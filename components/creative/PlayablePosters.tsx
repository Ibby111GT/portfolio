import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type PlayableVariant =
  | "blocktown-stories"
  | "slipstream-circuit"
  | "lantern-vale"
  | "frameforge";

const TITLES: Record<PlayableVariant, string> = {
  "blocktown-stories": "BLOCKTOWN STORIES",
  "slipstream-circuit": "SLIPSTREAM CIRCUIT",
  "lantern-vale": "LANTERN VALE",
  frameforge: "FRAMEFORGE",
};

function PlayablePoster({ variant }: { variant: PlayableVariant }) {
  const random = mulberry32(hashSeed(`playable-poster-${variant}`));
  const blocks = Array.from({ length: 34 }, (_, index) => ({
    id: index,
    left: 8 + random() * 84,
    top: 22 + random() * 62,
    width: 8 + random() * 28,
    height: 8 + random() * 24,
    red: index % 7 === 0,
  }));

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#05070b] bg-[radial-gradient(circle_at_18%_18%,rgba(37,99,235,.22),transparent_34%),radial-gradient(circle_at_82%_64%,rgba(220,38,38,.18),transparent_36%)]"
      aria-hidden="true"
    >
      <div className="absolute inset-x-7 top-8 z-20">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-blue-300/65">
          Playable in browser
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white/95">
          {TITLES[variant]}
        </p>
      </div>

      {variant === "slipstream-circuit" ? (
        <div className="absolute left-[14%] top-[29%] h-[48%] w-[72%] rounded-[50%] border-[28px] border-[#1d2637] shadow-[0_0_0_2px_rgba(96,165,250,.35)]">
          <span className="absolute -right-5 top-1/2 h-5 w-10 -translate-y-1/2 bg-blue-400 shadow-[0_0_24px_rgba(96,165,250,.8)]" />
          <span className="absolute left-[18%] top-[12%] h-1.5 w-12 rotate-[28deg] bg-red-400/80" />
        </div>
      ) : null}

      {variant === "frameforge" ? (
        <div className="absolute left-1/2 top-[31%] h-[47%] w-40 -translate-x-1/2">
          <span className="absolute left-1/2 top-0 h-14 w-14 -translate-x-1/2 bg-blue-200" />
          <span className="absolute left-1/2 top-14 h-24 w-16 -translate-x-1/2 bg-blue-500" />
          <span className="absolute left-2 top-16 h-16 w-5 rotate-[24deg] bg-red-400" />
          <span className="absolute right-2 top-16 h-16 w-5 -rotate-[24deg] bg-blue-300" />
          <span className="absolute bottom-0 left-10 h-20 w-6 rotate-[12deg] bg-blue-200" />
          <span className="absolute bottom-0 right-10 h-20 w-6 -rotate-[12deg] bg-red-400" />
        </div>
      ) : null}

      {variant === "lantern-vale" ? (
        <div className="absolute inset-x-[10%] bottom-[17%] top-[28%] grid grid-cols-8 grid-rows-5 gap-1 [transform:perspective(500px)_rotateX(56deg)]">
          {Array.from({ length: 40 }, (_, index) => (
            <span
              key={index}
              className={`border border-white/[0.06] ${
                index === 27
                  ? "bg-red-400"
                  : [9, 20, 35].includes(index)
                    ? "bg-blue-300 shadow-[0_0_18px_rgba(96,165,250,.8)]"
                    : index % 6 === 0
                      ? "bg-[#202a3e]"
                      : "bg-[#0f1521]"
              }`}
            />
          ))}
        </div>
      ) : null}

      {variant === "blocktown-stories"
        ? blocks.map((block) => (
            <span
              key={block.id}
              className={`absolute border border-white/10 ${
                block.red ? "bg-red-400/65" : "bg-blue-400/40"
              }`}
              style={{
                left: `${block.left}%`,
                top: `${block.top}%`,
                width: block.width,
                height: block.height,
                boxShadow: `${Math.round(block.width / 3)}px ${Math.round(block.height / 3)}px 0 rgba(0,0,0,.32)`,
              }}
            />
          ))
        : null}

      <div className="absolute inset-x-7 bottom-7 z-20 flex items-center justify-between border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
        <span>Indie systems study</span>
        <span>Touch + keyboard</span>
      </div>
    </div>
  );
}

export function BlocktownPoster() {
  return <PlayablePoster variant="blocktown-stories" />;
}

export function SlipstreamPoster() {
  return <PlayablePoster variant="slipstream-circuit" />;
}

export function LanternValePoster() {
  return <PlayablePoster variant="lantern-vale" />;
}

export function FrameforgePoster() {
  return <PlayablePoster variant="frameforge" />;
}
