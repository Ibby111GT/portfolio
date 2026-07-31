"use client";

import { useEffect, useRef } from "react";
import type { LogEntry } from "./expeditionEvents";

/**
 * Streaming ranger-radio log. The newest entry typewrites in (charBudget
 * advances from the parent's run loop); completed entries render in full.
 * The visible typewriter list is aria-hidden — a separate polite live
 * region receives each entry's complete text once, so screen readers hear
 * whole sentences instead of keystroke noise.
 */
export default function RadioLog({
  entries,
  revealed,
  charBudget,
}: {
  entries: LogEntry[];
  revealed: number;
  charBudget: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = entries.slice(0, revealed);
  const lastAnnounced = visible.length > 0 ? visible[visible.length - 1] : null;

  useEffect(() => {
    const host = scrollRef.current;
    if (host) {
      host.scrollTop = host.scrollHeight;
    }
  }, [revealed, charBudget]);

  return (
    <div>
      <div
        ref={scrollRef}
        aria-hidden="true"
        className="max-h-44 space-y-2 overflow-y-auto pr-1 font-mono text-xs leading-5"
      >
        {visible.length === 0 ? (
          <p className="text-white/65">
            Channel open. Launch an expedition to hear the team.
          </p>
        ) : (
          visible.map((entry, index) => {
            const isNewest = index === visible.length - 1;
            const text = isNewest ? entry.text.slice(0, charBudget) : entry.text;
            const done = !isNewest || charBudget >= entry.text.length;
            return (
              <p
                key={`${entry.time}-${index}`}
                className={entry.advisory ? "text-alert" : "text-white/75"}
              >
                <span className="text-white/65">{entry.time}</span>{" "}
                <span>{text}</span>
                {!done ? (
                  <span className="ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-blink bg-white/70" />
                ) : null}
              </p>
            );
          })
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {lastAnnounced ? `${lastAnnounced.time}. ${lastAnnounced.text}` : ""}
      </p>
    </div>
  );
}
