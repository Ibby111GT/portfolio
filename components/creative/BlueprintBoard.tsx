"use client";

import Image from "next/image";
import { useState } from "react";

export default function BlueprintBoard({
  title,
  tagline,
  blueprintImage,
  renderImage,
  renderFilter,
  specs,
  history,
}: {
  title: string;
  tagline: string;
  blueprintImage: string;
  renderImage: string;
  /** Optional CSS filter applied to the render view only (e.g. paint tint). */
  renderFilter?: string;
  specs: Array<[string, string]>;
  history: string;
}) {
  const [mode, setMode] = useState<"Blueprint" | "Render">("Blueprint");

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#06080c]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 md:px-8">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
          <span className="h-2 w-2 bg-alert" />
          Technical document · controlled study
        </div>
        <div
          className="flex rounded-full border border-white/10 p-1"
          role="group"
          aria-label="Drawing view"
        >
          {(["Blueprint", "Render"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                mode === option
                  ? "bg-white text-black"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-b border-white/10 p-4 md:p-8 lg:border-b-0 lg:border-r">
          <div
            className={`relative mx-auto overflow-hidden border border-white/10 bg-[#061323] shadow-2xl transition-[aspect-ratio] duration-500 ${
              mode === "Blueprint"
                ? "aspect-[3/4] max-h-[940px]"
                : "aspect-[4/3] w-full"
            }`}
          >
            <Image
              src={mode === "Blueprint" ? blueprintImage : renderImage}
              alt={
                mode === "Blueprint"
                  ? `${title} CAD blueprint with orthographic and exploded views`
                  : `${title} finished material visualization`
              }
              fill
              priority
              sizes="(min-width: 1024px) 760px, 100vw"
              className="object-cover transition-[opacity,filter] duration-500"
              style={
                mode === "Render" && renderFilter && renderFilter !== "none"
                  ? { filter: renderFilter }
                  : undefined
              }
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
            <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-4 border-b border-white/30 pb-3 md:inset-x-6 md:top-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-100/70">
                  Drawing set / concept development
                </p>
                <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.03em] text-white md:text-4xl">
                  {title}
                </h2>
              </div>
              <span className="border border-alert/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-red-100">
                Rev 01
              </span>
            </div>
            <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-px border border-white/20 bg-white/20 md:inset-x-6 md:bottom-6 md:grid-cols-4">
              {specs.map(([label, value]) => (
                <div key={label} className="bg-[#06101d]/90 p-3 backdrop-blur-md">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/65">
                    {label}
                  </p>
                  <p className="mt-1.5 text-xs font-semibold uppercase text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col justify-between p-7 md:p-9">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              Patent-print study
            </p>
            <h2 className="mt-4 text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.04em]">
              {title}
            </h2>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-alert">
              {tagline}
            </p>
            <p className="mt-8 text-sm leading-7 text-white/55">{history}</p>

            <div className="mt-8 space-y-px overflow-hidden border border-white/10 bg-white/10">
              {specs.map(([label, value], index) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-5 bg-[#06080c] px-4 py-3"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                    {String(index + 1).padStart(2, "0")} / {label}
                  </span>
                  <span className="text-xs font-semibold uppercase">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <div className="h-10 w-48 bg-[repeating-linear-gradient(90deg,#fff_0_2px,transparent_2px_5px,#fff_5px_6px,transparent_6px_10px)] opacity-70" />
            <div className="mt-4 flex justify-between border-t border-white/15 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
              <span>Issued for study</span>
              <span>Scale varies</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
