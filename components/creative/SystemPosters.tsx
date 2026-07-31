import type { ReactNode } from "react";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type Variant = "murmuration" | "automata-atlas" | "load-path" | "terraform";

const TITLES: Record<Variant, string> = {
  murmuration: "MURMURATION",
  "automata-atlas": "AUTOMATA ATLAS",
  "load-path": "LOAD PATH",
  terraform: "TERRAFORM",
};

/**
 * Static gallery posters for the four emergent-system pieces. Deterministic
 * (fixed seeds, module-safe) so server and client markup match, decorative
 * (aria-hidden), and each one loosely evokes its subject: directional flock
 * streaks, a cellular grid, a truss with its tension/compression convention,
 * and a terrain band with a pool. All art stays above the caption strip —
 * nothing is placed below 86% height.
 */
function PosterFrame({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-[#05070b] ${
        variant === "terraform"
          ? "bg-[radial-gradient(circle_at_25%_65%,rgba(37,99,235,.22),transparent_34%),radial-gradient(circle_at_72%_42%,rgba(96,165,250,.14),transparent_38%)]"
          : "bg-[radial-gradient(circle_at_50%_48%,rgba(37,99,235,.18),transparent_48%)]"
      }`}
      aria-hidden="true"
    >
      {children}
      <div className="absolute inset-x-7 top-8 z-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
          Interactive system
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white/90">
          {TITLES[variant]}
        </p>
      </div>
      <div className="absolute inset-x-7 bottom-7 z-10 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
        <span>Rules create form</span>
        <span>Live in browser</span>
      </div>
    </div>
  );
}

/** A flock of coherent directional streaks veering around one alert predator. */
export function MurmurationPoster() {
  const random = mulberry32(hashSeed("poster-murmuration"));
  const streaks = Array.from({ length: 56 }, (_, index) => ({
    id: index,
    left: 6 + random() * 86,
    top: 26 + random() * 54,
    length: 7 + random() * 12,
    angle: -24 + random() * 30,
    opacity: 0.35 + random() * 0.45,
  }));
  return (
    <PosterFrame variant="murmuration">
      {streaks.map((streak) => (
        <span
          key={streak.id}
          className="absolute h-[2px] rounded-full bg-accent"
          style={{
            left: `${streak.left}%`,
            top: `${streak.top}%`,
            width: streak.length,
            opacity: streak.opacity,
            transform: `rotate(${streak.angle}deg)`,
          }}
        />
      ))}
      <span
        className="absolute rounded-full border border-alert opacity-40"
        style={{ left: "64%", top: "44%", width: 34, height: 34 }}
      />
      <span
        className="absolute rounded-full bg-alert"
        style={{ left: "66%", top: "47%", width: 8, height: 8 }}
      />
    </PosterFrame>
  );
}

/** An actual cell lattice: aligned squares, some alive, some faded. */
export function AutomataPoster() {
  const random = mulberry32(hashSeed("poster-automata-atlas"));
  const cols = 15;
  const rows = 7;
  const cells: Array<{
    id: number;
    left: number;
    top: number;
    opacity: number;
  }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const alive = random() > 0.56;
      if (!alive) {
        continue;
      }
      cells.push({
        id: row * cols + col,
        left: 8 + col * 5.7,
        top: 34 + row * 6.6,
        opacity: 0.3 + random() * 0.6,
      });
    }
  }
  return (
    <PosterFrame variant="automata-atlas">
      {cells.map((cell) => (
        <span
          key={cell.id}
          className="absolute rounded-[1px] bg-accent"
          style={{
            left: `${cell.left}%`,
            top: `${cell.top}%`,
            width: "4.2%",
            height: "5%",
            opacity: cell.opacity,
          }}
        />
      ))}
    </PosterFrame>
  );
}

/**
 * A simply-supported truss under a center load, in the piece's own color
 * convention: blue bottom chord in tension, red top chord in compression.
 */
export function LoadPathPoster() {
  const panels = 5;
  return (
    <PosterFrame variant="load-path">
      <span className="absolute left-1/2 top-[33%] h-[10%] w-[3px] -translate-x-1/2 bg-alert" />
      <span className="absolute left-1/2 top-[42.4%] h-0 w-0 -translate-x-1/2 border-x-[6px] border-t-[8px] border-x-transparent border-t-alert" />
      <div className="absolute inset-x-[10%] top-[46%] h-[24%]">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-alert opacity-75" />
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent opacity-85" />
        {Array.from({ length: panels + 1 }, (_, index) => (
          <span
            key={index}
            className="absolute top-0 h-full w-[2px] bg-white opacity-25"
            style={{ left: `${index * 20}%` }}
          />
        ))}
        {Array.from({ length: panels }, (_, index) => (
          <span
            key={index}
            className={`absolute h-[2.5px] w-[24%] origin-left ${
              index % 2 === 0 ? "bottom-0 bg-accent" : "top-0 bg-alert"
            }`}
            style={{
              left: `${index * 20}%`,
              opacity: 0.6,
              transform: `rotate(${index % 2 === 0 ? -38 : 38}deg)`,
            }}
          />
        ))}
      </div>
      <span className="absolute left-[9%] top-[71%] h-0 w-0 border-x-[7px] border-b-[10px] border-x-transparent border-b-white opacity-60" />
      <span className="absolute right-[9%] top-[71%] h-0 w-0 border-x-[7px] border-b-[10px] border-x-transparent border-b-white opacity-60" />
    </PosterFrame>
  );
}

/** A terrain band with ridge silhouettes, a blue pool, and white stipple. */
export function TerraformPoster() {
  const random = mulberry32(hashSeed("poster-terraform"));
  const stipple = Array.from({ length: 46 }, (_, index) => ({
    id: index,
    left: 6 + random() * 88,
    top: 42 + random() * 40,
    size: 2 + random() * 2.5,
    stressed: index < 5,
    opacity: 0.35 + random() * 0.45,
  }));
  return (
    <PosterFrame variant="terraform">
      <div className="absolute inset-x-0 top-[46%] h-[38%] bg-[linear-gradient(to_top,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_55%,transparent)]" />
      <div className="absolute left-[-6%] top-[50%] h-[24%] w-[64%] rounded-full bg-white opacity-[0.07]" />
      <div className="absolute right-[-8%] top-[46%] h-[28%] w-[58%] rounded-full bg-white opacity-[0.05]" />
      <div className="absolute left-[34%] top-[62%] h-[9%] w-[24%] rounded-full bg-accent opacity-50 blur-[2px]" />
      {stipple.map((dot) => (
        <span
          key={dot.id}
          className={`absolute rounded-full ${dot.stressed ? "bg-alert" : "bg-white"}`}
          style={{
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: dot.size,
            height: dot.size,
            opacity: dot.stressed ? 0.75 : dot.opacity,
          }}
        />
      ))}
    </PosterFrame>
  );
}
