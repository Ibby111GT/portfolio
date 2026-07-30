"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DataScenario } from "@/lib/dataScenarios";

type StageState = "idle" | "running" | "complete" | "warning" | "blocked";
type RunStatus =
  | "ready"
  | "running"
  | "healthy"
  | "degraded"
  | "recovering"
  | "recovered";

interface ZoneCounts {
  raw: number;
  validated: number;
  governed: number;
  quarantine: number;
}

const LAYERS = [
  {
    name: "Ingestion",
    label: "Connect",
    description:
      "Pulls API, file, batch, and stream data through explicit source contracts.",
  },
  {
    name: "Storage",
    label: "Protect",
    description:
      "Writes immutable raw records, validated curated tables, and governed serving models.",
  },
  {
    name: "Transformation",
    label: "Model",
    description:
      "Cleans, deduplicates, joins, and tests domain data before publication.",
  },
  {
    name: "Analytics",
    label: "Serve",
    description:
      "Publishes trusted metrics and operational data products for end users.",
  },
  {
    name: "Observability",
    label: "Govern",
    description:
      "Tracks freshness, quality, lineage, access, and compliance across the run.",
  },
] as const;

// Two accents only: red for security subjects, blue for data and systems.
const ACCENTS = {
  blue: {
    active: "border-blue-400/50 bg-blue-400/10",
    text: "text-blue-300",
    dot: "bg-blue-400",
    button: "bg-blue-400 hover:bg-blue-300",
    bar: "bg-blue-400",
  },
  red: {
    active: "border-red-400/50 bg-red-400/10",
    text: "text-red-300",
    dot: "bg-red-400",
    button: "bg-red-400 hover:bg-red-300",
    bar: "bg-red-400",
  },
} as const;

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function DataPipelineLab({
  scenario,
}: {
  scenario: DataScenario;
}) {
  const accent = ACCENTS[scenario.accent];
  const [stages, setStages] = useState<StageState[]>(
    LAYERS.map(() => "idle"),
  );
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [runStatus, setRunStatus] = useState<RunStatus>("ready");
  const [fault, setFault] = useState(false);
  const [recoveredCheck, setRecoveredCheck] = useState(false);
  const [exported, setExported] = useState(false);
  const [zones, setZones] = useState<ZoneCounts>({
    raw: 0,
    validated: 0,
    governed: 0,
    quarantine: 0,
  });
  const [activity, setActivity] = useState<string[]>([
    "Pipeline ready. Source contracts loaded.",
  ]);
  const runToken = useRef(0);

  useEffect(
    () => () => {
      runToken.current += 1;
    },
    [],
  );

  const running = runStatus === "running" || runStatus === "recovering";
  const complete = ["healthy", "degraded", "recovered"].includes(runStatus);
  const quality =
    runStatus === "degraded" ? 75 : complete ? 100 : 0;
  const progress = Math.round(
    (stages.filter((stage) => stage === "complete").length / LAYERS.length) *
      100,
  );
  const runState: Record<RunStatus, string> = {
    ready: fault ? "Test fault armed" : "Ready",
    running: "Processing",
    healthy: "Healthy",
    degraded: "Degraded - publish blocked",
    recovering: "Replaying quarantine",
    recovered: "Recovered",
  };

  const layerDetails = useMemo(
    () => [
      `${scenario.sources.length} connectors validate source contracts before accepting ${scenario.records.toLocaleString()} records.`,
      `${scenario.warehouse} separates immutable raw, validated, and governed serving zones.`,
      scenario.transforms.join(" · "),
      "Metrics use the last verified serving snapshot, preventing bad data from reaching decisions.",
      `${scenario.policy}. ${scenario.controls.join(" · ")}`,
    ],
    [scenario],
  );

  async function runPipeline() {
    if (running) return;
    const token = runToken.current + 1;
    runToken.current = token;
    setRunStatus("running");
    setRecoveredCheck(false);
    setExported(false);
    setProcessed(0);
    setZones({ raw: 0, validated: 0, governed: 0, quarantine: 0 });
    setStages(LAYERS.map(() => "idle"));
    setActivity(["Run started. Validating connector contracts."]);

    for (let index = 0; index < LAYERS.length; index += 1) {
      setSelectedLayer(index);
      setStages((current) =>
        current.map((state, position) =>
          position === index ? "running" : state,
        ),
      );
      await wait(520);
      if (runToken.current !== token) return;

      if (fault && index === 2) {
        const validated =
          scenario.records -
          scenario.quality.duplicates -
          scenario.quality.rejected;
        setStages((current) =>
          current.map((state, position) => {
            if (position === index) return "warning";
            if (position > index) return "blocked";
            return state;
          }),
        );
        setProcessed(validated);
        setZones((current) => ({
          ...current,
          validated,
          quarantine: scenario.quality.quarantine,
        }));
        setActivity((current) => [
          `Publish blocked: ${scenario.fault}.`,
          `${scenario.quality.quarantine.toLocaleString()} records moved to quarantine; trusted serving data was not replaced.`,
          ...current,
        ]);
        setRunStatus("degraded");
        return;
      }

      setStages((current) =>
        current.map((state, position) =>
          position === index ? "complete" : state,
        ),
      );
      setProcessed(Math.round((scenario.records * (index + 1)) / LAYERS.length));
      if (index === 0) {
        setZones((current) => ({ ...current, raw: scenario.records }));
      } else if (index === 1) {
        setZones((current) => ({
          ...current,
          validated:
            scenario.records -
            scenario.quality.duplicates -
            scenario.quality.rejected,
        }));
      } else if (index === 2) {
        setZones((current) => ({
          ...current,
          governed: scenario.quality.goldRows,
        }));
      }
      setActivity((current) => [
        `${LAYERS[index].name}: completed successfully.`,
        ...current,
      ]);
    }

    setProcessed(scenario.records);
    setRunStatus("healthy");
    setActivity((current) => [
      "Run published. All data products are current.",
      ...current,
    ]);
  }

  function injectFault() {
    setFault(true);
    setRecoveredCheck(false);
    setActivity((current) => [
      `Schema fault armed for the next run: ${scenario.fault}.`,
      ...current,
    ]);
  }

  async function resolveFault() {
    if (running || runStatus !== "degraded") return;
    const token = runToken.current + 1;
    runToken.current = token;
    setRunStatus("recovering");
    setActivity((current) => [
      `Applying remediation: ${scenario.faultRemedy}`,
      ...current,
    ]);

    for (let index = 2; index < LAYERS.length; index += 1) {
      setSelectedLayer(index);
      setStages((current) =>
        current.map((state, position) =>
          position === index ? "running" : state,
        ),
      );
      await wait(520);
      if (runToken.current !== token) return;
      setStages((current) =>
        current.map((state, position) =>
          position === index ? "complete" : state,
        ),
      );
      setActivity((current) => [
        `${LAYERS[index].name}: replay completed.`,
        ...current,
      ]);
    }

    setFault(false);
    setRecoveredCheck(true);
    setProcessed(scenario.records);
    setZones((current) => ({
      ...current,
      governed: scenario.quality.goldRows,
      quarantine: 0,
    }));
    setRunStatus("recovered");
    setActivity((current) => [
      "Recovery complete. Quarantined records were replayed and the governed model was republished.",
      ...current,
    ]);
  }

  function exportManifest() {
    const manifest = {
      project: scenario.title,
      domain: scenario.slug,
      state: runState[runStatus],
      processed_records: processed,
      quality_percent: quality,
      zones,
      stage_states: Object.fromEntries(
        LAYERS.map((layer, index) => [layer.name.toLowerCase(), stages[index]]),
      ),
      quality_profile: scenario.quality,
      fault: fault || recoveredCheck ? scenario.fault : null,
      remediation: recoveredCheck ? scenario.faultRemedy : null,
      sources: scenario.sources,
      target_model: scenario.model,
      governance_policy: scenario.policy,
      generated_at: new Date().toISOString(),
    };
    const anchor = document.createElement("a");
    anchor.href = `data:application/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(manifest, null, 2),
    )}`;
    anchor.download = `${scenario.slug}-pipeline-run.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setExported(true);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#07090d] text-white shadow-2xl shadow-black/30">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              fault ? "bg-red-300" : accent.dot
            }`}
          />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              {scenario.warehouse}
            </p>
            <p className="mt-0.5 text-sm font-medium">
              {fault && !["degraded", "recovering"].includes(runStatus)
                ? "Test fault armed"
                : runState[runStatus]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runPipeline}
            disabled={running}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 ${accent.button}`}
          >
            {runStatus === "recovering"
              ? "Recovery running..."
              : runStatus === "running"
                ? "Pipeline running..."
                : complete
                  ? "Run again"
                  : "Run pipeline"}
          </button>
          {!fault ? (
            <button
              type="button"
              onClick={injectFault}
              disabled={running}
              className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/65 transition hover:bg-white/[0.06] disabled:opacity-40"
            >
              Inject schema fault
            </button>
          ) : (
            <button
              type="button"
              onClick={resolveFault}
              disabled={running || runStatus !== "degraded"}
              className="rounded-lg border border-red-300/40 bg-red-300/10 px-4 py-2 text-xs text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
            >
              Apply fix & replay
            </button>
          )}
          <button
            type="button"
            onClick={exportManifest}
            disabled={!complete}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/65 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {exported ? "Manifest downloaded" : "Download run manifest"}
          </button>
        </div>
      </header>

      <div className="grid gap-px bg-white/10 sm:grid-cols-3">
        {scenario.sources.map((source) => (
          <div key={source.name} className="bg-[#0b0e13] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{source.name}</p>
              <span className="font-mono text-[9px] uppercase text-white/35">
                {source.cadence}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-white/40">
              {source.kind} · {source.volume.toLocaleString()} records
            </p>
          </div>
        ))}
      </div>

      <div className="p-4 md:p-6">
        <div className="grid gap-2 lg:grid-cols-5">
          {LAYERS.map((layer, index) => {
            const state = stages[index];
            return (
              <button
                key={layer.name}
                type="button"
                onClick={() => setSelectedLayer(index)}
                className={`min-h-28 rounded-xl border p-4 text-left transition ${
                  selectedLayer === index
                    ? accent.active
                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-white/30">
                    0{index + 1}
                  </span>
                  <StageIndicator state={state} accent={accent.dot} />
                </div>
                <p className="mt-5 text-sm font-medium">{layer.name}</p>
                <p className="mt-1 text-[11px] text-white/40">{layer.label}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <p className="max-w-3xl text-xs leading-5 text-white/55">
            <span className={`mr-2 font-medium ${accent.text}`}>
              {LAYERS[selectedLayer].name}
            </span>
            {layerDetails[selectedLayer]}
          </p>
          <span className="font-mono text-[10px] text-white/35">
            {progress}% complete
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                  Published data products
                </p>
                <h2 className="mt-1 text-lg font-medium">{scenario.model}</h2>
              </div>
              <p className="font-mono text-xs text-white/45">
                {processed.toLocaleString()} records
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Raw", zones.raw],
                ["Validated", zones.validated],
                ["Governed", zones.governed],
                ["Quarantine", zones.quarantine],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.07] px-3 py-2.5">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/70">
                    {Number(value).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {scenario.metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg bg-white/[0.04] p-4">
                  <p className="text-xs text-white/45">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {complete ? metric.value : "--"}
                  </p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {complete ? metric.context : "Available after run"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="font-mono text-[9px] uppercase tracking-wider text-white/30">
                  <tr>
                    <th className="pb-2 font-normal">{scenario.previewLabels.entity}</th>
                    <th className="pb-2 font-normal">Source</th>
                    <th className="pb-2 font-normal">Status</th>
                    <th className="pb-2 text-right font-normal">{scenario.previewLabels.score}</th>
                  </tr>
                </thead>
                <tbody>
                  {scenario.preview.map((row) => (
                    <tr key={row.entity} className="border-t border-white/[0.07]">
                      <td className="py-3 font-mono text-white/75">{row.entity}</td>
                      <td className="py-3 text-white/45">{row.source}</td>
                      <td className="py-3 text-white/60">
                        {complete ? row.status : "Pending"}
                      </td>
                      <td className="py-3 text-right font-mono text-white/55">
                        {complete ? `${row.score}%` : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                  Quality and governance
                </p>
                <span
                  className={`font-mono text-xs ${
                    fault ? "text-red-200" : accent.text
                  }`}
                >
                  {complete ? `${quality}%` : "Not evaluated"}
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-500 ${
                    fault ? "bg-red-300" : accent.bar
                  }`}
                  style={{ width: `${quality}%` }}
                />
              </div>
              <ul className="mt-4 space-y-3">
                {scenario.checks.map((check, index) => {
                  const failed =
                    runStatus === "degraded" &&
                    index === scenario.faultCheckIndex;
                  const held =
                    runStatus === "degraded" &&
                    index > scenario.faultCheckIndex;
                  const recovered =
                    recoveredCheck && index === scenario.faultCheckIndex;
                  return (
                    <li key={check} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-white/55">{check}</span>
                      <span
                        className={`font-mono text-[9px] ${
                          failed
                            ? "text-red-200"
                            : held
                              ? "text-white/30"
                              : recovered
                                ? "text-blue-200"
                            : complete
                              ? accent.text
                              : "text-white/25"
                        }`}
                      >
                        {failed
                          ? "FAIL"
                          : held
                            ? "HELD"
                            : recovered
                              ? "RECOVERED"
                              : complete
                                ? "PASS"
                                : "WAIT"}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-white/35">
                Policy: {scenario.policy}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                Run activity
              </p>
              <ol className="mt-4 space-y-3">
                {activity.slice(0, 5).map((item, index) => (
                  <li key={`${item}-${index}`} className="flex gap-3 text-[11px] leading-5 text-white/45">
                    <span className="font-mono text-white/20">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StageIndicator({
  state,
  accent,
}: {
  state: StageState;
  accent: string;
}) {
  if (state === "running") {
    return <span className="h-2 w-2 animate-pulse rounded-full bg-white" />;
  }
  if (state === "warning") {
    return <span className="h-2 w-2 rounded-full bg-red-300" />;
  }
  if (state === "complete") {
    return <span className={`h-2 w-2 rounded-full ${accent}`} />;
  }
  return <span className="h-2 w-2 rounded-full bg-white/15" />;
}
