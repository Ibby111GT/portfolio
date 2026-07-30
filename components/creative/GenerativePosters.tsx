import type { ReactElement } from "react";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

/**
 * Static SVG gallery posters for the generative/simulation creative pieces.
 * Built at module scope from fixed seeds so server and client render the exact
 * same markup — no hydration mismatch and no runtime cost on the gallery grid.
 */

const posterClass =
  "absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.035]";

/** Sentinel Observatory — a wireframe threat globe with converging arcs. */
export function SentinelPoster() {
  const cx = 400;
  const cy = 500;
  const r = 250;
  const rng = mulberry32(hashSeed("sentinel-observatory"));
  const arcs = Array.from({ length: 7 }, () => {
    const angle = rng() * Math.PI * 2;
    const sx = cx + Math.cos(angle) * r;
    const sy = cy + Math.sin(angle) * r * 0.62;
    const lift = 120 + rng() * 120;
    const mx = (sx + cx) / 2 + (rng() - 0.5) * 80;
    const my = (sy + cy) / 2 - lift;
    return { sx, sy, mx, my, red: rng() < 0.4 };
  });
  return (
    <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" className={posterClass} aria-hidden="true">
      <rect width="800" height="1000" fill="#050608" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeOpacity="0.4" />
      {[0.32, 0.62, 0.9].map((k) => (
        <ellipse key={k} cx={cx} cy={cy} rx={r} ry={r * k} fill="none" stroke="var(--accent)" strokeOpacity="0.14" />
      ))}
      {[-0.6, 0, 0.6].map((k) => (
        <ellipse key={k} cx={cx} cy={cy} rx={r * Math.abs(k || 0.14)} ry={r} fill="none" stroke="var(--accent)" strokeOpacity="0.12" />
      ))}
      {arcs.map((arc, index) => (
        <g key={index}>
          <path
            d={`M ${arc.sx} ${arc.sy} Q ${arc.mx} ${arc.my} ${cx} ${cy}`}
            fill="none"
            stroke={arc.red ? "var(--alert)" : "var(--accent)"}
            strokeOpacity="0.5"
            strokeWidth="1.4"
          />
          <circle cx={arc.sx} cy={arc.sy} r="4" fill={arc.red ? "var(--alert)" : "var(--accent)"} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r="6" fill="#f5f5f5" />
    </svg>
  );
}

/** Verdant — layered procedural canopy over a dusk gradient. */
export function VerdantPoster() {
  const rng = mulberry32(hashSeed("verdant"));
  const trees = Array.from({ length: 9 }, (_, index) => ({
    x: 60 + index * 82 + (rng() - 0.5) * 30,
    h: 140 + rng() * 220,
    hue: 96 + rng() * 40,
  }));
  return (
    <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" className={posterClass} aria-hidden="true">
      <defs>
        <linearGradient id="verdant-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1622" />
          <stop offset="1" stopColor="#17251b" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#verdant-sky)" />
      <circle cx="620" cy="240" r="70" fill="#ffcf8f" fillOpacity="0.22" />
      <rect x="0" y="720" width="800" height="280" fill="#0f1a11" />
      {trees.map((tree, index) => {
        const baseY = 760;
        return (
          <g key={index} stroke={`hsl(${tree.hue}, 52%, 46%)`} strokeOpacity="0.75" strokeLinecap="round">
            <line x1={tree.x} y1={baseY} x2={tree.x} y2={baseY - tree.h} stroke="#4a3626" strokeWidth="7" />
            <line x1={tree.x} y1={baseY - tree.h * 0.5} x2={tree.x - 42} y2={baseY - tree.h * 0.82} strokeWidth="4" />
            <line x1={tree.x} y1={baseY - tree.h * 0.62} x2={tree.x + 46} y2={baseY - tree.h * 0.9} strokeWidth="4" />
            <circle cx={tree.x} cy={baseY - tree.h} r={tree.h * 0.22} fill={`hsl(${tree.hue}, 55%, 48%)`} fillOpacity="0.4" stroke="none" />
            <circle cx={tree.x - 42} cy={baseY - tree.h * 0.82} r={tree.h * 0.13} fill={`hsl(${tree.hue}, 55%, 50%)`} fillOpacity="0.35" stroke="none" />
            <circle cx={tree.x + 46} cy={baseY - tree.h * 0.9} r={tree.h * 0.15} fill={`hsl(${tree.hue}, 55%, 50%)`} fillOpacity="0.35" stroke="none" />
          </g>
        );
      })}
    </svg>
  );
}

/** Lumen City — a lit skyline against a night sky. */
export function LumenCityPoster() {
  const rng = mulberry32(hashSeed("lumen-city"));
  let cursor = 20;
  const buildings = Array.from({ length: 12 }, () => {
    const w = 40 + rng() * 46;
    const h = 200 + rng() * 500;
    const b = { x: cursor, w, h };
    cursor += w + 10 + rng() * 14;
    return b;
  });
  return (
    <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid slice" className={posterClass} aria-hidden="true">
      <defs>
        <linearGradient id="lumen-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a1024" />
          <stop offset="1" stopColor="#1b2440" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#lumen-sky)" />
      {buildings.map((building, index) => {
        const top = 1000 - building.h;
        const cols = Math.max(2, Math.floor(building.w / 14));
        const rows = Math.max(4, Math.floor(building.h / 26));
        const windows: ReactElement[] = [];
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            if (rng() > 0.32) {
              windows.push(
                <rect
                  key={`${row}-${col}`}
                  x={building.x + col * (building.w / cols) + 3}
                  y={top + row * (building.h / rows) + 4}
                  width={building.w / cols - 6}
                  height={building.h / rows - 8}
                  fill="var(--accent)"
                  fillOpacity={0.25 + rng() * 0.6}
                />,
              );
            }
          }
        }
        return (
          <g key={index}>
            <rect x={building.x} y={top} width={building.w} height={building.h} fill="#0a0c14" stroke="var(--accent)" strokeOpacity="0.12" />
            {windows}
          </g>
        );
      })}
    </svg>
  );
}
