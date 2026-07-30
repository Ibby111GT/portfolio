"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type Species = "grazer" | "hunter" | "scavenger";
interface Genome { speed: number; sense: number; efficiency: number; fertility: number; hue: number }
interface Organism {
  id: number; species: Species; x: number; y: number; vx: number; vy: number;
  energy: number; age: number; generation: number; radius: number; genome: Genome;
}
interface Nutrient { x: number; y: number; value: number; phase: number }
interface Corpse { x: number; y: number; value: number; age: number }
interface Snapshot {
  grazers: number; hunters: number; scavengers: number; nutrients: number;
  births: number; deaths: number; generation: number; diversity: number;
}

const SPECIES: Record<Species, { label: string; color: string; role: string }> = {
  grazer: { label: "Luma grazers", color: "#67e8f9", role: "Consume photosynthetic nutrients" },
  hunter: { label: "Vesper hunters", color: "#fb7185", role: "Regulate grazer populations" },
  scavenger: { label: "Morrow recyclers", color: "#c4b5fd", role: "Return dead matter to the substrate" },
};
const INITIAL: Record<Species, number> = { grazer: 42, hunter: 8, scavenger: 12 };

export default function DigitalBiosphere({ project }: { project: CreativeProject }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const organismsRef = useRef<Organism[]>([]);
  const nutrientsRef = useRef<Nutrient[]>([]);
  const corpsesRef = useRef<Corpse[]>([]);
  const historyRef = useRef<Array<{ g: number; h: number; s: number }>>([]);
  const commandRef = useRef<{ reset?: () => void; event?: (type: "rain" | "drought" | "bloom") => void; add?: (species: Species) => void }>({});
  const selectedRef = useRef<number | null>(null);
  const climateRef = useRef({ rainfall: 62, temperature: 48, timeScale: 10, paused: false });
  const [rainfall, setRainfall] = useState(62);
  const [temperature, setTemperature] = useState(48);
  const [timeScale, setTimeScale] = useState(10);
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(1);
  const [snapshot, setSnapshot] = useState<Snapshot>({ grazers: 42, hunters: 8, scavengers: 12, nutrients: 90, births: 0, deaths: 0, generation: 1, diversity: 0.5 });
  const [selected, setSelected] = useState<Organism | null>(null);

  useEffect(() => { climateRef.current = { rainfall, temperature, timeScale, paused }; }, [paused, rainfall, temperature, timeScale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const surface: HTMLCanvasElement = canvas;
    const container: HTMLDivElement = host;
    const drawing: CanvasRenderingContext2D = context;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 900, height = 760, horizon = 0, frame = 0, animation = 0;
    let nextId = 1, births = 0, deaths = 0;
    let random = mulberry32(hashSeed(`biosphere-${epoch}`));

    function genome(species: Species, parent?: Genome): Genome {
      const base = species === "hunter"
        ? { speed: 1.45, sense: 105, efficiency: 0.78, fertility: 0.19, hue: 350 }
        : species === "scavenger"
          ? { speed: 0.72, sense: 82, efficiency: 0.9, fertility: 0.3, hue: 268 }
          : { speed: 0.92, sense: 74, efficiency: 0.86, fertility: 0.42, hue: 188 };
      if (!parent) return { ...base, speed: base.speed * (0.85 + random() * 0.3), sense: base.sense * (0.82 + random() * 0.36), efficiency: base.efficiency * (0.9 + random() * 0.2), fertility: base.fertility * (0.84 + random() * 0.32), hue: base.hue + (random() - 0.5) * 18 };
      const mutate = (value: number, spread: number) => Math.max(0.05, value * (1 + (random() - 0.5) * spread));
      return { speed: mutate(parent.speed, 0.22), sense: mutate(parent.sense, 0.2), efficiency: Math.min(1.15, mutate(parent.efficiency, 0.12)), fertility: Math.min(0.9, mutate(parent.fertility, 0.18)), hue: parent.hue + (random() - 0.5) * 10 };
    }
    function create(species: Species, x = random() * width, y = horizon + random() * (height - horizon), parent?: Organism): Organism {
      const genes = genome(species, parent?.genome);
      return { id: nextId++, species, x, y, vx: (random() - 0.5) * 0.3, vy: (random() - 0.5) * 0.3, energy: parent ? parent.energy * 0.46 : 54 + random() * 35, age: 0, generation: parent ? parent.generation + 1 : 1, radius: species === "hunter" ? 5.2 : species === "scavenger" ? 4.2 : 3.6, genome: genes };
    }
    function nutrient(x = random() * width, y = horizon + random() * (height - horizon)): Nutrient {
      return { x, y, value: 8 + random() * 12, phase: random() * Math.PI * 2 };
    }
    function reset() {
      random = mulberry32(hashSeed(`biosphere-${epoch}`)); nextId = 1; births = 0; deaths = 0; frame = 0;
      organismsRef.current = (Object.keys(INITIAL) as Species[]).flatMap((species) => Array.from({ length: INITIAL[species] }, () => create(species)));
      nutrientsRef.current = Array.from({ length: 90 }, () => nutrient());
      corpsesRef.current = []; historyRef.current = []; selectedRef.current = null; setSelected(null);
    }
    function resize() {
      const rect = container.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(340, rect.width); height = Math.max(700, rect.height); horizon = height * 0.22;
      surface.width = Math.round(width * ratio); surface.height = Math.round(height * ratio);
      surface.style.width = `${width}px`; surface.style.height = `${height}px`; drawing.setTransform(ratio, 0, 0, ratio, 0, 0);
      reset();
    }
    function nearest<T extends { x: number; y: number }>(agent: Organism, items: T[], radius: number, predicate?: (item: T) => boolean) {
      let result: T | undefined, best = radius * radius;
      for (const item of items) {
        if (predicate && !predicate(item)) continue;
        const dx = item.x - agent.x, dy = item.y - agent.y, distance = dx * dx + dy * dy;
        if (distance < best) { best = distance; result = item; }
      }
      return result;
    }
    function steer(agent: Organism, target: { x: number; y: number } | undefined, scale: number) {
      if (!target) {
        const angle = random() * Math.PI * 2;
        agent.vx += Math.cos(angle) * 0.018; agent.vy += Math.sin(angle) * 0.018;
        return;
      }
      const dx = target.x - agent.x, dy = target.y - agent.y, distance = Math.max(1, Math.hypot(dx, dy));
      agent.vx += (dx / distance) * scale; agent.vy += (dy / distance) * scale;
    }
    function update() {
      const climate = climateRef.current, dt = climate.timeScale / 10;
      const nutrients = nutrientsRef.current, corpses = corpsesRef.current, agents = organismsRef.current;
      const capacity = 260;
      if (random() < (0.07 + climate.rainfall / 900) * dt && nutrients.length < 220) nutrients.push(nutrient());
      for (const agent of agents) {
        const metabolic = (0.025 + agent.genome.speed * 0.012 + Math.abs(climate.temperature - 52) * 0.0008) / agent.genome.efficiency;
        agent.energy -= metabolic * dt; agent.age += 0.012 * dt;
        let target: { x: number; y: number } | undefined;
        if (agent.species === "grazer") target = nearest(agent, nutrients, agent.genome.sense);
        else if (agent.species === "hunter") target = nearest(agent, agents, agent.genome.sense, (other) => other.species === "grazer" && other.id !== agent.id);
        else target = nearest(agent, corpses, agent.genome.sense);
        steer(agent, target, 0.035 * dt);
        const limit = agent.genome.speed * dt;
        const velocity = Math.max(0.01, Math.hypot(agent.vx, agent.vy));
        if (velocity > limit) { agent.vx = (agent.vx / velocity) * limit; agent.vy = (agent.vy / velocity) * limit; }
        agent.x += agent.vx; agent.y += agent.vy; agent.vx *= 0.96; agent.vy *= 0.96;
        if (agent.x < 0) agent.x += width; if (agent.x > width) agent.x -= width;
        if (agent.y < horizon) { agent.y = horizon; agent.vy = Math.abs(agent.vy); }
        if (agent.y > height) { agent.y = height; agent.vy = -Math.abs(agent.vy); }
        if (target && Math.hypot(target.x - agent.x, target.y - agent.y) < agent.radius + 5) {
          if (agent.species === "grazer") {
            const index = nutrients.indexOf(target as Nutrient); if (index >= 0) agent.energy += nutrients.splice(index, 1)[0].value;
          } else if (agent.species === "hunter") {
            const prey = target as Organism, index = agents.indexOf(prey);
            if (index >= 0 && prey !== agent) { agent.energy += prey.energy * 0.5; corpses.push({ x: prey.x, y: prey.y, value: prey.energy * 0.3, age: 0 }); agents.splice(index, 1); deaths += 1; }
          } else {
            const index = corpses.indexOf(target as Corpse); if (index >= 0) agent.energy += corpses.splice(index, 1)[0].value;
          }
        }
        if (agent.energy > 94 && agents.length < capacity && random() < agent.genome.fertility * 0.0025 * dt) {
          agent.energy *= 0.54; agents.push(create(agent.species, agent.x + random() * 12 - 6, agent.y + random() * 12 - 6, agent)); births += 1;
        }
      }
      for (let index = agents.length - 1; index >= 0; index -= 1) {
        const agent = agents[index];
        if (agent.energy <= 0 || agent.age > 38 + agent.genome.efficiency * 25) {
          corpses.push({ x: agent.x, y: agent.y, value: Math.max(4, agent.energy + 18), age: 0 }); agents.splice(index, 1); deaths += 1;
          if (selectedRef.current === agent.id) { selectedRef.current = null; setSelected(null); }
        }
      }
      corpses.forEach((corpse) => { corpse.age += 0.018 * dt; });
      for (let index = corpses.length - 1; index >= 0; index -= 1) if (corpses[index].age > 18) { const corpse = corpses.splice(index, 1)[0]; nutrients.push(nutrient(corpse.x, corpse.y)); }
    }
    function paint() {
      const climate = climateRef.current;
      const gradient = drawing.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, `hsl(${215 - climate.rainfall * 0.18} 44% ${8 + climate.temperature * 0.05}%)`);
      gradient.addColorStop(1, `hsl(${154 - climate.temperature * 0.15} 42% ${5 + climate.rainfall * 0.04}%)`);
      drawing.fillStyle = gradient; drawing.fillRect(0, 0, width, height);
      drawing.strokeStyle = "rgba(255,255,255,0.025)"; drawing.lineWidth = 1;
      for (let x = 0; x < width; x += 44) { drawing.beginPath(); drawing.moveTo(x, horizon); drawing.lineTo(x, height); drawing.stroke(); }
      for (let y = horizon; y < height; y += 44) { drawing.beginPath(); drawing.moveTo(0, y); drawing.lineTo(width, y); drawing.stroke(); }
      for (const item of nutrientsRef.current) {
        item.phase += 0.025; drawing.fillStyle = `rgba(74,222,128,${0.34 + Math.sin(item.phase) * 0.16})`;
        drawing.beginPath(); drawing.arc(item.x, item.y, 1.7, 0, Math.PI * 2); drawing.fill();
      }
      for (const corpse of corpsesRef.current) {
        drawing.strokeStyle = `rgba(251,191,36,${Math.max(0, 0.45 - corpse.age / 45)})`;
        drawing.beginPath(); drawing.moveTo(corpse.x - 3, corpse.y - 3); drawing.lineTo(corpse.x + 3, corpse.y + 3); drawing.moveTo(corpse.x + 3, corpse.y - 3); drawing.lineTo(corpse.x - 3, corpse.y + 3); drawing.stroke();
      }
      for (const agent of organismsRef.current) {
        const chosen = selectedRef.current === agent.id;
        drawing.save(); drawing.translate(agent.x, agent.y); drawing.rotate(Math.atan2(agent.vy, agent.vx));
        drawing.shadowColor = `hsl(${agent.genome.hue} 90% 64%)`; drawing.shadowBlur = chosen ? 22 : 9;
        drawing.fillStyle = `hsl(${agent.genome.hue} 84% ${chosen ? 72 : 61}%)`;
        drawing.beginPath();
        if (agent.species === "hunter") { drawing.moveTo(agent.radius * 1.7, 0); drawing.lineTo(-agent.radius, agent.radius); drawing.lineTo(-agent.radius, -agent.radius); }
        else if (agent.species === "scavenger") drawing.rect(-agent.radius, -agent.radius, agent.radius * 2, agent.radius * 2);
        else drawing.arc(0, 0, agent.radius, 0, Math.PI * 2);
        drawing.closePath(); drawing.fill(); drawing.restore();
        if (chosen) { drawing.strokeStyle = "rgba(255,255,255,0.55)"; drawing.beginPath(); drawing.arc(agent.x, agent.y, agent.genome.sense, 0, Math.PI * 2); drawing.stroke(); }
      }
    }
    function publish() {
      const agents = organismsRef.current;
      const count = (species: Species) => agents.filter((agent) => agent.species === species).length;
      const genes = agents.map((agent) => agent.genome.hue);
      const diversity = genes.length ? Math.min(1, (Math.max(...genes) - Math.min(...genes)) / 180) : 0;
      const data = { grazers: count("grazer"), hunters: count("hunter"), scavengers: count("scavenger"), nutrients: nutrientsRef.current.length, births, deaths, generation: Math.max(1, ...agents.map((agent) => agent.generation)), diversity };
      setSnapshot(data); historyRef.current.push({ g: data.grazers, h: data.hunters, s: data.scavengers }); if (historyRef.current.length > 42) historyRef.current.shift();
      const chosen = agents.find((agent) => agent.id === selectedRef.current); if (chosen) setSelected({ ...chosen, genome: { ...chosen.genome } });
    }
    function loop() {
      if (!climateRef.current.paused) update(); paint(); frame += 1;
      if (frame % 30 === 0) publish();
      animation = requestAnimationFrame(loop);
    }
    function select(event: PointerEvent) {
      const rect = surface.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      const found = nearest({ x, y, genome: { sense: 24 } } as Organism, organismsRef.current, 24);
      if (found) { selectedRef.current = found.id; setSelected({ ...found, genome: { ...found.genome } }); }
      else { for (let i = 0; i < 9; i += 1) nutrientsRef.current.push(nutrient(x + random() * 24 - 12, y + random() * 24 - 12)); }
    }
    commandRef.current.reset = reset;
    commandRef.current.add = (species) => { for (let i = 0; i < (species === "hunter" ? 3 : 7); i += 1) organismsRef.current.push(create(species)); };
    commandRef.current.event = (type) => {
      if (type === "rain") { for (let i = 0; i < 55; i += 1) nutrientsRef.current.push(nutrient()); }
      if (type === "drought") nutrientsRef.current.splice(0, Math.floor(nutrientsRef.current.length * 0.58));
      if (type === "bloom") for (const agent of organismsRef.current) agent.energy = Math.min(120, agent.energy + 24);
    };
    const observer = new ResizeObserver(resize); observer.observe(container); surface.addEventListener("pointerdown", select); resize();
    if (reduced) { for (let i = 0; i < 120; i += 1) update(); paint(); publish(); } else animation = requestAnimationFrame(loop);
    return () => { observer.disconnect(); surface.removeEventListener("pointerdown", select); cancelAnimationFrame(animation); commandRef.current = {}; };
  }, [epoch]);

  const history = historyRef.current;
  const maxHistory = Math.max(1, ...history.flatMap((item) => [item.g, item.h, item.s]));
  const polyline = (key: "g" | "h" | "s") => history.map((item, index) => `${(index / Math.max(1, history.length - 1)) * 100},${48 - (item[key] / maxHistory) * 44}`).join(" ");
  const balance = useMemo(() => Math.max(0, Math.min(100, 100 - Math.abs(snapshot.grazers - 45) - Math.abs(snapshot.hunters - 9) * 2 - Math.abs(snapshot.scavengers - 13))), [snapshot]);

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-[1500px] px-4 pb-24 sm:px-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#060909]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 md:px-8">
            <div className="flex items-center gap-3"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /><span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Biosphere 12 · autonomous ecology online</span></div>
            <div className="flex gap-5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>epoch {epoch}</span><span>balance {balance}%</span><span>diversity {(snapshot.diversity * 100).toFixed(0)}%</span></div>
          </header>
          <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
            <div ref={hostRef} className="relative min-h-[760px] overflow-hidden bg-[#06100d] md:min-h-[900px]">
              <canvas ref={canvasRef} role="img" aria-label="Autonomous digital biosphere with evolving organisms and resources" className="absolute inset-0 h-full w-full cursor-crosshair touch-none" />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/25 to-transparent px-7 pb-32 pt-9 md:px-12 md:pt-12">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-200/55">Artificial life / agent ecology</p>
                <h2 className="mt-4 text-[clamp(3.5rem,8vw,8rem)] font-semibold leading-[0.8] tracking-[-0.06em]">DIGITAL<br />BIOSPHERE</h2>
                <p className="mt-7 max-w-lg text-sm leading-7 text-white/48 md:text-base">Nothing here is choreographed. Organisms sense, feed, reproduce, mutate, hunt, die, and recycle themselves into the substrate.</p>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 grid grid-cols-4 gap-px border-t border-white/10 bg-white/10">
                {([["Grazers", snapshot.grazers, "text-cyan-300"], ["Hunters", snapshot.hunters, "text-rose-400"], ["Recyclers", snapshot.scavengers, "text-violet-300"], ["Generation", snapshot.generation, "text-emerald-300"]] as const).map(([label, value, color]) => <div key={label} className="bg-black/75 px-3 py-4 backdrop-blur-md md:px-6"><p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">{label}</p><p className={`mt-2 font-mono text-lg ${color}`}>{value}</p></div>)}
              </div>
            </div>
            <aside className="border-t border-white/10 bg-[#080c0b] p-6 md:p-8 xl:border-l xl:border-t-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Environmental pressure</p>
              <Range label="Rainfall" value={rainfall} suffix="%" onChange={setRainfall} />
              <Range label="Temperature" value={temperature} suffix="°" onChange={setTemperature} />
              <Range label="Time scale" value={timeScale} min={2} max={24} suffix={`${(timeScale / 10).toFixed(1)}×`} displayValue onChange={setTimeScale} />
              <div className="mt-7 grid grid-cols-3 gap-2">{(["rain", "drought", "bloom"] as const).map((event) => <button key={event} type="button" onClick={() => commandRef.current.event?.(event)} className="min-h-14 rounded-xl border border-white/10 px-2 text-[10px] capitalize text-white/55 hover:border-emerald-300/35 hover:bg-emerald-300/[0.05]">{event === "rain" ? "Nutrient rain" : event === "drought" ? "Drought" : "Energy bloom"}</button>)}</div>
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/35">Population memory</p><span className="font-mono text-[9px] text-white/25">{snapshot.births} born / {snapshot.deaths} lost</span></div>
                <svg viewBox="0 0 100 52" className="mt-4 h-24 w-full" aria-label="Population history chart">
                  <polyline points={polyline("g")} fill="none" stroke="#67e8f9" strokeWidth="1.2" />
                  <polyline points={polyline("h")} fill="none" stroke="#fb7185" strokeWidth="1.2" />
                  <polyline points={polyline("s")} fill="none" stroke="#c4b5fd" strokeWidth="1.2" />
                </svg>
              </div>
              <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Introduce organisms</p>
              <div className="mt-3 space-y-2">{(Object.keys(SPECIES) as Species[]).map((species) => <button key={species} type="button" onClick={() => commandRef.current.add?.(species)} className="flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left hover:bg-white/[0.04]"><span><span className="block text-xs font-semibold text-white/70">{SPECIES[species].label}</span><span className="mt-1 block text-[10px] text-white/35">{SPECIES[species].role}</span></span><span style={{ background: SPECIES[species].color }} className="h-2 w-2 rounded-full" /></button>)}</div>
              <div className="mt-7 grid grid-cols-2 gap-2"><button type="button" onClick={() => setPaused((value) => !value)} className="rounded-full border border-white/12 px-4 py-3 text-xs font-semibold text-white/65">{paused ? "Resume life" : "Pause life"}</button><button type="button" onClick={() => setEpoch((value) => value + 1)} className="rounded-full bg-emerald-300 px-4 py-3 text-xs font-semibold text-black">New ecosystem</button></div>
              <div className="mt-7 min-h-40 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/35">Selected lineage</p>
                {selected ? <div className="mt-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold" style={{ color: SPECIES[selected.species].color }}>{SPECIES[selected.species].label} #{selected.id}</p><span className="font-mono text-[9px] text-white/35">gen {selected.generation}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-[10px]"><Gene label="Energy" value={selected.energy.toFixed(1)} /><Gene label="Age" value={selected.age.toFixed(1)} /><Gene label="Speed" value={selected.genome.speed.toFixed(2)} /><Gene label="Sense" value={selected.genome.sense.toFixed(0)} /><Gene label="Efficiency" value={selected.genome.efficiency.toFixed(2)} /><Gene label="Fertility" value={selected.genome.fertility.toFixed(2)} /></dl></div> : <p className="mt-4 text-xs leading-6 text-white/35">Select a moving organism to inspect its inherited traits. Click empty substrate to add nutrients.</p>}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}

function Range({ label, value, min = 0, max = 100, suffix, displayValue = false, onChange }: { label: string; value: number; min?: number; max?: number; suffix: string; displayValue?: boolean; onChange: (value: number) => void }) {
  return <label className="mt-6 block"><span className="flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>{label}</span><span>{displayValue ? suffix : `${value}${suffix}`}</span></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-emerald-300" /></label>;
}
function Gene({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-white/30">{label}</dt><dd className="mt-1 font-mono text-white/65">{value}</dd></div>;
}
