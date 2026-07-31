"use client";

import { useMemo, useState } from "react";
import BlueprintBoard from "@/components/creative/BlueprintBoard";
import BlueprintSpatialViewer from "@/components/creative/BlueprintSpatialViewer";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";

const OBJECTS = [
  {
    name: "Arc Lounge",
    type: "Seating",
    price: 3800,
    build: "Bent lamination",
    time: 54,
  },
  {
    name: "Halo Lamp",
    type: "Lighting",
    price: 780,
    build: "Stack lamination",
    time: 16,
  },
  {
    name: "Field Speaker",
    type: "Audio",
    price: 1240,
    build: "Mitered enclosure",
    time: 22,
  },
  {
    name: "Service Tray",
    type: "Tableware",
    price: 290,
    build: "Box joint",
    time: 7,
  },
  {
    name: "Pin Stool",
    type: "Seating",
    price: 620,
    build: "Wedged tenon",
    time: 12,
  },
  {
    name: "Desk Array",
    type: "Workspace",
    price: 340,
    build: "Bridle joint",
    time: 9,
  },
] as const;

const WOODS = [
  { name: "Black walnut", multiplier: 1.15 },
  { name: "White oak", multiplier: 1 },
  { name: "Ebonized ash", multiplier: 1.08 },
] as const;

export default function WoodObjectIndex({
  project,
}: {
  project: CreativeProject;
}) {
  const [objectIndex, setObjectIndex] = useState(0);
  const [woodIndex, setWoodIndex] = useState(0);
  const [collection, setCollection] = useState<number[]>([]);

  const object = OBJECTS[objectIndex];
  const wood = WOODS[woodIndex];
  const price = Math.round(object.price * wood.multiplier);
  const collectionValue = useMemo(
    () =>
      collection.reduce(
        (sum, index) =>
          sum + Math.round(OBJECTS[index].price * wood.multiplier),
        0,
      ),
    [collection, wood.multiplier],
  );

  function toggleCollection(index: number) {
    setCollection((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  }

  return (
    <CreativeProjectShell project={project}>
      <div className="mx-auto max-w-7xl space-y-6 px-6 pb-24 md:px-8">
        <BlueprintBoard
          title="Wood Object Index"
          tagline="Six objects · one material language"
          blueprintImage="/creative/wood-products-blueprint.png"
          renderImage="/creative/wood-object-index.png"
          specs={[
            ["Collection", "Six objects"],
            ["Finish", "Hardwax oil"],
            ["Edges", "Hand eased"],
            ["Origin", "Small batch"],
          ]}
          history="A family of useful objects is connected by proportion, honest joinery, softened edges, and deliberate grain direction. Each piece is shown as both a collectible image and a plausible fabrication study."
        />

        <BlueprintSpatialViewer system="wood-object" />

        <section className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#080808] lg:grid-cols-[1fr_360px]">
          <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/65">
              Product registry
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Inspect the collection</h2>

            <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {OBJECTS.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  aria-pressed={objectIndex === index}
                  onClick={() => setObjectIndex(index)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    objectIndex === index
                      ? "border-alert/50 bg-alert-soft"
                      : "border-white/10 text-white/65 hover:text-white"
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-55">
                    O-{String(index + 1).padStart(2, "0")} · {item.type}
                  </span>
                  <span className="mt-2 block text-sm font-semibold">{item.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-9">
              <p className="text-xs text-white/65">Material edition</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {WOODS.map((option, index) => (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={woodIndex === index}
                    onClick={() => setWoodIndex(index)}
                    className={`rounded-full border px-4 py-3 text-xs ${
                      woodIndex === index
                        ? "border-accent/50 bg-accent-soft"
                        : "border-white/10 text-white/65"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-9 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                  O-{String(objectIndex + 1).padStart(2, "0")} · {object.type}
                </p>
                <h3 className="mt-2 text-3xl font-semibold">{object.name}</h3>
                <p className="mt-3 text-sm text-white/50">
                  {object.build} · {object.time} workshop hours · {wood.name}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={collection.includes(objectIndex)}
                onClick={() => toggleCollection(objectIndex)}
                className={`rounded-full px-5 py-3 text-xs font-semibold ${
                  collection.includes(objectIndex)
                    ? "bg-alert text-white"
                    : "bg-white text-black"
                }`}
              >
                {collection.includes(objectIndex)
                  ? "Remove from collection"
                  : "Add to collection"}
              </button>
            </div>
          </div>

          <aside className="p-7 md:p-9">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
              Selected specification
            </p>
            <h3 className="mt-3 text-2xl font-semibold">{object.name}</h3>
            <dl className="mt-7 space-y-px overflow-hidden border border-white/10 bg-white/10">
              {[
                ["Material", wood.name],
                ["Construction", object.build],
                ["Workshop time", `${object.time} hr`],
                ["Edition price", `$${price.toLocaleString()}`],
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

            <div className="mt-6 rounded-2xl border border-accent/35 bg-accent-soft p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/65">
                    Curated set
                  </p>
                  <p className="mt-2 font-mono text-3xl">{collection.length}/6</p>
                </div>
                <p className="font-mono text-lg">
                  ${collectionValue.toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCollection([])}
                disabled={collection.length === 0}
                className="mt-5 w-full rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/55 disabled:opacity-30"
              >
                Clear collection
              </button>
            </div>
          </aside>
        </section>
      </div>
    </CreativeProjectShell>
  );
}
