"use client";

import type { CSSProperties, ReactNode } from "react";

type Tone = "accent" | "alert";

/**
 * Shared chrome for the creative stages. All primitives keep the readability
 * floors: nothing below 10px type and nothing below 55% white for text.
 * The stage layout contract: StageHeader ABOVE the canvas, StatStrip BELOW
 * it — nothing is ever overlaid on the play surface.
 */

export function StageHeader({
  eyebrow,
  stats = [],
  tone = "accent",
}: {
  eyebrow: string;
  stats?: Array<{ label: string; value: string }>;
  tone?: Tone;
}) {
  const dot = tone === "alert" ? "bg-alert" : "bg-accent";
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 motion-reduce:hidden ${dot}`}
          />
          <span className={`relative h-2 w-2 rounded-full ${dot}`} />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          {eyebrow}
        </p>
      </div>
      {stats.length > 0 ? (
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
          {stats.map((stat) => (
            <span key={stat.label}>
              {stat.label} {stat.value}
            </span>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: string; alert?: boolean }>;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 md:grid-cols-[repeat(var(--stat-cols),minmax(0,1fr))]"
      style={{ "--stat-cols": items.length } as CSSProperties}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-black/70 px-4 py-4 md:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            {item.label}
          </p>
          <p
            className={`mt-2 font-mono text-sm ${item.alert ? "text-alert" : "text-white/80"}`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ControlRange({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  disabled = false,
  tone = "accent",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Formatted value shown beside the label; defaults to the raw number. */
  display?: string;
  disabled?: boolean;
  tone?: Tone;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-6 block">
      <span className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
          {label}
        </span>
        <span className="font-mono text-[11px] text-white/70">
          {display ?? String(value)}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`mt-3 w-full disabled:opacity-40 ${tone === "alert" ? "accent-alert" : "accent-accent"}`}
      />
    </label>
  );
}

export function ControlSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="mt-6 block">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-3 w-full rounded-xl border border-white/10 bg-[#0d0e12] px-4 py-3 text-xs text-white/75 outline-none transition-colors focus:border-accent/50"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function StageButton({
  children,
  onClick,
  variant = "ghost",
  disabled = false,
  pressed,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "alert" | "solid" | "ghost";
  disabled?: boolean;
  /** Renders aria-pressed for toggle buttons when provided. */
  pressed?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-accent text-white transition-transform enabled:hover:-translate-y-0.5",
    alert:
      "bg-alert text-white transition-transform enabled:hover:-translate-y-0.5",
    solid:
      "bg-white text-black transition-transform enabled:hover:-translate-y-0.5",
    ghost:
      "border border-white/15 text-white/70 transition-colors enabled:hover:bg-white/[0.06] enabled:hover:text-white",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`rounded-full px-4 py-3 text-xs font-semibold disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
