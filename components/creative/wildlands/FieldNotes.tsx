"use client";

import { FIELD_NOTES } from "./fieldNotes";

const WEATHER_GLYPH: Record<string, string> = {
  Clear: "○",
  Storm: "▲",
  Snow: "✳",
};

/** 3x3 collection grid — one card per trail x weather combination. */
export default function FieldNotes({
  unlocked,
  activeCombo,
  trailNames,
}: {
  unlocked: Record<string, string>;
  activeCombo: string | null;
  trailNames: Record<string, string>;
}) {
  const count = FIELD_NOTES.filter((note) => unlocked[note.combo]).length;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#080808] p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
          Field notes
        </p>
        <p
          aria-live="polite"
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55"
        >
          {count} of {FIELD_NOTES.length} recovered
        </p>
      </div>
      <p className="mt-2 text-xs text-white/65">
        Every trail × weather combination files a different note. Change the
        conditions and run it again.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {FIELD_NOTES.map((note) => {
          const isUnlocked = Boolean(unlocked[note.combo]);
          const isActive = activeCombo === note.combo;
          return (
            <div
              key={note.combo}
              className={`rounded-xl border p-3 transition-colors ${
                isUnlocked
                  ? isActive
                    ? "border-accent/70 bg-accent-soft"
                    : "border-accent/35 bg-white/[0.03]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
                <span>{trailNames[note.trail] ?? note.trail}</span>
                <span>
                  {WEATHER_GLYPH[note.weather]} {note.weather}
                </span>
              </p>
              {isUnlocked ? (
                <>
                  <p className="mt-2 text-xs font-semibold text-white">
                    {note.title}
                  </p>
                  <p
                    className={`mt-1 text-[11px] leading-4 text-white/55 ${
                      isActive ? "" : "line-clamp-2"
                    }`}
                  >
                    {note.text}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-lg text-white/55">?</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
