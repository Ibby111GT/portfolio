import Link from "next/link";
import type { LabDefinition } from "@/lib/labs";

const ACCENTS = {
  cyan: {
    glow: "from-cyan-400/30 via-blue-500/10 to-transparent",
    dot: "bg-cyan-300",
    text: "text-cyan-200",
    border: "group-hover:border-cyan-300/40",
  },
  lime: {
    glow: "from-lime-400/25 via-emerald-500/10 to-transparent",
    dot: "bg-lime-300",
    text: "text-lime-200",
    border: "group-hover:border-lime-300/40",
  },
  red: {
    glow: "from-red-500/30 via-orange-500/10 to-transparent",
    dot: "bg-red-400",
    text: "text-red-200",
    border: "group-hover:border-red-400/40",
  },
  amber: {
    glow: "from-amber-400/30 via-orange-500/10 to-transparent",
    dot: "bg-amber-300",
    text: "text-amber-200",
    border: "group-hover:border-amber-300/40",
  },
} as const;

export default function LabCard({ lab }: { lab: LabDefinition }) {
  const accent = ACCENTS[lab.accent];

  return (
    <Link
      href={`/labs/${lab.slug}`}
      className={`group relative min-h-[310px] overflow-hidden rounded-2xl border border-white/10 bg-[#090b10] p-7 md:p-8 transition-all duration-300 hover:-translate-y-1 ${accent.border}`}
      style={{ boxShadow: "0 22px 65px rgba(0,0,0,0.28)" }}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b ${accent.glow}`}
      />
      <div className="relative flex h-full flex-col justify-between gap-12">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
            <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
            {lab.eyebrow}
          </div>
          <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white">
            {lab.title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
            {lab.description}
          </p>
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            {lab.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/55"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className={`mt-5 flex items-center justify-between text-sm ${accent.text}`}>
            <span className="font-mono text-xs">{lab.signal}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              Launch lab -&gt;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
