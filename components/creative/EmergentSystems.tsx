"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import {
  ControlRange,
  ControlSelect,
  StageButton,
  StageHeader,
  StatStrip,
} from "@/components/creative/stage/controls";
import {
  exportCanvasPng,
  useCreativeCanvas,
} from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeCanvasRuntime } from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeProject } from "@/lib/creativeProjects";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type Mode = "murmuration" | "automata-atlas" | "load-path" | "terraform";

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SystemWorld {
  mode: Mode;
  width: number;
  height: number;
  tick: number;
  elapsed: number;
  boids: Boid[];
  boidScratch: Boid[];
  predator: { x: number; y: number; vx: number; vy: number; active: boolean };
  alignment: number;
  cells: Uint8Array;
  cellScratch: Uint8Array;
  cols: number;
  rows: number;
  terrain: Float32Array;
  water: Float32Array;
  waterScratch: Float32Array;
  vegetation: Float32Array;
  waterIndex: number;
  vegCount: number;
  stability: number;
  generation: number;
  alive: number;
}

const MODE_COPY: Record<
  Mode,
  {
    eyebrow: string;
    purpose: string;
    primary: string;
    secondary: string;
    presets: readonly string[];
  }
> = {
  murmuration: {
    eyebrow: "Murmuration · flock intelligence",
    purpose:
      "Use this to understand how local alignment, cohesion, and separation rules create coordinated group movement without a leader.",
    primary: "Cohesion",
    secondary: "Separation",
    presets: ["Balanced flock", "Tight current", "Scatter field"],
  },
  "automata-atlas": {
    eyebrow: "Automata Atlas · cellular rules",
    purpose:
      "Use this to compare how small neighborhood rules produce stable structures, oscillators, growth, or collapse.",
    primary: "Birth threshold",
    secondary: "Survival threshold",
    presets: ["Conway life", "HighLife", "Seeds", "Custom thresholds"],
  },
  "load-path": {
    eyebrow: "Load Path · structural stress",
    purpose:
      "Use this to see how an applied load travels through a determinate truss and where tension or compression concentrates.",
    primary: "Applied load",
    secondary: "Load position",
    presets: ["Bridge truss", "Cantilever", "Tower frame"],
  },
  terraform: {
    eyebrow: "Terraform · micro-climate engine",
    purpose:
      "Use this to explore how rainfall, heat, terrain, erosion, water, and vegetation form a coupled environmental system.",
    primary: "Rainfall",
    secondary: "Temperature",
    presets: ["Temperate basin", "Dry plateau", "Monsoon delta"],
  },
};

interface FlockTuning {
  cohesion: number;
  separation: number;
  alignmentWeight: number;
  neighborRadius: number;
  maxSpeed: number;
}

const FLOCK_PRESETS: Record<string, FlockTuning> = {
  "Balanced flock": {
    cohesion: 55,
    separation: 45,
    alignmentWeight: 1,
    neighborRadius: 74,
    maxSpeed: 86,
  },
  "Tight current": {
    cohesion: 84,
    separation: 20,
    alignmentWeight: 1.8,
    neighborRadius: 98,
    maxSpeed: 104,
  },
  "Scatter field": {
    cohesion: 16,
    separation: 80,
    alignmentWeight: 0.45,
    neighborRadius: 52,
    maxSpeed: 72,
  },
};

function flockTuning(preset: string): FlockTuning {
  return FLOCK_PRESETS[preset] ?? FLOCK_PRESETS["Balanced flock"];
}

interface ClimateTuning {
  rainBias: number;
  evapBias: number;
  octave: number;
  relief: number;
  shape: "basin" | "plateau" | "delta";
  vegetation: number;
}

const CLIMATE_PRESETS: Record<string, ClimateTuning> = {
  "Temperate basin": {
    rainBias: 1,
    evapBias: 1,
    octave: 1,
    relief: 1,
    shape: "basin",
    vegetation: 0.55,
  },
  "Dry plateau": {
    rainBias: 0.55,
    evapBias: 1.6,
    octave: 1.4,
    relief: 1.25,
    shape: "plateau",
    vegetation: 0.14,
  },
  "Monsoon delta": {
    rainBias: 1.75,
    evapBias: 0.75,
    octave: 0.8,
    relief: 0.7,
    shape: "delta",
    vegetation: 0.45,
  },
};

function climateTuning(preset: string): ClimateTuning {
  return CLIMATE_PRESETS[preset] ?? CLIMATE_PRESETS["Temperate basin"];
}

const GLIDER: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

const BLOCK: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];

function emptyWorld(mode: Mode): SystemWorld {
  return {
    mode,
    width: 900,
    height: 680,
    tick: 0,
    elapsed: 0,
    boids: [],
    boidScratch: [],
    predator: { x: 450, y: 340, vx: 0, vy: 0, active: false },
    alignment: 0,
    cells: new Uint8Array(),
    cellScratch: new Uint8Array(),
    cols: 64,
    rows: 44,
    terrain: new Float32Array(),
    water: new Float32Array(),
    waterScratch: new Float32Array(),
    vegetation: new Float32Array(),
    waterIndex: 0,
    vegCount: 0,
    stability: 100,
    generation: 1,
    alive: 0,
  };
}

export default function EmergentSystems({
  project,
}: {
  project: CreativeProject;
}) {
  const mode = project.slug as Mode;
  const copy = MODE_COPY[mode];
  // Initialized lazily via getWorld() below — passing the world object as a
  // hook argument would let the React Compiler treat it as immutable.
  const worldRef = useRef<SystemWorld | null>(null);
  const randomRef = useRef(mulberry32(hashSeed(mode)));
  const telemetryClockRef = useRef(0);
  const statsRef = useRef({ agents: 0, activity: 0, measure: 0 });
  const initKeyRef = useRef("");
  const needsSettleRef = useRef(false);
  const paintingRef = useRef(false);
  const lastPaintedRef = useRef(-1);
  const stampCountRef = useRef(0);
  const mountedRef = useRef(false);

  const [paused, setPaused] = useState(false);
  const [primary, setPrimary] = useState(
    mode === "load-path" ? 62 : mode === "terraform" ? 58 : 55,
  );
  const [secondary, setSecondary] = useState(
    mode === "load-path" ? 50 : mode === "terraform" ? 48 : 45,
  );
  const [preset, setPreset] = useState(copy.presets[0]);
  const [revision, setRevision] = useState(1);
  const [predatorOn, setPredatorOn] = useState(false);
  const [predatorX, setPredatorX] = useState(50);
  const [predatorY, setPredatorY] = useState(50);
  const [stormX, setStormX] = useState(50);
  const [stormY, setStormY] = useState(50);
  const [status, setStatus] = useState("");
  const [telemetry, setTelemetry] = useState({
    agents: 0,
    activity: 0,
    measure: 0,
  });

  const paramsRef = useRef({
    preset,
    revision,
    primary,
    secondary,
    predatorOn,
    predatorX,
    predatorY,
    stormX,
    stormY,
  });

  const getWorld = useCallback((): SystemWorld => {
    let world = worldRef.current;
    if (world === null) {
      world = emptyWorld(mode);
      worldRef.current = world;
    }
    return world;
  }, [mode]);

  // Idempotent per (mode, preset, revision): the first onRepaint from the
  // stage's own mount resize builds the world, and the init effect below then
  // sees a matching key and leaves it alone — no double initialization.
  const buildWorld = useCallback(
    (
      presetName: string,
      revisionValue: number,
      width: number,
      height: number,
    ): boolean => {
      const key = `${mode}|${presetName}|${revisionValue}`;
      if (initKeyRef.current === key) {
        return false;
      }
      initKeyRef.current = key;
      const random = mulberry32(hashSeed(key));
      randomRef.current = random;
      stampCountRef.current = 0;
      needsSettleRef.current = true;
      const world = emptyWorld(mode);
      world.width = width;
      world.height = height;
      const params = paramsRef.current;
      world.predator = {
        x: (params.predatorX / 100) * width,
        y: (params.predatorY / 100) * height,
        vx: 0,
        vy: 0,
        active: params.predatorOn,
      };
      if (mode === "murmuration") {
        world.boids = Array.from({ length: 145 }, () => ({
          x: random() * width,
          y: random() * height,
          vx: (random() - 0.5) * 80,
          vy: (random() - 0.5) * 80,
        }));
        world.boidScratch = world.boids.map(() => ({
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        }));
      }
      if (mode === "automata-atlas") {
        world.cols = 72;
        world.rows = 48;
        world.cells = new Uint8Array(world.cols * world.rows);
        world.cellScratch = new Uint8Array(world.cols * world.rows);
        let alive = 0;
        for (let index = 0; index < world.cells.length; index += 1) {
          const on = random() > 0.72 ? 1 : 0;
          world.cells[index] = on;
          alive += on;
        }
        world.alive = alive;
      }
      if (mode === "terraform") {
        const climate = climateTuning(presetName);
        world.cols = 74;
        world.rows = 50;
        const count = world.cols * world.rows;
        world.terrain = new Float32Array(count);
        world.water = new Float32Array(count);
        world.waterScratch = new Float32Array(count);
        world.vegetation = new Float32Array(count);
        let vegetatedCells = 0;
        for (let y = 0; y < world.rows; y += 1) {
          for (let x = 0; x < world.cols; x += 1) {
            const index = y * world.cols + x;
            const nx = x / (world.cols - 1) - 0.5;
            const ny = y / (world.rows - 1) - 0.5;
            let base = 0.5;
            base +=
              climate.relief *
              (Math.sin(x * 0.19 * climate.octave) * 0.14 +
                Math.cos(y * 0.23 * climate.octave) * 0.12 +
                Math.sin((x + y) * 0.11 * climate.octave) * 0.06);
            if (climate.shape === "basin") {
              base -= 0.2 * Math.max(0, 1 - (nx * nx + ny * ny) * 3.4);
            }
            if (climate.shape === "plateau") {
              base += 0.18 * Math.max(0, 1 - Math.max(Math.abs(nx), Math.abs(ny)) * 2.6);
            }
            if (climate.shape === "delta") {
              base += 0.26 * (0.5 - ny) - 0.13;
            }
            base += (random() - 0.5) * 0.14;
            const elevation = Math.max(0.04, Math.min(0.96, base));
            world.terrain[index] = elevation;
            const fertile = elevation > 0.3 && elevation < 0.72;
            world.vegetation[index] = fertile
              ? random() * climate.vegetation
              : random() * climate.vegetation * 0.18;
            if (world.vegetation[index] > 0.28) {
              vegetatedCells += 1;
            }
          }
        }
        world.vegCount = vegetatedCells;
      }
      worldRef.current = world;
      return true;
    },
    [mode],
  );

  const stage = useCreativeCanvas({
    minHeight: 680,
    // Load path is a synchronous solve with no time evolution — no loop.
    autoStart: mode !== "load-path",
    onFrame: (dt, _elapsed, runtime) => {
      if (paused) {
        return;
      }
      const clamped = Math.min(dt, 0.04);
      ensureWorld(runtime);
      advanceWorld(clamped);
      drawWorld(runtime);
      telemetryClockRef.current += clamped;
      if (telemetryClockRef.current >= 0.5) {
        telemetryClockRef.current = 0;
        publishTelemetry();
      }
    },
    onResize: (size, scale) => {
      const world = getWorld();
      world.width = size.width;
      world.height = size.height;
      for (const boid of world.boids) {
        boid.x *= scale.x;
        boid.y *= scale.y;
      }
      for (const boid of world.boidScratch) {
        boid.x *= scale.x;
        boid.y *= scale.y;
      }
      world.predator.x *= scale.x;
      world.predator.y *= scale.y;
    },
    onRepaint: (runtime) => {
      ensureWorld(runtime);
      if (reducedMotion && needsSettleRef.current) {
        // Settle to a finished composition so reduced motion never shows a
        // raw random seed after mount or a control change.
        needsSettleRef.current = false;
        settleWorld();
      }
      drawWorld(runtime);
      publishTelemetry();
    },
  });
  const { canvasRef, hostRef, sizeRef, repaint, reducedMotion, start, stop } =
    stage;

  function ensureWorld(runtime: CreativeCanvasRuntime) {
    const params = paramsRef.current;
    buildWorld(
      params.preset,
      params.revision,
      runtime.size.width || 900,
      runtime.size.height || 680,
    );
  }

  function advanceWorld(dt: number) {
    const world = getWorld();
    const params = paramsRef.current;
    if (mode === "murmuration") {
      updateBoids(world, dt, params.primary, params.secondary, flockTuning(params.preset));
    }
    if (mode === "automata-atlas") {
      world.tick += dt;
      if (world.tick > 0.12) {
        world.tick = 0;
        updateAutomata(world, params.preset, params.primary, params.secondary);
      }
    }
    if (mode === "terraform") {
      updateTerrain(
        world,
        dt,
        params.primary,
        params.secondary,
        climateTuning(params.preset),
        randomRef.current,
      );
    }
  }

  function settleWorld() {
    const world = getWorld();
    const params = paramsRef.current;
    if (mode === "murmuration") {
      const tuning = flockTuning(params.preset);
      for (let step = 0; step < 300; step += 1) {
        updateBoids(world, 1 / 60, params.primary, params.secondary, tuning);
      }
    }
    if (mode === "automata-atlas") {
      for (let step = 0; step < 40; step += 1) {
        updateAutomata(world, params.preset, params.primary, params.secondary);
      }
    }
    if (mode === "terraform") {
      const tuning = climateTuning(params.preset);
      for (let step = 0; step < 400; step += 1) {
        updateTerrain(world, 1 / 60, params.primary, params.secondary, tuning, randomRef.current);
      }
    }
  }

  function drawWorld(runtime: CreativeCanvasRuntime) {
    const context = runtime.context;
    if (!context) {
      return;
    }
    const world = getWorld();
    const params = paramsRef.current;
    context.clearRect(0, 0, world.width, world.height);
    context.fillStyle = "#070a10";
    context.fillRect(0, 0, world.width, world.height);
    if (mode === "murmuration") {
      drawBoids(context, world);
      statsRef.current = {
        agents: world.boids.length,
        activity: Math.round(world.elapsed),
        measure: Math.round(world.alignment),
      };
    }
    if (mode === "automata-atlas") {
      drawAutomata(context, world);
      statsRef.current = {
        agents: world.alive,
        activity: Math.round(world.generation),
        measure: Math.round(world.stability),
      };
    }
    if (mode === "load-path") {
      const result = drawLoadPath(context, world, params.primary, params.secondary, params.preset);
      statsRef.current = {
        agents: result.members,
        activity: Math.round(result.peak),
        measure: Math.round(result.utilization),
      };
    }
    if (mode === "terraform") {
      drawTerrain(
        context,
        world,
        params.primary,
        params.secondary,
        climateTuning(params.preset),
        params.stormX,
        params.stormY,
      );
      statsRef.current = {
        agents: world.vegCount,
        activity: Math.round(world.waterIndex * 1000),
        measure: Math.round(world.stability),
      };
    }
  }

  function publishTelemetry() {
    const stats = statsRef.current;
    setTelemetry((current) => {
      if (
        current.agents === stats.agents &&
        current.activity === stats.activity &&
        current.measure === stats.measure
      ) {
        return current;
      }
      return { ...stats };
    });
  }

  // Sync live parameters into the ref the simulation reads, then repaint so
  // no control is ever inert — under reduced motion the settle flag makes the
  // next paint a finished composition. The mount pass skips the extra work:
  // the stage's own resize repaint already settled and painted this state.
  useEffect(() => {
    const params = paramsRef.current;
    params.preset = preset;
    params.revision = revision;
    params.primary = primary;
    params.secondary = secondary;
    if (!mountedRef.current) {
      return;
    }
    needsSettleRef.current = true;
    repaint();
  }, [preset, revision, primary, secondary, repaint]);

  // Storm aim is a pure overlay: syncing + repainting draws the reticle at
  // its new position immediately without re-running the simulation.
  useEffect(() => {
    const params = paramsRef.current;
    params.stormX = stormX;
    params.stormY = stormY;
    if (!mountedRef.current) {
      return;
    }
    repaint();
  }, [stormX, stormY, repaint]);

  // World lifecycle: rebuild only when the (mode, preset, revision) key is new.
  useEffect(() => {
    const built = buildWorld(
      preset,
      revision,
      sizeRef.current.width || 900,
      sizeRef.current.height || 680,
    );
    if (built) {
      repaint();
    }
  }, [buildWorld, preset, revision, repaint, sizeRef]);

  // Keyboard parity for the predator: the X/Y sliders reposition it directly.
  useEffect(() => {
    const params = paramsRef.current;
    params.predatorOn = predatorOn;
    params.predatorX = predatorX;
    params.predatorY = predatorY;
    const world = getWorld();
    world.predator.active = predatorOn;
    if (predatorOn) {
      world.predator.x = (predatorX / 100) * world.width;
      world.predator.y = (predatorY / 100) * world.height;
      world.predator.vx = 0;
      world.predator.vy = 0;
    }
    if (!mountedRef.current) {
      return;
    }
    needsSettleRef.current = true;
    repaint();
  }, [getWorld, predatorOn, predatorX, predatorY, repaint]);

  // Runs after every guarded effect above, so the mount render skips their
  // redundant settle/repaint passes and real control changes never do.
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  function togglePaused() {
    const next = !paused;
    setPaused(next);
    if (next) {
      // Actually halt the loop instead of spinning through no-op frames.
      stop();
    } else {
      start();
    }
    setStatus(next ? "Simulation paused." : "Simulation resumed.");
    repaint();
  }

  function handleAdvance() {
    const world = getWorld();
    if (mode === "murmuration") {
      const tuning = flockTuning(preset);
      for (let step = 0; step < 30; step += 1) {
        updateBoids(world, 1 / 60, primary, secondary, tuning);
      }
      setStatus("Advanced 30 steps.");
    }
    if (mode === "automata-atlas") {
      updateAutomata(world, preset, primary, secondary);
      setStatus("Stepped one generation.");
    }
    if (mode === "terraform") {
      const tuning = climateTuning(preset);
      for (let step = 0; step < 30; step += 1) {
        updateTerrain(world, 1 / 60, primary, secondary, tuning, randomRef.current);
      }
      setStatus("Advanced 30 steps.");
    }
    if (mode === "load-path") {
      setStatus("Structure re-solved.");
    }
    repaint();
  }

  function applyPreset(value: string) {
    setPreset(value);
    if (mode === "murmuration") {
      const tuning = flockTuning(value);
      setPrimary(tuning.cohesion);
      setSecondary(tuning.separation);
    }
    setStatus(`Preset applied: ${value}.`);
  }

  function togglePredator() {
    const next = !predatorOn;
    setPredatorOn(next);
    setStatus(
      next
        ? `Predator placed at ${predatorX}% across, ${predatorY}% down.`
        : "Predator cleared.",
    );
  }

  // Under reduced motion a dropped storm must show its consequence, not a
  // raw splash: a short burst lets the water flow downhill and the
  // vegetation respond, while leaving the wet field still visible.
  function settleStormResponse() {
    const world = getWorld();
    const params = paramsRef.current;
    const tuning = climateTuning(params.preset);
    for (let step = 0; step < 90; step += 1) {
      updateTerrain(world, 1 / 60, params.primary, params.secondary, tuning, randomRef.current);
    }
  }

  function dropStormFromSliders() {
    const world = getWorld();
    const col = Math.round((stormX / 100) * (world.cols - 1));
    const row = Math.round((stormY / 100) * (world.rows - 1));
    dropStorm(world, col, row);
    if (reducedMotion) {
      settleStormResponse();
    }
    setStatus(`Storm dropped at ${stormX}% across, ${stormY}% down.`);
    repaint();
  }

  function stampPattern(
    pattern: ReadonlyArray<readonly [number, number]>,
    name: string,
  ) {
    const world = getWorld();
    const random = mulberry32(
      hashSeed(`${mode}-stamp-${revision}-${stampCountRef.current}`),
    );
    stampCountRef.current += 1;
    const col = 2 + Math.floor(random() * Math.max(1, world.cols - 8));
    const row = 2 + Math.floor(random() * Math.max(1, world.rows - 8));
    for (const [dx, dy] of pattern) {
      const index = (row + dy) * world.cols + (col + dx);
      if (world.cells[index] === 0) {
        world.cells[index] = 1;
        world.alive += 1;
      }
    }
    setStatus(`${name} stamped near row ${row}, column ${col}.`);
    repaint();
  }

  function newSystem() {
    setRevision((value) => value + 1);
    setStatus("New system seeded.");
  }

  function exportFrame() {
    exportCanvasPng(canvasRef.current, `${project.slug}-${revision}.png`);
    setStatus("Frame exported as PNG.");
  }

  function interact(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const safeWidth = Math.max(1, bounds.width);
    const safeHeight = Math.max(1, bounds.height);
    const world = getWorld();
    if (mode === "murmuration") {
      const percentX = Math.min(100, Math.max(0, Math.round((x / safeWidth) * 100)));
      const percentY = Math.min(100, Math.max(0, Math.round((y / safeHeight) * 100)));
      world.predator.x = (percentX / 100) * world.width;
      world.predator.y = (percentY / 100) * world.height;
      world.predator.vx = 0;
      world.predator.vy = 0;
      world.predator.active = true;
      setPredatorOn(true);
      setPredatorX(percentX);
      setPredatorY(percentY);
      setStatus(`Predator placed at ${percentX}% across, ${percentY}% down.`);
    }
    if (mode === "automata-atlas") {
      const col = Math.floor((x / safeWidth) * world.cols);
      const row = Math.floor((y / safeHeight) * world.rows);
      if (col >= 0 && row >= 0 && col < world.cols && row < world.rows) {
        const index = row * world.cols + col;
        const turnedOn = world.cells[index] === 0;
        world.cells[index] = turnedOn ? 1 : 0;
        world.alive += turnedOn ? 1 : -1;
        paintingRef.current = true;
        lastPaintedRef.current = index;
        setStatus(
          turnedOn
            ? `Cell activated at row ${row}, column ${col}.`
            : `Cell cleared at row ${row}, column ${col}.`,
        );
      }
    }
    if (mode === "terraform") {
      const col = Math.floor((x / safeWidth) * world.cols);
      const row = Math.floor((y / safeHeight) * world.rows);
      dropStorm(world, col, row);
      if (reducedMotion) {
        settleStormResponse();
      }
      const percentX = Math.min(100, Math.max(0, Math.round((x / safeWidth) * 100)));
      const percentY = Math.min(100, Math.max(0, Math.round((y / safeHeight) * 100)));
      setStormX(percentX);
      setStormY(percentY);
      setStatus(`Storm dropped at ${percentX}% across, ${percentY}% down.`);
    }
    if (mode === "load-path") {
      // Clamp clicks into the slider's own [5, 100] domain.
      const position = Math.min(100, Math.max(5, Math.round((x / safeWidth) * 100)));
      setSecondary(position);
      setStatus(`Load moved to ${position}% of span.`);
    }
    repaint();
  }

  function paintMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (mode !== "automata-atlas") {
      return;
    }
    if (!paintingRef.current) {
      return;
    }
    if ((event.buttons & 1) !== 1) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const world = getWorld();
    const col = Math.floor(((event.clientX - bounds.left) / Math.max(1, bounds.width)) * world.cols);
    const row = Math.floor(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * world.rows);
    if (col < 0 || row < 0 || col >= world.cols || row >= world.rows) {
      return;
    }
    const index = row * world.cols + col;
    if (index === lastPaintedRef.current) {
      return;
    }
    lastPaintedRef.current = index;
    // Drag-painting sets cells alive instead of toggling them.
    if (world.cells[index] === 0) {
      world.cells[index] = 1;
      world.alive += 1;
    }
    repaint();
  }

  function endPaint() {
    paintingRef.current = false;
    lastPaintedRef.current = -1;
  }

  const customRule = preset === "Custom thresholds";
  const slidersDisabled = mode === "automata-atlas" && !customRule;
  const rule =
    mode === "automata-atlas" ? ruleNotation(preset, primary, secondary) : null;
  const primaryDisplay = rule
    ? rule.birth
    : mode === "load-path"
      ? `${primary} kN`
      : `${primary}%`;
  const secondaryDisplay = rule ? rule.survival : `${secondary}%`;
  const advanceLabel =
    mode === "automata-atlas"
      ? "Step generation"
      : mode === "load-path"
        ? "Re-solve"
        : "Advance 30 steps";

  const statItems = useMemo(() => {
    if (mode === "murmuration") {
      return [
        { label: "Agents", value: String(telemetry.agents) },
        { label: "Elapsed", value: `${telemetry.activity}s` },
        { label: "Alignment", value: `${telemetry.measure}%` },
        { label: "Revision", value: String(revision) },
      ];
    }
    if (mode === "automata-atlas") {
      return [
        { label: "Living cells", value: String(telemetry.agents) },
        { label: "Generation", value: String(telemetry.activity) },
        { label: "Stability", value: `${telemetry.measure}%` },
        { label: "Revision", value: String(revision) },
      ];
    }
    if (mode === "load-path") {
      return [
        { label: "Members", value: String(telemetry.agents) },
        {
          label: "Peak force",
          value: `${telemetry.activity} kN`,
          alert: telemetry.measure > 70,
        },
        {
          label: "Peak utilization",
          value: `${telemetry.measure}%`,
          alert: telemetry.measure > 70,
        },
        { label: "Revision", value: String(revision) },
      ];
    }
    return [
      { label: "Vegetated cells", value: String(telemetry.agents) },
      { label: "Water index", value: String(telemetry.activity) },
      { label: "Stability", value: `${telemetry.measure}%` },
      { label: "Revision", value: String(revision) },
    ];
  }, [mode, revision, telemetry]);

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-[1500px] px-4 pb-24 sm:px-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#090b10]">
          <StageHeader
            eyebrow={copy.eyebrow}
            stats={[{ label: "preset", value: preset }]}
            tone={mode === "load-path" ? "alert" : "accent"}
          />
          <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
            <div
              ref={hostRef}
              className="relative min-h-[680px] overflow-hidden bg-[#070a10]"
            >
              <canvas
                ref={canvasRef}
                onPointerDown={interact}
                onPointerMove={paintMove}
                onPointerUp={endPaint}
                onPointerLeave={endPaint}
                role="img"
                aria-label={`${project.title} interactive simulation canvas`}
                className="absolute inset-0 h-full w-full cursor-crosshair touch-pan-y"
              />
            </div>
            <aside className="border-t border-white/15 bg-[#0c0e14] p-6 xl:border-l xl:border-t-0">
              <p className="sr-only" role="status" aria-live="polite">
                {status}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                What this is for
              </p>
              <p className="mt-3 text-sm leading-7 text-white/65">{copy.purpose}</p>
              <ControlSelect
                label="System preset"
                value={preset}
                options={copy.presets}
                onChange={applyPreset}
              />
              <ControlRange
                label={copy.primary}
                value={primary}
                min={5}
                max={100}
                display={primaryDisplay}
                disabled={slidersDisabled}
                onChange={setPrimary}
              />
              <ControlRange
                label={copy.secondary}
                value={secondary}
                min={5}
                max={100}
                display={secondaryDisplay}
                tone={mode === "load-path" ? "alert" : "accent"}
                disabled={slidersDisabled}
                onChange={setSecondary}
              />
              {slidersDisabled ? (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                  Rule fixed by preset — pick Custom thresholds to edit.
                </p>
              ) : null}
              {mode === "load-path" ? (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                  Blue = tension · red = compression · brightness = force
                </p>
              ) : null}
              {mode === "murmuration" ? (
                <div className="mt-6">
                  <StageButton
                    pressed={predatorOn}
                    onClick={togglePredator}
                    className="w-full"
                  >
                    {predatorOn ? "Clear predator" : "Place predator"}
                  </StageButton>
                  {predatorOn ? (
                    <>
                      <ControlRange
                        label="Predator X"
                        value={predatorX}
                        min={0}
                        max={100}
                        display={`${predatorX}%`}
                        tone="alert"
                        onChange={setPredatorX}
                      />
                      <ControlRange
                        label="Predator Y"
                        value={predatorY}
                        min={0}
                        max={100}
                        display={`${predatorY}%`}
                        tone="alert"
                        onChange={setPredatorY}
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
              {mode === "terraform" ? (
                <div className="mt-2">
                  <ControlRange
                    label="Storm X"
                    value={stormX}
                    min={0}
                    max={100}
                    display={`${stormX}%`}
                    onChange={setStormX}
                  />
                  <ControlRange
                    label="Storm Y"
                    value={stormY}
                    min={0}
                    max={100}
                    display={`${stormY}%`}
                    onChange={setStormY}
                  />
                  <StageButton
                    onClick={dropStormFromSliders}
                    className="mt-4 w-full"
                  >
                    Drop storm
                  </StageButton>
                </div>
              ) : null}
              <div className="mt-7 rounded-2xl border border-white/12 bg-white/[0.025] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                  Interaction
                </p>
                <p className="mt-2 text-xs leading-6 text-white/60">
                  {mode === "murmuration" &&
                    "Click the field — or use the predator button and sliders — to place a predator and watch the flock reorganize."}
                  {mode === "automata-atlas" &&
                    "Click to toggle a cell, drag to paint living cells, or stamp a seeded glider or block."}
                  {mode === "load-path" &&
                    "Click the span or move the position slider to relocate the load; every member force is re-solved instantly."}
                  {mode === "terraform" &&
                    "Click anywhere — or aim with the storm sliders — to drop a local storm; water then flows downhill and changes growth."}
                </p>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-2">
                {reducedMotion || mode === "load-path" ? null : (
                  <StageButton onClick={togglePaused} pressed={paused}>
                    {paused ? "Resume" : "Pause"}
                  </StageButton>
                )}
                <StageButton onClick={handleAdvance}>{advanceLabel}</StageButton>
                {mode === "automata-atlas" ? (
                  <>
                    <StageButton onClick={() => stampPattern(GLIDER, "Glider")}>
                      Stamp glider
                    </StageButton>
                    <StageButton onClick={() => stampPattern(BLOCK, "Block")}>
                      Stamp block
                    </StageButton>
                  </>
                ) : null}
                {mode === "load-path" ? null : (
                  <StageButton variant="primary" onClick={newSystem}>
                    New system
                  </StageButton>
                )}
                <StageButton onClick={exportFrame}>Export frame</StageButton>
              </div>
            </aside>
          </div>
          <StatStrip items={statItems} />
        </div>
      </section>
    </CreativeProjectShell>
  );
}

function updateBoids(
  world: SystemWorld,
  dt: number,
  cohesion: number,
  separation: number,
  tuning: FlockTuning,
) {
  const boids = world.boids;
  const scratch = world.boidScratch;
  const count = boids.length;
  const radius = tuning.neighborRadius;
  let unitX = 0;
  let unitY = 0;
  for (let index = 0; index < count; index += 1) {
    const boid = boids[index];
    let centerX = 0;
    let centerY = 0;
    let alignX = 0;
    let alignY = 0;
    let repelX = 0;
    let repelY = 0;
    let neighbors = 0;
    for (let otherIndex = 0; otherIndex < count; otherIndex += 1) {
      if (index === otherIndex) {
        continue;
      }
      const other = boids[otherIndex];
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const distance = Math.hypot(dx, dy);
      if (distance < radius) {
        centerX += other.x;
        centerY += other.y;
        alignX += other.vx;
        alignY += other.vy;
        neighbors += 1;
        if (distance < 22) {
          repelX -= dx / Math.max(distance, 1);
          repelY -= dy / Math.max(distance, 1);
        }
      }
    }
    let vx = boid.vx;
    let vy = boid.vy;
    if (neighbors > 0) {
      centerX = centerX / neighbors - boid.x;
      centerY = centerY / neighbors - boid.y;
      alignX = alignX / neighbors - boid.vx;
      alignY = alignY / neighbors - boid.vy;
      // Cohesion coefficient is scaled so its slider is as perceptible as
      // separation's across the whole 5–100 range.
      vx +=
        (centerX * cohesion * 0.0005 +
          alignX * 0.02 * tuning.alignmentWeight +
          repelX * separation * 0.045) *
        dt *
        60;
      vy +=
        (centerY * cohesion * 0.0005 +
          alignY * 0.02 * tuning.alignmentWeight +
          repelY * separation * 0.045) *
        dt *
        60;
    }
    if (world.predator.active) {
      const dx = boid.x - world.predator.x;
      const dy = boid.y - world.predator.y;
      const distance = Math.max(4, Math.hypot(dx, dy));
      if (distance < 150) {
        vx += (dx / distance) * (160 - distance) * 0.045;
        vy += (dy / distance) * (160 - distance) * 0.045;
      }
    }
    const speed = Math.max(1, Math.hypot(vx, vy));
    if (speed > tuning.maxSpeed) {
      vx = (vx / speed) * tuning.maxSpeed;
      vy = (vy / speed) * tuning.maxSpeed;
    }
    const target = scratch[index];
    target.vx = vx;
    target.vy = vy;
    target.x = (boid.x + vx * dt + world.width) % world.width;
    target.y = (boid.y + vy * dt + world.height) % world.height;
    const magnitude = Math.max(0.001, Math.hypot(vx, vy));
    unitX += vx / magnitude;
    unitY += vy / magnitude;
  }
  // Swap the persistent buffers instead of allocating a new array per frame.
  world.boids = scratch;
  world.boidScratch = boids;
  // Vicsek order parameter: magnitude of the mean normalized velocity.
  world.alignment = count > 0 ? (Math.hypot(unitX, unitY) / count) * 100 : 0;
  world.elapsed += dt;
  if (world.predator.active) {
    updatePredator(world, dt);
  }
}

function updatePredator(world: SystemWorld, dt: number) {
  const predator = world.predator;
  let targetX = 0;
  let targetY = 0;
  let nearby = 0;
  for (const boid of world.boids) {
    const distance = Math.hypot(boid.x - predator.x, boid.y - predator.y);
    if (distance < 240) {
      targetX += boid.x;
      targetY += boid.y;
      nearby += 1;
    }
  }
  if (nearby === 0) {
    for (const boid of world.boids) {
      targetX += boid.x;
      targetY += boid.y;
    }
    nearby = world.boids.length;
  }
  if (nearby === 0) {
    return;
  }
  const dx = targetX / nearby - predator.x;
  const dy = targetY / nearby - predator.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  predator.vx += (dx / distance) * 30 * dt;
  predator.vy += (dy / distance) * 30 * dt;
  const speed = Math.hypot(predator.vx, predator.vy);
  const maxSpeed = 34;
  if (speed > maxSpeed) {
    predator.vx = (predator.vx / speed) * maxSpeed;
    predator.vy = (predator.vy / speed) * maxSpeed;
  }
  predator.x = Math.min(world.width, Math.max(0, predator.x + predator.vx * dt));
  predator.y = Math.min(world.height, Math.max(0, predator.y + predator.vy * dt));
}

function drawBoids(context: CanvasRenderingContext2D, world: SystemWorld) {
  context.strokeStyle = "rgba(96,165,250,.68)";
  context.lineWidth = 1.2;
  for (const boid of world.boids) {
    const angle = Math.atan2(boid.vy, boid.vx);
    context.beginPath();
    context.moveTo(boid.x + Math.cos(angle) * 7, boid.y + Math.sin(angle) * 7);
    context.lineTo(boid.x + Math.cos(angle + 2.5) * 5, boid.y + Math.sin(angle + 2.5) * 5);
    context.lineTo(boid.x + Math.cos(angle - 2.5) * 5, boid.y + Math.sin(angle - 2.5) * 5);
    context.closePath();
    context.stroke();
  }
  if (world.predator.active) {
    context.fillStyle = "#f87171";
    context.beginPath();
    context.arc(world.predator.x, world.predator.y, 8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(248,113,113,.25)";
    context.beginPath();
    context.arc(world.predator.x, world.predator.y, 58, 0, Math.PI * 2);
    context.stroke();
  }
}

function customBirthValue(birth: number): number {
  return Math.max(1, Math.min(8, Math.round(birth / 18)));
}

function customSurvivalValue(survival: number): number {
  return Math.max(1, Math.min(8, Math.round(survival / 22)));
}

/** B/S notation shown on the sliders so a fixed rule is never mislabeled. */
function ruleNotation(
  preset: string,
  birth: number,
  survival: number,
): { birth: string; survival: string } {
  if (preset === "Conway life") {
    return { birth: "B3", survival: "S23" };
  }
  if (preset === "HighLife") {
    return { birth: "B36", survival: "S23" };
  }
  if (preset === "Seeds") {
    return { birth: "B2", survival: "S—" };
  }
  const birthValue = customBirthValue(birth);
  const survivalValue = customSurvivalValue(survival);
  const upper = Math.min(8, survivalValue + 1);
  return {
    birth: `B${birthValue}`,
    survival:
      upper === survivalValue
        ? `S${survivalValue}`
        : `S${survivalValue}${upper}`,
  };
}

function automataRules(preset: string, birth: number, survival: number) {
  if (preset === "Conway life") {
    return { births: new Set([3]), survives: new Set([2, 3]) };
  }
  if (preset === "HighLife") {
    return { births: new Set([3, 6]), survives: new Set([2, 3]) };
  }
  if (preset === "Seeds") {
    return { births: new Set([2]), survives: new Set<number>() };
  }
  // "Custom thresholds" is the only preset that reads the two sliders.
  const birthValue = customBirthValue(birth);
  const survivalValue = customSurvivalValue(survival);
  return {
    births: new Set([birthValue]),
    survives: new Set([survivalValue, Math.min(8, survivalValue + 1)]),
  };
}

function updateAutomata(
  world: SystemWorld,
  preset: string,
  birth: number,
  survival: number,
) {
  const rules = automataRules(preset, birth, survival);
  const cells = world.cells;
  // Reuse the persistent scratch buffer — no per-generation allocation.
  const next =
    world.cellScratch.length === cells.length
      ? world.cellScratch
      : new Uint8Array(cells.length);
  let alive = 0;
  let changed = 0;
  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          const nx = (x + dx + world.cols) % world.cols;
          const ny = (y + dy + world.rows) % world.rows;
          neighbors += cells[ny * world.cols + nx];
        }
      }
      const index = y * world.cols + x;
      let cell = 0;
      if (cells[index] === 1) {
        cell = rules.survives.has(neighbors) ? 1 : 0;
      } else {
        cell = rules.births.has(neighbors) ? 1 : 0;
      }
      next[index] = cell;
      alive += cell;
      if (cell !== cells[index]) {
        changed += 1;
      }
    }
  }
  // Measured stability: 100 minus the percentage of cells that changed.
  world.stability =
    cells.length > 0 ? 100 - (changed / cells.length) * 100 : 100;
  world.cellScratch = cells;
  world.cells = next;
  world.alive = alive;
  world.generation += 1;
}

function drawAutomata(context: CanvasRenderingContext2D, world: SystemWorld) {
  const cellWidth = world.width / world.cols;
  const cellHeight = world.height / world.rows;
  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      const alive = world.cells[y * world.cols + x];
      context.fillStyle = alive ? "#60a5fa" : "rgba(255,255,255,.025)";
      context.fillRect(x * cellWidth + 0.5, y * cellHeight + 0.5, cellWidth - 1, cellHeight - 1);
    }
  }
}

interface TrussNodeSpec {
  x: number;
  y: number;
  support?: "pin" | "roller" | "fixed";
}

interface TrussSpec {
  nodes: TrussNodeSpec[];
  members: Array<[number, number]>;
  loadable: number[];
  lateral: boolean;
  extentX: number;
  extentY: number;
  widthFrac: number;
  heightFrac: number;
  supportSide: "bottom" | "left";
}

const MEMBER_CAPACITY_KN = 220;

/**
 * Three hand-authored determinate topologies. Each satisfies m = 2n − r, so
 * the method-of-joints system (two equilibrium equations per unsupported
 * direction) is square and solvable by Gaussian elimination.
 */
const TRUSS_TOPOLOGIES: Record<string, TrussSpec> = {
  "Bridge truss": {
    // Simply-supported Pratt: pin left (node 0), roller right (node 6).
    nodes: [
      { x: 0, y: 1, support: "pin" },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 5, y: 1 },
      { x: 6, y: 1, support: "roller" },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ],
    members: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [1, 7],
      [2, 8],
      [3, 9],
      [4, 10],
      [5, 11],
      [0, 7],
      [6, 11],
      [7, 2],
      [8, 3],
      [11, 4],
      [10, 3],
    ],
    loadable: [1, 2, 3, 4, 5],
    lateral: false,
    extentX: 6,
    extentY: 1,
    widthFrac: 0.78,
    heightFrac: 0.3,
    supportSide: "bottom",
  },
  Cantilever: {
    // Fixed left wall (two wall nodes), tapering span to a tip.
    nodes: [
      { x: 0, y: 1, support: "fixed" },
      { x: 0, y: 0, support: "fixed" },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 1, y: 0.3 },
      { x: 2, y: 0.62 },
    ],
    members: [
      [0, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [5, 6],
      [6, 4],
      [2, 5],
      [3, 6],
      [0, 5],
      [3, 5],
    ],
    loadable: [2, 3, 4],
    lateral: false,
    extentX: 3,
    extentY: 1,
    widthFrac: 0.66,
    heightFrac: 0.42,
    supportSide: "left",
  },
  "Tower frame": {
    // Vertical lattice with a fixed base; the load is a lateral wind shear.
    nodes: [
      { x: 0, y: 3, support: "fixed" },
      { x: 1, y: 3, support: "fixed" },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ],
    members: [
      [0, 2],
      [2, 4],
      [4, 6],
      [1, 3],
      [3, 5],
      [5, 7],
      [2, 3],
      [4, 5],
      [6, 7],
      [0, 3],
      [2, 5],
      [4, 7],
    ],
    loadable: [2, 4, 6],
    lateral: true,
    extentX: 1,
    extentY: 3,
    widthFrac: 0.24,
    heightFrac: 0.66,
    supportSide: "bottom",
  },
};

/** Gaussian elimination with partial pivoting; mutates its arguments. */
function solveLinear(matrix: number[][], vector: number[]): number[] | null {
  const n = vector.length;
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(matrix[row][col]) > Math.abs(matrix[pivot][col])) {
        pivot = row;
      }
    }
    if (Math.abs(matrix[pivot][col]) < 1e-9) {
      return null;
    }
    if (pivot !== col) {
      const rowSwap = matrix[pivot];
      matrix[pivot] = matrix[col];
      matrix[col] = rowSwap;
      const valueSwap = vector[pivot];
      vector[pivot] = vector[col];
      vector[col] = valueSwap;
    }
    for (let row = col + 1; row < n; row += 1) {
      const factor = matrix[row][col] / matrix[col][col];
      if (factor === 0) {
        continue;
      }
      for (let k = col; k < n; k += 1) {
        matrix[row][k] -= factor * matrix[col][k];
      }
      vector[row] -= factor * vector[col];
    }
  }
  const solution = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row -= 1) {
    let sum = vector[row];
    for (let k = row + 1; k < n; k += 1) {
      sum -= matrix[row][k] * solution[k];
    }
    solution[row] = sum / matrix[row][row];
  }
  return solution;
}

/**
 * Real method-of-joints solve. Unknowns are the member axial forces; the
 * equilibrium equations of every unsupported node direction form a square
 * system (reactions are implicit in the dropped support equations — the
 * roller keeps its horizontal equation since it has no horizontal reaction).
 * Sign convention: positive = tension (accent blue), negative = compression
 * (alert red).
 */
function drawLoadPath(
  context: CanvasRenderingContext2D,
  world: SystemWorld,
  loadKn: number,
  positionPct: number,
  presetName: string,
): { members: number; peak: number; utilization: number } {
  const spec = TRUSS_TOPOLOGIES[presetName] ?? TRUSS_TOPOLOGIES["Bridge truss"];
  const spanWidth = world.width * spec.widthFrac;
  const spanHeight = world.height * spec.heightFrac;
  const offsetX = (world.width - spanWidth) / 2;
  const offsetY = (world.height - spanHeight) / 2 + world.height * 0.03;
  const points = spec.nodes.map((node) => ({
    x: offsetX + (node.x / spec.extentX) * spanWidth,
    y: offsetY + (node.y / spec.extentY) * spanHeight,
  }));
  const fraction = Math.min(1, Math.max(0, (positionPct - 5) / 95));
  const loadIndex = spec.loadable[Math.round(fraction * (spec.loadable.length - 1))];
  const load = spec.lateral
    ? { x: loadKn * 0.94, y: loadKn * 0.34 }
    : { x: 0, y: loadKn };
  const memberCount = spec.members.length;
  const matrix: number[][] = [];
  const vector: number[] = [];
  spec.nodes.forEach((node, nodeIndex) => {
    const blockX = node.support === "pin" || node.support === "fixed";
    const blockY = node.support !== undefined;
    for (let direction = 0; direction < 2; direction += 1) {
      if (direction === 0 && blockX) {
        continue;
      }
      if (direction === 1 && blockY) {
        continue;
      }
      const row = new Array<number>(memberCount).fill(0);
      spec.members.forEach((member, memberIndex) => {
        let other = -1;
        if (member[0] === nodeIndex) {
          other = member[1];
        }
        if (member[1] === nodeIndex) {
          other = member[0];
        }
        if (other < 0) {
          return;
        }
        const dx = points[other].x - points[nodeIndex].x;
        const dy = points[other].y - points[nodeIndex].y;
        const length = Math.max(1, Math.hypot(dx, dy));
        row[memberIndex] = direction === 0 ? dx / length : dy / length;
      });
      matrix.push(row);
      vector.push(nodeIndex === loadIndex ? -(direction === 0 ? load.x : load.y) : 0);
    }
  });
  const forces = matrix.length === memberCount ? solveLinear(matrix, vector) : null;
  let peak = 0;
  if (forces) {
    for (const force of forces) {
      peak = Math.max(peak, Math.abs(force));
    }
  }
  const denominator = Math.max(peak, 0.0001);
  context.lineCap = "round";
  spec.members.forEach((member, memberIndex) => {
    const start = points[member[0]];
    const end = points[member[1]];
    const force = forces ? forces[memberIndex] : 0;
    const intensity = Math.abs(force) / denominator;
    if (Math.abs(force) < 0.5) {
      // Zero-force members render neutral so color always means force.
      context.strokeStyle = "rgba(255,255,255,0.18)";
    } else if (force > 0) {
      context.strokeStyle = `rgba(96,165,250,${0.25 + intensity * 0.75})`;
    } else {
      context.strokeStyle = `rgba(248,113,113,${0.25 + intensity * 0.75})`;
    }
    context.lineWidth = 2 + intensity * 4.5;
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  });
  drawSupports(context, spec, points);
  context.fillStyle = "#f5f5f5";
  for (const point of points) {
    context.beginPath();
    context.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    context.fill();
  }
  drawLoadArrow(context, points[loadIndex], load, spec.lateral);
  return {
    members: memberCount,
    peak,
    utilization: (peak / MEMBER_CAPACITY_KN) * 100,
  };
}

function drawSupports(
  context: CanvasRenderingContext2D,
  spec: TrussSpec,
  points: Array<{ x: number; y: number }>,
) {
  context.strokeStyle = "rgba(255,255,255,0.6)";
  context.lineWidth = 1.5;
  spec.nodes.forEach((node, nodeIndex) => {
    if (!node.support) {
      return;
    }
    const point = points[nodeIndex];
    if (spec.supportSide === "left") {
      // Wall hatch beside the fixed nodes.
      context.beginPath();
      context.moveTo(point.x - 7, point.y - 20);
      context.lineTo(point.x - 7, point.y + 20);
      context.stroke();
      for (let tick = -2; tick <= 2; tick += 1) {
        context.beginPath();
        context.moveTo(point.x - 7, point.y + tick * 9);
        context.lineTo(point.x - 17, point.y + tick * 9 + 8);
        context.stroke();
      }
      return;
    }
    if (node.support === "roller") {
      context.beginPath();
      context.arc(point.x, point.y + 10, 5.5, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(point.x - 14, point.y + 17);
      context.lineTo(point.x + 14, point.y + 17);
      context.stroke();
      return;
    }
    // Pin or fixed base: triangle with ground hatches.
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x - 10, point.y + 15);
    context.lineTo(point.x + 10, point.y + 15);
    context.closePath();
    context.stroke();
    for (let tick = -1; tick <= 1; tick += 1) {
      context.beginPath();
      context.moveTo(point.x + tick * 9, point.y + 15);
      context.lineTo(point.x + tick * 9 - 6, point.y + 21);
      context.stroke();
    }
  });
}

function drawLoadArrow(
  context: CanvasRenderingContext2D,
  point: { x: number; y: number },
  load: { x: number; y: number },
  approaching: boolean,
) {
  const magnitude = Math.max(1, Math.hypot(load.x, load.y));
  const unitX = load.x / magnitude;
  const unitY = load.y / magnitude;
  context.strokeStyle = "#f87171";
  context.fillStyle = "#f87171";
  context.lineWidth = 3;
  if (approaching) {
    // Lateral load: the arrow flies in from outside and ends at the node.
    const tailX = point.x - unitX * 58;
    const tailY = point.y - unitY * 58;
    const tipX = point.x - unitX * 12;
    const tipY = point.y - unitY * 12;
    context.beginPath();
    context.moveTo(tailX, tailY);
    context.lineTo(tipX, tipY);
    context.stroke();
    const perpX = -unitY;
    const perpY = unitX;
    context.beginPath();
    context.moveTo(point.x - unitX * 5, point.y - unitY * 5);
    context.lineTo(tipX + perpX * 6, tipY + perpY * 6);
    context.lineTo(tipX - perpX * 6, tipY - perpY * 6);
    context.closePath();
    context.fill();
    return;
  }
  // Gravity load: drawn hanging below the loaded node, pointing down.
  const tailX = point.x + unitX * 12;
  const tailY = point.y + unitY * 12;
  const tipX = point.x + unitX * 52;
  const tipY = point.y + unitY * 52;
  context.beginPath();
  context.moveTo(tailX, tailY);
  context.lineTo(tipX, tipY);
  context.stroke();
  const perpX = -unitY;
  const perpY = unitX;
  context.beginPath();
  context.moveTo(point.x + unitX * 62, point.y + unitY * 62);
  context.lineTo(tipX + perpX * 6, tipY + perpY * 6);
  context.lineTo(tipX - perpX * 6, tipY - perpY * 6);
  context.closePath();
  context.fill();
}

function dropStorm(world: SystemWorld, col: number, row: number) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const cx = col + dx;
      const cy = row + dy;
      // Storms only wet interior cells; the border ring stays a drain.
      if (cx < 1 || cy < 1 || cx >= world.cols - 1 || cy >= world.rows - 1) {
        continue;
      }
      world.water[cy * world.cols + cx] += Math.max(0, 0.6 - Math.hypot(dx, dy) * 0.1);
    }
  }
}

function updateTerrain(
  world: SystemWorld,
  dt: number,
  rain: number,
  temperature: number,
  climate: ClimateTuning,
  random: () => number,
) {
  const cols = world.cols;
  const rows = world.rows;
  const terrain = world.terrain;
  const vegetation = world.vegetation;
  const water = world.water;
  const next = world.waterScratch;
  if (next.length !== water.length) {
    return;
  }
  next.set(water);
  // The border ring drains: water reaching the edge leaves the map, so no
  // permanent rim can accumulate.
  for (let x = 0; x < cols; x += 1) {
    next[x] = 0;
    next[(rows - 1) * cols + x] = 0;
  }
  for (let y = 0; y < rows; y += 1) {
    next[y * cols] = 0;
    next[y * cols + cols - 1] = 0;
  }
  const effectiveRain = rain * climate.rainBias;
  const drops = Math.max(1, Math.round(effectiveRain / 24));
  for (let drop = 0; drop < drops; drop += 1) {
    const dropX = 1 + Math.floor(random() * (cols - 2));
    const dropY = 1 + Math.floor(random() * (rows - 2));
    next[dropY * cols + dropX] += effectiveRain * 0.0009;
  }
  const evaporation = Math.min(
    0.5,
    (0.0005 + temperature * 0.000012 * climate.evapBias) * dt * 60,
  );
  const heatPenalty = (Math.abs(temperature - 48) / 100) * climate.evapBias;
  let waterTotal = 0;
  let vegetatedCells = 0;
  let fluxSum = 0;
  let fluxSquaredSum = 0;
  let interiorCells = 0;
  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      const index = y * cols + x;
      // Neighbor choice and transfer both read `next`: one buffer drives the
      // whole flow step, so there is no mixed-generation read.
      let lowest = index;
      let lowestLevel = terrain[index] + next[index];
      const left = index - 1;
      const leftLevel = terrain[left] + next[left];
      if (leftLevel < lowestLevel) {
        lowest = left;
        lowestLevel = leftLevel;
      }
      const right = index + 1;
      const rightLevel = terrain[right] + next[right];
      if (rightLevel < lowestLevel) {
        lowest = right;
        lowestLevel = rightLevel;
      }
      const up = index - cols;
      const upLevel = terrain[up] + next[up];
      if (upLevel < lowestLevel) {
        lowest = up;
        lowestLevel = upLevel;
      }
      const down = index + cols;
      const downLevel = terrain[down] + next[down];
      if (downLevel < lowestLevel) {
        lowest = down;
        lowestLevel = downLevel;
      }
      let flow = 0;
      if (lowest !== index && next[index] > 0.002) {
        const head = terrain[index] + next[index] - lowestLevel;
        flow = Math.min(next[index] * 0.12, Math.max(0, head) * 0.25);
        next[index] -= flow;
        next[lowest] += flow;
        // Erosion moves mass downstream instead of deleting it.
        const eroded = flow * 0.008;
        terrain[index] = Math.max(0.02, terrain[index] - eroded);
        terrain[lowest] = Math.min(0.98, terrain[lowest] + eroded * 0.65);
      }
      fluxSum += flow;
      fluxSquaredSum += flow * flow;
      interiorCells += 1;
      const moisture = next[index] + effectiveRain / 180;
      vegetation[index] = Math.max(
        0,
        Math.min(1, vegetation[index] + (moisture * 0.003 - heatPenalty * 0.0015) * dt * 60),
      );
      next[index] *= 1 - evaporation;
      waterTotal += next[index];
      if (vegetation[index] > 0.28) {
        vegetatedCells += 1;
      }
    }
  }
  // Swap the persistent buffers — no per-frame Float32Array allocation.
  world.water = next;
  world.waterScratch = water;
  world.waterIndex = interiorCells > 0 ? waterTotal / interiorCells : 0;
  world.vegCount = vegetatedCells;
  const meanFlux = interiorCells > 0 ? fluxSum / interiorCells : 0;
  const variance = Math.max(
    0,
    interiorCells > 0 ? fluxSquaredSum / interiorCells - meanFlux * meanFlux : 0,
  );
  // Measured stability: high when the water flux field is quiet and even.
  world.stability = Math.max(0, Math.min(100, 100 - variance * 2e7));
  world.generation += dt * 0.03;
}

function drawTerrain(
  context: CanvasRenderingContext2D,
  world: SystemWorld,
  rain: number,
  temperature: number,
  climate: ClimateTuning,
  stormX: number,
  stormY: number,
) {
  const cellWidth = world.width / world.cols;
  const cellHeight = world.height / world.rows;
  const moistureBase = (rain * climate.rainBias) / 180;
  for (let index = 0; index < world.terrain.length; index += 1) {
    const elevation = world.terrain[index];
    const water = world.water[index];
    const vegetationValue = world.vegetation[index];
    const x = (index % world.cols) * cellWidth;
    const y = Math.floor(index / world.cols) * cellHeight;
    // Neutral terrain shading; elevation only changes lightness, never hue.
    const shade = Math.round(30 + elevation * 64);
    context.fillStyle = `rgb(${shade},${shade + 3},${shade + 8})`;
    context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
    if (water > 0.06) {
      context.fillStyle = `rgba(96,165,250,${Math.min(0.85, 0.3 + water * 0.9)})`;
      context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
    } else if (vegetationValue > 0.05) {
      // Healthy vegetation is a white stipple whose alpha tracks density;
      // moisture-stressed growth blends toward alert red before dying.
      const moisture = water + moistureBase;
      const stress = Math.max(
        0,
        Math.min(1, (heatStress(temperature, climate) - moisture * 0.003) * 1500),
      );
      const red = Math.round(255 - stress * 7);
      const green = Math.round(255 - stress * 142);
      const blue = Math.round(255 - stress * 142);
      const alpha = 0.12 + vegetationValue * 0.55;
      context.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
      context.fillRect(
        x + cellWidth * 0.26,
        y + cellHeight * 0.26,
        cellWidth * 0.52,
        cellHeight * 0.52,
      );
    }
  }
  // Storm aim reticle: the X/Y sliders move this immediately, so aiming is
  // never an invisible action; Drop storm rains inside the dashed ring.
  const aimX = (stormX / 100) * world.width;
  const aimY = (stormY / 100) * world.height;
  context.strokeStyle = "rgba(96,165,250,0.85)";
  context.lineWidth = 1.5;
  context.setLineDash([6, 5]);
  context.beginPath();
  context.arc(aimX, aimY, cellWidth * 4.5, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);
  context.beginPath();
  context.moveTo(aimX - 10, aimY);
  context.lineTo(aimX + 10, aimY);
  context.moveTo(aimX, aimY - 10);
  context.lineTo(aimX, aimY + 10);
  context.stroke();
}

function heatStress(temperature: number, climate: ClimateTuning): number {
  return (Math.abs(temperature - 48) / 100) * climate.evapBias * 0.0015;
}
