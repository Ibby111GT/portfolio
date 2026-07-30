export interface DetailNavigatorItem {
  href: string;
  label: string;
}

interface DetailNavigatorProps {
  items: DetailNavigatorItem[];
  readingTime: number | string;
  label?: string;
  accent?: "blue" | "red";
  tone?: "default" | "dark";
  className?: string;
}

const ACCENT_STYLES = {
  blue: {
    dot: "bg-accent",
    link: "hover:border-accent/50 hover:bg-accent-soft",
  },
  red: {
    dot: "bg-alert",
    link: "hover:border-alert/50 hover:bg-alert-soft",
  },
} as const;

/**
 * A compact on-page table of contents for long-form project detail pages.
 *
 * Pass section fragment links in reading order. A numeric reading time is
 * formatted automatically; a string can be used for custom copy.
 */
export default function DetailNavigator({
  items,
  readingTime,
  label = "On this page",
  accent = "blue",
  tone = "default",
  className = "",
}: DetailNavigatorProps) {
  const styles = ACCENT_STYLES[accent];
  const readingTimeLabel =
    typeof readingTime === "number" ? `${readingTime} min read` : readingTime;

  return (
    <nav
      aria-label={label}
      className={`rounded-2xl border p-3 ${
        tone === "dark"
          ? "border-white/15 bg-white/[0.025]"
          : "border-border bg-surface/30"
      } ${className}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-h-11 shrink-0 items-center gap-3 px-2">
          <span
            aria-hidden="true"
            className={`h-2 w-2 rounded-full ${styles.dot}`}
          />
          <div>
            <p
              className={`text-sm font-medium ${
                tone === "dark" ? "text-white" : "text-fg"
              }`}
            >
              {label}
            </p>
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                tone === "dark" ? "text-white/45" : "text-fg-muted"
              }`}
            >
              {readingTimeLabel}
            </p>
          </div>
        </div>

        <ol className="flex max-w-full gap-2 overflow-x-auto scrollbar-none">
          {items.map((item, index) => (
            <li key={item.href} className="shrink-0">
              <a
                href={item.href}
                className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  tone === "dark"
                    ? "border-white/10 bg-white/[0.055] text-white/65 hover:text-white focus-visible:outline-white"
                    : "border-border bg-bg text-fg-muted hover:text-fg focus-visible:outline-fg"
                } ${styles.link}`}
              >
                <span
                  aria-hidden="true"
                  className={`font-mono text-[9px] ${
                    tone === "dark" ? "text-white/35" : "text-fg-muted/70"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
