import type { CaseDiagram as Diagram } from "@/lib/caseStudies";

/**
 * Replaces what used to be an empty gradient panel labelled "<slug>.overview".
 * Each case study now renders an actual schematic of the system it describes:
 * a left-to-right flow of stages, with the one fact that matters called out.
 */
export default function CaseDiagram({ diagram }: { diagram: Diagram }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-surface/40 shadow-[0_32px_80px_rgba(0,0,0,0.10)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
      <div className="border-b border-border px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
          {diagram.caption}
        </p>
      </div>

      <div className="p-5 md:p-7">
        <ol className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
          {diagram.stages.map((stage, index) => (
            <li key={stage.label} className="flex min-w-0 flex-1 items-stretch">
              <div
                className={`min-w-0 flex-1 rounded-xl border p-4 ${
                  stage.tone === "alert"
                    ? "border-alert/40 bg-alert-soft"
                    : stage.tone === "accent"
                      ? "border-accent/40 bg-accent-soft"
                      : "border-border bg-bg/60"
                }`}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-fg-muted">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-medium leading-5 text-fg">
                  {stage.label}
                </p>
                {stage.detail ? (
                  <p className="mt-1.5 text-xs leading-5 text-fg-muted">
                    {stage.detail}
                  </p>
                ) : null}
              </div>

              {index < diagram.stages.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="flex shrink-0 items-center justify-center px-1 text-fg-muted md:px-2"
                >
                  <span className="md:hidden">↓</span>
                  <span className="hidden md:inline">→</span>
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        {diagram.callout ? (
          <p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-fg-muted">
            <span className="font-medium text-fg">{diagram.callout.label}:</span>{" "}
            {diagram.callout.body}
          </p>
        ) : null}
      </div>
    </figure>
  );
}
