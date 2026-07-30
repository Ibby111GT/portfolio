"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type Point = { x: number; y: number; vx: number; vy: number };

interface SystemWorld {
  mode: Mode;
  width: number;
  height: number;
  tick: number;
  boids: Point[];
  predator: Point & { active: boolean };
  cells: Uint8Array;
  cols: number;
  rows: number;
  terrain: Float32Array;
  water: Float32Array;
  vegetation: Float32Array;
  rainfall: number;
  generation: number;
  alive: number;
  peakStress: number;
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
    presets: ["Conway life", "HighLife", "Seeds"],
  },
  "load-path": {
    eyebrow: "Load Path · structural stress",
    purpose:
      "Use this to see how an applied load travels through a simplified truss and where tension or compression concentrates.",
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

function emptyWorld(mode: Mode): SystemWorld {
  return {
    mode,
    width: 900,
    height: 680,
    tick: 0,
    boids: [],
    predator: { x: 450, y: 340, vx: 0, vy: 0, active: false },
    cells: new Uint8Array(),
    cols: 64,
    rows: 44,
    terrain: new Float32Array(),
    water: new Float32Array(),
    vegetation: new Float32Array(),
    rainfall: 0,
    generation: 1,
    alive: 0,
    peakStress: 0,
  };
}

export default function EmergentSystems({
  project,
}: {
  project: CreativeProject;
}) {
  const mode = project.slug as Mode;
  const copy = MODE_COPY[mode];
  const worldRef = useRef<SystemWorld>(emptyWorld(mode));
  const telemetryClockRef = useRef(0);
  const randomRef = useRef(mulberry32(hashSeed(mode)));
  const [paused, setPaused] = useState(false);
  const [primary, setPrimary] = useState(
    mode === "load-path" ? 62 : mode === "terraform" ? 58 : 55,
  );
  const [secondary, setSecondary] = useState(
    mode === "load-path" ? 50 : mode === "terraform" ? 48 : 45,
  );
  const [preset, setPreset] = useState(copy.presets[0]);
  const [revision, setRevision] = useState(1);
  const [telemetry, setTelemetry] = useState({
    agents: 0,
    activity: 0,
    stability: 100,
    generation: 1,
  });

  const initialize = useCallback(
    (width = 900, height = 680) => {
      const random = mulberry32(hashSeed(`${mode}-${preset}-${revision}`));
      randomRef.current = random;
      const world = emptyWorld(mode);
      world.width = width;
      world.height = height;
      if (mode === "murmuration") {
        world.boids = Array.from({ length: 145 }, () => ({
          x: random() * width,
          y: random() * height,
          vx: (random() - 0.5) * 80,
          vy: (random() - 0.5) * 80,
        }));
      }
      if (mode === "automata-atlas") {
        world.cols = 72;
        world.rows = 48;
        world.cells = new Uint8Array(world.cols * world.rows);
        world.cells.forEach((_, index) => {
          world.cells[index] = random() > 0.72 ? 1 : 0;
        });
        world.alive = world.cells.reduce((sum, cell) => sum + cell, 0);
      }
      if (mode === "terraform") {
        world.cols = 74;
        world.rows = 50;
        const count = world.cols * world.rows;
        world.terrain = new Float32Array(count);
        world.water = new Float32Array(count);
        world.vegetation = new Float32Array(count);
        for (let y = 0; y < world.rows; y += 1) {
          for (let x = 0; x < world.cols; x += 1) {
            const index = y * world.cols + x;
            const basin =
              0.48 +
              Math.sin(x * 0.19) * 0.14 +
              Math.cos(y * 0.23) * 0.12 +
              (random() - 0.5) * 0.16;
            world.terrain[index] = Math.max(0.04, Math.min(0.96, basin));
            world.vegetation[index] =
              world.terrain[index] > 0.35 && world.terrain[index] < 0.7
                ? random() * 0.55
                : random() * 0.08;
          }
        }
      }
      worldRef.current = world;
    },
    [mode, preset, revision],
  );

  const draw = useCallback((runtime: CreativeCanvasRuntime) => {
    const context = runtime.context;
    const world = worldRef.current;
    if (!context) return;
    if (!world.boids.length && !world.cells.length && !world.terrain.length && mode !== "load-path") {
      initialize(runtime.size.width || 900, runtime.size.height || 680);
    }
    context.clearRect(0, 0, world.width, world.height);
    context.fillStyle = "#070a10";
    context.fillRect(0, 0, world.width, world.height);

    if (mode === "murmuration") drawBoids(context, world);
    if (mode === "automata-atlas") drawAutomata(context, world);
    if (mode === "load-path") drawLoadPath(context, world, primary, secondary, preset);
    if (mode === "terraform") drawTerrain(context, world);
  }, [initialize, mode, preset, primary, secondary]);

  const advance = useCallback(
    (dt: number, runtime: CreativeCanvasRuntime) => {
      if (paused) return;
      const world = worldRef.current;
      world.tick += dt;
      telemetryClockRef.current += dt;
      if (mode === "murmuration") updateBoids(world, dt, primary, secondary);
      if (mode === "automata-atlas" && world.tick > 0.12) {
        updateAutomata(world, preset, primary, secondary);
        world.tick = 0;
      }
      if (mode === "terraform") updateTerrain(world, dt, primary, secondary, randomRef.current);
      draw(runtime);
      if (telemetryClockRef.current >= 0.5) {
        telemetryClockRef.current = 0;
        setTelemetry({
          agents:
            mode === "murmuration"
              ? world.boids.length
              : mode === "automata-atlas"
                ? world.alive
                : mode === "terraform"
                  ? world.vegetation.reduce((sum, value) => sum + (value > 0.28 ? 1 : 0), 0)
                  : 18,
          activity:
            mode === "load-path"
              ? Math.round(world.peakStress)
              : Math.round(
                  mode === "terraform"
                    ? world.rainfall * 100
                    : world.generation,
                ),
          stability: Math.max(
            0,
            Math.round(
              100 -
                (mode === "load-path"
                  ? world.peakStress * 0.55
                  : Math.abs(primary - secondary) * 0.6),
            ),
          ),
          generation: world.generation,
        });
      }
    },
    [draw, mode, paused, preset, primary, secondary],
  );

  const {
    canvasRef,
    hostRef,
    sizeRef,
    repaint,
  } = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => advance(Math.min(dt, 0.04), runtime),
    onResize: (size, scale) => {
      const world = worldRef.current;
      worldRef.current = {
        ...world,
        width: size.width,
        height: size.height,
        boids: world.boids.map((boid) => ({
          ...boid,
          x: boid.x * scale.x,
          y: boid.y * scale.y,
        })),
      };
    },
    onRepaint: draw,
  });

  useEffect(() => {
    initialize(sizeRef.current.width || 900, sizeRef.current.height || 680);
    repaint();
  }, [initialize, repaint, sizeRef]);

  useEffect(() => {
    repaint();
  }, [primary, repaint, secondary]);

  function interact(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const world = worldRef.current;
    if (mode === "murmuration") {
      world.predator = { x, y, vx: 0, vy: 0, active: true };
    }
    if (mode === "automata-atlas") {
      const col = Math.floor((x / bounds.width) * world.cols);
      const row = Math.floor((y / bounds.height) * world.rows);
      const index = row * world.cols + col;
      if (index >= 0 && index < world.cells.length) world.cells[index] = world.cells[index] ? 0 : 1;
    }
    if (mode === "terraform") {
      const col = Math.floor((x / bounds.width) * world.cols);
      const row = Math.floor((y / bounds.height) * world.rows);
      for (let dy = -4; dy <= 4; dy += 1) {
        for (let dx = -4; dx <= 4; dx += 1) {
          const cx = col + dx;
          const cy = row + dy;
          if (cx >= 0 && cy >= 0 && cx < world.cols && cy < world.rows) {
            world.water[cy * world.cols + cx] += Math.max(0, 0.6 - Math.hypot(dx, dy) * 0.1);
          }
        }
      }
    }
    if (mode === "load-path") setSecondary(Math.round((x / bounds.width) * 100));
    repaint();
  }

  const statItems = useMemo(
    () => [
      {
        label:
          mode === "murmuration"
            ? "Agents"
            : mode === "automata-atlas"
              ? "Living cells"
              : mode === "load-path"
                ? "Members"
                : "Vegetated cells",
        value: String(telemetry.agents),
      },
      {
        label:
          mode === "load-path"
            ? "Peak stress"
            : mode === "terraform"
              ? "Water index"
              : "Generation",
        value: String(telemetry.activity),
        alert: mode === "load-path" && telemetry.activity > 70,
      },
      { label: "Stability", value: `${telemetry.stability}%` },
      { label: "Revision", value: String(revision) },
    ],
    [mode, revision, telemetry],
  );

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
                role="img"
                aria-label={`${project.title} interactive simulation canvas`}
                className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
              />
            </div>
            <aside className="border-t border-white/15 bg-[#0c0e14] p-6 xl:border-l xl:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                What this is for
              </p>
              <p className="mt-3 text-sm leading-7 text-white/65">{copy.purpose}</p>
              <ControlSelect
                label="System preset"
                value={preset}
                options={copy.presets}
                onChange={(value) => setPreset(value)}
              />
              <ControlRange
                label={copy.primary}
                value={primary}
                min={5}
                max={100}
                display={`${primary}%`}
                onChange={(value) => {
                  setPrimary(value);
                  repaint();
                }}
              />
              <ControlRange
                label={copy.secondary}
                value={secondary}
                min={5}
                max={100}
                display={`${secondary}%`}
                tone={mode === "load-path" ? "alert" : "accent"}
                onChange={(value) => {
                  setSecondary(value);
                  repaint();
                }}
              />
              <div className="mt-7 rounded-2xl border border-white/12 bg-white/[0.025] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                  Interaction
                </p>
                <p className="mt-2 text-xs leading-6 text-white/60">
                  {mode === "murmuration" &&
                    "Click the field to place a predator and watch the flock reorganize."}
                  {mode === "automata-atlas" &&
                    "Click cells to paint the next generation, then pause or advance the system."}
                  {mode === "load-path" &&
                    "Click the span to move the applied load and recompute every member."}
                  {mode === "terraform" &&
                    "Click anywhere to drop a local storm; water then flows downhill and changes growth."}
                </p>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-2">
                <StageButton
                  onClick={() => setPaused((value) => !value)}
                  pressed={paused}
                >
                  {paused ? "Resume" : "Pause"}
                </StageButton>
                <StageButton
                  variant="primary"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  New system
                </StageButton>
                {mode === "automata-atlas" && paused ? (
                  <StageButton
                    onClick={() => {
                      updateAutomata(worldRef.current, preset, primary, secondary);
                      repaint();
                    }}
                  >
                    Step once
                  </StageButton>
                ) : null}
                <StageButton
                  onClick={() =>
                    exportCanvasPng(
                      canvasRef.current,
                      `${project.slug}-${revision}.png`,
                    )
                  }
                >
                  Export frame
                </StageButton>
              </div>
            </aside>
          </div>
          <StatStrip items={statItems} />
        </div>
      </section>
    </CreativeProjectShell>
  );
}

function updateBoids(world: SystemWorld, dt: number, cohesion: number, separation: number) {
  const next = world.boids.map((boid) => ({ ...boid }));
  for (let index = 0; index < world.boids.length; index += 1) {
    const boid = world.boids[index];
    let centerX = 0;
    let centerY = 0;
    let alignX = 0;
    let alignY = 0;
    let repelX = 0;
    let repelY = 0;
    let neighbors = 0;
    for (let otherIndex = 0; otherIndex < world.boids.length; otherIndex += 1) {
      if (index === otherIndex) continue;
      const other = world.boids[otherIndex];
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 74) {
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
    if (neighbors) {
      centerX = centerX / neighbors - boid.x;
      centerY = centerY / neighbors - boid.y;
      alignX = alignX / neighbors - boid.vx;
      alignY = alignY / neighbors - boid.vy;
      next[index].vx += (centerX * cohesion * 0.00004 + alignX * 0.0018 + repelX * separation * 0.045) * dt * 60;
      next[index].vy += (centerY * cohesion * 0.00004 + alignY * 0.0018 + repelY * separation * 0.045) * dt * 60;
    }
    if (world.predator.active) {
      const dx = boid.x - world.predator.x;
      const dy = boid.y - world.predator.y;
      const distance = Math.max(4, Math.hypot(dx, dy));
      if (distance < 150) {
        next[index].vx += (dx / distance) * (160 - distance) * 0.045;
        next[index].vy += (dy / distance) * (160 - distance) * 0.045;
      }
    }
    const speed = Math.max(1, Math.hypot(next[index].vx, next[index].vy));
    const maxSpeed = 86;
    if (speed > maxSpeed) {
      next[index].vx = (next[index].vx / speed) * maxSpeed;
      next[index].vy = (next[index].vy / speed) * maxSpeed;
    }
    next[index].x = (boid.x + next[index].vx * dt + world.width) % world.width;
    next[index].y = (boid.y + next[index].vy * dt + world.height) % world.height;
  }
  world.boids = next;
  world.generation += dt * 0.1;
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

function automataRules(preset: string, birth: number, survival: number) {
  if (preset === "HighLife") return { births: new Set([3, 6]), survives: new Set([2, 3]) };
  if (preset === "Seeds") return { births: new Set([2]), survives: new Set<number>() };
  const birthValue = Math.max(1, Math.min(8, Math.round(birth / 18)));
  const survivalValue = Math.max(1, Math.min(8, Math.round(survival / 22)));
  return { births: new Set([birthValue]), survives: new Set([survivalValue, Math.min(8, survivalValue + 1)]) };
}

function updateAutomata(world: SystemWorld, preset: string, birth: number, survival: number) {
  const next = new Uint8Array(world.cells.length);
  const rules = automataRules(preset, birth, survival);
  let alive = 0;
  for (let y = 0; y < world.rows; y += 1) {
    for (let x = 0; x < world.cols; x += 1) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (!dx && !dy) continue;
          const nx = (x + dx + world.cols) % world.cols;
          const ny = (y + dy + world.rows) % world.rows;
          neighbors += world.cells[ny * world.cols + nx];
        }
      }
      const index = y * world.cols + x;
      next[index] = world.cells[index]
        ? Number(rules.survives.has(neighbors))
        : Number(rules.births.has(neighbors));
      alive += next[index];
    }
  }
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

function drawLoadPath(
  context: CanvasRenderingContext2D,
  world: SystemWorld,
  load: number,
  position: number,
  preset: string,
) {
  const count = preset === "Tower frame" ? 6 : 9;
  const margin = world.width * 0.1;
  const span = world.width - margin * 2;
  const baseY = world.height * 0.72;
  const height = preset === "Tower frame" ? world.height * 0.5 : world.height * 0.27;
  const nodes = Array.from({ length: count }, (_, index) => ({
    x: margin + (span * index) / (count - 1),
    y: index % 2 ? baseY - height : baseY,
  }));
  const loadX = margin + span * (position / 100);
  let peak = 0;
  const members: Array<[typeof nodes[number], typeof nodes[number], number]> = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    const distance = Math.abs((nodes[index].x + nodes[index + 1].x) / 2 - loadX) / span;
    const stress = load * (1 - Math.min(1, distance * 1.8)) * (index % 2 ? -1 : 1);
    peak = Math.max(peak, Math.abs(stress));
    members.push([nodes[index], nodes[index + 1], stress]);
    if (index < nodes.length - 2) members.push([nodes[index], nodes[index + 2], stress * -0.62]);
  }
  world.peakStress = peak;
  context.lineCap = "round";
  for (const [a, b, stress] of members) {
    const intensity = Math.min(1, Math.abs(stress) / 80);
    context.strokeStyle =
      stress < 0
        ? `rgba(96,165,250,${0.28 + intensity * 0.72})`
        : `rgba(248,113,113,${0.28 + intensity * 0.72})`;
    context.lineWidth = 2 + intensity * 5;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }
  context.fillStyle = "#f5f5f5";
  for (const node of nodes) {
    context.beginPath();
    context.arc(node.x, node.y, 5, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = "#f87171";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(loadX, world.height * 0.16);
  context.lineTo(loadX, baseY - height - 20);
  context.stroke();
  context.fillStyle = "#f87171";
  context.beginPath();
  context.moveTo(loadX, baseY - height);
  context.lineTo(loadX - 8, baseY - height - 16);
  context.lineTo(loadX + 8, baseY - height - 16);
  context.closePath();
  context.fill();
}

function updateTerrain(
  world: SystemWorld,
  dt: number,
  rain: number,
  temperature: number,
  random: () => number,
) {
  const count = world.cols * world.rows;
  const nextWater = new Float32Array(world.water);
  for (let iteration = 0; iteration < Math.max(1, Math.round(rain / 24)); iteration += 1) {
    const index = Math.floor(random() * count);
    nextWater[index] += rain * 0.0009;
  }
  for (let y = 1; y < world.rows - 1; y += 1) {
    for (let x = 1; x < world.cols - 1; x += 1) {
      const index = y * world.cols + x;
      const currentLevel = world.terrain[index] + world.water[index];
      let lowest = index;
      for (const neighbor of [index - 1, index + 1, index - world.cols, index + world.cols]) {
        if (world.terrain[neighbor] + world.water[neighbor] < world.terrain[lowest] + world.water[lowest]) lowest = neighbor;
      }
      if (lowest !== index && nextWater[index] > 0.002) {
        const flow = Math.min(nextWater[index] * 0.12, Math.max(0, currentLevel - world.terrain[lowest]) * 0.08);
        nextWater[index] -= flow;
        nextWater[lowest] += flow;
        world.terrain[index] = Math.max(0.02, world.terrain[index] - flow * 0.002);
      }
      const moisture = nextWater[index] + rain / 180;
      const heatPenalty = Math.abs(temperature - 48) / 100;
      world.vegetation[index] = Math.max(0, Math.min(1, world.vegetation[index] + (moisture * 0.003 - heatPenalty * 0.0015) * dt * 60));
      nextWater[index] *= 1 - (0.0005 + temperature * 0.000012) * dt * 60;
    }
  }
  world.water = nextWater;
  world.rainfall = world.water.reduce((sum, value) => sum + value, 0) / Math.max(1, count);
  world.generation += dt * 0.03;
}

function drawTerrain(context: CanvasRenderingContext2D, world: SystemWorld) {
  const cellWidth = world.width / world.cols;
  const cellHeight = world.height / world.rows;
  for (let index = 0; index < world.terrain.length; index += 1) {
    const elevation = world.terrain[index];
    const water = world.water[index];
    const vegetation = world.vegetation[index];
    const x = (index % world.cols) * cellWidth;
    const y = Math.floor(index / world.cols) * cellHeight;
    context.fillStyle =
      water > 0.08
        ? `rgba(37,99,235,${Math.min(0.9, 0.35 + water)})`
        : vegetation > 0.22
          ? `rgb(${Math.round(26 + elevation * 20)},${Math.round(74 + vegetation * 90)},${Math.round(82 + elevation * 35)})`
          : `rgb(${Math.round(35 + elevation * 70)},${Math.round(38 + elevation * 58)},${Math.round(46 + elevation * 50)})`;
    context.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
  }
}
