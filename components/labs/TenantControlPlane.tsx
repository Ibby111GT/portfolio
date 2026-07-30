"use client";

import { useMemo, useState } from "react";

/**
 * The operating layer the feasibility study stops short of: once the facility
 * is approved, somebody has to decide which tenants go in it.
 *
 * For a regulated-SME private AI hub, two limits bind at the same time. Every
 * tenant consumes megawatts against a pilot budget that must never approach the
 * SB 6 line, and every tenant drags in a compliance regime whose controls have
 * to be in place before their data lands. This console makes an operator hold
 * both constraints at once.
 *
 * Tenants are synthetic. The control mappings are representative operating
 * assumptions informed by each regime, not an exhaustive legal checklist.
 */

const PILOT_CAPACITY_MW = 20; // the reference design in the study
const SB6_THRESHOLD_MW = 75;

type ControlId =
  | "isolation"
  | "encryption"
  | "audit"
  | "agreement"
  | "residency"
  | "access";

const CONTROL_LABEL: Record<ControlId, string> = {
  isolation: "Dedicated tenant isolation",
  encryption: "Encryption at rest and in transit",
  audit: "Immutable audit logging",
  agreement: "Signed data-handling agreement",
  residency: "In-state data residency",
  access: "Role-based access review",
};

const CONTROL_WHY: Record<ControlId, string> = {
  isolation:
    "Shared compute is what disqualifies public cloud for these tenants. Their data cannot sit on hardware another customer also uses.",
  encryption:
    "Protects the data if a disk or a network path is ever exposed. Effectively mandatory under every regime here.",
  audit:
    "A record of who touched what, which cannot be edited afterwards. This is what an auditor actually asks to see.",
  agreement:
    "The contract that makes the operator legally accountable for the tenant's data — a BAA under HIPAA, equivalents elsewhere.",
  residency:
    "Some regimes and contracts require the data physically stay inside the state or jurisdiction.",
  access:
    "Periodic proof that only the right people still have access. The control most often failed at audit.",
};

interface Tenant {
  id: string;
  name: string;
  sector: string;
  regime: string;
  loadMw: number;
  anchor?: boolean;
  controls: ControlId[];
  /** Controls not yet in place when the pilot starts. */
  gaps: ControlId[];
}

const TENANTS: Tenant[] = [
  {
    id: "northline",
    name: "Northline Regional Health",
    sector: "Healthcare",
    regime: "HIPAA",
    loadMw: 6.0,
    anchor: true,
    controls: ["isolation", "encryption", "audit", "agreement", "access"],
    gaps: ["agreement"],
  },
  {
    id: "lonestar",
    name: "Lonestar Credit Union",
    sector: "Financial services",
    regime: "GLBA / SOX",
    loadMw: 3.0,
    controls: ["isolation", "encryption", "audit", "access"],
    gaps: [],
  },
  {
    id: "collin",
    name: "Collin County Records",
    sector: "Public sector",
    regime: "CJIS",
    loadMw: 2.5,
    controls: ["isolation", "encryption", "audit", "residency", "access"],
    gaps: ["residency", "access"],
  },
  {
    id: "meridian",
    name: "Meridian Legal Group",
    sector: "Legal",
    regime: "Privilege / state bar",
    loadMw: 1.5,
    controls: ["isolation", "encryption", "agreement"],
    gaps: [],
  },
  {
    id: "vista",
    name: "Vista Imaging Partners",
    sector: "Healthcare",
    regime: "HIPAA",
    loadMw: 5.0,
    controls: ["isolation", "encryption", "audit", "agreement", "access"],
    gaps: ["audit"],
  },
  {
    id: "ardent",
    name: "Ardent Insurance TPA",
    sector: "Insurance",
    regime: "GLBA + HIPAA",
    loadMw: 3.5,
    controls: ["isolation", "encryption", "audit", "agreement", "residency"],
    gaps: ["residency"],
  },
  {
    id: "brightpath",
    name: "Brightpath Labs",
    sector: "Life sciences",
    regime: "21 CFR Part 11",
    loadMw: 2.0,
    controls: ["encryption", "audit", "agreement", "access"],
    gaps: ["audit"],
  },
];

export default function TenantControlPlane() {
  const [admitted, setAdmitted] = useState<Set<string>>(new Set(["northline"]));
  const [remediated, setRemediated] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<string>("northline");

  const gapKey = (tenantId: string, control: ControlId) => `${tenantId}:${control}`;

  const openGaps = (t: Tenant) =>
    t.gaps.filter((g) => !remediated.has(gapKey(t.id, g)));

  const state = useMemo(() => {
    const live = TENANTS.filter((t) => admitted.has(t.id));
    const committedMw = live.reduce((sum, t) => sum + t.loadMw, 0);

    const required = live.reduce((sum, t) => sum + t.controls.length, 0);
    const missing = live.reduce((sum, t) => sum + openGaps(t).length, 0);
    const coverage = required === 0 ? 100 : ((required - missing) / required) * 100;

    const blocked = live.filter((t) => openGaps(t).length > 0);

    return {
      live,
      committedMw,
      overCapacity: committedMw > PILOT_CAPACITY_MW,
      utilisation: (committedMw / PILOT_CAPACITY_MW) * 100,
      sb6Headroom: SB6_THRESHOLD_MW - committedMw,
      coverage,
      missing,
      blocked,
      readyToServe: blocked.length === 0 && committedMw <= PILOT_CAPACITY_MW && live.length > 0,
    };
  }, [admitted, remediated]);

  const focused = TENANTS.find((t) => t.id === focus)!;
  const focusedGaps = openGaps(focused);

  const toggleTenant = (id: string) =>
    setAdmitted((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resolveGap = (tenantId: string, control: ControlId) =>
    setRemediated((current) => new Set(current).add(gapKey(tenantId, control)));

  const reset = () => {
    setAdmitted(new Set(["northline"]));
    setRemediated(new Set());
    setFocus("northline");
  };

  return (
    <section
      aria-label="Tenant and capacity control plane"
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#08070d] text-white shadow-2xl shadow-black/30"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">
            Edge Tier operations
          </p>
          <p className="mt-0.5 text-sm font-medium">Tenant &amp; capacity control plane</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-white/12 px-3 py-1.5 text-xs text-white/55 transition hover:border-white/30 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
        >
          Reset
        </button>
      </div>

      {/* Meters ------------------------------------------------------------- */}
      <div className="grid gap-px border-b border-white/10 bg-white/[0.06] sm:grid-cols-3">
        <Meter
          label="Pilot capacity"
          value={`${state.committedMw.toFixed(1)} / ${PILOT_CAPACITY_MW} MW`}
          pct={Math.min(100, state.utilisation)}
          tone={state.overCapacity ? "bad" : state.utilisation > 85 ? "warn" : "good"}
          note={
            state.overCapacity
              ? `Oversubscribed by ${(state.committedMw - PILOT_CAPACITY_MW).toFixed(1)} MW`
              : `${(PILOT_CAPACITY_MW - state.committedMw).toFixed(1)} MW still sellable`
          }
        />
        <Meter
          label="SB 6 headroom"
          value={`${state.sb6Headroom.toFixed(1)} MW`}
          pct={Math.min(100, (state.committedMw / SB6_THRESHOLD_MW) * 100)}
          tone={state.sb6Headroom < 10 ? "bad" : "good"}
          note={`Ceiling is ${SB6_THRESHOLD_MW} MW before state review`}
        />
        <Meter
          label="Control coverage"
          value={`${Math.round(state.coverage)}%`}
          pct={state.coverage}
          tone={state.missing > 0 ? "warn" : "good"}
          note={
            state.missing > 0
              ? `${state.missing} control(s) outstanding`
              : "All modeled controls in place"
          }
        />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Tenant pipeline -------------------------------------------------- */}
        <div className="min-w-0 border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Prospective tenants
          </p>
          <p className="mt-1.5 text-xs leading-5 text-white/45">
            Admit tenants into the pilot. Each one consumes capacity and brings its
            own compliance obligations.
          </p>

          <ul className="mt-4 space-y-2">
            {TENANTS.map((t) => {
              const on = admitted.has(t.id);
              const gaps = openGaps(t);
              const isFocus = focus === t.id;
              return (
                <li key={t.id}>
                  <div
                    className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5 transition ${
                      isFocus ? "border-blue-300/40 bg-blue-300/[0.06]" : "border-white/10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTenant(t.id)}
                      aria-pressed={on}
                      aria-label={`${on ? "Remove" : "Admit"} ${t.name}`}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 ${
                        on
                          ? "border-blue-300 bg-blue-300 text-black"
                          : "border-white/20 text-white/30 hover:border-blue-300/60"
                      }`}
                    >
                      {on ? "+" : ""}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFocus(t.id)}
                      className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm ${on ? "text-white" : "text-white/60"}`}>
                          {t.name}
                        </span>
                        {t.anchor ? (
                          <span className="rounded border border-blue-300/30 bg-blue-300/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-blue-200">
                            anchor
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-white/35">
                        {t.sector} · {t.regime}
                      </span>
                    </button>

                    <span className="font-mono text-xs text-white/55">
                      {t.loadMw.toFixed(1)} MW
                    </span>

                    <span
                      className={`w-20 text-right font-mono text-[10px] uppercase ${
                        !on
                          ? "text-white/25"
                          : gaps.length
                            ? "text-red-300"
                            : "text-blue-300"
                      }`}
                    >
                      {!on ? "pipeline" : gaps.length ? `${gaps.length} gap` : "ready"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {state.overCapacity ? (
            <div role="alert" className="mt-4 rounded-xl border border-red-400/35 bg-red-400/[0.07] p-4">
              <p className="text-sm font-medium">Pilot is oversubscribed</p>
              <p className="mt-1.5 text-xs leading-5 text-white/60">
                Committed load exceeds the {PILOT_CAPACITY_MW} MW pilot by{" "}
                {(state.committedMw - PILOT_CAPACITY_MW).toFixed(1)} MW. Either stage a
                tenant into Phase 2 or expand the build — and expanding walks toward
                the SB 6 line, which is the decision the whole study exists to protect.
              </p>
            </div>
          ) : null}

          {state.readyToServe ? (
            <div role="status" className="mt-4 rounded-xl border border-blue-300/30 bg-blue-300/[0.06] p-4">
              <p className="text-sm font-medium">Cleared to serve</p>
              <p className="mt-1.5 text-xs leading-5 text-white/60">
                {state.live.length} tenant{state.live.length === 1 ? "" : "s"} at{" "}
                {state.committedMw.toFixed(1)} MW, every required control in place, and{" "}
                {state.sb6Headroom.toFixed(1)} MW of headroom before state review.
              </p>
            </div>
          ) : null}
        </div>

        {/* Control detail --------------------------------------------------- */}
        <aside className="flex flex-col gap-5 bg-white/[0.02] p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Controls modeled for tenant
            </p>
            <p className="mt-2 text-sm font-medium">{focused.name}</p>
            <p className="font-mono text-[10px] text-white/35">{focused.regime}</p>

            <ul className="mt-4 space-y-2">
              {focused.controls.map((c) => {
                const open = focusedGaps.includes(c);
                return (
                  <li
                    key={c}
                    className="rounded-lg bg-white/[0.04] px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] leading-5 text-white/70">
                        {CONTROL_LABEL[c]}
                      </span>
                      <span
                        className={`shrink-0 font-mono text-[10px] uppercase ${
                          open ? "text-red-300" : "text-blue-300"
                        }`}
                      >
                        {open ? "gap" : "in place"}
                      </span>
                    </div>
                    {open ? (
                      <>
                        <p className="mt-1.5 text-[10px] leading-4 text-white/40">
                          {CONTROL_WHY[c]}
                        </p>
                        <button
                          type="button"
                          onClick={() => resolveGap(focused.id, c)}
                          className="mt-2 rounded-md border border-white/15 px-2 py-1 font-mono text-[10px] uppercase text-white/60 transition hover:border-blue-300/50 hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
                        >
                          Mark remediated
                        </button>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-auto border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              Why this layer matters
            </p>
            <p className="mt-2 text-[11px] leading-5 text-white/45">
              The study proves the facility can be built. This is the part that decides
              whether it can be sold: capacity and compliance are one decision, not two.
              A tenant you cannot lawfully serve is not revenue, and a megawatt promised
              twice is an outage.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Meter({
  label,
  value,
  pct,
  tone,
  note,
}: {
  label: string;
  value: string;
  pct: number;
  tone: "good" | "warn" | "bad";
  note: string;
}) {
  const bar =
    tone === "bad" ? "bg-red-400" : tone === "warn" ? "bg-red-300" : "bg-blue-300";
  return (
    <div className="bg-[#08070d] px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${bar}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] leading-4 text-white/40">{note}</p>
    </div>
  );
}
