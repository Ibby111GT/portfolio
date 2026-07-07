"use client";

import type { BaseProfile } from "@/lib/types";

interface ProfileSectionProps {
  profile: BaseProfile;
  mode: "base" | "tailored";
  refToken: string | null;
  roleTitle?: string;
  focusArea?: string;
  reframingStrategy?: string;
  companyContext?: string;
}

export default function ProfileSection({
  profile,
  mode,
  refToken,
  roleTitle,
  focusArea,
  reframingStrategy,
  companyContext,
}: ProfileSectionProps) {
  return (
    <section className="animate-fade-in space-y-8 border-b border-border pb-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {mode === "tailored" ? "tailored_view" : "base_profile"} //
          {refToken ? ` ref=${refToken}` : " default"}
        </p>
        <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
          {profile.full_name}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-dim sm:text-base">
          {roleTitle ?? profile.headline}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="rounded border border-border px-2 py-1 transition-soft hover:border-accent/40 hover:text-accent">
            {profile.location}
          </span>
          <a
            href={`mailto:${profile.email}`}
            className="rounded border border-border px-2 py-1 transition-soft hover:border-accent/40 hover:text-accent"
          >
            {profile.email}
          </a>
          {focusArea ? (
            <span className="rounded border border-accent/30 bg-accent/5 px-2 py-1 text-accent">
              focus::{focusArea}
            </span>
          ) : null}
        </div>
      </header>

      {mode === "tailored" && (reframingStrategy || companyContext) ? (
        <div className="rounded border border-border bg-surface p-4 text-sm leading-relaxed text-ink-dim">
          {companyContext ? (
            <p>
              <span className="text-accent">context&gt;</span> {companyContext}
            </p>
          ) : null}
          {reframingStrategy ? (
            <p className={companyContext ? "mt-2" : ""}>
              <span className="text-accent">strategy&gt;</span> {reframingStrategy}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <SkillBlock title="Splunk / SIEM" body={profile.skills.splunk} />
        <SkillBlock title="Azure AD / Intune" body={profile.skills.azure_ad} />
        <SkillBlock title="Windows LAPS" body={profile.skills.windows_laps} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionLabel>education</SectionLabel>
          <div className="rounded border border-border bg-surface p-4 transition-soft hover:border-accent/20">
            <p className="text-sm text-white">{profile.education.school}</p>
            <p className="mt-1 text-sm text-ink-dim">{profile.education.degree}</p>
            <p className="mt-2 text-xs text-muted">
              {profile.education.graduation} — {profile.education.details}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <SectionLabel>certifications</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert) => (
              <span
                key={cert}
                className="rounded border border-border bg-surface px-3 py-1.5 text-xs text-ink-dim transition-soft hover:border-accent/30 hover:text-accent"
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel>
          {mode === "tailored" ? "ats_optimized_bullets" : "experience_bullets"}
        </SectionLabel>
        <ul className="space-y-2">
          {profile.bullets.map((bullet) => (
            <li
              key={bullet}
              className="rounded border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-ink-dim transition-soft hover:border-accent/20 hover:text-ink"
            >
              <span className="mr-2 text-accent">›</span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <SectionLabel>ats_keywords</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {profile.ats_keywords.map((keyword) => (
            <span
              key={keyword}
              className="text-xs text-muted transition-soft hover:text-accent"
            >
              #{keyword.replace(/\s+/g, "_").toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs uppercase tracking-[0.18em] text-muted">{children}</h2>
  );
}

function SkillBlock({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded border border-border bg-surface p-4 transition-soft hover:border-accent/20">
      <h3 className="text-sm text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-dim">{body}</p>
    </article>
  );
}
