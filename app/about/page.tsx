"use client";

import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/Reveal";

// Reverse-chronological — the timeline renders in array order.
const EXPERIENCE = [
  {
    org: "Roomi Group Corp",
    role: "Project Manager · AI & automation systems",
    period: "2026–Present",
    track: "OPS & AI",
  },
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
    org: "SQL analytics coursework — UT Dallas Global Career Accelerator",
    detail: "YouTube, Crunchbase, NBA, and Instacart datasets",
    period: "2026",
  },
  {
    org: "Microsoft",
    detail: "Azure Fundamentals (AZ-900)",
    period: "Certified",
  },
];

const TRACKS = ["ALL", "SECURITY", "CLOUD & IT", "OPS & AI"] as const;
type Track = (typeof TRACKS)[number];

const RESUME_PATH = "/resume.pdf";
const RESUME_FILENAME = "Ibrahim_Hussain_Resume.pdf";

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
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
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
        <p className="mt-2 text-sm text-white/65">{detail}</p>

        <ol className="mt-10 space-y-3">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3"
            >
              <span className="font-mono text-[10px] text-white/60">
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

function ResumeCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fg text-bg"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6" />
            <path d="M9 17h6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-fg">Resume</p>
          <p className="mt-0.5 text-sm text-fg-muted">
            One page · PDF
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={RESUME_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg transition-all duration-200 hover:bg-fg/70"
            >
              View resume
            </a>
            <a
              href={RESUME_PATH}
              download={RESUME_FILENAME}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-fg transition-all duration-200 hover:bg-bg"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const storyLink =
  "text-sm font-medium text-fg underline decoration-border underline-offset-4 transition-colors hover:text-fg-muted";

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
              I learned IT on a shop floor.
              <br />
              I learned security in a SOC.
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
                "SQL and data analysis",
              ]}
            />
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              This is my story.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              I&apos;m Ibrahim Hussain, a security and systems engineer from
              Houston. My first IT job started in January 2020, while I was
              still in high school, at Roomi Group Corp — a commercial millwork
              manufacturer with 200+ employees and a shop floor that
              doesn&apos;t stop for a broken login. It taught me the thing
              every job since has confirmed: security isn&apos;t a department.
              It&apos;s whether the right person has the right access at the
              moment they need it, and nobody else does.
            </p>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              Since then I&apos;ve hardened client clouds, built detections in
              a university SOC, led a capstone team advising a city on AI
              infrastructure, and shipped five open-source security tools.
              Today I manage construction projects for the company where I
              started — and I&apos;m building the AI that will help it
              estimate them.
            </p>
            <ResumeCard />
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
              For three and a half years I was the IT desk for 200+ people
              across offices and a production floor: Azure Active Directory,
              role-based access, accounts provisioned on day one and closed on
              the last. Most breaches don&apos;t start with an exploit — they
              start with an account nobody closed. I learned that by being the
              person who closed them.
            </p>
            <Link href="/work/roomi-group" className={storyLink}>
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
              Summer 2024 at Chief Technology Group: enterprise clients on
              Azure and Citrix, 200+ incidents resolved, Azure Firewall
              policies hardened, IAM tightened toward least privilege, and a
              legacy stack moved to Azure DevOps. Every rule I wrote landed on
              someone&apos;s production environment, so I learned to make the
              secure choice and the available one at the same time.
            </p>
            <Link href="/work/chief-technology-group" className={storyLink}>
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
              In 2025 I joined the University of Texas System&apos;s security
              team. I built SPL dashboards that surface login trends and IP
              anomalies, rolled out Windows LAPS across 500+ endpoints so local
              admin passwords rotate themselves, helped deploy Intune policy to
              managed devices, and hunted abnormal authentication in the logs.
            </p>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              In my final semester I led a five-person capstone team advising
              DFW Technology and the City of Richardson on private AI
              infrastructure. We found the version of the project that
              survives Texas grid politics — a 20 MW facility under the 75 MW
              review threshold, powered behind the meter — and placed Top 15
              of 6,000+ students at the UTDsolv Expo.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/work/ut-system-security" className={storyLink}>
                Security work →
              </Link>
              <Link href="/work/private-ai-feasibility" className={storyLink}>
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

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <Reveal>
            <EvidencePanel
              code="AI-01"
              title="Estimating intelligence, in development"
              metric="Blueprint → takeoff"
              detail="Roomi Group Corp · 2026"
              steps={[
                "Read the drawings",
                "Propose the takeoff",
                "Estimator approves",
              ]}
            />
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center gap-5">
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              Now I build the systems.
            </h2>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              I graduated in May 2026 and went back to Roomi Group as a
              Project Manager, running commercial millwork projects from shop
              drawings through installation, with schedules, submittals, and
              subcontractors tracked in Wrike and Procore.
            </p>
            <p className="text-base text-fg-muted leading-relaxed max-w-prose">
              Those projects are also my test bed. I&apos;m building RGC-AI,
              an estimating assistant that reads blueprints with a YOLOv11
              vision model trained on the company&apos;s historic drawings,
              retrieves precedent through a Postgres + pgvector pipeline, and
              hands a proposed takeoff to an estimator who approves or rejects
              every line. Agents propose; people decide. Alongside it:
              automated project-health monitoring on our Wrike workspace, and
              five open-source security tools with 248 automated tests and
              CI on every push.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/work/rgc-ai" className={storyLink}>
                RGC-AI case study →
              </Link>
              <Link href="/projects" className={storyLink}>
                Open-source tools →
              </Link>
              <Link href="/labs" className={storyLink}>
                Browser labs →
              </Link>
            </div>
          </Reveal>
        </section>

        <Reveal>
          <section className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-fg">
              Where this is going.
            </h2>
            <p className="mt-5 text-base text-fg-muted leading-relaxed max-w-prose">
              The through-line is software meeting physical operations — shop
              floors, endpoints, city grids, job sites. I want to keep working
              at that seam: securing the infrastructure people depend on and
              building the systems that run it. Security+ is next. Long term,
              I&apos;m aiming at federal and regulated facilities, where
              cybersecurity and construction are the same problem.
            </p>
          </section>
        </Reveal>

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
                key={`${item.org}-${item.period}`}
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
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:Ibrahim.Hussain@UTDallas.edu"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fg text-bg text-sm font-medium hover:bg-fg/70 transition-all duration-200"
              >
                Get in touch →
              </a>
              <a
                href={RESUME_PATH}
                download={RESUME_FILENAME}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-fg text-sm font-medium hover:bg-bg transition-all duration-200"
              >
                Download resume
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
