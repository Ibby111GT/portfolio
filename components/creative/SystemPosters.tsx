import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type Variant = "murmuration" | "automata-atlas" | "load-path" | "terraform";

function SystemPoster({ variant }: { variant: Variant }) {
  const random = mulberry32(hashSeed(`poster-${variant}`));
  const title = {
    murmuration: "MURMURATION",
    "automata-atlas": "AUTOMATA ATLAS",
    "load-path": "LOAD PATH",
    terraform: "TERRAFORM",
  }[variant];
  const items = Array.from({ length: variant === "automata-atlas" ? 110 : 56 }, (_, index) => ({
    id: index,
    left: 6 + random() * 88,
    top: 20 + random() * 72,
    size: 2 + random() * (variant === "terraform" ? 14 : 6),
    alert: variant === "load-path" ? index % 3 === 0 : index < 3,
    rotate: random() * 180,
  }));

  return (
    <div
      className={`absolute inset-0 overflow-hidden bg-[#05070b] ${
        variant === "terraform"
          ? "bg-[radial-gradient(circle_at_25%_65%,rgba(37,99,235,.28),transparent_34%),radial-gradient(circle_at_72%_42%,rgba(96,165,250,.16),transparent_38%)]"
          : "bg-[radial-gradient(circle_at_50%_48%,rgba(37,99,235,.18),transparent_48%)]"
      }`}
      aria-hidden="true"
    >
      <div className="absolute inset-x-7 top-8 z-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-blue-300/55">
          Interactive system
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white/90">
          {title}
        </p>
      </div>
      {variant === "load-path" ? (
        <div className="absolute inset-x-[8%] bottom-[20%] h-[48%]">
          {Array.from({ length: 9 }, (_, index) => (
            <span
              key={index}
              className={`absolute h-[3px] origin-left ${
                index % 2 ? "bg-blue-400/75" : "bg-red-400/70"
              }`}
              style={{
                left: `${index * 10}%`,
                top: `${index % 2 ? 22 : 72}%`,
                width: "17%",
                transform: `rotate(${index % 2 ? 52 : -52}deg)`,
              }}
            />
          ))}
        </div>
      ) : null}
      {items.map((item) => (
        <span
          key={item.id}
          className={`absolute ${
            variant === "automata-atlas"
              ? "rounded-[1px]"
              : variant === "terraform"
                ? "rounded-full blur-[1px]"
                : "rounded-full"
          } ${item.alert ? "bg-red-400/75" : "bg-blue-300/65"}`}
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            width: item.size,
            height: variant === "murmuration" ? 2 : item.size,
            transform: `rotate(${item.rotate}deg)`,
          }}
        />
      ))}
      <div className="absolute inset-x-7 bottom-7 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
        <span>Rules create form</span>
        <span>Live in browser</span>
      </div>
    </div>
  );
}

export function MurmurationPoster() {
  return <SystemPoster variant="murmuration" />;
}

export function AutomataPoster() {
  return <SystemPoster variant="automata-atlas" />;
}

export function LoadPathPoster() {
  return <SystemPoster variant="load-path" />;
}

export function TerraformPoster() {
  return <SystemPoster variant="terraform" />;
}
