"use client";

import { useMemo, useState } from "react";
import { analyzePassword, VERDICT_META } from "@/lib/passwordStrength";

/**
 * Security Checkup — a privacy-first password strength meter. Everything runs
 * in the browser: the value is never sent anywhere, logged, or stored. It ports
 * the passaudit heuristics (entropy, block-list, pattern detection) into a tool
 * any visitor can actually use on themselves.
 */

const SAMPLES = ["password1", "Summer2024!", "correct-horse-battery-staple", "Tr0ub4dor&3"];

const TONE_CLASS: Record<string, { text: string; bar: string; ring: string }> = {
  alert: { text: "text-alert", bar: "bg-alert", ring: "border-alert/40 bg-alert-soft" },
  warn: { text: "text-alert", bar: "bg-alert", ring: "border-alert/30 bg-alert-soft" },
  accent: { text: "text-accent", bar: "bg-accent", ring: "border-accent/40 bg-accent-soft" },
  good: { text: "text-accent", bar: "bg-accent", ring: "border-accent/40 bg-accent-soft" },
};

export default function SecurityCheckup() {
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const result = useMemo(() => analyzePassword(password), [password]);
  const meta = VERDICT_META[result.verdict];
  const tone = TONE_CLASS[meta.tone];

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-6">
      <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <p className="font-mono text-[11px] text-fg-muted">
          Runs entirely in your browser — nothing is sent, stored, or logged.
        </p>
      </div>

      <div className="mt-5">
        <label htmlFor="security-checkup-password" className="text-sm font-medium text-fg">
          Test a password
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="security-checkup-password"
            type={reveal ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Type or paste a password"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 font-mono text-sm text-fg outline-none transition-colors focus:border-fg/40"
          />
          <button
            type="button"
            onClick={() => setReveal((value) => !value)}
            aria-controls="security-checkup-password"
            aria-pressed={reveal}
            className="shrink-0 rounded-lg border border-border px-3 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-fg-muted">Try:</span>
        {SAMPLES.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => setPassword(sample)}
            className="rounded-md border border-border px-2 py-0.5 font-mono text-[11px] text-fg-muted transition-colors hover:text-fg"
          >
            {sample}
          </button>
        ))}
      </div>

      {password.length > 0 ? (
        <>
          {/* Verdict + meter */}
          <div className={`mt-5 rounded-xl border p-4 ${tone.ring}`}>
            <div className="flex items-baseline justify-between">
              <span className={`text-lg font-semibold ${tone.text}`}>{meta.label}</span>
              <span className="font-mono text-xs text-fg-muted">{result.score}/100</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
              <div
                className={`h-full rounded-full transition-all duration-300 ${tone.bar}`}
                style={{ width: `${Math.max(4, result.score)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-bg/50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">Entropy</p>
              <p className="mt-1 font-mono text-xl text-fg">{result.entropyBits}<span className="text-xs text-fg-muted"> bits</span></p>
            </div>
            <div className="rounded-xl border border-border bg-bg/50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">Char pool</p>
              <p className="mt-1 font-mono text-xl text-fg">{result.poolSize}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg/50 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">Crack time</p>
              <p className="mt-1 text-sm font-medium text-fg">{result.crackTime}</p>
            </div>
          </div>

          {/* Findings */}
          <ul className="mt-4 space-y-2">
            {result.findings.map((finding, index) => (
              <li
                key={index}
                className="flex items-start gap-3 rounded-lg border border-border bg-bg/40 px-3 py-2.5"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    finding.kind === "blocker" ? "bg-alert" : finding.kind === "warning" ? "bg-alert/60" : "bg-accent"
                  }`}
                />
                <span className="text-sm leading-6 text-fg-muted">{finding.message}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-6 text-fg-muted">
            Crack time assumes a fast offline attacker guessing ~100 billion
            combinations per second. The single best upgrade is length: a memorable
            four-word passphrase beats a short string of symbols every time.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm leading-6 text-fg-muted">
          Start typing to see a live strength read-out. Try one of the samples
          above to watch how a block-listed classic, a symbol-padded password, and
          a long passphrase compare.
        </p>
      )}
    </div>
  );
}
