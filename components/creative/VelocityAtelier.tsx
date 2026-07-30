"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BlueprintBoard from "@/components/creative/BlueprintBoard";
import BlueprintSpatialViewer from "@/components/creative/BlueprintSpatialViewer";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import TelemetryChart, {
  type TelemetryChartHandle,
} from "@/components/creative/testcell/TelemetryChart";
import SpeedGauge, {
  type SpeedGaugeHandle,
} from "@/components/creative/testcell/SpeedGauge";
import {
  createEngineAudio,
  type EngineAudio,
} from "@/components/creative/testcell/engineAudio";
import { exportRunCard } from "@/components/creative/testcell/runCard";
import {
  IDLE_RPM,
  MPH_PER_MS,
  SIM_SCALE,
  simulateFull,
  stepRun,
  toResult,
  createRunState,
  type AeroMode,
  type Milestone,
  type RunResult,
  type RunSample,
  type RunState,
} from "@/components/creative/testcell/physics";
import { useRafLoop } from "@/lib/useRafLoop";
import type { CreativeProject } from "@/lib/creativeProjects";

const PAINTS = [
  { name: "Crimson", color: "#c81e1e", filter: "none" },
  {
    name: "Ion blue",
    color: "#1d4ed8",
    filter: "hue-rotate(210deg) saturate(1.15)",
  },
  {
    name: "Ice white",
    color: "#f5f5f5",
    filter: "grayscale(0.9) brightness(1.08)",
  },
  {
    name: "Obsidian",
    color: "#111111",
    filter: "saturate(0.25) brightness(0.62)",
  },
] as const;

const AERO_MODES = {
  Road: { downforce: 480, range: 344 },
  Track: { downforce: 860, range: 286 },
  Vmax: { downforce: 310, range: 318 },
} as const;

type RunPhase = "idle" | "running" | "complete";

function betterRun(a: RunResult | null, b: RunResult): RunResult {
  if (!a) {
    return b;
  }
  if (a.quarterMileS === null) {
    return b.quarterMileS === null ? a : b;
  }
  if (b.quarterMileS === null) {
    return a;
  }
  return b.quarterMileS < a.quarterMileS ? b : a;
}

export default function VelocityAtelier({
  project,
}: {
  project: CreativeProject;
}) {
  const [paintIndex, setPaintIndex] = useState(0);
  const [aero, setAero] = useState<AeroMode>("Road");
  const [wheelSize, setWheelSize] = useState(21);
  const [runPhase, setRunPhase] = useState<RunPhase>("idle");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [readout, setReadout] = useState({ mph: 0, rpm: IDLE_RPM, gear: 1 });
  const [soundOn, setSoundOn] = useState(false);
  const [lastResult, setLastResult] = useState<RunResult | null>(null);
  const [bestResult, setBestResult] = useState<RunResult | null>(null);
  const [announce, setAnnounce] = useState("");

  const runStateRef = useRef<RunState | null>(null);
  const samplesRef = useRef<RunSample[]>([]);
  const ghostRef = useRef<RunSample[] | null>(null);
  const milestonesRef = useRef<Milestone[]>([]);
  const chartRef = useRef<TelemetryChartHandle>(null);
  const gaugeRef = useRef<SpeedGaugeHandle>(null);
  const audioRef = useRef<EngineAudio | null>(null);
  const readoutAccumRef = useRef(0);

  const paint = PAINTS[paintIndex];
  const spec = AERO_MODES[aero];
  // The physics model is the single source of truth for every displayed
  // number, so the spec strip and the live run can never disagree.
  const predicted = useMemo(() => simulateFull(aero, wheelSize), [aero, wheelSize]);

  useEffect(() => {
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  const loop = useRafLoop((dt) => {
    const state = runStateRef.current;
    if (!state) {
      return;
    }
    const previousGear = state.gear;
    const previousMilestones = state.milestones.length;
    stepRun(state, dt * SIM_SCALE);
    if (state.gear !== previousGear) {
      audioRef.current?.onShift();
    }
    gaugeRef.current?.update(state.v * MPH_PER_MS, state.rpm, state.gear + 1);
    audioRef.current?.update(state.rpm);
    chartRef.current?.draw();

    if (state.milestones.length !== previousMilestones) {
      setMilestones([...state.milestones]);
      setAnnounce(
        state.milestones
          .slice(previousMilestones)
          .map((item) => `${item.label}: ${item.value}`)
          .join(". "),
      );
    }

    readoutAccumRef.current += dt;
    if (readoutAccumRef.current >= 0.1) {
      readoutAccumRef.current = 0;
      setReadout({
        mph: Math.round(state.v * MPH_PER_MS),
        rpm: Math.round(state.rpm),
        gear: state.gear + 1,
      });
    }

    if (state.done) {
      loop.stop();
      audioRef.current?.stopRun();
      const result = toResult(state);
      setLastResult(result);
      setBestResult((previous) => betterRun(previous, result));
      setRunPhase("complete");
      setReadout({
        mph: result.topSpeedMph,
        rpm: Math.round(state.rpm),
        gear: state.gear + 1,
      });
      chartRef.current?.draw();
    }
  });

  function finishInstantly(result: RunResult) {
    runStateRef.current = null;
    samplesRef.current = result.samples;
    milestonesRef.current = result.milestones;
    setMilestones(result.milestones);
    setLastResult(result);
    setBestResult((previous) => betterRun(previous, result));
    setRunPhase("complete");
    const last = result.samples[result.samples.length - 1];
    setReadout({
      mph: result.topSpeedMph,
      rpm: Math.round(last.rpm),
      gear: last.gear,
    });
    gaugeRef.current?.update(result.topSpeedMph, last.rpm, last.gear);
    chartRef.current?.draw();
    setAnnounce(
      `Run complete. ${result.milestones
        .map((item) => `${item.label}: ${item.value}`)
        .join(". ")}`,
    );
  }

  function launchRun() {
    if (loop.running) {
      return;
    }
    ghostRef.current = lastResult ? lastResult.samples : null;
    setAnnounce("Performance run started.");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishInstantly(simulateFull(aero, wheelSize));
      return;
    }

    const state = createRunState(aero, wheelSize);
    runStateRef.current = state;
    samplesRef.current = state.samples;
    milestonesRef.current = state.milestones;
    setMilestones([]);
    setRunPhase("running");
    setReadout({ mph: 0, rpm: IDLE_RPM, gear: 1 });
    readoutAccumRef.current = 0;
    loop.start();
  }

  function abortRun() {
    if (!loop.running) {
      return;
    }
    loop.stop();
    audioRef.current?.stopRun();
    runStateRef.current = null;
    samplesRef.current = [];
    milestonesRef.current = [];
    setMilestones([]);
    setRunPhase("idle");
    setReadout({ mph: 0, rpm: IDLE_RPM, gear: 1 });
    gaugeRef.current?.update(0, IDLE_RPM, 1);
    chartRef.current?.draw();
  }

  function toggleSound() {
    if (!audioRef.current) {
      audioRef.current = createEngineAudio();
    }
    const next = !soundOn;
    setSoundOn(next);
    audioRef.current.setEnabled(next);
  }

  const statusText =
    runPhase === "running"
      ? "Acceleration run in progress"
      : runPhase === "complete"
        ? "Run complete · telemetry captured"
        : "Vehicle staged";

  return (
    <CreativeProjectShell project={project}>
      <div className="mx-auto max-w-7xl space-y-6 px-6 pb-24 md:px-8">
        <BlueprintBoard
          title="Apex Hypercars"
          tagline="APX-01 · form follows airflow"
          blueprintImage="/creative/apex-blueprint.png"
          renderImage="/creative/apex-hypercars.png"
          renderFilter={paint.filter}
          specs={[
            [
              "0–60 mph",
              predicted.zeroToSixtyS
                ? `${predicted.zeroToSixtyS.toFixed(1)}s`
                : "—",
            ],
            ["V-max", `${predicted.topSpeedMph} mph`],
            ["Downforce", `${spec.downforce} kg`],
            ["Structure", "Carbon monocoque"],
          ]}
          history="APX-01 is a fictional mid-engine design study developed from package, cooling, suspension, and aero requirements. The technical board keeps the proportions honest; the editorial render gives the machine its character."
        />
        <BlueprintSpatialViewer system="automotive" />
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#080808]">
          <div className="grid lg:grid-cols-[1fr_0.9fr]">
            <div className="border-b border-white/10 p-7 md:p-10 lg:border-b-0 lg:border-r">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Design configuration
              </p>

              <div className="mt-7">
                <p className="text-xs text-white/45">Paint system</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {PAINTS.map((option, index) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setPaintIndex(index)}
                      aria-pressed={paintIndex === index}
                      className={`flex items-center gap-3 rounded-full border py-2 pl-2 pr-4 text-xs transition-colors ${
                        paintIndex === index
                          ? "border-white/60 bg-white/10 text-white"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-white/25"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.name}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-white/35">
                  Paint retints the render view on the technical board above.
                </p>
              </div>

              <div className="mt-8">
                <p className="text-xs text-white/45">Active aero map</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(Object.keys(AERO_MODES) as AeroMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        abortRun();
                        setAero(mode);
                      }}
                      aria-pressed={aero === mode}
                      className={`rounded-xl border px-4 py-3 text-sm transition-colors ${
                        aero === mode
                          ? "border-alert/60 bg-alert-soft text-white"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  {aero === "Track"
                    ? "Maximum cornering load with aggressive cooling and a short final drive."
                    : aero === "Vmax"
                      ? "Low-drag body position for the highest achievable straight-line speed."
                      : "Balanced road calibration with full range and adaptive ride height."}
                </p>
              </div>

              <label className="mt-8 block">
                <span className="flex justify-between text-xs text-white/45">
                  <span>Wheel diameter</span>
                  <span className="font-mono text-white/70">{wheelSize} in</span>
                </span>
                <input
                  type="range"
                  min="20"
                  max="23"
                  value={wheelSize}
                  onChange={(event) => {
                    abortRun();
                    setWheelSize(Number(event.target.value));
                  }}
                  className="mt-4 w-full accent-red-500"
                />
                <span className="mt-2 block text-[10px] text-white/35">
                  Larger wheels add rotational inertia — watch the splits move.
                </span>
              </label>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-5">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Predicted by the model
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-sm text-white/75">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
                      0–60
                    </p>
                    <p className="mt-1">
                      {predicted.zeroToSixtyS
                        ? `${predicted.zeroToSixtyS.toFixed(1)}s`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
                      ¼ mile
                    </p>
                    <p className="mt-1">
                      {predicted.quarterMileS
                        ? `${predicted.quarterMileS.toFixed(1)}s`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.14em] text-white/35">
                      Top speed
                    </p>
                    <p className="mt-1">{predicted.topSpeedMph} mph</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="bg-white/[0.025] p-7 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                    Test cell
                  </p>
                  <p className="mt-2 text-sm text-white/60">{statusText}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-pressed={soundOn}
                  className={`rounded-full border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                    soundOn
                      ? "border-accent/60 bg-accent-soft text-white"
                      : "border-white/15 text-white/45 hover:text-white"
                  }`}
                >
                  {soundOn ? "Engine audio on" : "Engine audio off"}
                </button>
              </div>

              <div className="mt-6 flex justify-center">
                <SpeedGauge ref={gaugeRef} maxMph={300} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-center text-xs text-white/70">
                <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-white/35">
                    Speed
                  </p>
                  <p className="mt-1">{readout.mph} mph</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-white/35">
                    Engine
                  </p>
                  <p className="mt-1">{readout.rpm} rpm</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/25 p-2">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-white/35">
                    Gear
                  </p>
                  <p className="mt-1">{readout.gear}</p>
                </div>
              </div>

              <div className="mt-6 min-h-[104px] rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Timing splits
                </p>
                {milestones.length === 0 ? (
                  <p className="mt-3 text-xs text-white/40">
                    {runPhase === "running"
                      ? "Waiting for the first split…"
                      : "Launch a run to capture splits."}
                  </p>
                ) : (
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
                    {milestones.map((milestone) => (
                      <li
                        key={milestone.id}
                        className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1"
                      >
                        <span className="text-white/45">{milestone.label}</span>
                        <span className="text-white">{milestone.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={launchRun}
                disabled={loop.running}
                className="mt-6 w-full rounded-full bg-alert px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {loop.running
                  ? "Running…"
                  : runPhase === "complete"
                    ? "Run again"
                    : "Launch performance run"}
              </button>

              {bestResult?.quarterMileS ? (
                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                  Best ¼ mile this session · {bestResult.quarterMileS.toFixed(1)}
                  s ({bestResult.config.aero}, {bestResult.config.wheelSize}
                  ″)
                </p>
              ) : null}
            </aside>
          </div>

          <div className="border-t border-white/10 p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Live telemetry
              </p>
              <div className="flex flex-wrap items-center gap-4 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-6 bg-accent" /> Speed
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-6 bg-alert" /> RPM
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-6 bg-white/30" /> Previous run
                </span>
              </div>
            </div>
            <div className="relative mt-4 h-[240px] md:h-[300px]">
              <TelemetryChart
                ref={chartRef}
                samplesRef={samplesRef}
                ghostRef={ghostRef}
                milestonesRef={milestonesRef}
              />
            </div>
            {runPhase === "complete" && lastResult ? (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-mono text-xs text-white/60">
                  {paint.name} · {lastResult.config.aero} ·{" "}
                  {lastResult.config.wheelSize}″ — {lastResult.topSpeedMph} mph
                  top speed
                  {lastResult.zeroToSixtyS
                    ? ` · 0–60 in ${lastResult.zeroToSixtyS.toFixed(1)}s`
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => exportRunCard(lastResult, paint.name)}
                  className="rounded-full border border-white/15 px-5 py-2 text-xs font-semibold text-white/70 transition-colors hover:text-white"
                >
                  Export run card
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <p aria-live="polite" className="sr-only">
          {announce}
        </p>
      </div>
    </CreativeProjectShell>
  );
}
