"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";
import type { CreativeProject } from "@/lib/creativeProjects";

/**
 * Sentinel Observatory — a wireframe threat globe rendered entirely on a 2D
 * canvas (no WebGL, no external data). Seeded synthetic intrusion attempts
 * travel along great-circle arcs toward a home node; a glass HUD reports the
 * live tactical picture. The JARVIS blueprint aesthetic applied to security
 * operations — the field this portfolio is actually about.
 *
 * Everything is deterministic: a numeric seed drives the PRNG, so a given
 * sweep always produces the same threat set. Nothing here reaches the network.
 */

type Vec3 = { x: number; y: number; z: number };

interface Origin {
  name: string;
  lat: number;
  lon: number;
}

interface Threat {
  origin: Origin;
  severity: "critical" | "high" | "medium" | "low";
  tactic: string;
  offset: number; // 0..1 starting phase along the arc
  speed: number;
  blocked: boolean;
}

const HOME: Origin = { name: "Richardson TX", lat: 32.95, lon: -96.73 };

// Real-world city coordinates used purely as believable arc origins.
const CITIES: Origin[] = [
  { name: "Moscow", lat: 55.75, lon: 37.62 },
  { name: "Beijing", lat: 39.9, lon: 116.4 },
  { name: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "Kyiv", lat: 50.45, lon: 30.52 },
  { name: "Tehran", lat: 35.69, lon: 51.39 },
  { name: "Jakarta", lat: -6.21, lon: 106.85 },
  { name: "Amsterdam", lat: 52.37, lon: 4.9 },
  { name: "Seoul", lat: 37.57, lon: 126.98 },
  { name: "Cairo", lat: 30.04, lon: 31.24 },
  { name: "Bogotá", lat: 4.71, lon: -74.07 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Istanbul", lat: 41.01, lon: 28.98 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
];

const TACTICS = [
  "Credential Access",
  "Initial Access",
  "Command & Control",
  "Exfiltration",
  "Discovery",
  "Lateral Movement",
  "Impact",
  "Persistence",
];

const SEVERITIES: Threat["severity"][] = ["critical", "high", "medium", "low"];

function toVec(lat: number, lon: number): Vec3 {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.cos(lambda),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.sin(lambda),
  };
}

function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const omega = Math.acos(dot);
  if (omega < 1e-4) {
    return a;
  }
  const sin = Math.sin(omega);
  const k0 = Math.sin((1 - t) * omega) / sin;
  const k1 = Math.sin(t * omega) / sin;
  return {
    x: a.x * k0 + b.x * k1,
    y: a.y * k0 + b.y * k1,
    z: a.z * k0 + b.z * k1,
  };
}

function buildThreats(seed: number, volume: number): Threat[] {
  const rand = mulberry32(seed);
  return Array.from({ length: volume }, () => {
    const origin = CITIES[Math.floor(rand() * CITIES.length)];
    const severity = SEVERITIES[Math.floor(rand() * SEVERITIES.length)];
    return {
      origin,
      severity,
      tactic: TACTICS[Math.floor(rand() * TACTICS.length)],
      offset: rand(),
      speed: 0.08 + rand() * 0.16,
      // Higher severities are less likely to be auto-mitigated.
      blocked: rand() > (severity === "critical" ? 0.55 : 0.2),
    };
  });
}

const SEVERITY_META: Record<
  Threat["severity"],
  { color: string; label: string; weight: number }
> = {
  critical: { color: "#f87171", label: "Critical", weight: 4 },
  high: { color: "#fb923c", label: "High", weight: 3 },
  medium: { color: "#60a5fa", label: "Medium", weight: 2 },
  low: { color: "#a3a3a3", label: "Low", weight: 1 },
};

export default function SentinelObservatory({
  project,
}: {
  project: CreativeProject;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [volume, setVolume] = useState(26);
  const [spin, setSpin] = useState(14);
  const [autoRotate, setAutoRotate] = useState(true);
  const [seed, setSeed] = useState(() => hashSeed("sentinel-observatory"));

  const threats = useMemo(() => buildThreats(seed, volume), [seed, volume]);

  // DOM-rendered telemetry (client-only, so no hydration mismatch).
  const feed = useMemo(() => {
    const rand = mulberry32(seed ^ 0x9e3779b9);
    return threats
      .slice()
      .sort((a, b) => SEVERITY_META[b.severity].weight - SEVERITY_META[a.severity].weight)
      .slice(0, 6)
      .map((threat, index) => ({
        id: `INC-${(4200 + Math.floor(rand() * 900)).toString()}`,
        origin: threat.origin.name,
        tactic: threat.tactic,
        severity: threat.severity,
        blocked: threat.blocked,
        key: `${threat.origin.name}-${index}`,
      }));
  }, [threats, seed]);

  const stats = useMemo(() => {
    const blocked = threats.filter((threat) => threat.blocked).length;
    const critical = threats.filter((threat) => threat.severity === "critical").length;
    const mitigation = threats.length
      ? Math.round((blocked / threats.length) * 100)
      : 100;
    return { blocked, critical, mitigation, active: threats.length - blocked };
  }, [threats]);

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
    const pitch = -0.41; // fixed axial tilt, radians
    let yaw = 0;
    let width = 0;
    let height = 0;
    let radius = 0;
    let cx = 0;
    let cy = 0;
    let frame = 0;
    let sweep = 0;
    let dragging = false;
    let lastPointerX = 0;

    const home = toVec(HOME.lat, HOME.lon);

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
      cx = width / 2;
      cy = height / 2;
      radius = Math.min(width, height) * 0.34;
    }

    function project(v: Vec3): { x: number; y: number; front: boolean } {
      // yaw about Y
      const x1 = v.x * Math.cos(yaw) + v.z * Math.sin(yaw);
      const z1 = -v.x * Math.sin(yaw) + v.z * Math.cos(yaw);
      const y1 = v.y;
      // pitch about X
      const y2 = y1 * Math.cos(pitch) - z1 * Math.sin(pitch);
      const z2 = y1 * Math.sin(pitch) + z1 * Math.cos(pitch);
      return {
        x: cx + x1 * radius,
        y: cy - y2 * radius,
        front: z2 >= -0.02,
      };
    }

    function drawGraticule() {
      ctx.lineWidth = 0.6;
      // latitude rings
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const p = project(toVec(lat, lon));
          if (!p.front) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = "rgba(96,165,250,0.16)";
        ctx.stroke();
      }
      // longitude meridians
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 6) {
          const p = project(toVec(lat, lon));
          if (!p.front) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.strokeStyle = "rgba(96,165,250,0.11)";
        ctx.stroke();
      }
    }

    function drawLimb() {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(96,165,250,0.4)";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, radius * 1.14);
      glow.addColorStop(0, "rgba(96,165,250,0)");
      glow.addColorStop(1, "rgba(96,165,250,0.09)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.14, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawRadarRings() {
      for (let index = 0; index < 3; index += 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * (1.06 + index * 0.12), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.05 - index * 0.012})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // sweep wedge
      const sweepAngle = sweep;
      const conic = ctx as CanvasRenderingContext2D & {
        createConicGradient?: (
          startAngle: number,
          x: number,
          y: number,
        ) => CanvasGradient;
      };
      const grad = conic.createConicGradient
        ? conic.createConicGradient(sweepAngle, cx, cy)
        : null;
      if (grad) {
        grad.addColorStop(0, "rgba(96,165,250,0.22)");
        grad.addColorStop(0.08, "rgba(96,165,250,0)");
        grad.addColorStop(1, "rgba(96,165,250,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.02, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawArc(threat: Threat, pulse: number) {
      const from = toVec(threat.origin.lat, threat.origin.lon);
      const meta = SEVERITY_META[threat.severity];
      const steps = 48;
      ctx.beginPath();
      let started = false;
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const point = slerp(from, home, t);
        const lift = 1 + Math.sin(Math.PI * t) * 0.32;
        const p = project({ x: point.x * lift, y: point.y * lift, z: point.z * lift });
        if (!p.front) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = threat.blocked
        ? "rgba(96,165,250,0.28)"
        : `${meta.color}66`;
      ctx.lineWidth = threat.severity === "critical" ? 1.5 : 1;
      ctx.stroke();

      // traveling pulse
      const tp = pulse % 1;
      const point = slerp(from, home, tp);
      const lift = 1 + Math.sin(Math.PI * tp) * 0.32;
      const pp = project({ x: point.x * lift, y: point.y * lift, z: point.z * lift });
      if (pp.front) {
        ctx.beginPath();
        ctx.fillStyle = meta.color;
        ctx.shadowColor = meta.color;
        ctx.shadowBlur = 12;
        ctx.arc(pp.x, pp.y, threat.severity === "critical" ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function drawNode(origin: Origin, color: string, size: number) {
      const p = project(toVec(origin.lat, origin.lon));
      if (!p.front) {
        return;
      }
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // ping ring
      const pingRadius = size + ((frame * 0.6) % 22);
      ctx.beginPath();
      ctx.arc(p.x, p.y, pingRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${color}${pingRadius > 16 ? "10" : "33"}`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function render() {
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, width, height);

      drawRadarRings();
      drawLimb();
      drawGraticule();

      threats.forEach((threat, index) => {
        drawArc(threat, frame * threat.speed * 0.02 + threat.offset);
        if (index % 3 === 0) {
          drawNode(threat.origin, SEVERITY_META[threat.severity].color, 1.8);
        }
      });

      drawNode(HOME, "#f5f5f5", 3.4);

      frame += 1;
      if (autoRotate && !dragging) {
        yaw += (spin / 10000) * 6;
      }
      sweep += 0.02;
      if (!reduced) {
        animation = window.requestAnimationFrame(render);
      }
    }

    let animation = 0;

    function onPointerDown(event: PointerEvent) {
      dragging = true;
      lastPointerX = event.clientX;
    }
    function onPointerMove(event: PointerEvent) {
      if (!dragging) {
        return;
      }
      yaw += (event.clientX - lastPointerX) * 0.006;
      lastPointerX = event.clientX;
      if (reduced) {
        render();
      }
    }
    function onPointerUp() {
      dragging = false;
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) {
        render();
      }
    });
    observer.observe(host);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    resize();
    render();

    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.cancelAnimationFrame(animation);
    };
  }, [threats, autoRotate, spin]);

  function exportFrame() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const anchor = document.createElement("a");
    anchor.download = "sentinel-observatory.png";
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#050608]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="relative min-h-[760px] overflow-hidden">
              <canvas
                ref={canvasRef}
                role="img"
                className="absolute inset-0 h-full w-full touch-none"
                aria-label="Rotating wireframe globe showing simulated intrusion attempts converging on a home node"
              />

              {/* Corner crosshairs */}
              <div className="pointer-events-none absolute left-6 top-6 h-6 w-6 border-l border-t border-white/25" />
              <div className="pointer-events-none absolute right-6 top-6 h-6 w-6 border-r border-t border-white/25" />
              <div className="pointer-events-none absolute bottom-6 left-6 h-6 w-6 border-b border-l border-white/25" />
              <div className="pointer-events-none absolute bottom-6 right-6 h-6 w-6 border-b border-r border-white/25" />

              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-7 md:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
                  Sentinel Observatory · live tactical picture
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.04em] md:text-6xl">
                  Threat globe
                </h1>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/55">
                  Every arc is a simulated intrusion attempt tracing a great
                  circle toward the home node. Drag to rotate. All synthetic,
                  all in your browser.
                </p>
              </div>

              {/* HUD vitals — glassmorphism */}
              <div className="pointer-events-none absolute bottom-7 left-7 flex flex-wrap gap-2 md:gap-3">
                {[
                  { label: "Threats tracked", value: threats.length },
                  { label: "Auto-mitigated", value: `${stats.mitigation}%` },
                  { label: "Active", value: stats.active },
                  { label: "Critical", value: stats.critical },
                ].map((tile) => (
                  <div
                    key={tile.label}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 backdrop-blur-sm"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/40">
                      {tile.label}
                    </p>
                    <p className="mt-0.5 font-mono text-lg text-white/90">
                      {tile.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="border-t border-white/10 p-7 md:p-9 lg:border-l lg:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Console
              </p>

              <label className="mt-8 block">
                <span className="flex justify-between text-xs text-white/50">
                  <span>Threat volume</span>
                  <span className="font-mono">{volume}</span>
                </span>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="mt-4 w-full accent-blue-500"
                />
              </label>

              <label className="mt-8 block">
                <span className="flex justify-between text-xs text-white/50">
                  <span>Rotation speed</span>
                  <span className="font-mono">{(spin / 10).toFixed(1)}×</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={spin}
                  onChange={(event) => setSpin(Number(event.target.value))}
                  className="mt-4 w-full accent-blue-500"
                />
              </label>

              <button
                type="button"
                aria-pressed={autoRotate}
                onClick={() => setAutoRotate((value) => !value)}
                className={`mt-6 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                  autoRotate
                    ? "border-accent/55 bg-accent-soft text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                Auto-rotate
                <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
                  {autoRotate ? "on" : "off"}
                </span>
              </button>

              <div className="mt-8">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Incident feed
                </p>
                <ul className="mt-3 space-y-2">
                  {feed.map((incident) => (
                    <li
                      key={incident.key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              background: SEVERITY_META[incident.severity].color,
                            }}
                          />
                          <span className="truncate font-mono text-[11px] text-white/70">
                            {incident.id}
                          </span>
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-white/40">
                          {incident.origin} · {incident.tactic}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] ${
                          incident.blocked ? "text-accent" : "text-alert"
                        }`}
                      >
                        {incident.blocked ? "blocked" : "open"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setSeed((value) => (value + 0x1000193) >>> 0)}
                className="mt-8 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Run a new sweep
              </button>
              <button
                type="button"
                onClick={exportFrame}
                className="mt-3 w-full rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                Export this frame
              </button>

              <p className="mt-8 text-[11px] leading-5 text-white/35">
                Synthetic data only. No live feeds, no network calls, no real
                targets — a visualization of how a SOC watches the world.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}
