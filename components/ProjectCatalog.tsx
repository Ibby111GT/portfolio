"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ALL_CATALOG_ENTRIES,
  type CatalogProject,
  type ProjectKind,
} from "@/lib/projects";

const ACCENT_TEXT = {
  blue: "text-blue-700 dark:text-blue-400",
  red: "text-red-700 dark:text-red-400",
} as const;

const ACCENT_DOT = {
  blue: "bg-blue-600 dark:bg-blue-400",
  red: "bg-red-600 dark:bg-red-400",
} as const;

const GROUPS: Array<{
  kind: ProjectKind;
  id: string;
  number: string;
  title: string;
  short: string;
  description: string;
  cta: string;
}> = [
  {
    kind: "case",
    id: "professional-work",
    number: "01",
    title: "Professional work",
    short: "See real-world work",
    description:
      "Work delivered inside real organizations. Confidential details are removed; individual scope and outcomes are stated directly.",
    cta: "Read case study",
  },
  {
    kind: "tool",
    id: "open-source",
    number: "02",
    title: "Open-source software",
    short: "Inspect working code",
    description:
      "Runnable repositories with local demos, automated tests, source code, and CI evidence.",
    cta: "View source & walkthrough",
  },
  {
    kind: "lab",
    id: "interactive-labs",
    number: "03",
    title: "Interactive labs",
    short: "Try something now",
    description:
      "Browser-based simulations built with synthetic data. No account or installation is required.",
    cta: "Open lab",
  },
];

export default function ProjectCatalog() {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return ALL_CATALOG_ENTRIES;

    return ALL_CATALOG_ENTRIES.filter((project) =>
      [
        project.name,
        project.slug,
        project.category,
        project.plain,
        project.tagline,
        project.signal,
        ...project.stack,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  return (
    <div>
      <nav
        aria-label="Project collections"
        className="grid gap-3 md:grid-cols-3"
      >
        {GROUPS.map((group) => {
          // Counts track the active search so a filtered-out section never
          // leaves behind a card advertising entries its anchor can't reach.
          const count = visible.filter(
            (project) => project.kind === group.kind,
          ).length;
          if (!count) return null;
          return (
            <a
              key={group.kind}
              href={`#${group.id}`}
              className="group min-h-40 rounded-2xl border border-border bg-surface/35 p-5 transition-colors hover:border-fg/25 hover:bg-surface/65"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                  Path {group.number}
                </span>
                <span className="font-mono text-[10px] text-fg-muted">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>
              <p className="mt-7 text-xl font-semibold tracking-tight text-fg">
                {group.short}
              </p>
              <p className="mt-2 text-xs leading-5 text-fg-muted">
                {group.title} <span aria-hidden="true">↓</span>
              </p>
            </a>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-border bg-surface/30 p-3">
        <label className="relative block">
          <span className="sr-only">Search projects</span>
          <Search
            aria-hidden="true"
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search all ${ALL_CATALOG_ENTRIES.length} entries by project, skill, or outcome`}
            className="h-12 w-full rounded-xl border border-border bg-bg pl-10 pr-10 text-sm text-fg outline-none transition-colors placeholder:text-fg-muted/70 focus:border-fg/40"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear project search"
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <X aria-hidden="true" size={15} />
            </button>
          ) : null}
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-fg-muted" aria-live="polite">
          {visible.length} entr{visible.length === 1 ? "y" : "ies"}
          {query ? ` matching “${query.trim()}”` : ""}
        </p>
        <p className="text-xs text-fg-muted">
          Simple explanation first · technical evidence inside
        </p>
      </div>

      {visible.length ? (
        <div className="mt-12 space-y-20">
          {GROUPS.map((group) => {
            const projects = visible.filter(
              (project) => project.kind === group.kind,
            );
            if (!projects.length) return null;

            return (
              <section
                key={group.kind}
                id={group.id}
                className="scroll-mt-28"
              >
                <div className="grid gap-4 border-t border-border pt-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
                      {group.number} · {projects.length}{" "}
                      {projects.length === 1 ? "entry" : "entries"}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
                      {group.title}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-7 text-fg-muted md:justify-self-end">
                    {group.description}
                  </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {projects.map((project) => (
                    <ProjectTile
                      key={project.slug}
                      project={project}
                      typeLabel={group.title}
                      cta={group.cta}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-base font-medium text-fg">No matching entry.</p>
          <p className="mt-2 text-sm text-fg-muted">
            Try a project name, technology, or outcome such as “Python,”
            “identity,” or “healthcare.”
          </p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-4 min-h-11 text-sm text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectTile({
  project,
  typeLabel,
  cta,
}: {
  project: CatalogProject;
  typeLabel: string;
  cta: string;
}) {
  return (
    <Link
      href={project.href}
      className="group flex min-h-[280px] flex-col justify-between rounded-2xl border border-border bg-surface/40 p-6 transition-colors hover:border-fg/25 hover:bg-surface/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full border border-border bg-bg/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-muted">
            {typeLabel}
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[project.accent]}`}
            />
            {project.category}
          </div>
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight text-fg">
          {project.name}
        </h3>
        <p className="mt-3 text-base leading-7 text-fg-muted">
          {project.tagline}
        </p>
      </div>

      <div className="mt-8 border-t border-border pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted">
          Proof · {project.signal}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-xs text-fg-muted">
            Plain guide + technical detail
          </span>
          <span
            className={`text-right font-medium transition-transform duration-200 group-hover:translate-x-1 ${ACCENT_TEXT[project.accent]}`}
          >
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  );
}
