import ProjectCatalog from "@/components/ProjectCatalog";
import Reveal from "@/components/Reveal";
import Link from "next/link";

export const metadata = {
  title: "Projects — Ibrahim Hussain",
  description:
    "One catalog of working security tools, browser labs, data applications, and professional case studies, each with a plain-English walkthrough.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-6 pb-32 pt-36 md:px-8 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Build / break / learn
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight text-fg md:text-7xl">
            Systems I&apos;ve shipped, simulated, and delivered.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            One clearly labeled catalog of professional engagements, CI-tested
            open-source tools, and interactive browser labs. Every entry
            explains what to do, what the evidence means, and where the system
            would be used.
          </p>
        </Reveal>

        <Reveal className="mt-14" delay={80}>
          <ProjectCatalog />
        </Reveal>

        <Reveal className="mt-20" delay={120}>
          <Link
            href="/creative"
            className="group grid gap-8 overflow-hidden rounded-3xl border border-border bg-[#080808] p-7 text-white md:grid-cols-[1fr_auto] md:items-end md:p-10"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Separate creative collection · 10 live prototypes
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
                Explore spatial models, simulations, and generative systems.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                The Creative tab is intentionally separate from professional
                work. Every piece is interactive and now includes an
                engineering proof layer describing its purpose, decisions, and
                limits.
              </p>
            </div>
            <span className="inline-flex items-center text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
              Enter Creative →
            </span>
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
