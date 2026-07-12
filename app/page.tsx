"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HeroCanvas from "@/components/HeroCanvas";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";
import TailoredView from "@/components/TailoredView";
import { CASE_STUDIES } from "@/lib/caseStudies";
import { mergeTailoredIntoView } from "@/lib/profile";
import type { BaseProfile, TailoredPayload } from "@/lib/types";

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
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-medium tracking-wide text-fg-muted bg-green-500/[0.12] border border-green-500/30 dark:bg-green-500/[0.08] dark:border-white/15"
                style={{ boxShadow: "0 4px 16px rgba(34,197,94,0.1)" }}
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping"
                    style={{ animationDuration: "2s" }}
                  />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
                {statusText}
              </span>
            </Reveal>
            <h1 className="text-[clamp(2.75rem,10vw,5.5rem)] font-bold leading-[1.05] tracking-tight text-fg mb-4 md:mb-6 whitespace-nowrap">
              {nameWords.map((word, index) => (
                <Reveal
                  key={word}
                  blur
                  delay={150 + index * 120}
                  className="inline-block"
                >
                  <span className="inline-block">
                    {word}
                    {index < nameWords.length - 1 ? " " : ""}
                  </span>
                </Reveal>
              ))}
            </h1>
            <Reveal delay={420}>
              <div className="flex items-center gap-3">
                <a
                  href="#work"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fg text-bg text-sm font-medium shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-fg/70 transition-all duration-200"
                >
                  View Case Studies
                </a>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.82] dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] text-fg text-sm font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.14] hover:shadow-none transition-all duration-200"
                >
                  Resume ↗
                </a>
              </div>
            </Reveal>
            <Reveal delay={600}>
              <a
                href="#work"
                className="mt-10 flex flex-col items-center text-fg-muted/70 hover:text-fg-muted transition-colors duration-200"
                aria-label="Scroll to case studies"
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

      <section
        id="work"
        className="relative px-6 md:px-8 pt-28 pb-32 md:pt-36 md:pb-40"
      >
        <div className="max-w-7xl mx-auto">
          <Reveal className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold text-fg tracking-tight">
                Case Studies
              </h2>
              <p className="mt-3 text-base text-fg-muted max-w-md">
                Here is my work across information security, cloud, and
                identity.
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
