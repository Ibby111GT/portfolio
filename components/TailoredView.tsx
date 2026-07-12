"use client";

import Reveal from "@/components/Reveal";
import TerminalConsole from "@/components/TerminalConsole";
import type { BaseProfile, TailoredPayload } from "@/lib/types";

interface TailoredViewProps {
  profile: BaseProfile;
  tailored: TailoredPayload;
}

export default function TailoredView({ profile, tailored }: TailoredViewProps) {
  const sandbox = tailored.sandbox_project;
  const overrides = tailored.resume_overrides;

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-32 md:pt-40 pb-12">
          <Reveal className="mb-6">
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
              Tailored for {tailored.role_title ?? "this role"}
              {tailored.focus_area ? ` · ${tailored.focus_area}` : ""}
            </span>
          </Reveal>
          <Reveal blur delay={120}>
            <h1 className="text-4xl md:text-6xl font-bold text-fg leading-tight tracking-tight">
              {profile.full_name}
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-4 text-base text-fg-muted max-w-xl leading-relaxed">
              {profile.location} · {profile.email}
            </p>
            {overrides?.reframing_strategy ? (
              <p className="mt-2 text-sm text-fg-muted max-w-xl leading-relaxed">
                {overrides.reframing_strategy}
              </p>
            ) : null}
          </Reveal>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 md:px-8 pb-24 space-y-16">
        {profile.bullets.length > 0 ? (
          <Reveal>
            <section>
              <p className="text-xs font-medium tracking-widest uppercase text-fg-muted mb-6">
                Highlighted Experience
              </p>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.07), 0 0 24px #22c55e28",
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px z-10 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                <div className="absolute inset-0 bg-[#08080f]" />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: 0,
                    left: "-10%",
                    width: "70%",
                    height: "100%",
                    background:
                      "radial-gradient(ellipse at 20% 50%, #16a34a55 0%, transparent 70%)",
                  }}
                />
                <ul className="relative z-10 px-7 py-7 md:px-10 md:py-9 space-y-4">
                  {profile.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex gap-3 text-sm md:text-base text-white/80 leading-relaxed"
                    >
                      <span className="text-green-400 shrink-0 mt-0.5">→</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </Reveal>
        ) : null}

        {profile.ats_keywords.length > 0 ? (
          <Reveal>
            <section>
              <p className="text-xs font-medium tracking-widest uppercase text-fg-muted mb-5">
                Keywords
              </p>
              <div className="flex gap-2 flex-wrap">
                {profile.ats_keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="text-[10px] md:text-xs uppercase tracking-widest text-fg-muted bg-surface border border-border rounded-md px-2.5 py-1"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        {overrides?.achievement_mappings?.length ? (
          <Reveal>
            <section>
              <p className="text-xs font-medium tracking-widest uppercase text-fg-muted mb-5">
                Requirement Mapping
              </p>
              <div className="relative flex flex-col pl-5 border-l border-border">
                {overrides.achievement_mappings.map((mapping) => (
                  <div
                    key={mapping.requirement}
                    className="flex flex-col gap-1 py-4"
                  >
                    <p className="text-sm font-semibold text-fg">
                      {mapping.requirement}
                    </p>
                    <p className="text-sm text-fg-muted leading-relaxed">
                      {mapping.evidence}
                      {mapping.source ? ` — ${mapping.source}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        ) : null}

        {sandbox ? (
          <Reveal>
            <TerminalConsole
              projectTitle={sandbox.title}
              problemStatement={sandbox.problem_statement}
              caseStudy={sandbox.technical_case_study}
              companyContext={sandbox.target_company_context}
              assets={sandbox.sandbox_assets ?? []}
            />
          </Reveal>
        ) : null}

        <p className="font-mono text-xs text-fg-muted">
          {tailored.tracker_id ? `tracker_id=${tailored.tracker_id}` : ""}
          {tailored.job_url ? ` — ${tailored.job_url}` : ""}
        </p>
      </div>
    </main>
  );
}
