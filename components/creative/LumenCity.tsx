"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import { mulberry32 } from "@/lib/seededRandom";
import type { CreativeProject } from "@/lib/creativeProjects";

/**
 * Lumen City — a playable clean-energy grid. You set how much wind, solar, and
 * battery the city runs on; weather and time-of-day move demand and renewable
 * output; the skyline glows when supply meets demand and browns out when it
 * doesn't. Systems-thinking about the energy transition, made tangible.
 *
 * Deterministic skyline (seeded). Simulation clock is client-side and paused
 * under reduced motion (a single representative frame is drawn instead).
 */

interface Building {
  x: number;
  width: number;
  height: number;
  windows: { row: number; col: number }[];
  rows: number;
  cols: number;
}

type Weather = "clear" | "cloudy" | "storm";

const WEATHER: Record<
  Weather,
  { solar: number; wind: number; label: string }
> = {
  clear: { solar: 1, wind: 0.55, label: "Clear" },
  cloudy: { solar: 0.45, wind: 0.8, label: "Cloudy" },
  storm: { solar: 0.2, wind: 1.15, label: "Storm" },
};

function buildSkyline(seed: number, count: number): Building[] {
  const rand = mulberry32(seed);
  const buildings: Building[] = [];
  let cursor = 0;
  for (let index = 0; index < count; index += 1) {
    const width = 26 + rand() * 30;
    const height = 60 + rand() * 200;
    const cols = Math.max(2, Math.floor(width / 12));
    const rows = Math.max(3, Math.floor(height / 20));
    const windows: { row: number; col: number }[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (rand() > 0.25) {
          windows.push({ row, col });
        }
      }
    }
    buildings.push({ x: cursor, width, height, windows, rows, cols });
    cursor += width + 6 + rand() * 10;
  }
  return buildings;
}

export default function LumenCity({ project }: { project: CreativeProject }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wind, setWind] = useState(40);
  const [solar, setSolar] = useState(35);
  const [battery, setBattery] = useState(25);
  const [weather, setWeather] = useState<Weather>("clear");
  const [reading, setReading] = useState({
    demand: 0,
    supply: 0,
    renewablePct: 0,
    batteryLevel: 60,
    hour: 12,
    status: "balanced" as "surplus" | "balanced" | "deficit",
  });

  const stateRef = useRef({ wind, solar, battery, weather });
  stateRef.current = { wind, solar, battery, weather };
  const batteryLevelRef = useRef(60);
  const seed = useMemo(() => 0x5eed1234, []);

  const fossilPct = Math.max(0, 100 - wind - solar - battery);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) {
      return;
    }
    const hostEl = canvasEl.parentElement;
    if (!hostEl) {
      return;
    }
    const ctxEl = canvasEl.getContext("2d");
    if (!ctxEl) {
      return;
    }
    // Non-null aliases: TypeScript drops control-flow narrowing across the
    // nested render/resize closures, so we re-assert the narrowed types here.
    const canvas: HTMLCanvasElement = canvasEl;
    const host: HTMLElement = hostEl;
    const ctx: CanvasRenderingContext2D = ctxEl;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let animation = 0;
    let clock = reduced ? 19 : 6; // start at dusk for reduced motion (glow visible)
    let buildings: Building[] = [];

    function resize() {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, bounds.width);
      height = Math.max(520, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildings = buildSkyline(seed, Math.ceil(width / 44) + 2);
    }

    function simulate(hour: number) {
      const { wind: w, solar: s, battery: b, weather: wx } = stateRef.current;
      const weatherMeta = WEATHER[wx];
      // Demand curve: morning + evening peaks, overnight trough (0..1).
      const demandCurve =
        0.55 +
        0.28 * Math.sin(((hour - 8) / 24) * Math.PI * 2) +
        0.2 * Math.exp(-(((hour - 19) % 24) ** 2) / 8);
      const demand = Math.max(0.3, Math.min(1.2, demandCurve));

      // Solar follows daylight; wind is weather-driven with mild variance.
      const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
      const solarOut = (s / 100) * daylight * weatherMeta.solar;
      const windOut = (w / 100) * weatherMeta.wind * (0.7 + 0.3 * Math.abs(Math.sin(hour)));
      const fossil = fossilPct / 100;
      const renewableSupply = solarOut + windOut;

      let batteryLevel = batteryLevelRef.current;
      const rawSupply = renewableSupply + fossil;
      let supply = rawSupply;
      let drawFromBattery = 0;
      if (rawSupply < demand && batteryLevel > 0) {
        drawFromBattery = Math.min(demand - rawSupply, (b / 100) * 0.5, batteryLevel / 100);
        supply += drawFromBattery;
        batteryLevel -= drawFromBattery * 60;
      } else if (rawSupply > demand) {
        // charge with surplus renewable
        const surplus = Math.min(rawSupply - demand, (b / 100) * 0.4);
        batteryLevel = Math.min(100, batteryLevel + surplus * 30);
      }
      batteryLevel = Math.max(0, Math.min(100, batteryLevel));
      batteryLevelRef.current = batteryLevel;

      const renewablePct = supply > 0 ? (renewableSupply + drawFromBattery) / supply : 0;
      const ratio = supply / demand;
      const status: "surplus" | "balanced" | "deficit" =
        ratio > 1.08 ? "surplus" : ratio < 0.94 ? "deficit" : "balanced";
      return { demand, supply, renewablePct, batteryLevel, status, ratio };
    }

    function skyColor(hour: number): [string, string] {
      // interpolate a simple day/night gradient
      const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
      const night = 1 - daylight;
      const topR = Math.round(12 + daylight * 60);
      const topG = Math.round(16 + daylight * 90);
      const topB = Math.round(30 + daylight * 120);
      const botR = Math.round(20 + daylight * 120 + night * 20);
      const botG = Math.round(20 + daylight * 70);
      const botB = Math.round(34 + daylight * 60);
      return [`rgb(${topR},${topG},${topB})`, `rgb(${botR},${botG},${botB})`];
    }

    function render() {
      const sim = simulate(clock);
      const [skyTop, skyBottom] = skyColor(clock);
      const horizon = height * 0.82;

      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, skyTop);
      sky.addColorStop(1, skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, horizon);

      // Health of the grid governs how brightly the city is lit.
      const litFactor =
        sim.status === "deficit" ? 0.2 : sim.status === "balanced" ? 0.7 : 1;
      const warmth = sim.renewablePct; // more renewable -> cooler blue glow

      // ground
      ctx.fillStyle = "#05060a";
      ctx.fillRect(0, horizon, width, height - horizon);

      buildings.forEach((building) => {
        const bx = building.x % (width + 60);
        const top = horizon - building.height;
        ctx.fillStyle = "rgba(10,12,20,0.96)";
        ctx.fillRect(bx, top, building.width, building.height);
        ctx.strokeStyle = "rgba(96,165,250,0.12)";
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, top, building.width, building.height);

        const cellW = building.width / building.cols;
        const cellH = building.height / building.rows;
        building.windows.forEach((win) => {
          // Flicker deterministically off building/window index + clock.
          const flicker =
            litFactor > 0.25
              ? 0.55 +
                0.45 *
                  Math.sin(clock * 2 + win.row * 1.7 + win.col * 0.9 + bx)
              : 0.12;
          const alpha = Math.max(0.05, flicker * litFactor);
          const blue = 120 + warmth * 120;
          const green = 150 + warmth * 60;
          ctx.fillStyle = `rgba(255, ${Math.round(green)}, ${Math.round(blue)}, ${alpha})`;
          ctx.fillRect(
            bx + win.col * cellW + cellW * 0.2,
            top + win.row * cellH + cellH * 0.2,
            cellW * 0.55,
            cellH * 0.5,
          );
        });
      });

      // city glow bloom when healthy
      if (litFactor > 0.5) {
        const bloom = ctx.createLinearGradient(0, horizon - 160, 0, horizon);
        const c = warmth > 0.5 ? "96,165,250" : "255,200,120";
        bloom.addColorStop(0, `rgba(${c},0)`);
        bloom.addColorStop(1, `rgba(${c},${0.05 * litFactor})`);
        ctx.fillStyle = bloom;
        ctx.fillRect(0, horizon - 160, width, 160);
      }

      // advance clock
      if (!reduced) {
        clock = (clock + 0.03) % 24;
        animation = window.requestAnimationFrame(render);
      }

      setReading((current) => {
        const next = {
          demand: Math.round(sim.demand * 100),
          supply: Math.round(sim.supply * 100),
          renewablePct: Math.round(sim.renewablePct * 100),
          batteryLevel: Math.round(sim.batteryLevel),
          hour: Math.floor(clock),
          status: sim.status,
        };
        // avoid churn: only update when something visible changed
        if (
          next.demand === current.demand &&
          next.supply === current.supply &&
          next.renewablePct === current.renewablePct &&
          next.batteryLevel === current.batteryLevel &&
          next.hour === current.hour &&
          next.status === current.status
        ) {
          return current;
        }
        return next;
      });
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) {
        render();
      }
    });
    observer.observe(host);

    resize();
    render();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animation);
    };
  }, [seed, fossilPct]);

  const statusMeta = {
    surplus: { label: "Surplus — exporting", color: "text-accent", dot: "#60a5fa" },
    balanced: { label: "Balanced", color: "text-emerald-300", dot: "#34d399" },
    deficit: { label: "Deficit — brown-out risk", color: "text-alert", dot: "#f87171" },
  }[reading.status];

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#05060a]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="relative min-h-[760px] overflow-hidden">
              <canvas
                ref={canvasRef}
                role="img"
                className="absolute inset-0 h-full w-full"
                aria-label="A city skyline that brightens or dims as the power grid moves between surplus and deficit"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent p-7 md:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
                  Lumen City · grid conductor
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-6xl">
                  Keep the lights on
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/60">
                  Balance wind, solar, and battery against a city that wakes,
                  works, and sleeps. Get it right and the skyline glows; fall
                  short and it browns out.
                </p>
              </div>
              <div className="pointer-events-none absolute bottom-7 left-7 flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: statusMeta.dot }}
                />
                <span className={`font-mono text-sm ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
                <span className="font-mono text-xs text-white/40">
                  {String(reading.hour).padStart(2, "0")}:00
                </span>
              </div>
            </div>

            <aside className="border-t border-white/10 p-7 md:p-9 lg:border-l lg:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Generation mix
              </p>

              {[
                { label: "Wind", value: wind, set: setWind, accent: "accent-blue-500" },
                { label: "Solar", value: solar, set: setSolar, accent: "accent-yellow-400" },
                { label: "Battery", value: battery, set: setBattery, accent: "accent-emerald-400" },
              ].map((control) => (
                <label key={control.label} className="mt-7 block">
                  <span className="flex justify-between text-xs text-white/50">
                    <span>{control.label}</span>
                    <span className="font-mono">{control.value}%</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={control.value}
                    onChange={(event) => control.set(Number(event.target.value))}
                    className={`mt-3 w-full ${control.accent}`}
                  />
                </label>
              ))}

              <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <span className="text-xs text-white/50">Fossil backup</span>
                <span
                  className={`font-mono text-sm ${
                    fossilPct > 40 ? "text-alert" : "text-white/70"
                  }`}
                >
                  {fossilPct}%
                </span>
              </div>

              <div className="mt-8">
                <p className="text-xs text-white/50">Weather</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(Object.keys(WEATHER) as Weather[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={weather === option}
                      onClick={() => setWeather(option)}
                      className={`rounded-xl border px-2 py-2.5 text-xs transition-colors ${
                        weather === option
                          ? "border-accent/55 bg-accent-soft text-white"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {WEATHER[option].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                    Renewable
                  </p>
                  <p className="mt-2 font-mono text-2xl text-accent">
                    {reading.renewablePct}%
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                    Battery
                  </p>
                  <p className="mt-2 font-mono text-2xl text-emerald-300/90">
                    {reading.batteryLevel}%
                  </p>
                </div>
              </div>

              <p className="mt-6 text-[11px] leading-5 text-white/40">
                Demand rises at breakfast and after work and dips overnight.
                Solar needs daylight; wind climbs in storms; the battery bridges
                the gaps. Watch the windows dim the moment supply falls behind.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}
