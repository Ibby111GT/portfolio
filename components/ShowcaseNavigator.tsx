"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Reveal from "@/components/Reveal";

type TrackId = "defend" | "data" | "infrastructure";

interface ShowcaseTrack {
  id: TrackId;
  number: string;
  label: string;
  title: string;
  description: string;
  proof: string;
  time: string;
  primary: {
    href: string;
    label: string;
  };
  related: {
    href: string;
    label: string;
  }[];
  skills: string[];
  flow: string[];
  tone: "red" | "blue";
}

const TRACKS: ShowcaseTrack[] = [
  {
    id: "defend",
    number: "01",
    label: "Investigate an attack",
    title: "Find the intruder before the trail goes cold.",
    description:
      "Work through a realistic identity breach hidden inside ordinary employee activity. Select the evidence, connect the attacker’s steps, and produce a defensible incident timeline.",
    proof:
      "A scored investigation built from 12 correlated identity, endpoint, and cloud events.",
    time: "5–8 minute live lab",
    primary: {
      href: "/labs/threat-hunt",
      label: "Launch SignalTrace",
    },
    related: [
      { href: "/projects/threatlens", label: "Score an IOC with ThreatLens" },
      { href: "/projects/logsentry", label: "Triage logs with LogSentry" },
    ],
    skills: [
      "Threat hunting",
      "MITRE ATT&CK reasoning",
      "Evidence communication",
    ],
    flow: ["Initial access", "Endpoint execution", "Cloud persistence", "Case conclusion"],
    tone: "red",
  },
  {
    id: "data",
    number: "02",
    label: "Operate critical data",
    title: "Run a pipeline, break it, and recover safely.",
    description:
      "Move raw records through ingestion, storage, transformation, analytics, and governance. Then inject a schema failure and watch the platform quarantine bad data instead of publishing a wrong answer.",
    proof:
      "A simulated 1.28-million-event pipeline run across five observable data layers.",
    time: "4–6 minute live lab",
    primary: {
      href: "/labs/data-systems/cybersecurity",
      label: "Run SentinelStream",
    },
    related: [
      { href: "/labs/data-systems/finance", label: "Reconcile finance data" },
      { href: "/labs/data-systems/healthcare", label: "Govern healthcare data" },
    ],
    skills: [
      "Data contracts",
      "Pipeline observability",
      "Security governance",
    ],
    flow: ["Ingest", "Store", "Transform", "Serve", "Govern"],
    tone: "blue",
  },
  {
    id: "infrastructure",
    number: "03",
    label: "Design resilient systems",
    title: "Make an infrastructure decision under real constraints.",
    description:
      "Explore how power, regulation, capacity, identity, and compliance change a private AI facility recommendation. The model exposes the trade-offs instead of hiding them in a slide deck.",
    proof:
      "A 20 MW pilot tested against a 75 MW regulatory threshold and seven tenant scenarios.",
    time: "6–10 minute case study",
    primary: {
      href: "/work/private-ai-feasibility",
      label: "Open the feasibility study",
    },
    related: [
      {
        href: "/work/chief-technology-group",
        label: "See client cloud operations in practice",
      },
      {
        href: "/work/roomi-group",
        label: "Walk the identity lifecycle design",
      },
    ],
    skills: [
      "Systems analysis",
      "Capacity planning",
      "Identity and compliance",
    ],
    flow: ["Constraint", "Alternatives", "Operating model", "Control plane"],
    tone: "blue",
  },
];

export default function ShowcaseNavigator() {
  const [activeId, setActiveId] = useState<TrackId>("defend");
  const active = TRACKS.find((track) => track.id === activeId) ?? TRACKS[0];
  const isRed = active.tone === "red";
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % TRACKS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + TRACKS.length) % TRACKS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TRACKS.length - 1;
    }
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    setActiveId(TRACKS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section
      id="start"
      className="relative border-b border-border px-6 py-28 md:px-8 md:py-36"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-10 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Start with a problem
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Pick a challenge. See the proof.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted">
            Every path below leads to something you can operate, inspect, and
            understand without a specialist background.
          </p>
        </Reveal>

        <div
          className="grid gap-2 rounded-2xl border border-border bg-surface/60 p-2 md:grid-cols-3"
          role="tablist"
          aria-label="Choose a portfolio path"
        >
          {TRACKS.map((track, index) => {
            const selected = track.id === active.id;
            const selectedTone =
              track.tone === "red"
                ? "border-alert/50 bg-alert-soft text-fg"
                : "border-accent/50 bg-accent-soft text-fg";

            return (
              <button
                key={track.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                id={`showcase-tab-${track.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="showcase-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(track.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`flex min-h-16 items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
                  selected
                    ? selectedTone
                    : "border-transparent text-fg-muted hover:border-border hover:bg-bg/60 hover:text-fg"
                }`}
              >
                <span className="font-mono text-xs tracking-[0.18em] opacity-70">
                  {track.number}
                </span>
                <span className="text-sm font-medium">{track.label}</span>
              </button>
            );
          })}
        </div>

        <div
          id="showcase-panel"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`showcase-tab-${active.id}`}
          className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-[#080808] text-white"
        >
          <div
            className={`pointer-events-none absolute inset-0 ${
              isRed
                ? "bg-[radial-gradient(circle_at_18%_20%,rgba(220,38,38,0.22),transparent_42%)]"
                : "bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.22),transparent_42%)]"
            }`}
          />
          <div className="relative grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 md:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRed ? "bg-alert" : "bg-accent"
                  }`}
                />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/55">
                  {active.time}
                </span>
              </div>
              <h3 className="mt-6 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                {active.title}
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
                {active.description}
              </p>

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                  What proves it
                </p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {active.proof}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={active.primary.href}
                  className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 ${
                    isRed ? "bg-alert" : "bg-accent"
                  }`}
                >
                  {active.primary.label} <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Browse all work
                </Link>
              </div>
            </div>

            <aside className="border-t border-white/10 bg-black/20 p-7 md:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Competency chain
              </p>
              <ol className="mt-6 space-y-3">
                {active.flow.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3"
                  >
                    <span className="font-mono text-[10px] text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-white/75">{step}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-9 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Skills demonstrated
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {active.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/65"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-9 border-t border-white/10 pt-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                  Go deeper
                </p>
                <div className="mt-4 space-y-3">
                  {active.related.map((project) => (
                    <Link
                      key={project.href}
                      href={project.href}
                      className="flex items-center justify-between gap-4 text-sm text-white/65 transition-colors hover:text-white"
                    >
                      <span>{project.label}</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
