"use client";

import { useMemo, useState } from "react";

/**
 * Interactive model of the constraint at the centre of the capstone study:
 * how large the facility can get, how much of its load is served behind the
 * meter, and at what point Texas SB 6 review is triggered.
 *
 * Every figure below comes from the team's final deliverables. The arithmetic
 * is deliberately simple and is labelled as illustrative -- it demonstrates the
 * shape of the analysis, it is not an engineering sizing tool.
 */

// --- figures taken from the study -------------------------------------------
const SB6_THRESHOLD_MW = 75; // SB 6 (June 2025) gave ERCOT authority above this
const GENSET_COUNT = 10;
const GENSET_MW = 2.5; // Caterpillar G3520K
const GAS_MW = GENSET_COUNT * GENSET_MW; // 25 MW firm
const BESS_MW = 20; // 20x Tesla Megapack 3, LFP
const BESS_MWH = 80; // 4 hours at full discharge
const SOLAR_MW = 35; // 30-40 MW DC nameplate, single-axis tracking, ~125 acres
const PILOT_MW = 20; // the reference design in the final deck
const PHASE1_MIN = 20;
const PHASE1_MAX = 40;
const TODAY_MAX = 2; // existing DFW AI Lab / AI Innovation Center

// Each component was matched to a deployment already running, rather than a
// vendor promise -- this is what made the proposal credible to the client.
const PRECEDENTS = [
  { figure: "210", label: "gas gensets live in Texas", note: "Voltagrid, behind the meter, TCEQ-approved" },
  { figure: "$20B", label: "Google Energy Parks", note: "first solar-plus-battery data centre hybrid, 2026" },
  { figure: "1-2 MW", label: "already operating", note: "the client's existing Richardson AI lab" },
  { figure: "<4 mo", label: "tenant breakeven", note: "Lenovo benchmark, 80%+ five-year saving vs cloud" },
];

interface Alternative {
  id: "A" | "B" | "C";
  name: string;
  recommended: boolean;
  summary: string;
  criteria: Record<string, "meets" | "partial" | "fails">;
}

// Criteria are the seven the team scored against. Marks reflect the study's
// own characterisation of each option, including its note that the recommended
// option met every criterion except political feasibility.
const CRITERIA = [
  "Capital intensity",
  "Speed to market",
  "SB 6 exposure",
  "Asset alignment",
  "Differentiation",
  "Political feasibility",
  "Replicability",
];

const ALTERNATIVES: Alternative[] = [
  {
    id: "A",
    name: "Hyperscaler Chase",
    recommended: false,
    summary:
      "Compete for a full-scale hyperscale campus. Expensive to run, heavy overhead, and the highest regulatory exposure of the three.",
    criteria: {
      "Capital intensity": "fails",
      "Speed to market": "fails",
      "SB 6 exposure": "fails",
      "Asset alignment": "partial",
      Differentiation: "partial",
      "Political feasibility": "fails",
      Replicability: "partial",
    },
  },
  {
    id: "B",
    name: "Edge Tier Private AI Hub",
    recommended: true,
    summary:
      "A sub-75 MW private AI facility on DFW Technology's existing Richardson footprint, phased upward and aimed at regulated small and mid-size enterprises that hyperscalers do not serve.",
    criteria: {
      "Capital intensity": "meets",
      "Speed to market": "meets",
      "SB 6 exposure": "meets",
      "Asset alignment": "meets",
      Differentiation: "meets",
      "Political feasibility": "partial",
      Replicability: "meets",
    },
  },
  {
    id: "C",
    name: "Status Quo Plus",
    recommended: false,
    summary:
      "Expand the existing colocation business. Low risk and low reward, and the least likely of the three to attract new employers to the city.",
    criteria: {
      "Capital intensity": "meets",
      "Speed to market": "meets",
      "SB 6 exposure": "meets",
      "Asset alignment": "meets",
      Differentiation: "fails",
      "Political feasibility": "meets",
      Replicability: "fails",
    },
  },
];

const MARK = {
  meets: { glyph: "meets", tone: "text-blue-300" },
  partial: { glyph: "partial", tone: "text-red-300" },
  fails: { glyph: "fails", tone: "text-red-300" },
} as const;

export default function PrivateAiLab() {
  const [loadMw, setLoadMw] = useState(PILOT_MW);
  const [solar, setSolar] = useState(true);
  const [gas, setGas] = useState(true);
  const [bess, setBess] = useState(true);
  const [selected, setSelected] = useState<Alternative["id"]>("B");

  const model = useMemo(() => {
    // Only dispatchable generation counts toward continuous supply.
    //   Gas   - firm, runs around the clock.
    //   Solar - energy, not capacity. It cuts fuel burn during daylight but
    //           cannot be relied on to carry load, so it is excluded here.
    //   BESS  - storage, not generation. It shifts energy in time and rides
    //           through peaks and generator starts, but it cannot serve load
    //           indefinitely because something has to recharge it.
    const firmMw = gas ? GAS_MW : 0;
    const gridMw = Math.max(0, loadMw - firmMw);
    const coveredPct = loadMw === 0 ? 100 : Math.min(100, (firmMw / loadMw) * 100);
    // How long storage alone could hold up the shortfall before it is empty.
    const bridgedMw = Math.min(bess ? BESS_MW : 0, gridMw);
    const bridgeHours = bridgedMw > 0 ? BESS_MWH / bridgedMw : 0;

    let phase: string;
    if (loadMw <= TODAY_MAX) phase = "Today's footprint (1-2 MW, already operating)";
    else if (loadMw < PHASE1_MIN) phase = "Between today and the Phase 1 target";
    else if (loadMw <= PHASE1_MAX) phase = "Phase 1 target (20-40 MW)";
    else if (loadMw < SB6_THRESHOLD_MW) phase = "Beyond Phase 1, still under the SB 6 line";
    else phase = "Over the SB 6 line";

    return {
      firmMw,
      gridMw,
      coveredPct,
      bridgedMw,
      bridgeHours,
      phase,
      triggersSb6: loadMw >= SB6_THRESHOLD_MW,
      zeroGridLoad: gridMw === 0,
      solarOffsetPct: solar ? Math.min(100, (SOLAR_MW / Math.max(loadMw, 1)) * 100) : 0,
    };
  }, [loadMw, solar, gas, bess]);

  const active = ALTERNATIVES.find((a) => a.id === selected)!;

  const toggle = (on: boolean) =>
    `rounded-lg border px-3 py-2 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
      on
        ? "border-blue-300/50 bg-blue-300/10 text-blue-100"
        : "border-white/12 text-white/45 hover:border-white/25 hover:text-white/70"
    }`;

  return (
    <section
      aria-label="Private AI feasibility explorer"
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#08070d] text-white shadow-2xl shadow-black/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">
            Richardson Edge Tier
          </p>
          <p className="mt-0.5 text-sm font-medium">Feasibility explorer</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
          Figures from the study · simplified model
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <label htmlFor="load" className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Facility load
            </span>
            <span className="mt-1 block text-3xl font-semibold tabular-nums">
              {loadMw} <span className="text-lg text-white/45">MW</span>
            </span>
          </label>
          <input
            id="load"
            type="range"
            min={1}
            max={100}
            step={1}
            value={loadMw}
            onChange={(e) => setLoadMw(Number(e.target.value))}
            aria-describedby="load-help"
            className="mt-3 w-full accent-blue-400"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-white/30">
            <span>1</span>
            <span className="text-blue-300">Phase 1: {PHASE1_MIN}-{PHASE1_MAX}</span>
            <span className="text-red-300">SB 6: {SB6_THRESHOLD_MW}</span>
            <span>100</span>
          </div>
          <p id="load-help" className="mt-2 text-xs leading-5 text-white/45">
            {model.phase}
          </p>

          {/* SB 6 status ---------------------------------------------------- */}
          <div
            role="status"
            className={`mt-5 rounded-xl border p-4 ${
              model.triggersSb6
                ? "border-red-400/40 bg-red-400/[0.08]"
                : "border-blue-300/30 bg-blue-300/[0.06]"
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Texas SB 6
            </p>
            <p className="mt-1.5 text-sm font-medium">
              {model.triggersSb6
                ? `Triggers review at ${loadMw} MW`
                : `Clear of the threshold at ${loadMw} MW`}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-white/55">
              {model.triggersSb6
                ? "Senate Bill 6 and its implementing processes apply additional review and operating requirements to loads of 75 MW or greater. Reaching this line creates the delay and regulatory cost the recommended strategy exists to avoid."
                : "Senate Bill 6 and its implementing processes apply additional review and operating requirements to loads of 75 MW or greater. Staying below it keeps this model outside that large-load category."}
            </p>
          </div>

          {/* Power sources -------------------------------------------------- */}
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Behind-the-meter generation
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <button type="button" onClick={() => setGas(!gas)} aria-pressed={gas} className={toggle(gas)}>
              <span className="block font-medium">Gas gensets</span>
              <span className="mt-0.5 block text-[11px] opacity-70">
                {GENSET_COUNT} × {GENSET_MW} MW = {GAS_MW} MW firm
              </span>
            </button>
            <button type="button" onClick={() => setBess(!bess)} aria-pressed={bess} className={toggle(bess)}>
              <span className="block font-medium">Battery storage</span>
              <span className="mt-0.5 block text-[11px] opacity-70">
                {BESS_MW} MW / {BESS_MWH} MWh
              </span>
            </button>
            <button type="button" onClick={() => setSolar(!solar)} aria-pressed={solar} className={toggle(solar)}>
              <span className="block font-medium">Solar PV</span>
              <span className="mt-0.5 block text-[11px] opacity-70">
                {SOLAR_MW} MW daytime energy
              </span>
            </button>
          </div>

          {/* Load coverage bar ---------------------------------------------- */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/45">
                Load served on site
              </span>
              <span className="font-mono text-xs text-white/60">
                {Math.round(model.coveredPct)}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${
                  model.zeroGridLoad ? "bg-blue-300" : "bg-blue-400"
                }`}
                style={{ width: `${model.coveredPct}%` }}
              />
            </div>
          </div>

          <div
            role="status"
            className={`mt-4 rounded-xl border p-4 ${
              model.zeroGridLoad
                ? "border-blue-300/30 bg-blue-300/[0.06]"
                : "border-red-300/30 bg-red-300/[0.06]"
            }`}
          >
            <p className="text-sm font-medium">
              {model.zeroGridLoad
                ? "Zero added load on the Oncor grid"
                : `Draws ${model.gridMw.toFixed(1)} MW from the grid`}
            </p>
            <p className="mt-1.5 text-xs leading-5 text-white/55">
              {model.zeroGridLoad
                ? "Firm on-site generation covers the whole facility, so the project adds nothing to a grid already under strain. That is the argument that makes this politically viable."
                : "Firm on-site capacity is short of the facility load, so the shortfall comes from the public grid — which is exactly the cost the city is trying not to absorb."}
            </p>
            {solar ? (
              <p className="mt-2 text-[11px] leading-5 text-white/40">
                Solar counts as daytime energy, not capacity — it cuts fuel burn and
                cost, but the sun is not dispatchable, so it does not change the grid
                figure above.
              </p>
            ) : null}
            {bess && model.bridgedMw > 0 ? (
              <p className="mt-1 text-[11px] leading-5 text-red-200/70">
                Storage can hold up {model.bridgedMw.toFixed(1)} MW of that shortfall
                for about {model.bridgeHours.toFixed(1)} hours, then it is empty.
                Batteries move energy in time; they do not make it. Without
                generation, this only delays the draw on the grid.
              </p>
            ) : null}
            {bess && model.bridgedMw === 0 ? (
              <p className="mt-1 text-[11px] leading-5 text-white/40">
                Storage holds {BESS_MWH} MWh in reserve, covering generator starts and
                demand peaks rather than serving load continuously.
              </p>
            ) : null}
          </div>
        </div>

        {/* Alternatives ------------------------------------------------------ */}
        <aside className="flex flex-col gap-5 bg-white/[0.02] p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Three strategic alternatives
            </p>
            <div className="mt-3 flex flex-col gap-1.5" role="group" aria-label="Select an alternative">
              {ALTERNATIVES.map((alt) => {
                const on = selected === alt.id;
                return (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => setSelected(alt.id)}
                    aria-pressed={on}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
                      on
                        ? "border-blue-300/50 bg-blue-300/10"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-white/40">{alt.id}</span>
                    <span className={on ? "text-white" : "text-white/60"}>{alt.name}</span>
                    {alt.recommended ? (
                      <span className="ml-auto rounded border border-blue-300/30 bg-blue-300/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-blue-200">
                        picked
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-white/55">{active.summary}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Scored against seven criteria
            </p>
            <ul className="mt-3 space-y-1.5">
              {CRITERIA.map((c) => {
                const mark = MARK[active.criteria[c]];
                return (
                  <li
                    key={c}
                    className="flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-1.5"
                  >
                    <span className="text-[11px] text-white/60">{c}</span>
                    <span className={`font-mono text-[10px] uppercase ${mark.tone}`}>
                      {mark.glyph}
                    </span>
                  </li>
                );
              })}
            </ul>
            {active.recommended ? (
              <p className="mt-3 text-[11px] leading-5 text-white/45">
                The recommended option met every criterion except political
                feasibility — which is precisely what the joint policy framework and
                the 90-day plan were written to address.
              </p>
            ) : null}
          </div>

          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Why we argued it was realistic
            </p>
            <ul className="mt-3 space-y-2.5">
              {PRECEDENTS.map((p) => (
                <li key={p.label}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm text-blue-200">{p.figure}</span>
                    <span className="text-[11px] text-white/65">{p.label}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-4 text-white/35">{p.note}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
