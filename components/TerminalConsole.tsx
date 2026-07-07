"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SandboxAsset } from "@/lib/types";
import { actionLabelForAsset } from "@/lib/profile";

interface TerminalConsoleProps {
  projectTitle: string;
  problemStatement: string;
  caseStudy: string;
  companyContext: string;
  assets: SandboxAsset[];
}

type TerminalPhase = "idle" | "streaming" | "complete";

const PROMPT = "hermes@sandbox:~$";

export default function TerminalConsole({
  projectTitle,
  problemStatement,
  caseStudy,
  companyContext,
  assets,
}: TerminalConsoleProps) {
  const [activeAsset, setActiveAsset] = useState<SandboxAsset | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<TerminalPhase>("idle");
  const terminalRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    const node = terminalRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, phase, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }
    };
  }, []);

  const runAsset = useCallback(
    (asset: SandboxAsset) => {
      if (streamRef.current) {
        clearInterval(streamRef.current);
      }

      setActiveAsset(asset);
      setPhase("streaming");

      const prelude = [
        `${PROMPT} init --task "${asset.title}"`,
        `[info] type=${asset.type} runnable=${asset.runnable}`,
        `[info] ${asset.description}`,
        `[exec] streaming payload...`,
        "",
      ];

      const contentLines = asset.content.split("\n");
      const queue = [...prelude, ...contentLines, "", `[done] exit 0`];

      setLines([]);

      let index = 0;
      let charIndex = 0;
      let currentLine = "";

      streamRef.current = setInterval(() => {
        if (index >= queue.length) {
          if (streamRef.current) {
            clearInterval(streamRef.current);
          }
          setPhase("complete");
          return;
        }

        const target = queue[index];

        if (charIndex < target.length) {
          currentLine += target[charIndex];
          charIndex += 1;
          setLines((prev) => {
            const next = [...prev];
            next[index] = currentLine;
            return next;
          });
        } else {
          index += 1;
          charIndex = 0;
          currentLine = "";
          if (index < queue.length) {
            setLines((prev) => [...prev, ""]);
          }
        }
      }, 12);
    },
    [],
  );

  return (
    <section className="animate-fade-in mt-12 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          interactive_case_study
        </p>
        <h2 className="text-xl text-white">{projectTitle}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-dim">
          {problemStatement}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            sandbox_actions
          </p>

          <div className="space-y-2 text-xs leading-relaxed text-ink-dim">
            <p>
              <span className="text-accent">context&gt;</span> {companyContext}
            </p>
            <p>
              <span className="text-accent">study&gt;</span> {caseStudy}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {assets.length === 0 ? (
              <p className="text-xs text-muted">No runnable assets in payload.</p>
            ) : (
              assets.map((asset) => {
                const label = actionLabelForAsset(asset.type, asset.title);
                const isActive = activeAsset?.title === asset.title;
                return (
                  <button
                    key={`${asset.type}-${asset.title}`}
                    type="button"
                    onClick={() => runAsset(asset)}
                    className={`w-full rounded border px-3 py-2 text-left text-xs transition-soft ${
                      isActive
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-border text-ink-dim hover:border-accent/30 hover:text-accent"
                    }`}
                  >
                    {label}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="overflow-hidden rounded border border-border bg-[#050505]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-[#333]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#333]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#333]" />
            <span className="ml-2">terminal.sandbox</span>
          </div>

          <div
            ref={terminalRef}
            className="h-[360px] overflow-y-auto p-4 text-xs leading-6 text-ink-dim"
          >
            {lines.length === 0 ? (
              <p className="text-muted">
                {PROMPT} awaiting task selection...
                <span className="ml-1 inline-block h-4 w-2 animate-blink bg-accent/80 align-middle" />
              </p>
            ) : (
              lines.map((line, index) => (
                <div key={`${index}-${line.slice(0, 12)}`} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))
            )}
            {phase === "streaming" ? (
              <span className="mt-1 inline-block h-4 w-2 animate-blink bg-accent/80 align-middle" />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
