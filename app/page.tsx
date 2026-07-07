"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfileSection from "@/components/ProfileSection";
import TerminalConsole from "@/components/TerminalConsole";
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

        const tailoredResponse = await fetch(`/data/${encodeURIComponent(refToken)}.json`);

        if (tailoredResponse.status === 404) {
          setProfile(baseProfile);
          setTailored(null);
          setMode("base");
          setError(`No tailored payload found for ref=${refToken}. Showing base profile.`);
          return;
        }

        if (!tailoredResponse.ok) {
          throw new Error(`Tailored payload request failed (${tailoredResponse.status}).`);
        }

        const tailoredPayload = (await tailoredResponse.json()) as TailoredPayload;
        const merged = mergeTailoredIntoView(baseProfile, tailoredPayload);

        setProfile(merged);
        setTailored(tailoredPayload);
        setMode("tailored");
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown load error.");
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
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
        <p className="text-sm text-muted">Unable to load portfolio data.</p>
      </main>
    );
  }

  const sandbox = tailored?.sandbox_project;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4 text-xs text-muted">
        <span>portfolio.sandbox.hub</span>
        <span>{new Date().getUTCFullYear()} // hermes.phase5</span>
      </div>

      {error ? (
        <div className="mb-6 rounded border border-border bg-surface px-4 py-3 text-xs text-muted">
          <span className="text-accent">warn&gt;</span> {error}
        </div>
      ) : null}

      <ProfileSection
        profile={profile}
        mode={mode}
        refToken={refToken}
        roleTitle={tailored?.role_title}
        focusArea={tailored?.focus_area}
        reframingStrategy={tailored?.resume_overrides?.reframing_strategy}
        companyContext={sandbox?.target_company_context}
      />

      {sandbox ? (
        <TerminalConsole
          projectTitle={sandbox.title}
          problemStatement={sandbox.problem_statement}
          caseStudy={sandbox.technical_case_study}
          companyContext={sandbox.target_company_context}
          assets={sandbox.sandbox_assets ?? []}
        />
      ) : (
        <section className="mt-12 rounded border border-border bg-surface p-6 text-sm text-ink-dim">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            showcase_mode
          </p>
          <p className="mt-3">
            Append <span className="text-accent">?ref=tracker-id</span> to load a
            Hermes-tailored case study, ATS bullets, and interactive sandbox assets.
          </p>
        </section>
      )}

      <footer className="mt-16 border-t border-border pt-6 text-xs text-muted">
        <p>
          {mode === "tailored" && tailored?.tracker_id
            ? `tracker_id=${tailored.tracker_id}`
            : "base_profile.json"}
          {tailored?.job_url ? ` — ${tailored.job_url}` : ""}
        </p>
      </footer>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl animate-pulse px-6 py-14 sm:px-8">
      <div className="mb-8 h-4 w-48 rounded bg-surface" />
      <div className="mb-4 h-10 w-2/3 rounded bg-surface" />
      <div className="mb-8 h-4 w-1/2 rounded bg-surface" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-32 rounded bg-surface" />
        <div className="h-32 rounded bg-surface" />
        <div className="h-32 rounded bg-surface" />
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
