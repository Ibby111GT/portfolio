"use client";

import Image from "next/image";
import { Clock3, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import ExpeditionMapper from "@/components/creative/wildlands/ExpeditionMapper";
import RadioLog from "@/components/creative/wildlands/RadioLog";
import TrailMap, {
  type TrailMapHandle,
} from "@/components/creative/wildlands/TrailMap";
import FieldNotes from "@/components/creative/wildlands/FieldNotes";
import {
  buildExpeditionLog,
  type LogEntry,
} from "@/components/creative/wildlands/expeditionEvents";
import {
  comboKey,
  loadUnlocked,
  saveUnlocked,
} from "@/components/creative/wildlands/fieldNotes";
import {
  TRAIL_ROUTES,
  expeditionDuration,
  type TrailSlug,
  type Weather,
} from "@/components/creative/wildlands/trailData";
import { useRangerAudio } from "@/components/creative/wildlands/useRangerAudio";
import { useRafLoop } from "@/lib/useRafLoop";
import type { CreativeProject } from "@/lib/creativeProjects";

const TRAILS = [
  {
    slug: "ridge-to-river" as TrailSlug,
    name: "Ridge to River",
    distance: 12.6,
    elevation: 2240,
    time: "6–8 hr",
    wildlife: "Bighorn · elk · eagle",
    difficulty: "Expert",
    discovery: "Rangers reopened the overlook after the storm corridor cleared.",
  },
  {
    slug: "old-forest-circuit" as TrailSlug,
    name: "Old Forest Circuit",
    distance: 7.4,
    elevation: 980,
    time: "3–4 hr",
    wildlife: "Black bear · owl · fox",
    difficulty: "Moderate",
    discovery: "A hidden waterfall is now logged as a low-impact rest point.",
  },
  {
    slug: "campground-loop" as TrailSlug,
    name: "Campground Loop",
    distance: 4.8,
    elevation: 420,
    time: "2–3 hr",
    wildlife: "Kit fox · raven · bat",
    difficulty: "Easy",
    discovery: "Visitor flow stayed below the habitat threshold for the full route.",
  },
] as const;

const TRAIL_NAMES: Record<string, string> = Object.fromEntries(
  TRAILS.map((trail) => [trail.slug, trail.name]),
);

const TYPEWRITER_CPS = 45;

type RunPhase = "idle" | "running" | "complete";

export default function AtlasImpossible({
  project,
}: {
  project: CreativeProject;
}) {
  const [trailIndex, setTrailIndex] = useState(0);
  const [weather, setWeather] = useState<Weather>("Clear");
  const [hour, setHour] = useState(17);
  const [runPhase, setRunPhase] = useState<RunPhase>("idle");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [charBudget, setCharBudget] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [unlockedNotes, setUnlockedNotes] = useState<Record<string, string>>({});
  const [activeCombo, setActiveCombo] = useState<string | null>(null);

  const progressRef = useRef(0);
  const durationRef = useRef(10);
  const entriesRef = useRef<LogEntry[]>([]);
  const revealedRef = useRef(0);
  const charsRef = useRef(0);
  const charThrottleRef = useRef(0);
  const pctThrottleRef = useRef(0);
  const mapRef = useRef<TrailMapHandle>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const trail = TRAILS[trailIndex];
  const daylight = hour >= 7 && hour < 19;
  const route = TRAIL_ROUTES[trail.slug];
  const rangerAudio = useRangerAudio(weather);

  useEffect(() => {
    setUnlockedNotes(loadUnlocked());
  }, []);

  const imageFilter = useMemo(() => {
    if (!daylight) {
      return "brightness(0.44) saturate(0.75) hue-rotate(8deg)";
    }
    if (weather === "Storm") {
      return "brightness(0.56) saturate(0.65) contrast(1.1)";
    }
    if (weather === "Snow") {
      return "brightness(1.03) saturate(0.62) contrast(0.94)";
    }
    return "brightness(0.82) saturate(0.95)";
  }, [daylight, weather]);

  const visitorLoad = trailIndex === 2 ? 82 : trailIndex === 1 ? 61 : 38;
  const habitatHealth = Math.max(
    62,
    96 - Math.round(visitorLoad * 0.18) - (weather === "Storm" ? 7 : 0),
  );
  const fireRisk =
    weather === "Storm" || weather === "Snow"
      ? "Low"
      : hour >= 13 && hour <= 18
        ? "Elevated"
        : "Moderate";

  function completeRun() {
    const combo = comboKey(trail.slug, weather);
    setUnlockedNotes((previous) => {
      if (previous[combo]) {
        setActiveCombo(combo);
        return previous;
      }
      const next = { ...previous, [combo]: new Date().toISOString() };
      saveUnlocked(next);
      setActiveCombo(combo);
      return next;
    });
    setRunPhase("complete");
    setProgressPct(100);
  }

  const loop = useRafLoop((dt) => {
    const entries = entriesRef.current;
    const duration = durationRef.current;
    const next = Math.min(1, progressRef.current + dt / duration);
    progressRef.current = next;
    mapRef.current?.setProgress(next);
    if (barRef.current) {
      barRef.current.style.width = `${next * 100}%`;
    }

    // Reveal entries whose trigger point has passed.
    let reveal = revealedRef.current;
    while (reveal < entries.length && entries[reveal].atProgress <= next) {
      reveal += 1;
    }
    if (reveal !== revealedRef.current) {
      revealedRef.current = reveal;
      charsRef.current = 0;
      setRevealedCount(reveal);
      setCharBudget(0);
    }

    // Typewriter for the newest entry, throttled to ~12 updates/s.
    charsRef.current += dt * TYPEWRITER_CPS;
    charThrottleRef.current += dt;
    if (charThrottleRef.current >= 0.08) {
      charThrottleRef.current = 0;
      setCharBudget(Math.floor(charsRef.current));
    }

    pctThrottleRef.current += dt;
    if (pctThrottleRef.current >= 0.2) {
      pctThrottleRef.current = 0;
      setProgressPct(Math.round(next * 100));
    }

    if (next >= 1) {
      loop.stop();
      revealedRef.current = entries.length;
      setRevealedCount(entries.length);
      setCharBudget(Number.MAX_SAFE_INTEGER);
      completeRun();
    }
  });

  function resetRun() {
    loop.stop();
    progressRef.current = 0;
    revealedRef.current = 0;
    charsRef.current = 0;
    entriesRef.current = [];
    setLogEntries([]);
    setRevealedCount(0);
    setCharBudget(0);
    setProgressPct(0);
    setRunPhase("idle");
    setActiveCombo(null);
    mapRef.current?.setProgress(0);
    if (barRef.current) {
      barRef.current.style.width = "0%";
    }
  }

  function beginExpedition() {
    if (loop.running) {
      return;
    }
    rangerAudio.squelch();
    const entries = buildExpeditionLog(
      trail.slug,
      weather,
      hour,
      trail.discovery,
    );
    entriesRef.current = entries;
    setLogEntries(entries);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      progressRef.current = 1;
      revealedRef.current = entries.length;
      setRevealedCount(entries.length);
      setCharBudget(Number.MAX_SAFE_INTEGER);
      mapRef.current?.setProgress(1);
      if (barRef.current) {
        barRef.current.style.width = "100%";
      }
      completeRun();
      return;
    }

    progressRef.current = 0;
    revealedRef.current = 0;
    charsRef.current = 0;
    charThrottleRef.current = 0;
    pctThrottleRef.current = 0;
    durationRef.current = expeditionDuration(trail.distance, weather);
    setRevealedCount(0);
    setCharBudget(0);
    setProgressPct(0);
    setRunPhase("running");
    setActiveCombo(null);
    mapRef.current?.setProgress(0);
    loop.start();
  }

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="relative min-h-[780px] overflow-hidden rounded-3xl border border-white/10">
          <Image
            src="/creative/park-operator.png"
            alt="An isometric national park simulation with a winding river, waterfall, trails, campers, ranger buildings, forest, and changing weather"
            fill
            priority
            sizes="100vw"
            className="object-cover transition-[filter] duration-700"
            style={{ filter: imageFilter }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/20 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

          {weather === "Storm" ? (
            <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:repeating-linear-gradient(105deg,transparent_0_13px,rgba(147,197,253,0.4)_14px,transparent_15px_27px)] animate-[weatherSweep_1.3s_linear_infinite]" />
          ) : null}
          {weather === "Snow" ? (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0_1px,transparent_1.5px)] bg-[size:28px_28px] opacity-55 animate-[snowDrift_7s_linear_infinite]" />
          ) : null}
          {weather === "Clear" && (hour >= 17 || hour <= 6) ? (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {Array.from({ length: 14 }, (_, index) => (
                <span
                  key={index}
                  className="absolute h-1 w-1 rounded-full bg-amber-200 shadow-[0_0_9px_3px_rgba(253,230,138,0.5)] animate-[fireflyDrift_4.5s_ease-in-out_infinite]"
                  style={{
                    left: `${8 + ((index * 17) % 84)}%`,
                    top: `${18 + ((index * 29) % 68)}%`,
                    animationDelay: `${index * -0.37}s`,
                  }}
                />
              ))}
            </div>
          ) : null}

          <TrailMap ref={mapRef} route={route} />

          <div className="relative grid min-h-[780px] lg:grid-cols-[1fr_420px]">
            <div className="flex flex-col justify-between p-7 md:p-12">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
                  Expedition sandbox · live ecosystem
                </p>
                <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.92] tracking-[-0.045em] md:text-8xl">
                  Wilderness
                  <br />
                  Field Console
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-7 text-white/65 md:text-base">
                  Run a small national park as a living system. Balance trail
                  access, visitor load, habitat health, weather, and ranger
                  coverage—then send a field team into the conditions you made.
                </p>
              </div>

              <div className="mt-12 max-w-2xl rounded-2xl border border-white/10 bg-black/45 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                      Ranger radio · channel 3
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      {runPhase === "complete"
                        ? "Route complete · field note filed"
                        : runPhase === "running"
                          ? `Traversing ${trail.name}`
                          : "Awaiting departure"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void rangerAudio.toggle()}
                      aria-pressed={rangerAudio.enabled}
                      aria-label={
                        rangerAudio.enabled
                          ? "Mute ranger radio ambience"
                          : "Enable ranger radio ambience"
                      }
                      className={`rounded-full border p-2 transition-colors ${
                        rangerAudio.enabled
                          ? "border-accent/50 bg-accent-soft text-white"
                          : "border-white/10 text-white/45 hover:text-white"
                      }`}
                    >
                      {rangerAudio.enabled ? (
                        <Volume2 size={15} />
                      ) : (
                        <VolumeX size={15} />
                      )}
                    </button>
                    <span className="font-mono text-xl text-white">
                      {progressPct}%
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    ref={barRef}
                    className={`h-full rounded-full ${
                      weather === "Storm" ? "bg-alert" : "bg-accent"
                    }`}
                    style={{ width: "0%" }}
                  />
                </div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <RadioLog
                    entries={logEntries}
                    revealed={revealedCount}
                    charBudget={charBudget}
                  />
                </div>
              </div>
            </div>

            <aside className="border-t border-white/10 bg-black/55 p-6 backdrop-blur-xl md:p-8 lg:border-l lg:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Park operations
              </p>

              <div className="mt-6 space-y-2">
                {TRAILS.map((option, index) => (
                  <button
                    key={option.name}
                    type="button"
                    aria-pressed={trailIndex === index}
                    onClick={() => {
                      resetRun();
                      setTrailIndex(index);
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                      trailIndex === index
                        ? "border-accent/60 bg-accent-soft"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.name}</span>
                    <span className="mt-1 block text-xs text-white/45">
                      {option.distance} mi · {option.difficulty}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2">
                {(["Clear", "Storm", "Snow"] as Weather[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={weather === option}
                    onClick={() => {
                      resetRun();
                      setWeather(option);
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                      weather === option
                        ? option === "Storm"
                          ? "border-alert/60 bg-alert-soft text-white"
                          : "border-accent/60 bg-accent-soft text-white"
                        : "border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <span className="flex items-center gap-2 text-xs text-white/55">
                  <Clock3 size={13} />
                  Time preset
                </span>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: "Midday", value: 12 },
                    { label: "Dawn", value: 17 },
                    { label: "Night", value: 22 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      aria-pressed={hour === preset.value}
                      onClick={() => {
                        resetRun();
                        setHour(preset.value);
                      }}
                      className={`rounded-lg border px-2 py-2 text-[10px] transition-colors ${
                        hour === preset.value
                          ? "border-accent/60 bg-accent-soft text-white"
                          : "border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-5 block">
                <span className="flex items-center justify-between text-xs text-white/55">
                  <span>Local time</span>
                  <span className="font-mono">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </span>
                <input
                  type="range"
                  min="5"
                  max="23"
                  value={hour}
                  onChange={(event) => {
                    resetRun();
                    setHour(Number(event.target.value));
                  }}
                  className="mt-3 w-full accent-blue-500"
                />
              </label>

              <dl className="mt-8 grid grid-cols-2 gap-3">
                {[
                  ["Visitor load", `${visitorLoad}%`],
                  ["Habitat health", `${habitatHealth}%`],
                  ["Fire risk", fireRisk],
                  ["Visibility", weather === "Clear" ? "Excellent" : "Limited"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <dt className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm text-white/75">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 rounded-xl border border-white/10 p-4">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Likely sightings
                </p>
                <p className="mt-2 text-sm text-white/65">{trail.wildlife}</p>
              </div>

              <button
                type="button"
                onClick={beginExpedition}
                disabled={loop.running}
                className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              >
                {loop.running
                  ? "Expedition underway…"
                  : runPhase === "complete"
                    ? "Run it again"
                    : "Begin expedition"}
              </button>
            </aside>
          </div>
        </div>

        <div className="mt-6">
          <ExpeditionMapper />
        </div>

        <div className="mt-6">
          <FieldNotes
            unlocked={unlockedNotes}
            activeCombo={activeCombo}
            trailNames={TRAIL_NAMES}
          />
        </div>
      </section>
    </CreativeProjectShell>
  );
}
