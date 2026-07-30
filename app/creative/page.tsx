"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Reveal from "@/components/Reveal";
import SignalBloomPoster from "@/components/creative/SignalBloomPoster";
import {
  LumenCityPoster,
  SentinelPoster,
  VerdantPoster,
} from "@/components/creative/GenerativePosters";
import {
  CREATIVE_PROJECTS,
  type CreativeGroup,
  type CreativeProject,
} from "@/lib/creativeProjects";

const FILTERS = [
  "All",
  "Spatial & fabrication",
  "Automotive",
  "Simulation & data",
  "Generative art",
] as const;

type Filter = (typeof FILTERS)[number];

function CreativePreview({
  project,
  priority = false,
}: {
  project: CreativeProject;
  priority?: boolean;
}) {
  if (project.image === null) {
    switch (project.slug) {
      case "sentinel-observatory":
        return <SentinelPoster />;
      case "verdant":
        return <VerdantPoster />;
      case "lumen-city":
        return <LumenCityPoster />;
      default:
        return <SignalBloomPoster />;
    }
  }
  return (
    <Image
      src={project.image}
      alt=""
      fill
      priority={priority}
      sizes="(min-width: 1024px) 50vw, 100vw"
      className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
    />
  );
}

export default function CreativePage() {
  const [filter, setFilter] = useState<Filter>("All");

  const visible =
    filter === "All"
      ? CREATIVE_PROJECTS
      : CREATIVE_PROJECTS.filter(
          (project) => project.group === (filter as CreativeGroup),
        );

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.14),transparent_38%),radial-gradient(circle_at_82%_12%,rgba(220,38,38,0.12),transparent_36%)]" />

      <section className="relative mx-auto max-w-7xl px-6 pb-14 pt-36 md:px-8 md:pb-20 md:pt-44">
        <Reveal blur>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-fg-muted">
            Ten playable systems
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.045em] text-fg md:text-8xl">
            Ideas you can operate,
            <br />
            not just observe.
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-7 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            Each study turns a complex system — from millwork construction and
            automotive form to threat operations, ecology, and energy — into a
            working interface you can change, test, and understand. The
            blueprint projects share one interactive 3D construction-review
            system.
          </p>
        </Reveal>

        <Reveal delay={220}>
          <div
            className="mt-10 flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface/50 p-1"
            role="group"
            aria-label="Filter creative projects"
          >
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
                  filter === item
                    ? "bg-fg text-bg"
                    : "text-fg-muted hover:text-fg"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-5 px-6 pb-32 md:px-8 lg:grid-cols-2">
        {visible.map((project, index) => (
          <Reveal
            key={project.slug}
            delay={index * 80}
            className={index === 0 && filter === "All" ? "lg:col-span-2" : ""}
          >
            <Link
              href={`/creative/${project.slug}`}
              prefetch={false}
              className={`group relative block overflow-hidden rounded-3xl border border-border bg-[#080808] ${
                index === 0 && filter === "All"
                  ? "min-h-[580px] md:min-h-[680px]"
                  : "min-h-[520px]"
              }`}
            >
              <CreativePreview
                project={project}
                priority={index === 0 && filter === "All"}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-9">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      project.accent === "red" ? "bg-alert" : "bg-accent"
                    }`}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                    {project.number} · {project.category} · Live prototype
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  {project.title}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 md:text-base">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.capabilities.slice(0, 3).map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <p className="text-xs text-white/50">{project.interaction}</p>
                  <span className="text-sm font-medium text-white transition-transform group-hover:translate-x-1">
                    Enter project →
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
