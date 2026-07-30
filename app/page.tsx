"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HeroCanvas from "@/components/HeroCanvas";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import TailoredView from "@/components/TailoredView";
import LabCard from "@/components/LabCard";
import ShowcaseNavigator from "@/components/ShowcaseNavigator";
import { CASE_STUDIES } from "@/lib/caseStudies";
import { LABS } from "@/lib/labs";
import {
  ALL_CATALOG_ENTRIES,
  LAB_PROJECTS,
  TOOL_PROJECTS,
} from "@/lib/projects";
import { mergeTailoredIntoView } from "@/lib/profile";
import type { BaseProfile, TailoredPayload } from "@/lib/types";

const PUBLIC_TOOL_TESTS = TOOL_PROJECTS.reduce((total, project) => {
  const count = project.signal.match(/\d+/)?.[0];
  return total + (count ? Number(count) : 0);
}, 0);

function PortfolioContent() {
  const searchParams = useSearchParams();
  const refToken = searchParams.get("ref");

  const [profile, setProfile] = useState<BaseProfile | null>(null);
  const [tailored, setTailored] = useState<TailoredPayload | null>(null);
  const [mode, setMode] = useState<"base" | "tailored">("base");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPortfolio() {
      setLoading(true);
      setError(null);

      try {
        const baseResponse = await fetch("/data/base_profile.json");
        if (!baseResponse.ok) {
          throw new Error("Failed to load base profile.");
        }
        const baseProfile = (await baseResponse.json()) as BaseProfile;

        if (cancelled) {
          return;
        }

        if (!refToken) {
          setProfile(baseProfile);
          setTailored(null);
          setMode("base");
          return;
        }

        const tailoredResponse = await fetch(
          `/data/${encodeURIComponent(refToken)}.json`,
        );

        if (tailoredResponse.status === 404) {
          setProfile(baseProfile);
          setTailored(null);
          setMode("base");
          setError(
            `No tailored payload found for ref=${refToken}. Showing base profile.`,
          );
          return;
        }

        if (!tailoredResponse.ok) {
          throw new Error(
            `Tailored payload request failed (${tailoredResponse.status}).`,
          );
        }

        const tailoredPayload =
          (await tailoredResponse.json()) as TailoredPayload;
        const merged = mergeTailoredIntoView(baseProfile, tailoredPayload);

        setProfile(merged);
        setTailored(tailoredPayload);
        setMode("tailored");
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unknown load error.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPortfolio();

    return () => {
      cancelled = true;
    };
  }, [refToken]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-sm text-fg-muted">Unable to load portfolio data.</p>
      </main>
    );
  }

  if (mode === "tailored" && tailored) {
    return <TailoredView profile={profile} tailored={tailored} />;
  }

  return <HomeView profile={profile} error={error} />;
}

function HomeView({
  profile,
  error,
}: {
  profile: BaseProfile;
  error: string | null;
}) {
  const statusText = profile.headline.replace("|", "·");
  const nameWords = profile.full_name.split(" ");

  return (
    <main>
      <section className="relative h-[100svh] flex flex-col justify-center overflow-hidden">
        <HeroCanvas />
        <div className="absolute bottom-0 left-0 right-0 h-80 pointer-events-none bg-gradient-to-b from-transparent to-bg" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-24 md:pt-28 pb-16 w-full">
          <div className="flex flex-col items-center text-center">
            {error ? (
              <p className="mb-4 text-xs text-fg-muted">{error}</p>
            ) : null}
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
            [String(PUBLIC_TOOL_TESTS), "Automated tool tests"],
            ["4", "Professional case studies"],
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
                Six public tools with repeatable demos, documented limitations,
                automated regression tests, and CI on every push.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface/50 px-5 py-4 text-right">
              <p className="text-2xl font-bold tracking-tight text-fg">
                {PUBLIC_TOOL_TESTS}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                Automated tests across 6 tools
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
              View all six repositories and live demos →
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
                Simulations you can run in this browser and security tools you
                can download — each one with a plain-English walkthrough.
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

function LoadingSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl animate-pulse px-6 pt-40 sm:px-8">
      <div className="mx-auto mb-8 h-8 w-64 rounded-full bg-surface" />
      <div className="mx-auto mb-4 h-20 w-2/3 rounded-2xl bg-surface" />
      <div className="mx-auto mb-8 h-10 w-80 rounded-full bg-surface" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-surface lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PortfolioContent />
    </Suspense>
  );
}
