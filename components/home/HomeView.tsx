import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import LabCard from "@/components/LabCard";
import ShowcaseNavigator from "@/components/ShowcaseNavigator";
import { CASE_STUDIES } from "@/lib/caseStudies";
import { LABS } from "@/lib/labs";
import {
  ALL_CATALOG_ENTRIES,
  LAB_PROJECTS,
  TOOL_PROJECTS,
  TOTAL_TOOL_TESTS,
} from "@/lib/projects";
import type { BaseProfile } from "@/lib/types";

/**
 * The default homepage. A server component with static imports only — its
 * full markup ships in the prerendered HTML, so crawlers, link previews, and
 * no-JS visitors get the complete page rather than a loading skeleton.
 */
export default function HomeView({ profile }: { profile: BaseProfile }) {
  const statusText = profile.headline.replace("|", "·");
  const nameWords = profile.full_name.split(" ");

  return (
    <main>
      <section className="relative h-[100svh] flex flex-col justify-center overflow-hidden">
        <HeroCanvas />
        <div className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none bg-gradient-to-b from-transparent to-bg" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-24 md:pt-28 pb-16 w-full">
          <div className="flex flex-col items-center text-center">
            <Reveal className="mb-6 md:mb-8">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-medium tracking-wide text-fg-muted bg-blue-500/[0.12] border border-blue-500/30 dark:bg-blue-500/[0.08] dark:border-white/15"
                style={{ boxShadow: "0 4px 16px rgba(29,78,216,0.16)" }}
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-60 animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                </span>
                {statusText}
              </span>
            </Reveal>
            <h1 className="mb-4 max-w-5xl text-balance text-[clamp(2.35rem,11vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.045em] text-fg md:mb-6">
              {nameWords.map((word, index) => (
                <Reveal
                  key={word}
                  blur
                  delay={150 + index * 120}
                  className="inline-block"
                >
                  <span className="inline-block">
                    {word}
                    {index < nameWords.length - 1 ? " " : ""}
                  </span>
                </Reveal>
              ))}
            </h1>
            <Reveal delay={360}>
              <p className="mx-auto mb-7 max-w-2xl text-sm leading-6 text-fg-muted md:text-lg md:leading-8">
                I build security, data, and infrastructure systems that turn
                messy signals into decisions — with working demos that show
                exactly how they hold up.
              </p>
            </Reveal>
            <Reveal delay={500}>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/labs/threat-hunt"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fg text-bg text-sm font-medium shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-fg/70 transition-all duration-200"
                >
                  Start a live investigation
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.82] dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] text-fg text-sm font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.14] hover:shadow-none transition-all duration-200"
                >
                  Browse all work
                </Link>
              </div>
            </Reveal>
            <Reveal delay={680}>
              <a
                href="#start"
                className="mt-10 flex flex-col items-center text-fg-muted/70 hover:text-fg-muted transition-colors duration-200"
                aria-label="Scroll to choose a portfolio path"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path
                    d="M6 10l8 8 8-8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/35 px-6 py-6 md:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
          {[
            [String(ALL_CATALOG_ENTRIES.length), "Technical & work entries"],
            [String(LAB_PROJECTS.length), "Live browser labs"],
            [String(TOTAL_TOOL_TESTS), "Automated tool tests"],
            [String(CASE_STUDIES.length), "Professional case studies"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="px-4 py-3 text-center first:pl-0 last:pr-0"
            >
              <p className="text-2xl font-bold tracking-tight text-fg">{value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ShowcaseNavigator />

      <section
        id="projects"
        className="relative px-6 md:px-8 pt-28 pb-32 md:pt-36 md:pb-40"
      >
        <div className="max-w-7xl mx-auto">
          <Reveal className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-fg tracking-tight">
                Professional Case Studies
              </h2>
              <p className="mt-3 text-base text-fg-muted max-w-md">
                The decisions, constraints, and measurable outcomes behind
                work delivered in real organizations.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-10">
            {CASE_STUDIES.map((study, index) => (
              <ProjectCard
                key={study.slug}
                card={{ ...study, href: `/work/${study.slug}` }}
                delay={index * 80}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-border px-6 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
                Open-source engineering
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg md:text-5xl">
                Inspect the code, not just the claim.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-fg-muted">
                {TOOL_PROJECTS.length} public tools with repeatable demos,
                documented limitations, automated regression tests, and CI on
                every push.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/50 px-5 py-4 text-right">
              <p className="text-2xl font-bold tracking-tight text-fg">
                {TOTAL_TOOL_TESTS}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                Automated tests across {TOOL_PROJECTS.length} tools
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-3">
            {TOOL_PROJECTS.slice(0, 3).map((project, index) => (
              <Reveal key={project.slug} delay={index * 70}>
                <Link
                  href={project.href}
                  className="group flex min-h-64 flex-col justify-between rounded-2xl border border-border bg-surface/35 p-6 transition-colors hover:border-fg/25 hover:bg-surface/70"
                >
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-alert">
                        Open-source tool
                      </span>
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-tight text-fg">
                      {project.name}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-fg-muted">
                      {project.plain}
                    </p>
                  </div>
                  <div className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <span className="font-mono text-fg-muted">
                      {project.signal}
                    </span>
                    <span className="font-medium text-fg transition-transform group-hover:translate-x-1">
                      Walkthrough →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-6 text-right">
            <Link
              href="/projects"
              className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              View all {TOOL_PROJECTS.length} repositories and live demos →
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative border-t border-border px-6 py-28 md:px-8 md:py-36">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
                Working demonstrations
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg md:text-5xl">
                Browser Labs
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-fg-muted">
                Simulations you can run right here in the browser — each one
                with a plain-English walkthrough of what it proves.
              </p>
            </div>
            <Link
              href="/projects"
              className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
            >
              See all projects -&gt;
            </Link>
          </Reveal>
          <div className="grid gap-6 lg:grid-cols-3">
            {LABS.map((lab, index) => (
              <Reveal key={lab.slug} delay={index * 80}>
                <LabCard lab={lab} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
