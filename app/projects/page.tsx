import ProjectCatalog from "@/components/ProjectCatalog";
import Reveal from "@/components/Reveal";
import Link from "next/link";

export const metadata = {
  title: "Projects — Ibrahim Hussain",
  description:
    "Professional work, tested open-source software, and interactive labs—organized into three clear paths with plain-English summaries and technical evidence.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-6 pb-32 pt-36 md:px-8 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Work · code · interactive labs
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight text-fg md:text-7xl">
            Start simple.
            <br />
            Go deep when you&apos;re ready.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            Professional work, tested software, and browser labs are grouped
            into three clear paths. Every entry begins in plain English and
            includes the technical decisions, evidence, and limits underneath.
          </p>
          <Link
            href="/creative"
            className="mt-7 inline-flex min-h-11 items-center border-b border-border text-sm font-medium text-fg-muted transition-colors hover:border-fg hover:text-fg"
          >
            Looking for spatial design and interactive art? Explore 10 creative
            prototypes →
          </Link>
        </Reveal>

        <Reveal className="mt-14" delay={80}>
          <ProjectCatalog />
        </Reveal>
      </div>
    </main>
  );
}
