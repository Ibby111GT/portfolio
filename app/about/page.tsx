"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

const EXPERIENCE = [
  {
    org: "University of Texas System",
    role: "Information Security Intern",
    period: "2025–Present",
    track: "SECURITY",
  },
  {
    org: "DFW Technology — UT Dallas Capstone",
    role: "Project Lead & Systems Analyst",
    period: "2026",
    track: "SECURITY",
  },
  {
    org: "Chief Technology Group",
    role: "Cloud Engineer Intern",
    period: "2024",
    track: "CLOUD & IT",
  },
  {
    org: "Roomi Group Corp",
    role: "IT Support / Systems Administrator",
    period: "2020–2023",
    track: "CLOUD & IT",
  },
];

const EDUCATION = [
  {
    org: "The University of Texas at Dallas",
    detail: "B.S. in Computer Information Systems & Technology",
    period: "May 2026",
  },
  {
    org: "Johns Hopkins University",
    detail:
      "Professional Certificate in Cybersecurity: IT and Data Security in the Age of AI",
    period: "In Progress",
  },
  {
    org: "UT Dallas Global Career Accelerator",
    detail: "Professional Certificate Program",
    period: "In Progress",
  },
  {
    org: "Microsoft",
    detail: "Azure Fundamentals (AZ-900)",
    period: "",
  },
];

const TRACKS = ["ALL", "SECURITY", "CLOUD & IT"] as const;
type Track = (typeof TRACKS)[number];

function StoryImage({ aspect, label }: { aspect: string; label: string }) {
  return (
    <div
      className={`rounded-3xl w-full ${aspect} overflow-hidden relative border border-border bg-surface`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(60,100,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(130,60,230,0.10) 0%, transparent 60%)",
        }}
      />
      <span className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
        {label}
      </span>
    </div>
  );
}

export default function AboutPage() {
  const [track, setTrack] = useState<Track>("ALL");

  const visibleExperience =
    track === "ALL"
      ? EXPERIENCE
      : EXPERIENCE.filter((item) => item.track === track);

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse at 50% -30%, rgba(60,100,255,0.12) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-20">
          <Reveal blur>
            <h1 className="text-4xl md:text-6xl font-bold text-fg leading-tight tracking-tight">
              I secure with intention.
              <br />
              I build with care.
            </h1>
          </Reveal>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 md:px-8 pb-24 space-y-28">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <StoryImage aspect="aspect-[3/4]" label="dallas.tx" />
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              This is my story.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              I&apos;m Ibrahim — an information security intern and Computer
              Information Systems &amp; Technology student at UT Dallas. Over
              the last few years I&apos;ve learned what it takes to keep
              systems standing: careful identity management, sharp detection
              engineering, and a willingness to dig into the logs when
              something looks off.
            </p>
          </Reveal>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal
            delay={120}
            className="flex flex-col justify-center gap-5 order-2 md:order-1"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              It started with fixing things.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              My first years in IT were at Roomi Group in Houston, managing
              identity and access for 200+ employees through Azure Active
              Directory. Enforcing RBAC policies and building secure
              provisioning processes taught me that access control is where
              security begins.
            </p>
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <StoryImage aspect="aspect-square" label="houston.tx" />
          </Reveal>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <StoryImage aspect="aspect-[4/3]" label="azure.cloud" />
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              Then I found the cloud.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              At Chief Technology Group I hardened Azure Firewall policies,
              resolved 200+ incidents across Azure and Citrix environments,
              and supported migrations to Azure DevOps. Working with least
              privilege in real client environments showed me how cloud
              security holds up under pressure.
            </p>
          </Reveal>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal
            delay={120}
            className="flex flex-col justify-center gap-5 order-2 md:order-1"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              Now I work in security.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              Today I&apos;m an Information Security Intern at the University
              of Texas System — building SPL detection dashboards, enforcing
              Windows LAPS across 500+ endpoints, and hunting abnormal
              authentication behavior. I also led a 5-person capstone team
              advising DFW Technology on private AI infrastructure, selected
              Top 15 of 6,000+ students at the UTDsolv Expo.
            </p>
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <StoryImage aspect="aspect-[4/3]" label="ut.system" />
          </Reveal>
        </section>

        <section>
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-medium tracking-widest uppercase text-fg-muted">
              Experience
            </p>
            <div className="flex items-center gap-1 p-1 rounded-full border border-border">
              {TRACKS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTrack(item)}
                  className={`px-3 py-1 rounded-full text-[10px] font-medium tracking-widest uppercase transition-colors duration-200 ${
                    track === item
                      ? "bg-fg text-bg"
                      : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="relative flex flex-col pl-5 border-l border-border">
            {visibleExperience.map((item) => (
              <div
                key={item.org}
                className="flex items-start justify-between gap-6 py-5 last:pb-0"
              >
                <div>
                  <p className="text-base font-semibold text-fg">{item.org}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{item.role}</p>
                </div>
                <p className="shrink-0 text-sm text-fg-muted">{item.period}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="mb-8 text-xs font-medium tracking-widest uppercase text-fg-muted">
            Education &amp; Certifications
          </p>
          <div className="relative flex flex-col pl-5 border-l border-border">
            {EDUCATION.map((item) => (
              <div
                key={`${item.org}-${item.detail}`}
                className="flex items-start justify-between gap-6 py-5 last:pb-0"
              >
                <div>
                  <p className="text-base font-semibold text-fg">{item.org}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{item.detail}</p>
                </div>
                <p className="shrink-0 text-sm text-fg-muted">{item.period}</p>
              </div>
            ))}
          </div>
        </section>

        <Reveal>
          <div className="p-8 rounded-2xl border border-border bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-lg font-semibold text-fg mb-1">
                Open to opportunities
              </p>
              <p className="text-sm text-fg-muted">
                Available for internships and full-time roles in information
                security and cloud.
              </p>
            </div>
            <a
              href="mailto:Ibrahim.Hussain@UTDallas.edu"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fg text-bg text-sm font-medium hover:bg-fg/70 transition-all duration-200"
            >
              Get in touch →
            </a>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
