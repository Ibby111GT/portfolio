import Link from "next/link";
import type { LabDefinition } from "@/lib/labs";

// Two accents only: red for security subjects, blue for data and systems.
const ACCENTS = {
  blue: {
    glow: "from-blue-500/25 via-blue-500/10 to-transparent",
    dot: "bg-blue-400",
    text: "text-blue-300",
    border: "group-hover:border-blue-400/40",
  },
  red: {
    glow: "from-red-500/25 via-red-500/10 to-transparent",
    dot: "bg-red-400",
    text: "text-red-300",
    border: "group-hover:border-red-400/40",
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
