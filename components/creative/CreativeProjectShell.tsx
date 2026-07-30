"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  CREATIVE_PROJECTS,
  type CreativeProject,
} from "@/lib/creativeProjects";

export default function CreativeProjectShell({
  project,
  children,
}: {
  project: CreativeProject;
  children: ReactNode;
}) {
  const projectIndex = CREATIVE_PROJECTS.findIndex(
    (candidate) => candidate.slug === project.slug,
  );
  const previous =
    CREATIVE_PROJECTS[
      (projectIndex - 1 + CREATIVE_PROJECTS.length) % CREATIVE_PROJECTS.length
    ];
  const next =
    CREATIVE_PROJECTS[(projectIndex + 1) % CREATIVE_PROJECTS.length];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pb-5 pt-28 md:px-8 md:pt-32">
        <Link
          href="/creative"
          className="text-xs font-medium text-white/55 transition-colors hover:text-white"
        >
          ← Creative playground
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${
              project.accent === "red" ? "bg-alert" : "bg-accent"
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            {project.number} · {project.category}
          </span>
        </div>
      </div>
      {children}

      <section
        aria-labelledby="creative-proof-title"
        className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32"
      >
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#090909]">
          <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Engineering proof · Interactive concept prototype
              </p>
              <h2
                id="creative-proof-title"
                className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl"
              >
                Why this exists.
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/60 md:text-base">
                {project.purpose}
              </p>

              <p className="mt-9 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                Skills demonstrated
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.capabilities.map((capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-7 md:p-10">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                    What is interactive
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    {project.interaction}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                    Evidence type
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Working browser prototype using illustrative or synthetic
                    data. No account or paid API key is required.
                  </p>
                </div>
              </div>

              <div className="mt-9">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Technical decisions
                </p>
                <ol className="mt-4 space-y-3">
                  {project.decisions.map((decision, index) => (
                    <li
                      key={decision}
                      className="flex gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                    >
                      <span className="font-mono text-[10px] text-white/30">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm leading-6 text-white/65">
                        {decision}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-8 rounded-2xl border border-alert/35 bg-alert-soft p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-alert">
                  Scope and limitation
                </p>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {project.boundary}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav
          aria-label="Continue through creative projects"
          className="mt-8 grid gap-3 sm:grid-cols-2"
        >
          <Link
            href={`/creative/${previous.slug}`}
            prefetch={false}
            className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-colors hover:bg-white/[0.06]"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              ← Previous project
            </span>
            <span className="mt-2 block text-lg font-medium text-white/80 group-hover:text-white">
              {previous.title}
            </span>
          </Link>
          <Link
            href={`/creative/${next.slug}`}
            prefetch={false}
            className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition-colors hover:bg-white/[0.06] sm:text-right"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              Next project →
            </span>
            <span className="mt-2 block text-lg font-medium text-white/80 group-hover:text-white">
              {next.title}
            </span>
          </Link>
        </nav>
      </section>
    </main>
  );
}
