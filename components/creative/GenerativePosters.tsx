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
  const buildings: Array<{ x: number; w: number; h: number }> = [];
  let cursor = 20;
  for (let index = 0; index < 12; index += 1) {
    const w = 40 + rng() * 46;
    const h = 200 + rng() * 500;
    buildings.push({ x: cursor, w, h });
    cursor += w + 10 + rng() * 14;
  }
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

/** Continuum Engine — braided trajectories around a luminous singularity. */
export function ContinuumPoster() {
  const rng = mulberry32(hashSeed("continuum-engine"));
  const paths = Array.from({ length: 82 }, (_, index) => {
    const phase = (index / 82) * Math.PI * 2;
    const radius = 90 + rng() * 280;
    const twist = 0.62 + rng() * 1.8;
    return {
      x1: 400 + Math.cos(phase) * radius,
      y1: 500 + Math.sin(phase) * radius * 1.24,
      x2: 400 + Math.cos(phase + twist) * radius * 0.42,
      y2: 500 + Math.sin(phase + twist) * radius * 0.54,
      hue: 184 + rng() * 112,
    };
  });
  return (
    <svg
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      className={posterClass}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="continuum-bg">
          <stop offset="0" stopColor="#102735" />
          <stop offset="0.42" stopColor="#070b14" />
          <stop offset="1" stopColor="#020305" />
        </radialGradient>
        <filter id="continuum-glow">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect width="800" height="1000" fill="url(#continuum-bg)" />
      <g fill="none">
        {paths.map((path, index) => (
          <path
            key={index}
            d={`M ${path.x1} ${path.y1} Q 400 500 ${path.x2} ${path.y2}`}
            stroke={`hsl(${path.hue}, 88%, 66%)`}
            strokeOpacity={0.12 + (index % 5) * 0.035}
            strokeWidth={0.7 + (index % 4) * 0.22}
          />
        ))}
      </g>
      <circle
        cx="400"
        cy="500"
        r="82"
        fill="#56e8ff"
        fillOpacity="0.12"
        filter="url(#continuum-glow)"
      />
      <circle cx="400" cy="500" r="5" fill="#dffcff" />
      <circle
        cx="400"
        cy="500"
        r="112"
        fill="none"
        stroke="#67e8f9"
        strokeOpacity="0.16"
      />
      <text
        x="54"
        y="86"
        fill="white"
        fillOpacity="0.44"
        fontSize="15"
        letterSpacing="4"
      >
        CONTINUUM / FIELD 11
      </text>
    </svg>
  );
}

/** Digital Biosphere — three trophic populations sharing one nutrient field. */
export function BiospherePoster() {
  const rng = mulberry32(hashSeed("digital-biosphere"));
  const nutrients = Array.from({ length: 92 }, () => ({
    x: 34 + rng() * 732,
    y: 248 + rng() * 700,
    r: 1 + rng() * 2.2,
  }));
  const agents = Array.from({ length: 64 }, (_, index) => ({
    x: 42 + rng() * 716,
    y: 270 + rng() * 650,
    r: index < 9 ? 7 : index < 22 ? 5 : 4,
    kind: index < 9 ? "hunter" : index < 22 ? "recycler" : "grazer",
    rotation: rng() * 360,
  }));
  return (
    <svg
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      className={posterClass}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="biosphere-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#071311" />
          <stop offset="1" stopColor="#020806" />
        </linearGradient>
        <radialGradient id="biosphere-aura">
          <stop offset="0" stopColor="#34d399" stopOpacity=".2" />
          <stop offset="1" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
        <filter id="biosphere-glow">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <rect width="800" height="1000" fill="url(#biosphere-bg)" />
      <circle cx="400" cy="590" r="340" fill="url(#biosphere-aura)" />
      <g stroke="#a7f3d0" strokeOpacity=".035">
        {Array.from({ length: 17 }, (_, index) => (
          <path key={`v-${index}`} d={`M ${index * 50} 220 V 1000`} />
        ))}
        {Array.from({ length: 17 }, (_, index) => (
          <path key={`h-${index}`} d={`M 0 ${220 + index * 50} H 800`} />
        ))}
      </g>
      <text x="52" y="82" fill="#a7f3d0" fillOpacity=".5" fontSize="14" letterSpacing="4">
        AUTONOMOUS ECOLOGY / 12
      </text>
      <text x="52" y="144" fill="white" fillOpacity=".9" fontSize="44" fontWeight="600" letterSpacing="-2">
        DIGITAL BIOSPHERE
      </text>
      <text x="53" y="184" fill="white" fillOpacity=".35" fontSize="13" letterSpacing="2">
        FEED · MUTATE · HUNT · RECYCLE
      </text>
      <g fill="#4ade80">
        {nutrients.map((item, index) => (
          <circle key={index} cx={item.x} cy={item.y} r={item.r} opacity=".48" />
        ))}
      </g>
      {agents.map((agent, index) => {
        const color =
          agent.kind === "hunter"
            ? "#fb7185"
            : agent.kind === "recycler"
              ? "#c4b5fd"
              : "#67e8f9";
        return (
          <g
            key={index}
            transform={`translate(${agent.x} ${agent.y}) rotate(${agent.rotation})`}
            fill={color}
          >
            <circle r={agent.r * 2.5} opacity=".14" filter="url(#biosphere-glow)" />
            {agent.kind === "hunter" ? (
              <path d={`M ${agent.r * 1.8} 0 L ${-agent.r} ${agent.r} L ${-agent.r} ${-agent.r} Z`} />
            ) : agent.kind === "recycler" ? (
              <rect x={-agent.r} y={-agent.r} width={agent.r * 2} height={agent.r * 2} />
            ) : (
              <circle r={agent.r} />
            )}
          </g>
        );
      })}
      <g transform="translate(52 940)">
        <circle r="4" fill="#67e8f9" />
        <text x="14" y="4" fill="white" fillOpacity=".42" fontSize="11" letterSpacing="1.5">GRAZER</text>
        <circle cx="128" r="4" fill="#fb7185" />
        <text x="142" y="4" fill="white" fillOpacity=".42" fontSize="11" letterSpacing="1.5">HUNTER</text>
        <rect x="260" y="-4" width="8" height="8" fill="#c4b5fd" />
        <text x="278" y="4" fill="white" fillOpacity=".42" fontSize="11" letterSpacing="1.5">RECYCLER</text>
      </g>
    </svg>
  );
}
