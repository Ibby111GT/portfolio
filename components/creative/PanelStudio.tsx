"use client";

import { useMemo, useState } from "react";
import BlueprintBoard from "@/components/creative/BlueprintBoard";
import BlueprintSpatialViewer from "@/components/creative/BlueprintSpatialViewer";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";

const PROFILES = [
  { name: "Micro slat", module: 12, acoustic: 0.72 },
  { name: "Linear 30", module: 24, acoustic: 0.81 },
  { name: "Deep flute", module: 18, acoustic: 0.67 },
] as const;

const SPECIES = [
  { name: "Natural oak", cost: 29, swatch: "#b98c54" },
  { name: "Walnut", cost: 38, swatch: "#70422d" },
  { name: "Smoked ash", cost: 34, swatch: "#433a33" },
] as const;

export default function PanelStudio({
  project,
}: {
  project: CreativeProject;
}) {
  const [profileIndex, setProfileIndex] = useState(1);
  const [speciesIndex, setSpeciesIndex] = useState(0);
  const [wallWidth, setWallWidth] = useState(18);
  const [wallHeight, setWallHeight] = useState(9);
  const [ledChannels, setLedChannels] = useState(3);

  const profile = PROFILES[profileIndex];
  const species = SPECIES[speciesIndex];
  const metrics = useMemo(() => {
    const area = wallWidth * wallHeight;
    const panels = Math.ceil((wallWidth * 12) / profile.module);
    const estimate = Math.round(area * species.cost + ledChannels * 320);
    return { area, panels, estimate };
  }, [ledChannels, profile.module, species.cost, wallHeight, wallWidth]);

  return (
    <CreativeProjectShell project={project}>
      <div className="mx-auto max-w-7xl space-y-6 px-6 pb-24 md:px-8">
        <BlueprintBoard
          title="Panel Studio"
          tagline="Rhythm · light · acoustic control"
          blueprintImage="/creative/panel-blueprint.png"
          renderImage="/creative/panel-studio.png"
          specs={[
            ["Mounting", "Concealed rail"],
            ["Backing", "Acoustic felt"],
            ["Reveal", "12 mm shadow"],
            ["Lighting", "Serviceable LED"],
          ]}
          history="The wall becomes a repeatable architectural system. Slat rhythm, acoustic backing, concealed mounting, integrated lighting, and corner transitions are resolved as one modular assembly."
        />

        <BlueprintSpatialViewer system="wall-panels" />

        <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#080808] lg:grid-cols-[1fr_360px]">
          <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
              Coverage calculator
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Shape the wall system</h2>

            <div className="mt-8 grid gap-7 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/45">Panel profile</p>
                <div className="mt-3 space-y-2">
                  {PROFILES.map((option, index) => (
                    <button
                      key={option.name}
                      type="button"
                      aria-pressed={profileIndex === index}
                      onClick={() => setProfileIndex(index)}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left ${
                        profileIndex === index
                          ? "border-accent/55 bg-accent-soft"
                          : "border-white/10 text-white/45"
                      }`}
                    >
                      <span className="text-sm font-semibold">{option.name}</span>
                      <span className="font-mono text-[9px]">
                        {option.module} in module
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/45">Timber finish</p>
                <div className="mt-3 space-y-2">
                  {SPECIES.map((option, index) => (
                    <button
                      key={option.name}
                      type="button"
                      aria-pressed={speciesIndex === index}
                      onClick={() => setSpeciesIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs ${
                        speciesIndex === index
                          ? "border-alert/50 bg-alert-soft"
                          : "border-white/10 text-white/45"
                      }`}
                    >
                      <span
                        className="h-7 w-7 rounded border border-white/20"
                        style={{ backgroundColor: option.swatch }}
                      />
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-9 grid gap-6 sm:grid-cols-3">
              <label>
                <span className="flex justify-between text-xs text-white/45">
                  <span>Wall width</span>
                  <span className="font-mono">{wallWidth} ft</span>
                </span>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={wallWidth}
                  onChange={(event) => setWallWidth(Number(event.target.value))}
                  className="mt-4 w-full accent-blue-500"
                />
              </label>
              <label>
                <span className="flex justify-between text-xs text-white/45">
                  <span>Wall height</span>
                  <span className="font-mono">{wallHeight} ft</span>
                </span>
                <input
                  type="range"
                  min="8"
                  max="14"
                  value={wallHeight}
                  onChange={(event) => setWallHeight(Number(event.target.value))}
                  className="mt-4 w-full accent-blue-500"
                />
              </label>
              <label>
                <span className="flex justify-between text-xs text-white/45">
                  <span>LED channels</span>
                  <span className="font-mono">{ledChannels}</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={ledChannels}
                  onChange={(event) => setLedChannels(Number(event.target.value))}
                  className="mt-4 w-full accent-red-500"
                />
              </label>
            </div>
          </div>

          <aside className="p-7 md:p-9">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              Generated takeoff
            </p>
            <h3 className="mt-3 text-2xl font-semibold">
              {species.name} / {profile.name}
            </h3>
            <div className="mt-7 grid grid-cols-2 gap-2">
              {[
                ["Coverage", `${metrics.area} ft²`],
                ["Modules", String(metrics.panels)],
                ["Acoustic NRC", profile.acoustic.toFixed(2)],
                ["LED channels", String(ledChannels)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >
                  <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
                    {label}
                  </p>
                  <p className="mt-2 font-mono text-xl">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-l-2 border-alert pl-4">
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                Material allowance
              </p>
              <p className="mt-2 font-mono text-3xl">
                ${metrics.estimate.toLocaleString()}
              </p>
            </div>
          </aside>
        </section>
      </div>
    </CreativeProjectShell>
  );
}
