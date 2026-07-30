"use client";

import { useMemo, useState } from "react";
import BlueprintBoard from "@/components/creative/BlueprintBoard";
import BlueprintSpatialViewer from "@/components/creative/BlueprintSpatialViewer";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";

const MATERIALS = [
  { name: "Rift walnut", multiplier: 1.28, swatch: "#70412b" },
  { name: "White oak", multiplier: 1.12, swatch: "#b99160" },
  { name: "Ebonized ash", multiplier: 1.2, swatch: "#211d1a" },
  { name: "Painted birch", multiplier: 0.92, swatch: "#d8d3c8" },
] as const;

const LAYOUTS = [
  { name: "Single wall", run: 16, modules: 9 },
  { name: "Galley", run: 24, modules: 14 },
  { name: "L-shaped", run: 28, modules: 16 },
] as const;

const HARDWARE = ["Edge pull", "Knurled bar", "Touch latch"] as const;

export default function CabinetryStudio({
  project,
}: {
  project: CreativeProject;
}) {
  const [materialIndex, setMaterialIndex] = useState(0);
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [hardware, setHardware] = useState<(typeof HARDWARE)[number]>("Edge pull");
  const [glassBays, setGlassBays] = useState(1);
  const [lighting, setLighting] = useState(true);

  const material = MATERIALS[materialIndex];
  const layout = LAYOUTS[layoutIndex];
  const estimate = useMemo(
    () =>
      Math.round(
        (layout.modules * 1680 + glassBays * 1350 + (lighting ? 1850 : 0)) *
          material.multiplier,
      ),
    [glassBays, layout.modules, lighting, material.multiplier],
  );
  const leadTime = Math.round(
    7 + layout.modules / 4 + glassBays * 0.6 + (materialIndex === 0 ? 2 : 0),
  );

  return (
    <CreativeProjectShell project={project}>
      <div className="mx-auto max-w-7xl space-y-6 px-6 pb-24 md:px-8">
        <BlueprintBoard
          title="Cabinetry Studio"
          tagline="Measured once · built precisely"
          blueprintImage="/creative/cabinetry-blueprint.png"
          renderImage="/creative/cabinetry-studio.png"
          specs={[
            ["Construction", "Frameless case"],
            ["Reveal", "3 mm shadow"],
            ["Fronts", "Sequence matched"],
            ["Joinery", "Dowel + confirmat"],
          ]}
          history="A cabinet wall is treated as architecture rather than a row of boxes. The concept aligns veneer grain, appliance centers, shadow gaps, lighting, and service access into one controlled elevation."
        />

        <BlueprintSpatialViewer system="cabinetry" />

        <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#080808] lg:grid-cols-[1fr_360px]">
          <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
              Live cabinet specification
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Configure the run</h2>

            <div className="mt-8">
              <p className="text-xs text-white/45">Layout</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {LAYOUTS.map((option, index) => (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={layoutIndex === index}
                    onClick={() => setLayoutIndex(index)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      layoutIndex === index
                        ? "border-accent/55 bg-accent-soft"
                        : "border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.name}</span>
                    <span className="mt-1 block font-mono text-[9px] text-white/35">
                      {option.run} ft · {option.modules} modules
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs text-white/45">Face material</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MATERIALS.map((option, index) => (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={materialIndex === index}
                    onClick={() => setMaterialIndex(index)}
                    className={`flex items-center gap-3 rounded-full border py-2 pl-2 pr-4 text-xs transition-colors ${
                      materialIndex === index
                        ? "border-white/55 bg-white/10"
                        : "border-white/10 text-white/50"
                    }`}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-white/20"
                      style={{ backgroundColor: option.swatch }}
                    />
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-7 md:grid-cols-2">
              <div>
                <p className="text-xs text-white/45">Hardware</p>
                <div className="mt-3 space-y-2">
                  {HARDWARE.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={hardware === option}
                      onClick={() => setHardware(option)}
                      className={`w-full rounded-lg border px-4 py-2.5 text-left text-xs ${
                        hardware === option
                          ? "border-alert/50 bg-alert-soft"
                          : "border-white/10 text-white/45"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block">
                  <span className="flex justify-between text-xs text-white/45">
                    <span>Glass display bays</span>
                    <span className="font-mono">{glassBays}</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    value={glassBays}
                    onChange={(event) => setGlassBays(Number(event.target.value))}
                    className="mt-4 w-full accent-blue-500"
                  />
                </label>
                <button
                  type="button"
                  aria-pressed={lighting}
                  onClick={() => setLighting((current) => !current)}
                  className={`mt-7 w-full rounded-full border px-4 py-3 text-xs font-semibold ${
                    lighting
                      ? "border-accent/55 bg-accent-soft"
                      : "border-white/10 text-white/45"
                  }`}
                >
                  Integrated lighting · {lighting ? "On" : "Off"}
                </button>
              </div>
            </div>
          </div>

          <aside className="p-7 md:p-9">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              Current issue
            </p>
            <h3 className="mt-3 text-2xl font-semibold">
              {material.name} / {layout.name}
            </h3>
            <dl className="mt-7 space-y-px overflow-hidden border border-white/10 bg-white/10">
              {[
                ["Cabinet run", `${layout.run} linear ft`],
                ["Case modules", String(layout.modules)],
                ["Hardware", hardware],
                ["Lighting", lighting ? "Integrated LED" : "Not specified"],
                ["Lead time", `${leadTime} weeks`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 bg-[#080808] px-4 py-3"
                >
                  <dt className="text-[10px] text-white/35">{label}</dt>
                  <dd className="text-xs font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 rounded-2xl border border-accent/35 bg-accent-soft p-5">
              <p className="text-[9px] uppercase tracking-[0.16em] text-white/40">
                Concept allowance
              </p>
              <p className="mt-2 font-mono text-3xl">
                ${estimate.toLocaleString()}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                Design-study estimate only; field dimensions and fabrication
                drawings control the final scope.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </CreativeProjectShell>
  );
}
