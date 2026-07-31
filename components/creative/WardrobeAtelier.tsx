"use client";

import { useMemo, useState } from "react";
import BlueprintBoard from "@/components/creative/BlueprintBoard";
import BlueprintSpatialViewer from "@/components/creative/BlueprintSpatialViewer";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";

const MODULES = [
  { name: "Double hang", width: 36, capacity: 24 },
  { name: "Long hang", width: 30, capacity: 10 },
  { name: "Drawer stack", width: 30, capacity: 18 },
  { name: "Shoe tower", width: 24, capacity: 20 },
  { name: "Accessory bay", width: 24, capacity: 16 },
  { name: "Glass cabinet", width: 30, capacity: 12 },
] as const;

const DOORS = ["Open", "Fluted timber", "Smoked glass"] as const;

export default function WardrobeAtelier({
  project,
}: {
  project: CreativeProject;
}) {
  const [active, setActive] = useState([true, true, true, true, false, false]);
  const [availableWidth, setAvailableWidth] = useState(144);
  const [doorStyle, setDoorStyle] = useState<(typeof DOORS)[number]>("Open");
  const [lighting, setLighting] = useState(true);

  const metrics = useMemo(() => {
    const chosen = MODULES.filter((_, index) => active[index]);
    const used = chosen.reduce((sum, module) => sum + module.width, 0);
    const capacity = chosen.reduce((sum, module) => sum + module.capacity, 0);
    return {
      chosen,
      used,
      capacity,
      remaining: availableWidth - used,
      fits: used <= availableWidth,
    };
  }, [active, availableWidth]);

  function toggleModule(index: number) {
    setActive((current) =>
      current.map((value, itemIndex) =>
        itemIndex === index ? !value : value,
      ),
    );
  }

  function optimize() {
    let remaining = availableWidth;
    setActive(
      MODULES.map((module) => {
        if (module.width <= remaining) {
          remaining -= module.width;
          return true;
        }
        return false;
      }),
    );
  }

  return (
    <CreativeProjectShell project={project}>
      <div className="mx-auto max-w-7xl space-y-6 px-6 pb-24 md:px-8">
        <BlueprintBoard
          title="Wardrobe Atelier"
          tagline="Storage made architectural"
          blueprintImage="/creative/wardrobe-blueprint.png"
          renderImage="/creative/wardrobe-atelier.png"
          specs={[
            ["Case depth", "24 inch"],
            ["Shelf grid", "32 mm system"],
            ["Drawers", "Soft close"],
            ["Lighting", "Door switched"],
          ]}
          history="The wardrobe is organized as a flexible kit of parts. Hanging, drawers, shoes, accessories, doors, and lighting are allocated against a real wall width so the presentation remains buildable."
        />

        <BlueprintSpatialViewer system="wardrobe" />

        <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#080808] lg:grid-cols-[1fr_360px]">
          <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
              Module planner
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
              <h2 className="text-3xl font-semibold">Build the storage wall</h2>
              <button
                type="button"
                onClick={optimize}
                className="rounded-full border border-accent/50 bg-accent-soft px-5 py-2.5 text-xs font-semibold"
              >
                Optimize layout
              </button>
            </div>

            <label className="mt-8 block">
              <span className="flex justify-between text-xs text-white/65">
                <span>Available wall width</span>
                <span className="font-mono">{availableWidth} in</span>
              </span>
              <input
                type="range"
                min="84"
                max="240"
                step="6"
                value={availableWidth}
                onChange={(event) => setAvailableWidth(Number(event.target.value))}
                className="mt-4 w-full accent-blue-500"
              />
            </label>

            <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((module, index) => (
                <button
                  key={module.name}
                  type="button"
                  aria-pressed={active[index]}
                  onClick={() => toggleModule(index)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active[index]
                      ? "border-accent/55 bg-accent-soft"
                      : "border-white/10 text-white/65"
                  }`}
                >
                  <span className="block text-sm font-semibold">{module.name}</span>
                  <span className="mt-2 block font-mono text-[10px] text-white/60">
                    {module.width} in · {module.capacity} items
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.7fr]">
              <div>
                <p className="text-xs text-white/65">Door treatment</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {DOORS.map((door) => (
                    <button
                      key={door}
                      type="button"
                      aria-pressed={doorStyle === door}
                      onClick={() => setDoorStyle(door)}
                      className={`rounded-lg border px-3 py-3 text-[11px] ${
                        doorStyle === door
                          ? "border-alert/50 bg-alert-soft"
                          : "border-white/10 text-white/65"
                      }`}
                    >
                      {door}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                aria-pressed={lighting}
                onClick={() => setLighting((current) => !current)}
                className={`self-end rounded-full border px-4 py-3 text-xs font-semibold ${
                  lighting
                    ? "border-accent/50 bg-accent-soft"
                    : "border-white/10 text-white/65"
                }`}
              >
                Shelf lighting · {lighting ? "On" : "Off"}
              </button>
            </div>
          </div>

          <aside className="p-7 md:p-9">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
                  Layout status
                </p>
                <h3 className="mt-3 text-2xl font-semibold">
                  {metrics.fits ? "Ready to detail" : "Width exceeded"}
                </h3>
              </div>
              <span
                className={`h-3 w-3 rounded-full ${
                  metrics.fits ? "bg-accent" : "animate-pulse bg-alert"
                }`}
              />
            </div>

            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full transition-[width] ${
                  metrics.fits ? "bg-accent" : "bg-alert"
                }`}
                style={{
                  width: `${Math.min(100, (metrics.used / availableWidth) * 100)}%`,
                }}
              />
            </div>

            <dl className="mt-7 space-y-px overflow-hidden border border-white/10 bg-white/10">
              {[
                ["Selected modules", String(metrics.chosen.length)],
                ["Width used", `${metrics.used} in`],
                [
                  metrics.remaining >= 0 ? "Width remaining" : "Over by",
                  `${Math.abs(metrics.remaining)} in`,
                ],
                ["Storage capacity", `${metrics.capacity} items`],
                ["Door style", doorStyle],
                ["Lighting", lighting ? "Specified" : "None"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 bg-[#080808] px-4 py-3"
                >
                  <dt className="text-[10px] text-white/60">{label}</dt>
                  <dd className="text-xs font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            {!metrics.fits ? (
              <p className="mt-5 rounded-xl border border-alert/40 bg-alert-soft p-4 text-xs leading-5 text-red-100/80">
                Remove a module or increase the available width before issuing
                the drawing set.
              </p>
            ) : null}
          </aside>
        </section>
      </div>
    </CreativeProjectShell>
  );
}
