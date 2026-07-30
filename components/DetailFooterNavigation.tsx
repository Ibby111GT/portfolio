import Link from "next/link";
import {
  ALL_CATALOG_ENTRIES,
  type ProjectKind,
} from "@/lib/projects";

interface DetailFooterNavigationProps {
  currentSlug: string;
  collectionHref?: string;
  collectionLabel?: string;
  className?: string;
}

const NEXT_LABELS: Record<ProjectKind, string> = {
  lab: "Next live lab",
  tool: "Next code project",
  case: "Next case study",
};

const ACCENT_STYLES = {
  blue: {
    dot: "bg-accent",
    card: "hover:border-accent/50 hover:bg-accent-soft",
    label: "text-accent",
  },
  red: {
    dot: "bg-alert",
    card: "hover:border-alert/50 hover:bg-alert-soft",
    label: "text-alert",
  },
} as const;

/**
 * A registry-driven footer rail for project detail pages.
 *
 * The next item is selected from the current item's evidence type (lab, tool,
 * or case study) and stops at the end of that collection — the last entry
 * shows a full-width "collection complete" card, matching the creative
 * shell's contract, instead of silently wrapping to the first item.
 */
export default function DetailFooterNavigation({
  currentSlug,
  collectionHref = "/projects",
  collectionLabel = "Back to project collection",
  className = "",
}: DetailFooterNavigationProps) {
  const current = ALL_CATALOG_ENTRIES.find(
    (project) => project.slug === currentSlug,
  );
  const siblings = current
    ? ALL_CATALOG_ENTRIES.filter((project) => project.kind === current.kind)
    : [];
  const currentIndex = siblings.findIndex(
    (project) => project.slug === currentSlug,
  );
  const next =
    currentIndex >= 0 && currentIndex < siblings.length - 1
      ? siblings[currentIndex + 1]
      : undefined;
  const nextStyles = next ? ACCENT_STYLES[next.accent] : undefined;

  return (
    <nav
      aria-label="Continue exploring"
      className={`grid gap-3 border-t border-border pt-6 sm:grid-cols-2 ${className}`}
    >
      <Link
        href={collectionHref}
        className={`group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-border bg-surface/30 p-5 transition-colors hover:border-fg/30 hover:bg-surface/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
          next ? "" : "sm:col-span-2"
        }`}
      >
        <span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
            {next ? "Collection" : "Collection complete"}
          </span>
          <span className="mt-1 block text-base font-semibold text-fg">
            {collectionLabel}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="text-lg text-fg-muted transition-transform group-hover:-translate-x-1"
        >
          &larr;
        </span>
      </Link>

      {next && current && nextStyles ? (
        <Link
          href={next.href}
          className={`group flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-border bg-surface/30 p-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${nextStyles.card}`}
        >
          <span className="min-w-0">
            <span
              className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] ${nextStyles.label}`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${nextStyles.dot}`}
              />
              {NEXT_LABELS[current.kind]}
            </span>
            <span className="mt-1 block text-base font-semibold text-fg">
              {next.name}
            </span>
            <span className="mt-1 block truncate text-xs text-fg-muted">
              {next.signal}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="shrink-0 text-lg text-fg-muted transition-transform group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
