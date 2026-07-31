"use client";

import { useEffect, useRef, useState } from "react";
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
  type CreativeCanvasRuntime,
} from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeProject } from "@/lib/creativeProjects";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type FieldMode = "Vortex lattice" | "Strange attractor" | "Tidal weave";
type Spectrum = "Blue field" | "Red shift" | "Duotone" | "Monochrome";

interface Particle {
  x: number;
  y: number;
  px: number;
  py: number;
  age: number;
  life: number;
  band: number;
}

interface FieldParams {
  mode: FieldMode;
  spectrum: Spectrum;
  turbulence: number;
  symmetry: number;
  speed: number;
  frozen: boolean;
  pointerActive: boolean;
  pointerX: number;
  pointerY: number;
  attractorOn: boolean;
  attractorX: number;
  attractorY: number;
}

const PRESETS: Array<{
  name: string;
  mode: FieldMode;
  spectrum: Spectrum;
  turbulence: number;
  symmetry: number;
  speed: number;
}> = [
  { name: "Event horizon", mode: "Strange attractor", spectrum: "Blue field", turbulence: 52, symmetry: 5, speed: 12 },
  { name: "Solar loom", mode: "Tidal weave", spectrum: "Duotone", turbulence: 34, symmetry: 8, speed: 9 },
  { name: "Red giant", mode: "Vortex lattice", spectrum: "Red shift", turbulence: 76, symmetry: 3, speed: 16 },
];

// Two-accent palette only: blue hue 217, red hue 0, and neutral greys.
// Bands vary lightness within a family, never hue.
function colorFor(spectrum: Spectrum, band: number, alpha: number): string {
  if (spectrum === "Blue field") {
    return `hsla(217, 90%, ${50 + band * 28}%, ${alpha})`;
  }
  if (spectrum === "Red shift") {
    return `hsla(0, 88%, ${48 + band * 28}%, ${alpha})`;
  }
  if (spectrum === "Duotone") {
    const hue = band < 0.5 ? 217 : 0;
    return `hsla(${hue}, 88%, ${58 + band * 16}%, ${alpha})`;
  }
  return `hsla(0, 0%, ${68 + band * 22}%, ${alpha})`;
}

export default function ContinuumEngine({
  project,
}: {
  project: CreativeProject;
}) {
  const [mode, setMode] = useState<FieldMode>("Strange attractor");
  const [spectrum, setSpectrum] = useState<Spectrum>("Blue field");
  const [turbulence, setTurbulence] = useState(52);
  const [symmetry, setSymmetry] = useState(5);
  const [speed, setSpeed] = useState(12);
  const [particleCount, setParticleCount] = useState(1900);
  const [seed, setSeed] = useState("continuum-01");
  const [frozen, setFrozen] = useState(false);
  const [generation, setGeneration] = useState(1);
  const [attractorOn, setAttractorOn] = useState(false);
  const [attractorX, setAttractorX] = useState(50);
  const [attractorY, setAttractorY] = useState(50);
  const [telemetry, setTelemetry] = useState({ fps: 0, energy: 0, entropy: 0 });
  const [status, setStatus] = useState("Universe 1 seeded and flowing.");

  const paramsRef = useRef<FieldParams>({
    mode,
    spectrum,
    turbulence,
    symmetry,
    speed,
    frozen,
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
    attractorOn,
    attractorX,
    attractorY,
  });
  const particlesRef = useRef<Particle[]>([]);
  const countRef = useRef(particleCount);
  const worldRandomRef = useRef<() => number>(() => 0.5);
  const frameRef = useRef(0);
  const fieldStatsRef = useRef({ energy: 0, entropy: 0 });
  const fpsRef = useRef({ accumulated: 0, frames: 0 });

  function spawnParticle(
    random: () => number,
    width: number,
    height: number,
    target?: Particle,
  ): Particle {
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * Math.min(width, height) * 0.46;
    const x = width / 2 + Math.cos(angle) * radius;
    const y = height / 2 + Math.sin(angle) * radius;
    const particle = target ?? {
      x,
      y,
      px: x,
      py: y,
      age: 0,
      life: 0,
      band: 0,
    };
    particle.x = x;
    particle.y = y;
    particle.px = x;
    particle.py = y;
    particle.age = 0;
    particle.life = 160 + random() * 520;
    particle.band = random();
    return particle;
  }

  function vectorAt(x: number, y: number, time: number, width: number, height: number) {
    const params = paramsRef.current;
    const shortSide = Math.min(width, height);
    const nx = (x - width / 2) / shortSide;
    const ny = (y - height / 2) / shortSide;
    const radius = Math.max(0.001, Math.hypot(nx, ny));
    const theta = Math.atan2(ny, nx);
    const symmetryWave = Math.sin(theta * params.symmetry + time * 0.25);
    const noise =
      Math.sin(nx * 8.3 + time * 0.31) *
      Math.cos(ny * 7.1 - time * 0.23) *
      (params.turbulence / 100);
    let angle: number;
    if (params.mode === "Vortex lattice") {
      angle =
        Math.atan2(
          Math.sin(nx * Math.PI * params.symmetry),
          Math.cos(ny * Math.PI * params.symmetry),
        ) +
        noise * 2.4;
    } else if (params.mode === "Tidal weave") {
      angle =
        Math.sin(ny * 5 + time * 0.18) * 1.7 +
        Math.cos(nx * 4 - time * 0.14) +
        symmetryWave * 0.62 +
        noise;
    } else {
      angle =
        theta +
        Math.PI / 2 +
        Math.sin(radius * 18 - time * 0.38) * 0.74 +
        symmetryWave * 0.3 +
        noise;
    }
    let pullX: number | null = null;
    let pullY: number | null = null;
    if (params.pointerActive) {
      pullX = params.pointerX;
      pullY = params.pointerY;
    } else if (params.attractorOn) {
      pullX = (params.attractorX / 100) * width;
      pullY = (params.attractorY / 100) * height;
    }
    if (pullX !== null && pullY !== null) {
      const dx = pullX - x;
      const dy = pullY - y;
      const distance = Math.max(22, Math.hypot(dx, dy));
      const pull = Math.max(0, 1 - distance / 330);
      angle = angle * (1 - pull) + (Math.atan2(dy, dx) + Math.PI * 0.16) * pull;
    }
    return {
      x: Math.cos(angle),
      y: Math.sin(angle),
      energy: Math.min(1, Math.abs(noise) + 0.2 + 1 / (radius * 8 + 2)),
    };
  }

  function renderStep(runtime: CreativeCanvasRuntime) {
    const context = runtime.context;
    if (!context) {
      return;
    }
    const { width, height } = runtime.size;
    const params = paramsRef.current;
    const time = frameRef.current / 60;
    const step = params.speed / 5.2;
    context.fillStyle = "rgba(3,4,7,0.055)";
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";
    let energySum = 0;
    let turnSum = 0;
    const particles = particlesRef.current;
    const random = worldRandomRef.current;
    for (const particle of particles) {
      particle.px = particle.x;
      particle.py = particle.y;
      const vector = vectorAt(particle.x, particle.y, time, width, height);
      particle.x += vector.x * step;
      particle.y += vector.y * step;
      particle.age += 1;
      energySum += vector.energy;
      turnSum += Math.abs(vector.x * vector.y);
      const escaped =
        particle.x < -10 ||
        particle.x > width + 10 ||
        particle.y < -10 ||
        particle.y > height + 10;
      if (escaped || particle.age > particle.life) {
        spawnParticle(random, width, height, particle);
        continue;
      }
      context.strokeStyle = colorFor(
        params.spectrum,
        particle.band,
        0.08 + vector.energy * 0.21,
      );
      context.lineWidth = 0.45 + vector.energy * 0.7;
      context.beginPath();
      context.moveTo(particle.px, particle.py);
      context.lineTo(particle.x, particle.y);
      context.stroke();
    }
    context.globalCompositeOperation = "source-over";
    frameRef.current += 1;
    if (particles.length > 0) {
      fieldStatsRef.current = {
        energy: energySum / particles.length,
        entropy: Math.min(1, (turnSum / particles.length) * 4),
      };
    }
  }

  const stage = useCreativeCanvas({
    minHeight: 620,
    contextSettings: { alpha: false },
    onFrame: (dt, _elapsed, runtime) => {
      if (paramsRef.current.frozen) {
        return;
      }
      renderStep(runtime);
      if (dt > 0) {
        fpsRef.current.accumulated += 1 / dt;
        fpsRef.current.frames += 1;
      }
      if (fpsRef.current.frames >= 24) {
        const fps = Math.round(
          fpsRef.current.accumulated / fpsRef.current.frames,
        );
        fpsRef.current = { accumulated: 0, frames: 0 };
        setTelemetry({
          fps,
          energy: fieldStatsRef.current.energy,
          entropy: fieldStatsRef.current.entropy,
        });
      }
    },
    onResize: (_size, scale) => {
      for (const particle of particlesRef.current) {
        particle.x *= scale.x;
        particle.px *= scale.x;
        particle.y *= scale.y;
        particle.py *= scale.y;
      }
    },
    onRepaint: (runtime) => {
      const context = runtime.context;
      if (!context) {
        return;
      }
      context.fillStyle = "#030407";
      context.fillRect(0, 0, runtime.size.width, runtime.size.height);
      // Rebuild a finished composition rather than a blank frame, so reduced
      // motion (and post-resize normal motion) always shows a complete work.
      // 140 steps keeps a slider drag under reduced motion responsive.
      const steps = stage.reducedMotion ? 140 : 90;
      for (let index = 0; index < steps; index += 1) {
        renderStep(runtime);
      }
      setTelemetry((current) => ({
        ...current,
        energy: fieldStatsRef.current.energy,
        entropy: fieldStatsRef.current.entropy,
      }));
    },
  });
  const { reducedMotion, repaint, sizeRef, canvasRef, contextRef, hostRef } =
    stage;

  // Live parameters: the frame loop reads these, so slider/select changes
  // retune the running field without rebuilding it. Under reduced motion a
  // parameter change re-renders the finished composition instead.
  useEffect(() => {
    const params = paramsRef.current;
    params.mode = mode;
    params.spectrum = spectrum;
    params.turbulence = turbulence;
    params.symmetry = symmetry;
    params.speed = speed;
    params.frozen = frozen;
    params.attractorOn = attractorOn;
    params.attractorX = attractorX;
    params.attractorY = attractorY;
    if (reducedMotion) {
      repaint();
    }
  }, [
    attractorOn,
    attractorX,
    attractorY,
    frozen,
    mode,
    reducedMotion,
    repaint,
    spectrum,
    speed,
    symmetry,
    turbulence,
  ]);

  // The current count lives in a ref so the world-init effect below can read
  // it without depending on it — count changes must never rebuild the world.
  useEffect(() => {
    countRef.current = particleCount;
  }, [particleCount]);

  // The universe is rebuilt only when the seed or generation changes; the
  // same seed and tracer count always reproduce the same initial universe.
  useEffect(() => {
    const random = mulberry32(hashSeed(`${seed}-${generation}`));
    worldRandomRef.current = random;
    frameRef.current = 0;
    const width = Math.max(sizeRef.current.width, 320);
    const height = Math.max(sizeRef.current.height, 620);
    particlesRef.current = Array.from({ length: countRef.current }, () =>
      spawnParticle(random, width, height),
    );
    repaint();
  }, [generation, repaint, seed, sizeRef]);

  // Tracer-count changes are additive: grow with a dedicated deterministic
  // stream or trim, never tearing down the existing composition.
  useEffect(() => {
    const particles = particlesRef.current;
    if (particleCount > particles.length) {
      const extra = mulberry32(
        hashSeed(`${seed}-${generation}-extra-${particleCount}`),
      );
      const width = Math.max(sizeRef.current.width, 320);
      const height = Math.max(sizeRef.current.height, 620);
      while (particles.length < particleCount) {
        particles.push(spawnParticle(extra, width, height));
      }
    } else if (particleCount < particles.length) {
      particles.length = particleCount;
    }
    if (reducedMotion) {
      repaint();
    }
  }, [generation, particleCount, reducedMotion, repaint, seed, sizeRef]);

  function stepOnce() {
    renderStep({ context: contextRef.current, size: sizeRef.current });
    setTelemetry((current) => ({
      ...current,
      energy: fieldStatsRef.current.energy,
      entropy: fieldStatsRef.current.entropy,
    }));
    setStatus("Advanced one frame.");
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setMode(preset.mode);
    setSpectrum(preset.spectrum);
    setTurbulence(preset.turbulence);
    setSymmetry(preset.symmetry);
    setSpeed(preset.speed);
    setStatus(`${preset.name} recipe applied.`);
  }

  function updatePointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const params = paramsRef.current;
    params.pointerX = event.clientX - bounds.left;
    params.pointerY = event.clientY - bounds.top;
    params.pointerActive = true;
  }

  function releasePointer() {
    paramsRef.current.pointerActive = false;
  }

  const attractorLabel = attractorOn
    ? `${attractorX}% · ${attractorY}%`
    : "off";

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-[1500px] px-4 pb-24 sm:px-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050609] shadow-[0_40px_140px_rgba(0,0,0,0.65)]">
          <StageHeader
            eyebrow="Continuum engine · deterministic field synthesis"
            stats={[
              {
                label: "fps",
                value: reducedMotion ? "static" : String(telemetry.fps),
              },
              { label: "tracers", value: particleCount.toLocaleString() },
              { label: "gen", value: String(generation).padStart(2, "0") },
            ]}
          />
          <div className="grid xl:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <div
                ref={hostRef}
                className="relative min-h-[560px] overflow-hidden bg-[#030407] md:min-h-[700px]"
              >
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Generative topology field drawn by thousands of flowing luminous tracers"
                  className="absolute inset-0 h-full w-full touch-pan-y"
                  onPointerMove={updatePointer}
                  onPointerDown={updatePointer}
                  onPointerLeave={releasePointer}
                  onPointerUp={releasePointer}
                />
              </div>
              <StatStrip
                items={[
                  { label: "Field energy", value: telemetry.energy.toFixed(3) },
                  {
                    label: "Directional entropy",
                    value: telemetry.entropy.toFixed(3),
                  },
                  { label: "Rotational symmetry", value: `${symmetry}-fold` },
                  { label: "Attractor", value: attractorLabel },
                ]}
              />
            </div>
            <aside className="border-t border-white/10 bg-[#08090c] p-6 md:p-8 xl:border-l xl:border-t-0">
              <p className="sr-only" role="status" aria-live="polite">
                {status}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                Field recipes
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="min-h-16 rounded-xl border border-white/10 px-2 text-[10px] leading-4 text-white/60 transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-white"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <ControlSelect
                label="Topology"
                value={mode}
                options={["Vortex lattice", "Strange attractor", "Tidal weave"]}
                onChange={(value) => setMode(value)}
              />
              <ControlSelect
                label="Spectrum"
                value={spectrum}
                options={["Blue field", "Red shift", "Duotone", "Monochrome"]}
                onChange={(value) => setSpectrum(value)}
              />
              <ControlRange
                label="Turbulence"
                value={turbulence}
                min={0}
                max={100}
                display={`${turbulence}%`}
                onChange={setTurbulence}
              />
              <ControlRange
                label="Rotational symmetry"
                value={symmetry}
                min={2}
                max={12}
                display={`${symmetry}-fold`}
                onChange={setSymmetry}
              />
              <ControlRange
                label="Temporal velocity"
                value={speed}
                min={3}
                max={24}
                display={`${(speed / 10).toFixed(1)}×`}
                onChange={setSpeed}
              />
              <ControlRange
                label="Tracer population"
                value={particleCount}
                min={600}
                max={3200}
                step={200}
                display={particleCount.toLocaleString()}
                onChange={setParticleCount}
              />
              <div className="mt-6">
                <StageButton
                  variant="ghost"
                  pressed={attractorOn}
                  onClick={() => {
                    const next = !attractorOn;
                    setAttractorOn(next);
                    setStatus(
                      next
                        ? "Attractor enabled — position it with the X and Y sliders or your pointer."
                        : "Attractor disabled.",
                    );
                  }}
                  className="w-full"
                >
                  {attractorOn ? "Attractor: on" : "Attractor: off"}
                </StageButton>
                {attractorOn ? (
                  <>
                    <ControlRange
                      label="Attractor X"
                      value={attractorX}
                      min={0}
                      max={100}
                      display={`${attractorX}%`}
                      onChange={setAttractorX}
                    />
                    <ControlRange
                      label="Attractor Y"
                      value={attractorY}
                      min={0}
                      max={100}
                      display={`${attractorY}%`}
                      onChange={setAttractorY}
                    />
                  </>
                ) : null}
              </div>
              <label className="mt-6 block">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                  Reproducible seed
                </span>
                <input
                  value={seed}
                  maxLength={32}
                  onChange={(event) =>
                    setSeed(event.target.value || "continuum")
                  }
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 font-mono text-xs text-white/75 outline-none transition-colors focus:border-accent/50"
                />
              </label>
              <div className="mt-7 grid grid-cols-2 gap-2">
                {reducedMotion ? null : (
                  <StageButton
                    variant="ghost"
                    pressed={frozen}
                    onClick={() => {
                      const next = !frozen;
                      setFrozen(next);
                      setStatus(next ? "Time frozen." : "Time resumed.");
                    }}
                  >
                    {frozen ? "Resume time" : "Freeze time"}
                  </StageButton>
                )}
                <StageButton variant="ghost" onClick={stepOnce}>
                  Step frame
                </StageButton>
                <StageButton
                  variant="primary"
                  onClick={() => {
                    setGeneration((current) => current + 1);
                    setStatus(`Universe ${generation + 1} seeded.`);
                  }}
                >
                  New universe
                </StageButton>
                <StageButton
                  variant="solid"
                  onClick={() => {
                    exportCanvasPng(
                      canvasRef.current,
                      `continuum-${seed}-${generation}`,
                    );
                    setStatus("Composition exported as PNG.");
                  }}
                >
                  Export PNG
                </StageButton>
              </div>
              <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-white/55">
                Same seed + same tracer count = same initial universe. Adding
                tracers mid-flight is additive, so the composition is never
                destroyed. Pointer or attractor gravity bends the field toward
                you.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}
