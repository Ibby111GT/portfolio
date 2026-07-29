"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ALL_CATALOG_ENTRIES,
  FILTERS,
  type CatalogProject,
  type ProjectFilter,
} from "@/lib/projects";

const ACCENT_TEXT = {
  cyan: "text-cyan-600 dark:text-cyan-300",
  lime: "text-lime-600 dark:text-lime-300",
  amber: "text-amber-600 dark:text-amber-300",
  red: "text-red-600 dark:text-red-300",
  violet: "text-violet-600 dark:text-violet-300",
} as const;

const ACCENT_DOT = {
  cyan: "bg-cyan-500 dark:bg-cyan-300",
  lime: "bg-lime-500 dark:bg-lime-300",
  amber: "bg-amber-500 dark:bg-amber-300",
  red: "bg-red-500 dark:bg-red-400",
  violet: "bg-violet-500 dark:bg-violet-300",
} as const;

export default function ProjectCatalog() {
  const [active, setActive] = useState<ProjectFilter | "all">("all");

  const visible =
    active === "all"
      ? ALL_CATALOG_ENTRIES
      : ALL_CATALOG_ENTRIES.filter((project) => project.filter === active);

  return (
    <div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter projects"
      >
        {FILTERS.map((filter) => {
          const selected = active === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActive(filter.id)}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                selected
                  ? "border-fg bg-fg text-bg"
                  : "border-border text-fg-muted hover:border-fg/40 hover:text-fg"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-mono text-xs text-fg-muted" aria-live="polite">
        {visible.length} project{visible.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((project) => (
          <ProjectTile key={project.slug} project={project} />
        ))}
      </div>
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
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${ACCENT_DOT[project.accent]}`}
          />
          {project.category}
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
              ? "Open lab"
              : project.kind === "case"
                ? "Read case study"
                : "Read walkthrough"}{" "}
            -&gt;
          </span>
        </div>
      </div>
    </Link>
  );
}
