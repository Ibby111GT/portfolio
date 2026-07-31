"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { POSTERS } from "@/components/creative/posterMap";
import {
  CREATIVE_PROJECTS,
  type CreativeGroup,
  type CreativeProject,
} from "@/lib/creativeProjects";

const COLLECTIONS: Array<{
  group: CreativeGroup;
  id: string;
  number: string;
  title: string;
  description: string;
}> = [
  {
    group: "Design & fabrication",
    id: "design",
    number: "01",
    title: "Design & fabrication",
    description:
      "Cabinetry, architectural panels, wardrobes, wooden products, and an automotive concept—each explored as a system that must fit, assemble, and communicate clearly.",
  },
  {
    group: "Playable worlds",
    id: "playable",
    number: "02",
    title: "Playable worlds",
    description:
      "Small indie-style systems you can inhabit: run a neighborhood, drive a circuit, finish an RPG quest, direct a blocky character rig, or escape a first-person maze.",
  },
  {
    group: "Interactive simulations",
    id: "simulations",
    number: "03",
    title: "Interactive simulations",
    description:
      "Playable interfaces for route planning, security operations, and clean-energy balancing. Change the inputs and watch the system respond.",
  },
  {
    group: "Generative systems",
    id: "generative",
    number: "04",
    title: "Generative systems",
    description:
      "Living algorithms, ecosystems, neural behavior, and engineering studies shaped by simple rules, time, and your input. Every result is created in the browser.",
  },
];

function CreativePreview({
  project,
  priority = false,
}: {
  project: CreativeProject;
  priority?: boolean;
}) {
  if (project.image === null) {
    // Every imageless project must have a POSTERS entry — enforced by
    // tests/catalog.test.ts, so an unknown slug can only mean a failing test.
    const Poster = POSTERS[project.slug];
    return Poster ? <Poster /> : null;
  }

  return (
    <Image
      src={project.image}
      alt=""
      fill
      priority={priority}
      sizes="(min-width: 1024px) 50vw, 100vw"
      className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
    />
  );
}

export default function CreativePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_20%_0%,rgba(37,99,235,0.14),transparent_38%),radial-gradient(circle_at_82%_12%,rgba(220,38,38,0.12),transparent_36%)]" />

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-36 md:px-8 md:pb-24 md:pt-44">
        <Reveal blur>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-fg-muted">
            {CREATIVE_PROJECTS.length} interactive prototypes
          </p>
          <h1 className="mt-4 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.045em] text-fg md:text-8xl">
            Four collections.
            <br />
            Systems you can play.
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-7 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            Build, race, explore, animate, or study a living system. Every
            project starts with a simple guide, then opens into its design
            decisions, architecture, evidence, and limits.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <nav
            aria-label="Creative collections"
            className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          >
            {COLLECTIONS.map((collection) => {
              const count = CREATIVE_PROJECTS.filter(
                (project) => project.group === collection.group,
              ).length;
              return (
                <a
                  key={collection.id}
                  href={`#${collection.id}`}
                  className="group min-h-36 rounded-2xl border border-border bg-surface/45 p-5 transition-colors hover:border-fg/25 hover:bg-surface/75"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                      Collection {collection.number}
                    </span>
                    <span className="font-mono text-[10px] text-fg-muted">
                      {count} projects
                    </span>
                  </div>
                  <p className="mt-7 text-lg font-semibold tracking-tight text-fg">
                    {collection.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-fg-muted">
                    Jump to collection <span aria-hidden="true">↓</span>
                  </p>
                </a>
              );
            })}
          </nav>
        </Reveal>
      </section>

      {COLLECTIONS.map((collection, collectionIndex) => {
        const projects = CREATIVE_PROJECTS.filter(
          (project) => project.group === collection.group,
        );
        return (
          <section
            key={collection.id}
            id={collection.id}
            className="relative mx-auto max-w-7xl scroll-mt-28 px-6 pb-28 md:px-8 md:pb-36"
          >
            <Reveal className="border-t border-border pt-10">
              <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fg-muted">
                    {collection.number} · {projects.length} projects
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg md:text-5xl">
                    {collection.title}
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-fg-muted md:justify-self-end">
                  {collection.description}
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {projects.map((project, index) => {
                const featured = projects.length > 2 && index === 0;
                return (
                  <Reveal
                    key={project.slug}
                    delay={index * 60}
                    className={featured ? "lg:col-span-2" : ""}
                  >
                    <Link
                      href={`/creative/${project.slug}`}
                      prefetch={false}
                      className={`group relative block overflow-hidden rounded-3xl border border-border bg-[#080808] ${
                        featured
                          ? "min-h-[620px] md:min-h-[660px]"
                          : "min-h-[530px] md:min-h-[560px]"
                      }`}
                    >
                      <CreativePreview
                        project={project}
                        priority={collectionIndex === 0 && index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              project.accent === "red"
                                ? "bg-alert"
                                : "bg-accent"
                            }`}
                          />
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                            {project.category} · Interactive prototype
                          </span>
                        </div>
                        <h3
                          className={`mt-4 font-semibold tracking-tight text-white ${
                            featured
                              ? "text-4xl md:text-6xl"
                              : "text-3xl md:text-4xl"
                          }`}
                        >
                          {project.title}
                        </h3>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 md:text-base">
                          {project.description}
                        </p>
                        <p className="mt-4 max-w-xl text-xs leading-5 text-white/65">
                          <span className="font-semibold text-white/90">
                            What this is for:
                          </span>{" "}
                          {project.purpose}
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5">
                          <p className="max-w-xl text-xs leading-5 text-white/50">
                            <span className="font-semibold text-white/75">
                              Try:
                            </span>{" "}
                            {project.interaction}
                          </p>
                          <span className="text-sm font-medium text-white transition-transform group-hover:translate-x-1">
                            Open interactive →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
