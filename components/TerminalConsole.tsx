"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SandboxAsset } from "@/lib/types";
import { actionLabelForAsset } from "@/lib/profile";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

interface TerminalConsoleProps {
  projectTitle: string;
  problemStatement: string;
  caseStudy: string;
  companyContext: string;
  assets: SandboxAsset[];
}

type TerminalPhase = "idle" | "streaming" | "complete";

interface StreamProgress {
  row: number;
  chars: number;
}

const PROMPT = "hermes@sandbox:~$";

function buildQueue(asset: SandboxAsset): string[] {
  const prelude = [
    `${PROMPT} init --task "${asset.title}"`,
    `[info] type=${asset.type} runnable=${asset.runnable}`,
    `[info] ${asset.description}`,
    `[exec] streaming payload...`,
    "",
  ];
  return [...prelude, ...asset.content.split("\n"), "", `[done] exit 0`];
}

export default function TerminalConsole({
  projectTitle,
  problemStatement,
  caseStudy,
  companyContext,
  assets,
}: TerminalConsoleProps) {
  const [activeAsset, setActiveAsset] = useState<SandboxAsset | null>(null);
  const [progress, setProgress] = useState<StreamProgress>({ row: 0, chars: 0 });
  const [phase, setPhase] = useState<TerminalPhase>("idle");
  const prefersReducedMotion = usePrefersReducedMotion();
  const terminalRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queue = useMemo(
    () => (activeAsset ? buildQueue(activeAsset) : []),
    [activeAsset],
  );

  // Visible output is derived by slicing the source queue, so rows keep stable
  // identities and only the in-progress row changes per tick.
  const visibleLines =
    phase === "idle"
      ? []
      : phase === "complete" || progress.row >= queue.length
        ? queue
        : [
            ...queue.slice(0, progress.row),
            queue[progress.row].slice(0, progress.chars),
          ];

  const scrollToBottom = useCallback(() => {
    const node = terminalRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [progress, phase, scrollToBottom]);

  const clearStream = useCallback(() => {
    if (streamRef.current) {
      clearInterval(streamRef.current);
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearStream;
  }, [clearStream]);

  const runAsset = useCallback(
    (asset: SandboxAsset) => {
      clearStream();
      setActiveAsset(asset);

      const nextQueue = buildQueue(asset);

      if (prefersReducedMotion) {
        // Reduced motion: print the full output at once, no typewriter.
        setProgress({ row: nextQueue.length, chars: 0 });
        setPhase("complete");
        return;
      }

      setProgress({ row: 0, chars: 0 });
      setPhase("streaming");

      let row = 0;
      let chars = 0;

      streamRef.current = setInterval(() => {
        if (row >= nextQueue.length) {
          clearStream();
          setPhase("complete");
          return;
        }

        if (chars < nextQueue[row].length) {
          chars += 1;
        } else {
          row += 1;
          chars = 0;
        }
        setProgress({ row, chars });
      }, 12);
    },
    [clearStream, prefersReducedMotion],
  );

  const skipStream = useCallback(() => {
    clearStream();
    setProgress({ row: queue.length, chars: 0 });
    setPhase("complete");
  }, [clearStream, queue.length]);

  return (
    <section className="animate-fade-in space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-widest uppercase text-fg-muted">
          Interactive Case Study
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-fg tracking-tight">
          {projectTitle}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-fg-muted">
          {problemStatement}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <p className="text-xs font-medium tracking-widest uppercase text-fg-muted">
            Sandbox Actions
          </p>

          <div className="space-y-2 text-xs leading-relaxed text-fg-muted">
            <p>
              <span className="text-blue-500 dark:text-blue-400">
                context&gt;
              </span>{" "}
              {companyContext}
            </p>
            <p>
              <span className="text-blue-500 dark:text-blue-400">
                study&gt;
              </span>{" "}
              {caseStudy}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {assets.length === 0 ? (
              <p className="text-xs text-fg-muted">
                No runnable assets in payload.
              </p>
            ) : (
              assets.map((asset) => {
                const label = actionLabelForAsset(asset.type, asset.title);
                const isActive = activeAsset?.title === asset.title;
                return (
                  <button
                    key={`${asset.type}-${asset.title}`}
                    type="button"
                    onClick={() => runAsset(asset)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors duration-200 ${
                      isActive
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-500 dark:text-blue-400"
                        : "border-border text-fg-muted hover:border-blue-500/30 hover:text-fg"
                    }`}
                  >
                    {label}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="overflow-hidden rounded-2xl bg-[#050505] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 font-mono text-xs text-white/40">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="ml-2">terminal.sandbox</span>
            {phase === "streaming" ? (
              <button
                type="button"
                onClick={skipStream}
                className="ml-auto rounded border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-white/50 transition-colors duration-200 hover:border-white/30 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Skip
              </button>
            ) : null}
          </div>

          <div
            ref={terminalRef}
            className="h-[360px] overflow-y-auto p-4 font-mono text-xs leading-6 text-white/70"
          >
            {visibleLines.length === 0 ? (
              <p className="text-white/40">
                {PROMPT} awaiting task selection...
                <span className="ml-1 inline-block h-4 w-2 animate-blink bg-blue-400/80 align-middle" />
              </p>
            ) : (
              visibleLines.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
            {phase === "streaming" ? (
              <span className="mt-1 inline-block h-4 w-2 animate-blink bg-blue-400/80 align-middle" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
