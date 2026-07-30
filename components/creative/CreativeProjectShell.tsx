"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import DetailNavigator from "@/components/DetailNavigator";
import {
  CREATIVE_PROJECTS,
  type CreativeGroup,
  type CreativeProject,
} from "@/lib/creativeProjects";

const GROUP_ANCHORS: Record<CreativeGroup, string> = {
  "Design & fabrication": "design",
  "Interactive simulations": "simulations",
  "Generative systems": "generative",
  "Playable worlds": "playable",
};

export default function CreativeProjectShell({
  project,
  children,
}: {
  project: CreativeProject;
  children: ReactNode;
}) {
  const collection = CREATIVE_PROJECTS.filter(
    (candidate) => candidate.group === project.group,
  );
  const projectIndex = collection.findIndex(
    (candidate) => candidate.slug === project.slug,
  );
  const next =
    projectIndex >= 0 && projectIndex < collection.length - 1
      ? collection[projectIndex + 1]
      : undefined;
  const collectionHref = `/creative#${GROUP_ANCHORS[project.group]}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pb-5 pt-28 md:px-8 md:pt-32">
        <Link
          href={collectionHref}
          className="text-xs font-medium text-white/55 transition-colors hover:text-white"
        >
          ← {project.group}
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

      <div className="relative z-20 mx-auto max-w-7xl px-6 pb-10 md:px-8">
        <DetailNavigator
          accent={project.accent}
          tone="dark"
          readingTime="2 min overview · 8 min deep dive"
          label="Choose your depth"
          items={[
            { href: "#plain-english", label: "Start here" },
            { href: "#experience", label: "Use the prototype" },
            { href: "#technical-details", label: "Technical details" },
          ]}
        />
      </div>

      <section
        id="plain-english"
        aria-labelledby="creative-guide-title"
        className="mx-auto max-w-7xl scroll-mt-32 px-6 pb-16 md:px-8 md:pb-24"
      >
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#090909]">
          <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
            <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Start here · In plain English
              </p>
              <h1
                id="creative-guide-title"
                className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl"
              >
                {project.title}
              </h1>
              <p className="mt-5 text-base leading-7 text-white/65">
                {project.description}
              </p>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Why it matters
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  {project.purpose}
                </p>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-white/10 p-7 md:border-b-0 md:border-r md:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Try it in order
                </p>
                <ol className="mt-5 space-y-5">
                  {project.steps.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/12 font-mono text-[10px] text-white/45">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-white/65">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="p-7 md:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  What you are looking at
                </p>
                <dl className="mt-5 space-y-5">
                  {project.reading.map((item) => (
                    <div key={item.label}>
                      <dt className="text-sm font-semibold text-white/80">
                        {item.label}
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-white/55">
                        {item.detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="experience" className="scroll-mt-32">
        {children}
      </div>

      <section
        id="technical-details"
        aria-labelledby="creative-technical-title"
        className="mx-auto max-w-7xl scroll-mt-32 px-6 py-24 md:px-8 md:py-32"
      >
        <div className="grid gap-10 border-t border-white/10 pt-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
              Technical deep dive
            </p>
            <h2
              id="creative-technical-title"
              className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl"
            >
              How the system works.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/60 md:text-base">
              The prototype is fully operable in this browser. This section
              separates the implementation evidence from the visual concept.
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

          <div className="space-y-9">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                System structure
              </p>
              <ol className="mt-4 space-y-3">
                {project.architecture.map((item, index) => (
                  <li
                    key={item}
                    className="flex gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                  >
                    <span className="font-mono text-[10px] text-white/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm leading-6 text-white/65">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                  Evidence and data
                </p>
                <p className="mt-3 text-sm leading-6 text-white/65">
                  {project.evidenceMode}. No account or paid API key is
                  required.
                </p>
                <a
                  href="https://github.com/Ibby111GT/portfolio/tree/main/components/creative"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex min-h-11 items-center text-xs font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
                >
                  View implementation source ↗
                </a>
              </div>
              <div
                className={`rounded-2xl border p-5 ${
                  project.boundaryTone === "safety"
                    ? "border-alert/35 bg-alert-soft"
                    : "border-white/10 bg-white/[0.025]"
                }`}
              >
                <p
                  className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                    project.boundaryTone === "safety"
                      ? "text-alert"
                      : "text-white/35"
                  }`}
                >
                  Scope and limits
                </p>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {project.boundary}
                </p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                Key technical decisions
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {project.decisions.map((decision, index) => (
                  <div
                    key={decision}
                    className="rounded-xl border border-white/[0.08] p-4"
                  >
                    <span className="font-mono text-[10px] text-white/30">
                      Decision {String(index + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-2 text-sm leading-6 text-white/65">
                      {decision}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <nav
          aria-label="Continue through creative projects"
          className="mt-16 grid gap-3 sm:grid-cols-2"
        >
          <Link
            href={collectionHref}
            className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-colors hover:bg-white/[0.06]"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              Collection
            </span>
            <span className="mt-2 block text-lg font-medium text-white/80 group-hover:text-white">
              ← Back to {project.group}
            </span>
          </Link>
          <Link
            href={next ? `/creative/${next.slug}` : "/creative"}
            prefetch={false}
            className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-left transition-colors hover:bg-white/[0.06] sm:text-right"
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              {next
                ? `Next in this collection · ${projectIndex + 2} of ${collection.length}`
                : "Collection complete"}
            </span>
            <span className="mt-2 block text-lg font-medium text-white/80 group-hover:text-white">
              {next ? `${next.title} →` : "Explore all creative projects →"}
            </span>
          </Link>
        </nav>
      </section>
    </main>
  );
}
