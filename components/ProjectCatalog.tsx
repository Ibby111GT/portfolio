"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ALL_CATALOG_ENTRIES,
  type CatalogProject,
  type ProjectKind,
} from "@/lib/projects";

// Two accents only: red for security subjects, blue for data and systems.
const ACCENT_TEXT = {
  blue: "text-blue-700 dark:text-blue-400",
  red: "text-red-700 dark:text-red-400",
} as const;

const ACCENT_DOT = {
  blue: "bg-blue-600 dark:bg-blue-400",
  red: "bg-red-600 dark:bg-red-400",
} as const;

const VIEWS: Array<{ id: "all" | ProjectKind; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "lab", label: "Try a live lab" },
  { id: "tool", label: "Inspect a code project" },
  { id: "case", label: "Read a case study" },
];

const EVIDENCE_LABELS: Record<ProjectKind, string> = {
  lab: "Live browser lab · synthetic data",
  tool: "Open-source tool · CI verified",
  case: "Professional case study · sanitized",
};

export default function ProjectCatalog() {
  const [active, setActive] = useState<ProjectKind | "all">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ALL_CATALOG_ENTRIES.filter((project) => {
      const matchesView = active === "all" || project.kind === active;
      const searchable = [
        project.name,
        project.category,
        project.plain,
        project.tagline,
        project.signal,
        ...project.stack,
      ]
        .join(" ")
        .toLowerCase();
      return matchesView && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [active, query]);

  return (
    <div>
      <div className="grid gap-4 rounded-2xl border border-border bg-surface/30 p-3 lg:grid-cols-[1fr_auto] lg:items-center">
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
            placeholder="Search by project, skill, or outcome"
            className="h-11 w-full rounded-xl border border-border bg-bg pl-10 pr-10 text-sm text-fg outline-none transition-colors placeholder:text-fg-muted/70 focus:border-fg/40"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear project search"
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <X aria-hidden="true" size={15} />
            </button>
          ) : null}
        </label>

        <div
          className="flex max-w-full gap-2 overflow-x-auto scrollbar-none"
          role="group"
          aria-label="Filter projects"
        >
          {VIEWS.map((view) => {
            const selected = active === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActive(view.id)}
                aria-pressed={selected}
                className={`h-11 shrink-0 rounded-full border px-4 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                  selected
                    ? "border-fg bg-fg text-bg"
                    : "border-border bg-bg text-fg-muted hover:border-fg/40 hover:text-fg"
                }`}
              >
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-fg-muted" aria-live="polite">
          {visible.length} project{visible.length === 1 ? "" : "s"}
          {query ? ` matching “${query.trim()}”` : ""}
        </p>
        <p className="text-xs text-fg-muted">
          Every entry is labeled by evidence type.
        </p>
      </div>

      {visible.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => (
            <ProjectTile key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <p className="text-base font-medium text-fg">No matching project.</p>
          <button
            type="button"
            onClick={() => {
              setActive("all");
              setQuery("");
            }}
            className="mt-3 text-sm text-fg-muted underline decoration-border underline-offset-4 transition-colors hover:text-fg"
          >
            Reset the catalog
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectTile({ project }: { project: CatalogProject }) {
  return (
    <Link
      href={project.href}
      className="group flex min-h-[260px] flex-col justify-between rounded-2xl border border-border bg-surface/40 p-6 transition-colors hover:border-fg/25 hover:bg-surface/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[project.accent]}`}
            />
            {project.category}
          </div>
          <span className="rounded-full border border-border bg-bg/70 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-fg-muted">
            {EVIDENCE_LABELS[project.kind]}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg">
          {project.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{project.plain}</p>
      </div>
      <div className="mt-6">
        <div className="flex flex-wrap gap-1.5">
          {project.stack.map((item) => (
            <span
              key={item}
              className="rounded-md border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg-muted"
            >
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="font-mono text-fg-muted">{project.signal}</span>
          <span
            className={`font-medium transition-transform duration-200 group-hover:translate-x-1 ${ACCENT_TEXT[project.accent]}`}
          >
            {project.kind === "lab"
              ? "Operate lab"
              : project.kind === "case"
                ? "Read evidence"
                : "Inspect project"}{" "}
            -&gt;
          </span>
        </div>
      </div>
    </Link>
  );
}
