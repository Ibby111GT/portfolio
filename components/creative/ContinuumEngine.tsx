"use client";

import { useEffect, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

type FieldMode = "Vortex lattice" | "Strange attractor" | "Tidal weave";
type Palette = "Ion" | "Solar" | "Infrared" | "Monochrome";
interface Particle { x: number; y: number; px: number; py: number; age: number; life: number; band: number }
interface EngineParameters {
  mode: FieldMode; palette: Palette; turbulence: number; symmetry: number;
  speed: number; pointerX: number; pointerY: number; pointerActive: boolean; frozen: boolean;
}

const PRESETS = [
  { name: "Event horizon", mode: "Strange attractor" as FieldMode, palette: "Ion" as Palette, turbulence: 52, symmetry: 5, speed: 12 },
  { name: "Solar loom", mode: "Tidal weave" as FieldMode, palette: "Solar" as Palette, turbulence: 34, symmetry: 8, speed: 9 },
  { name: "Red giant", mode: "Vortex lattice" as FieldMode, palette: "Infrared" as Palette, turbulence: 76, symmetry: 3, speed: 16 },
];

function colorFor(palette: Palette, band: number, alpha: number) {
  const hue = palette === "Ion" ? 188 + band * 72 : palette === "Solar" ? 34 + band * 22 : palette === "Infrared" ? 350 + band * 26 : 210;
  return `hsla(${hue},${palette === "Monochrome" ? 8 : 88}%,${palette === "Monochrome" ? 78 + band * 10 : 58 + band * 13}%,${alpha})`;
}

export default function ContinuumEngine({ project }: { project: CreativeProject }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const paramsRef = useRef<EngineParameters>({ mode: "Strange attractor", palette: "Ion", turbulence: 52, symmetry: 5, speed: 12, pointerX: 0, pointerY: 0, pointerActive: false, frozen: false });
  const resetRef = useRef<(() => void) | null>(null);
  const stepRef = useRef<(() => void) | null>(null);
  const exportRef = useRef<(() => void) | null>(null);
  const [mode, setMode] = useState<FieldMode>("Strange attractor");
  const [palette, setPalette] = useState<Palette>("Ion");
  const [turbulence, setTurbulence] = useState(52);
  const [symmetry, setSymmetry] = useState(5);
  const [speed, setSpeed] = useState(12);
  const [particleCount, setParticleCount] = useState(1900);
  const [seed, setSeed] = useState("continuum-01");
  const [frozen, setFrozen] = useState(false);
  const [generation, setGeneration] = useState(1);
  const [telemetry, setTelemetry] = useState({ fps: 60, energy: 0.52, entropy: 0.31 });
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => { Object.assign(paramsRef.current, { mode, palette, turbulence, symmetry, speed, frozen }); }, [frozen, mode, palette, speed, symmetry, turbulence]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    let width = 900, height = 900, frame = 0, animationFrame = 0;
    let lastTime = performance.now(), fpsAccumulator = 0, fpsFrames = 0;
    let particles: Particle[] = [];
    let random = mulberry32(hashSeed(`${seed}-${generation}`));

    function spawn(particle?: Particle) {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * Math.min(width, height) * 0.46;
      const target = particle ?? ({} as Particle);
      Object.assign(target, { x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius });
      target.px = target.x; target.py = target.y; target.age = 0;
      target.life = 160 + random() * 520; target.band = random();
      return target;
    }
    function reset() {
      random = mulberry32(hashSeed(`${seed}-${generation}`));
      particles = Array.from({ length: particleCount }, () => spawn());
      context!.fillStyle = "#030407"; context!.fillRect(0, 0, width, height);
    }
    function resize() {
      const bounds = stage!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, bounds.width); height = Math.max(620, bounds.height);
      canvas!.width = Math.round(width * ratio); canvas!.height = Math.round(height * ratio);
      canvas!.style.width = `${width}px`; canvas!.style.height = `${height}px`;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0); reset();
    }
    function vectorAt(x: number, y: number, time: number) {
      const p = paramsRef.current;
      const nx = (x - width / 2) / Math.min(width, height), ny = (y - height / 2) / Math.min(width, height);
      const radius = Math.max(0.001, Math.hypot(nx, ny)), theta = Math.atan2(ny, nx);
      const symmetryWave = Math.sin(theta * p.symmetry + time * 0.25);
      const noise = Math.sin(nx * 8.3 + time * 0.31) * Math.cos(ny * 7.1 - time * 0.23) * (p.turbulence / 100);
      let angle: number;
      if (p.mode === "Vortex lattice") angle = Math.atan2(Math.sin(nx * Math.PI * p.symmetry), Math.cos(ny * Math.PI * p.symmetry)) + noise * 2.4;
      else if (p.mode === "Tidal weave") angle = Math.sin(ny * 5 + time * 0.18) * 1.7 + Math.cos(nx * 4 - time * 0.14) + symmetryWave * 0.62 + noise;
      else angle = theta + Math.PI / 2 + Math.sin(radius * 18 - time * 0.38) * 0.74 + symmetryWave * 0.3 + noise;
      if (p.pointerActive) {
        const dx = p.pointerX - x, dy = p.pointerY - y, distance = Math.max(22, Math.hypot(dx, dy));
        const pull = Math.max(0, 1 - distance / 330);
        angle = angle * (1 - pull) + (Math.atan2(dy, dx) + Math.PI * 0.16) * pull;
      }
      return { x: Math.cos(angle), y: Math.sin(angle), energy: Math.min(1, Math.abs(noise) + 0.2 + 1 / (radius * 8 + 2)) };
    }
    function render(timestamp: number, force = false) {
      const p = paramsRef.current;
      if (p.frozen && !force) return;
      const time = frame / 60, step = p.speed / 5.2;
      context!.fillStyle = p.frozen ? "rgba(3,4,7,0.015)" : "rgba(3,4,7,0.055)";
      context!.fillRect(0, 0, width, height); context!.globalCompositeOperation = "lighter";
      let energySum = 0, turnSum = 0;
      for (const particle of particles) {
        particle.px = particle.x; particle.py = particle.y;
        const vector = vectorAt(particle.x, particle.y, time);
        particle.x += vector.x * step; particle.y += vector.y * step; particle.age += 1;
        energySum += vector.energy; turnSum += Math.abs(vector.x * vector.y);
        if (particle.x < -10 || particle.x > width + 10 || particle.y < -10 || particle.y > height + 10 || particle.age > particle.life) { spawn(particle); continue; }
        context!.strokeStyle = colorFor(p.palette, particle.band, 0.08 + vector.energy * 0.21);
        context!.lineWidth = 0.45 + vector.energy * 0.7;
        context!.beginPath(); context!.moveTo(particle.px, particle.py); context!.lineTo(particle.x, particle.y); context!.stroke();
      }
      context!.globalCompositeOperation = "source-over"; frame += 1;
      const delta = Math.max(1, timestamp - lastTime); fpsAccumulator += 1000 / delta; fpsFrames += 1; lastTime = timestamp;
      if (fpsFrames >= 24) {
        setTelemetry({ fps: Math.round(fpsAccumulator / fpsFrames), energy: energySum / particles.length, entropy: Math.min(1, (turnSum / particles.length) * 4) });
        fpsAccumulator = 0; fpsFrames = 0;
      }
    }
    function tick(timestamp: number) { render(timestamp); animationFrame = requestAnimationFrame(tick); }
    function pointerMove(event: PointerEvent) {
      const bounds = canvas!.getBoundingClientRect();
      Object.assign(paramsRef.current, { pointerX: event.clientX - bounds.left, pointerY: event.clientY - bounds.top, pointerActive: true });
    }
    function pointerLeave() { paramsRef.current.pointerActive = false; }
    resetRef.current = reset;
    stepRef.current = () => render(performance.now(), true);
    exportRef.current = () => { const link = document.createElement("a"); link.download = `continuum-${seed}-${generation}.png`; link.href = canvas!.toDataURL("image/png"); link.click(); };
    const observer = new ResizeObserver(resize); observer.observe(stage);
    canvas.addEventListener("pointermove", pointerMove); canvas.addEventListener("pointerdown", pointerMove);
    canvas.addEventListener("pointerleave", pointerLeave); canvas.addEventListener("pointerup", pointerLeave);
    resize();
    if (reducedMotion) for (let index = 0; index < 90; index += 1) render(performance.now(), true);
    else animationFrame = requestAnimationFrame(tick);
    return () => {
      observer.disconnect(); canvas.removeEventListener("pointermove", pointerMove); canvas.removeEventListener("pointerdown", pointerMove);
      canvas.removeEventListener("pointerleave", pointerLeave); canvas.removeEventListener("pointerup", pointerLeave);
      cancelAnimationFrame(animationFrame); resetRef.current = null; stepRef.current = null; exportRef.current = null;
    };
  }, [generation, particleCount, reducedMotion, seed]);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setMode(preset.mode); setPalette(preset.palette); setTurbulence(preset.turbulence);
    setSymmetry(preset.symmetry); setSpeed(preset.speed); window.setTimeout(() => resetRef.current?.(), 0);
  }

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-[1500px] px-4 pb-24 sm:px-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050609] shadow-[0_40px_140px_rgba(0,0,0,0.65)]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 md:px-8">
            <div className="flex items-center gap-3"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-40" /><span className="relative h-2 w-2 rounded-full bg-cyan-300" /></span><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Continuum engine · deterministic field synthesis</p></div>
            <div className="flex gap-5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>{telemetry.fps} fps</span><span>{particleCount.toLocaleString()} tracers</span><span>gen {String(generation).padStart(2, "0")}</span></div>
          </header>
          <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
            <div ref={stageRef} className="relative min-h-[720px] overflow-hidden bg-[#030407] md:min-h-[860px]">
              <canvas ref={canvasRef} role="img" aria-label="Interactive generative topology field with flowing luminous particles" className="absolute inset-0 h-full w-full touch-none" />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/25 to-transparent px-7 pb-32 pt-8 md:px-12 md:pt-12">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200/55">Field study № {String(generation).padStart(2, "0")}</p>
                <h2 className="mt-4 text-[clamp(3.5rem,9vw,8.5rem)] font-semibold leading-[0.78] tracking-[-0.065em] text-white">CONTIN<br />UUM</h2>
                <p className="mt-7 max-w-lg text-sm leading-7 text-white/48 md:text-base">A living topology drawn by thousands of short-lived agents. Move through the field to bend its gravity. Change the rules and a new universe emerges from the same seed.</p>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-3 gap-px border-t border-white/10 bg-white/10">
                {[["Field energy", telemetry.energy.toFixed(3)], ["Directional entropy", telemetry.entropy.toFixed(3)], ["Rotational symmetry", `${symmetry}-fold`]].map(([label, value]) => (
                  <div key={label} className="bg-black/75 px-4 py-4 backdrop-blur-md md:px-7"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">{label}</p><p className="mt-2 font-mono text-sm text-white/70">{value}</p></div>
                ))}
              </div>
            </div>
            <aside className="border-t border-white/10 bg-[#08090c] p-6 md:p-8 xl:border-l xl:border-t-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">Field recipes</p>
              <div className="mt-3 grid grid-cols-3 gap-2">{PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => applyPreset(preset)} className="min-h-16 rounded-xl border border-white/10 px-2 text-[10px] leading-4 text-white/55 transition-colors hover:border-cyan-300/35 hover:bg-cyan-300/[0.06] hover:text-white">{preset.name}</button>)}</div>
              <ControlSelect label="Topology" value={mode} onChange={(value) => setMode(value as FieldMode)} options={["Vortex lattice", "Strange attractor", "Tidal weave"]} />
              <ControlSelect label="Spectrum" value={palette} onChange={(value) => setPalette(value as Palette)} options={["Ion", "Solar", "Infrared", "Monochrome"]} />
              <ControlRange label="Turbulence" value={turbulence} min={0} max={100} suffix="%" onChange={setTurbulence} />
              <ControlRange label="Rotational symmetry" value={symmetry} min={2} max={12} suffix="-fold" onChange={setSymmetry} />
              <ControlRange label="Temporal velocity" value={speed} min={3} max={24} suffix={`${(speed / 10).toFixed(1)}×`} displayValue onChange={setSpeed} />
              <ControlRange label="Tracer population" value={particleCount} min={600} max={3200} step={200} suffix="" onChange={setParticleCount} />
              <label className="mt-6 block"><span className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/35">Reproducible seed</span><input value={seed} maxLength={32} onChange={(event) => setSeed(event.target.value || "continuum")} className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 font-mono text-xs text-white/70 outline-none transition-colors focus:border-cyan-300/45" /></label>
              <div className="mt-7 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setFrozen((current) => !current)} className="rounded-full border border-white/12 px-4 py-3 text-xs font-semibold text-white/65 hover:bg-white/[0.06]">{frozen ? "Resume time" : "Freeze time"}</button>
                <button type="button" disabled={!frozen} onClick={() => stepRef.current?.()} className="rounded-full border border-white/12 px-4 py-3 text-xs font-semibold text-white/65 enabled:hover:bg-white/[0.06] disabled:opacity-30">Step frame</button>
                <button type="button" onClick={() => setGeneration((current) => current + 1)} className="rounded-full bg-cyan-300 px-4 py-3 text-xs font-semibold text-black transition-transform hover:-translate-y-0.5">New universe</button>
                <button type="button" onClick={() => exportRef.current?.()} className="rounded-full bg-white px-4 py-3 text-xs font-semibold text-black transition-transform hover:-translate-y-0.5">Export PNG</button>
              </div>
              <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-white/35">Same seed + same parameters = same initial universe. Pointer gravity makes the trajectory uniquely yours.</p>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}

function ControlRange({ label, value, min, max, step = 1, suffix, displayValue = false, onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix: string; displayValue?: boolean; onChange: (value: number) => void }) {
  return <label className="mt-6 block"><span className="flex items-center justify-between gap-4"><span className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/35">{label}</span><span className="font-mono text-[10px] text-white/55">{displayValue ? suffix : `${value}${suffix}`}</span></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-cyan-300" /></label>;
}
function ControlSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="mt-6 block"><span className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/35">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-[#0d0e12] px-4 py-3 text-xs text-white/70 outline-none focus:border-cyan-300/45">{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}
