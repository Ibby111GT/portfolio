"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

const FILTERS = ["ALL", "GRAPHIC DESIGN", "PHOTOGRAPHY", "MIXED MEDIA"] as const;
type Filter = (typeof FILTERS)[number];

interface Tile {
  category: Exclude<Filter, "ALL">;
  aspect: string;
  gradient: string;
}

// Placeholder tiles — swap each entry for a real image once creative work is added.
const TILES: Tile[] = [
  { category: "PHOTOGRAPHY", aspect: "aspect-[3/4]", gradient: "linear-gradient(160deg, #1b2a4a 0%, #0e1424 100%)" },
  { category: "GRAPHIC DESIGN", aspect: "aspect-square", gradient: "linear-gradient(200deg, #3b1d5e 0%, #120a1f 100%)" },
  { category: "MIXED MEDIA", aspect: "aspect-[4/5]", gradient: "linear-gradient(140deg, #0f3d33 0%, #081712 100%)" },
  { category: "PHOTOGRAPHY", aspect: "aspect-[4/3]", gradient: "linear-gradient(120deg, #4a2a1b 0%, #170c06 100%)" },
  { category: "GRAPHIC DESIGN", aspect: "aspect-[3/4]", gradient: "linear-gradient(220deg, #14324a 0%, #06121c 100%)" },
  { category: "PHOTOGRAPHY", aspect: "aspect-square", gradient: "linear-gradient(180deg, #43124a 0%, #16061a 100%)" },
  { category: "MIXED MEDIA", aspect: "aspect-[4/3]", gradient: "linear-gradient(150deg, #4a3d12 0%, #191505 100%)" },
  { category: "PHOTOGRAPHY", aspect: "aspect-[3/4]", gradient: "linear-gradient(240deg, #12414a 0%, #051518 100%)" },
  { category: "GRAPHIC DESIGN", aspect: "aspect-[4/5]", gradient: "linear-gradient(130deg, #4a1224 0%, #1a060c 100%)" },
  { category: "MIXED MEDIA", aspect: "aspect-square", gradient: "linear-gradient(170deg, #1d2e12 0%, #0a1005 100%)" },
  { category: "PHOTOGRAPHY", aspect: "aspect-[4/3]", gradient: "linear-gradient(210deg, #2a1b4a 0%, #0c0817 100%)" },
  { category: "GRAPHIC DESIGN", aspect: "aspect-[3/4]", gradient: "linear-gradient(190deg, #124a3e 0%, #051813 100%)" },
];

export default function CreativePage() {
  const [filter, setFilter] = useState<Filter>("ALL");

  const visible =
    filter === "ALL" ? TILES : TILES.filter((tile) => tile.category === filter);

  return (
    <main className="relative min-h-screen">
      <div
        className="absolute top-0 left-0 right-0 h-[520px] pointer-events-none opacity-60 dark:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse at 50% -20%, rgba(60,100,255,0.14) 0%, transparent 70%)",
        }}
      />
      <section className="relative">
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-32 pb-12">
          <Reveal blur>
            <h1 className="text-5xl md:text-7xl font-semibold text-fg leading-tight tracking-tight mb-4">
              My Creative Endeavors
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="text-sm text-fg-muted mb-8 max-w-sm">
              When I&apos;m not securing systems, I&apos;m exploring
              photography, design, and other creative media.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <div className="overflow-x-auto scrollbar-none">
              <div className="inline-flex items-center gap-0.5 p-1 rounded-full border border-border">
                {FILTERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-medium tracking-widest uppercase whitespace-nowrap transition-colors duration-200 ${
                      filter === item
                        ? "bg-fg text-bg"
                        : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-6 md:px-8 pb-24">
        <div className="relative overflow-hidden columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 max-w-7xl mx-auto">
          {visible.map((tile, index) => (
            <div key={`${tile.category}-${index}`} className="break-inside-avoid pb-3">
              <div
                className={`group relative overflow-hidden rounded-xl w-full ${tile.aspect}`}
                style={{ background: tile.gradient }}
              >
                <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                  <p className="text-[10px] uppercase tracking-widest text-white/80">
                    {tile.category}
                  </p>
                  <p className="text-xs text-white/60">Work coming soon</p>
                </div>
                <span className="absolute bottom-3 left-3 text-[9px] uppercase tracking-widest text-white/40 group-hover:opacity-0 transition-opacity duration-300">
                  {tile.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
