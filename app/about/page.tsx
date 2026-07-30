"use client";

import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/Reveal";

// Reverse-chronological — the timeline renders in array order.
const EXPERIENCE = [
  {
    org: "DFW Technology — UT Dallas Capstone",
    role: "Project Lead & Systems Analyst",
    period: "2026",
    track: "SECURITY",
  },
  {
    org: "University of Texas System",
    role: "Information Security Intern",
    period: "2025",
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
    period: "Certified",
  },
];

const TRACKS = ["ALL", "SECURITY", "CLOUD & IT"] as const;
type Track = (typeof TRACKS)[number];

function EvidencePanel({
  code,
  title,
  metric,
  detail,
  steps,
  tone = "blue",
}: {
  code: string;
  title: string;
  metric: string;
  detail: string;
  steps: string[];
  tone?: "blue" | "red";
}) {
  const red = tone === "red";

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-3xl border border-border bg-[#080808] p-7 text-white md:p-9">
      <div
        className={`pointer-events-none absolute inset-0 ${
          red
            ? "bg-[radial-gradient(circle_at_18%_8%,rgba(220,38,38,0.24),transparent_45%)]"
            : "bg-[radial-gradient(circle_at_18%_8%,rgba(37,99,235,0.24),transparent_45%)]"
        }`}
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Evidence record · {code}
          </span>
          <span
            className={`h-2 w-2 rounded-full ${
              red ? "bg-alert" : "bg-accent"
            }`}
          />
        </div>
        <p className="mt-8 text-sm font-medium text-white/60">{title}</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {metric}
        </p>
        <p className="mt-2 text-sm text-white/45">{detail}</p>

        <ol className="mt-10 space-y-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3"
            >
              <span className="font-mono text-[9px] text-white/30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-white/65">{step}</span>
            </li>
          ))}
        </ol>
      </div>
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
            <EvidencePanel
              code="EDU-01"
              title="Systems, security, and data"
              metric="B.S. · CIS&T"
              detail="The University of Texas at Dallas · May 2026"
              steps={[
                "Information security",
                "Cloud and identity",
                "Systems analysis",
              ]}
            />
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              This is my story.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              I&apos;m Ibrahim — a security, cloud, and systems engineer shaped
              by operational work rather than theory alone. My work spans
              identity administration, detection engineering, cloud
              hardening, data systems, and the client-facing analysis needed
              to turn a technical recommendation into a decision.
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
            <Link
              href="/work/roomi-group"
              className="text-sm font-medium text-fg underline decoration-border underline-offset-4 transition-colors hover:text-fg-muted"
            >
              Read the identity lifecycle case study →
            </Link>
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <EvidencePanel
              code="IAM-01"
              title="Identity lifecycle ownership"
              metric="200+ identities"
              detail="Roomi Group Corp · 2020–2023"
              steps={["Provision access", "Adjust by role", "Revoke on exit"]}
              tone="red"
            />
          </Reveal>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <EvidencePanel
              code="CLD-02"
              title="Client cloud operations"
              metric="200+ incidents"
              detail="Azure and Citrix environments · 2024"
              steps={["Harden traffic", "Right-size access", "Restore service"]}
            />
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
            <Link
              href="/work/chief-technology-group"
              className="text-sm font-medium text-fg underline decoration-border underline-offset-4 transition-colors hover:text-fg-muted"
            >
              Read the cloud engineering case study →
            </Link>
          </Reveal>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal
            delay={120}
            className="flex flex-col justify-center gap-5 order-2 md:order-1"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              Security brought the work together.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              At the University of Texas System, I built SPL detection
              dashboards, enforced Windows LAPS across 500+ endpoints, and
              investigated abnormal authentication behavior. I also led a
              five-person capstone team evaluating a sub-threshold private AI
              facility for DFW Technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/work/ut-system-security"
                className="text-sm font-medium text-fg underline decoration-border underline-offset-4 transition-colors hover:text-fg-muted"
              >
                Security work →
              </Link>
              <Link
                href="/work/private-ai-feasibility"
                className="text-sm font-medium text-fg underline decoration-border underline-offset-4 transition-colors hover:text-fg-muted"
              >
                Feasibility study →
              </Link>
            </div>
          </Reveal>
          <Reveal className="order-1 md:order-2">
            <EvidencePanel
              code="SEC-03"
              title="Detection and credential hardening"
              metric="500+ endpoints"
              detail="University of Texas System · 2025"
              steps={["Detect anomalies", "Triage evidence", "Rotate credentials"]}
              tone="red"
            />
          </Reveal>
        </section>

        <section>
          <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-medium tracking-widest uppercase text-fg-muted">
              Experience
            </p>
            <div
              role="group"
              aria-label="Filter experience by track"
              className="flex items-center gap-1 p-1 rounded-full border border-border"
            >
              {TRACKS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTrack(item)}
                  aria-pressed={track === item}
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
                Available for security, cloud, identity, and IT engineering
                opportunities.
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
