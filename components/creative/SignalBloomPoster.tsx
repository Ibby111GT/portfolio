import { hashSeed, mulberry32 } from "@/lib/seededRandom";

interface PosterDot {
  x: number;
  y: number;
  r: number;
  blue: boolean;
}

// Built once at module scope from a fixed seed, so server and client render
// the identical SVG — no hydration mismatch, no runtime animation cost.
const DOTS: PosterDot[] = (() => {
  const rng = mulberry32(hashSeed("signal-bloom"));
  return Array.from({ length: 48 }, () => ({
    x: Math.round(rng() * 780 + 10),
    y: Math.round(rng() * 980 + 10),
    r: Math.round((1.4 + rng() * 3.2) * 10) / 10,
    blue: rng() < 0.5,
  }));
})();

const LINKS: Array<[PosterDot, PosterDot]> = (() => {
  const pairs: Array<[PosterDot, PosterDot]> = [];
  for (let a = 0; a < DOTS.length; a += 1) {
    for (let b = a + 1; b < DOTS.length; b += 1) {
      const dx = DOTS[a].x - DOTS[b].x;
      const dy = DOTS[a].y - DOTS[b].y;
      if (Math.hypot(dx, dy) < 130) {
        pairs.push([DOTS[a], DOTS[b]]);
      }
    }
  }
  return pairs;
})();

/** Static generative poster used as the gallery card for Signal Bloom. */
export default function SignalBloomPoster() {
  return (
    <svg
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.035]"
      aria-hidden="true"
    >
      <rect width="800" height="1000" fill="#050507" />
      <g strokeWidth="1">
        {LINKS.map(([a, b], index) => (
          <line
            key={index}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={a.blue ? "var(--accent)" : "var(--alert)"}
            strokeOpacity="0.22"
          />
        ))}
      </g>
      <g>
        {DOTS.map((dot, index) => (
          <circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={dot.blue ? "var(--accent)" : "var(--alert)"}
            fillOpacity="0.9"
          />
        ))}
      </g>
    </svg>
  );
}
