"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Bluetooth,
  CheckCircle2,
  Eye,
  Home,
  Pause,
  Play,
  Radio,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wifi,
} from "lucide-react";

type SignalKind = "wifi" | "ble" | "csi";
type DeviceState = "trusted" | "unknown" | "watch";
type EventKind = "arrival" | "movement" | "object" | "policy";

interface Device {
  id: string;
  label: string;
  kind: SignalKind;
  state: DeviceState;
  zone: string;
  x: number;
  y: number;
  rssi: number;
  confidence: number;
  lastSeen: number;
}

interface SentinelEvent {
  id: number;
  second: number;
  kind: EventKind;
  title: string;
  detail: string;
  severity: "info" | "review" | "high";
}

const ZONES = [
  { id: "entry", label: "Entry", x: 4, y: 8, w: 27, h: 34 },
  { id: "living", label: "Living room", x: 33, y: 8, w: 63, h: 50 },
  { id: "office", label: "Office", x: 4, y: 45, w: 27, h: 48 },
  { id: "kitchen", label: "Kitchen", x: 33, y: 61, w: 34, h: 32 },
  { id: "bedroom", label: "Bedroom", x: 69, y: 61, w: 27, h: 32 },
] as const;

const BASE_DEVICES: Device[] = [
  { id: "d-01", label: "Resident phone", kind: "wifi", state: "trusted", zone: "living", x: 58, y: 30, rssi: -46, confidence: 97, lastSeen: 0 },
  { id: "d-02", label: "Fitness band", kind: "ble", state: "trusted", zone: "living", x: 52, y: 38, rssi: -55, confidence: 91, lastSeen: 0 },
  { id: "d-03", label: "Work laptop", kind: "wifi", state: "trusted", zone: "office", x: 17, y: 68, rssi: -39, confidence: 99, lastSeen: 0 },
  { id: "d-04", label: "Kitchen beacon", kind: "ble", state: "trusted", zone: "kitchen", x: 48, y: 77, rssi: -61, confidence: 88, lastSeen: 0 },
];

const INITIAL_EVENTS: SentinelEvent[] = [
  { id: 1, second: 0, kind: "policy", title: "Privacy boundary active", detail: "Identifiers are session aliases; raw addresses are neither retained nor displayed.", severity: "info" },
  { id: 2, second: 0, kind: "policy", title: "Baseline loaded", detail: "Five authorized zones and four consented devices are represented.", severity: "info" },
];

const STATE_STYLE: Record<DeviceState, string> = {
  trusted: "border-emerald-300/45 bg-emerald-300/10 text-emerald-200",
  unknown: "border-rose-300/55 bg-rose-300/12 text-rose-200",
  watch: "border-amber-300/55 bg-amber-300/10 text-amber-200",
};

export default function AegisHomeSentinel() {
  const [devices, setDevices] = useState<Device[]>(BASE_DEVICES);
  const [events, setEvents] = useState<SentinelEvent[]>(INITIAL_EVENTS);
  const [running, setRunning] = useState(true);
  const [second, setSecond] = useState(0);
  const [sensitivity, setSensitivity] = useState(68);
  const [retention, setRetention] = useState(15);
  const [selectedId, setSelectedId] = useState<string>("d-01");
  const [mode, setMode] = useState<"presence" | "change">("presence");
  const [baseline, setBaseline] = useState(92);
  const [occupancy, setOccupancy] = useState<number[]>([34, 38, 36, 40, 39, 42, 43, 45, 42, 44, 46, 45]);
  const nextEventId = useRef(3);

  const addEvent = (
    event: Omit<SentinelEvent, "id" | "second">,
  ) => {
    setEvents((current) => [
      { ...event, id: nextEventId.current++, second },
      ...current,
    ].slice(0, 12));
  };

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecond((value) => value + 1);
      setDevices((current) =>
        current.map((device, index) => {
          const drift = Math.sin((second + index * 7) / 4) * 1.8;
          return {
            ...device,
            rssi: Math.round(device.rssi + drift * 0.12),
            lastSeen: Math.max(0, Math.round(Math.abs(Math.sin(second + index)))),
          };
        }),
      );
      setOccupancy((current) => [
        ...current.slice(1),
        Math.max(8, Math.min(96, current[current.length - 1] + Math.round(Math.sin(second / 2) * 4))),
      ]);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, second]);

  const selected = devices.find((device) => device.id === selectedId) ?? devices[0];
  const unknownCount = devices.filter((device) => device.state !== "trusted").length;
  const risk = Math.min(
    100,
    unknownCount * 31 + events.filter((event) => event.severity === "high").length * 18,
  );
  const status = risk >= 60 ? "Review now" : risk > 0 ? "Review suggested" : "Nominal";

  const confidence = useMemo(
    () =>
      devices.length
        ? Math.round(devices.reduce((sum, device) => sum + device.confidence, 0) / devices.length)
        : 0,
    [devices],
  );

  function injectUnknown() {
    const exists = devices.some((device) => device.id === "unknown-01");
    if (exists) {
      setSelectedId("unknown-01");
      return;
    }
    const stranger: Device = {
      id: "unknown-01",
      label: "Unrecognized signal",
      kind: "ble",
      state: "unknown",
      zone: "entry",
      x: 20,
      y: 25,
      rssi: -51,
      confidence: 84,
      lastSeen: 0,
    };
    setDevices((current) => [...current, stranger]);
    setSelectedId(stranger.id);
    addEvent({
      kind: "arrival",
      title: "Unknown BLE signal entered",
      detail: "A rotating session alias crossed the entry threshold. Identity is intentionally unresolved.",
      severity: "high",
    });
  }

  function simulateMovement() {
    setDevices((current) =>
      current.map((device) =>
        device.id === selectedId
          ? {
              ...device,
              x: device.zone === "living" ? 78 : 57,
              y: device.zone === "living" ? 75 : 30,
              zone: device.zone === "living" ? "bedroom" : "living",
              state: device.state === "trusted" ? "watch" : device.state,
              confidence: Math.min(99, device.confidence + 2),
            }
          : device,
      ),
    );
    addEvent({
      kind: "movement",
      title: `${selected?.label ?? "Signal"} changed zones`,
      detail: "A sustained RSSI trend crossed the hysteresis boundary; a single noisy sample would not trigger this.",
      severity: selected?.state === "trusted" ? "review" : "high",
    });
  }

  function simulateObjectChange() {
    setMode("change");
    setBaseline((value) => Math.max(43, value - 24));
    setOccupancy((current) => current.map((value, index) => index > 7 ? value + 22 : value));
    addEvent({
      kind: "object",
      title: "Room baseline changed",
      detail: "The kitchen path shows sustained attenuation. This indicates a radio-environment change, not an identified object.",
      severity: "review",
    });
  }

  function recalibrate() {
    setBaseline(96);
    setEvents(INITIAL_EVENTS);
    setDevices(BASE_DEVICES);
    setSelectedId("d-01");
    setSecond(0);
    nextEventId.current = 3;
  }

  return (
    <main className="min-h-screen bg-[#050807] px-4 pb-28 pt-28 text-white sm:px-6 md:pt-32">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/projects#interactive-labs" className="font-mono text-xs uppercase tracking-[0.18em] text-white/45 hover:text-white">
          &lt;- All projects
        </Link>

        <header className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/10 text-emerald-200"><ShieldCheck size={18} /></span>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-200/65">Authorized RF sensing lab · synthetic telemetry</p>
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[7.5rem] lg:leading-[0.82]">
              AEGIS<span className="text-emerald-300">/</span>HOME
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/48 md:text-lg">
              A privacy-first wireless sensing command center for learning how consented Wi‑Fi, Bluetooth, and CSI telemetry can reveal presence and environmental change—without pretending a browser can secretly identify people.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:w-80">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">System posture</p>
              <span className={`h-2 w-2 rounded-full ${risk ? "bg-amber-300" : "bg-emerald-300"}`} />
            </div>
            <p className="mt-5 text-2xl font-semibold">{status}</p>
            <p className="mt-2 text-xs leading-5 text-white/40">Risk is an explainable simulation score, never a claim that a person was identified.</p>
          </div>
        </header>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d0b]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-7">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRunning((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-white/60 hover:bg-white/[0.05]" aria-label={running ? "Pause telemetry" : "Resume telemetry"}>
                {running ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-white/55">Session {running ? "streaming" : "paused"}</p>
                <p className="mt-1 font-mono text-[9px] text-white/25">T+{String(second).padStart(3, "0")}s · local demonstration</p>
              </div>
            </div>
            <div role="tablist" aria-label="Detection mode" className="flex rounded-full border border-white/10 bg-black/25 p-1">
              {(["presence", "change"] as const).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => setMode(item)} className={`rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] ${mode === item ? "bg-white text-black" : "text-white/40"}`}>
                  {item === "presence" ? "Presence map" : "Room-change map"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="p-4 md:p-7">
              <div className="relative min-h-[660px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07100d]" role="img" aria-label="Interactive floor plan showing synthetic wireless signals">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(110,231,183,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(110,231,183,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
                {ZONES.map((zone) => (
                  <div key={zone.id} className="absolute border border-white/12 bg-white/[0.018]" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}>
                    <span className="absolute left-3 top-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/24">{zone.label}</span>
                  </div>
                ))}
                <div className="absolute left-[47%] top-[43%]">
                  <div className="absolute -inset-20 animate-ping rounded-full border border-emerald-300/10 [animation-duration:3s]" />
                  <div className="relative grid h-11 w-11 place-items-center rounded-full border border-emerald-300/40 bg-emerald-300/10 text-emerald-200"><Radio size={18} /></div>
                </div>

                {mode === "change" ? (
                  <div className="absolute left-[34%] top-[62%] h-[29%] w-[32%] overflow-hidden rounded-xl border border-amber-300/30 bg-amber-300/[0.06]">
                    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,.22),transparent_58%)]" />
                    <p className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.15em] text-amber-200/65">Δ attenuation {100 - baseline}%</p>
                  </div>
                ) : null}

                {devices.map((device) => (
                  <button key={device.id} type="button" onClick={() => setSelectedId(device.id)} aria-label={`Inspect ${device.label}`} className="group absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700" style={{ left: `${device.x}%`, top: `${device.y}%` }}>
                    <span className={`absolute left-1/2 top-1/2 -z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-25 ${device.state === "unknown" ? "animate-ping border-rose-300" : "border-emerald-300"}`} />
                    <span className={`grid h-10 w-10 place-items-center rounded-full border shadow-[0_0_28px_rgba(52,211,153,.12)] ${STATE_STYLE[device.state]} ${selectedId === device.id ? "ring-2 ring-white/45 ring-offset-4 ring-offset-[#07100d]" : ""}`}>
                      {device.kind === "wifi" ? <Wifi size={15} /> : device.kind === "ble" ? <Bluetooth size={15} /> : <Activity size={15} />}
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-12 min-w-max -translate-x-1/2 rounded-md bg-black/75 px-2 py-1 font-mono text-[8px] text-white/55 opacity-0 transition-opacity group-hover:opacity-100">{device.label}</span>
                  </button>
                ))}

                <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 md:inset-x-6 md:grid-cols-6">
                  <Metric label="Signals" value={String(devices.length)} />
                  <Metric label="Unknown" value={String(unknownCount)} alert={unknownCount > 0} />
                  <Metric label="Confidence" value={`${confidence}%`} />
                  <Metric label="Baseline" value={`${baseline}%`} />
                  <Metric label="Retention" value={`${retention}m`} />
                  <Metric label="Raw IDs" value="0" />
                </div>
              </div>
            </div>

            <aside className="border-t border-white/10 p-5 md:p-7 xl:border-l xl:border-t-0">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Signal inspector</p>
              {selected ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-semibold">{selected.label}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-white/30">session alias {selected.id}</p></div>
                    <span className={`rounded-full border px-2 py-1 font-mono text-[8px] uppercase ${STATE_STYLE[selected.state]}`}>{selected.state}</span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    <Datum label="Modality" value={selected.kind.toUpperCase()} />
                    <Datum label="Zone" value={ZONES.find((zone) => zone.id === selected.zone)?.label ?? selected.zone} />
                    <Datum label="RSSI" value={`${selected.rssi} dBm`} />
                    <Datum label="Confidence" value={`${selected.confidence}%`} />
                    <Datum label="Last seen" value={`${selected.lastSeen}s`} />
                    <Datum label="Identity" value="Not inferred" />
                  </dl>
                </div>
              ) : null}

              <p className="mt-7 font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Run a safe scenario</p>
              <div className="mt-3 grid gap-2">
                <Scenario icon={<TriangleAlert size={15} />} label="Unknown signal arrives" detail="Add an unidentified, rotating BLE alias" onClick={injectUnknown} />
                <Scenario icon={<Activity size={15} />} label="Signal changes rooms" detail="Test trend and zone-transition logic" onClick={simulateMovement} />
                <Scenario icon={<Home size={15} />} label="Room baseline changes" detail="Model sustained obstruction or reflection" onClick={simulateObjectChange} />
              </div>

              <div className="mt-7 border-t border-white/10 pt-6">
                <label className="block">
                  <span className="flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>Detection sensitivity</span><span>{sensitivity}%</span></span>
                  <input type="range" min="20" max="95" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} className="mt-3 w-full accent-emerald-300" />
                </label>
                <label className="mt-6 block">
                  <span className="flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>Session retention</span><span>{retention} min</span></span>
                  <input type="range" min="0" max="60" step="5" value={retention} onChange={(event) => setRetention(Number(event.target.value))} className="mt-3 w-full accent-emerald-300" />
                </label>
              </div>
              <button type="button" onClick={recalibrate} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-3 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">
                <RefreshCw size={13} /> Recalibrate safe baseline
              </button>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#090d0b] p-5 md:p-7">
            <div className="flex items-center justify-between">
              <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Decision timeline</p><h2 className="mt-2 text-xl font-semibold">What the sentinel noticed</h2></div>
              <Eye size={18} className="text-white/25" />
            </div>
            <div className="mt-6 space-y-3" aria-live="polite">
              {events.map((event) => (
                <div key={event.id} className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-xl border border-white/8 bg-white/[0.018] p-4">
                  <span className={`mt-1 h-2 w-2 rounded-full ${event.severity === "high" ? "bg-rose-400" : event.severity === "review" ? "bg-amber-300" : "bg-emerald-300"}`} />
                  <div><p className="text-xs font-semibold text-white/75">{event.title}</p><p className="mt-1.5 text-[11px] leading-5 text-white/35">{event.detail}</p></div>
                  <span className="font-mono text-[8px] text-white/25">T+{event.second}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-emerald-300/15 bg-emerald-300/[0.035] p-6">
              <div className="flex items-center gap-3 text-emerald-200"><CheckCircle2 size={18} /><h2 className="font-semibold">Privacy contract</h2></div>
              <ul className="mt-5 space-y-3 text-xs leading-6 text-white/45">
                <li>Explicit opt-in for every real Bluetooth connection.</li>
                <li>Session aliases replace raw hardware addresses.</li>
                <li>No face, name, or person-level identity inference.</li>
                <li>Short, user-controlled local retention by default.</li>
                <li>Alerts explain the evidence and uncertainty.</li>
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#090d0b] p-6">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Research-to-product architecture</p>
              <ol className="mt-5 space-y-4">
                {[
                  ["01", "Authorized sensors", "Consented BLE devices, owned-network telemetry, or compatible CSI hardware."],
                  ["02", "Privacy transform", "Rotate aliases, discard payloads, minimize retention, and enforce an allowlist."],
                  ["03", "Feature pipeline", "Smooth RSSI/CSI trends, compare baselines, and require sustained evidence."],
                  ["04", "Explainable policy", "Convert anomalies into reviewable events—not claims about identity."],
                ].map(([number, title, detail]) => (
                  <li key={number} className="grid grid-cols-[28px_1fr] gap-3"><span className="font-mono text-[9px] text-emerald-200/55">{number}</span><div><p className="text-xs font-semibold text-white/70">{title}</p><p className="mt-1 text-[11px] leading-5 text-white/35">{detail}</p></div></li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mt-20 border-t border-white/10 pt-14">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">Technical boundary</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight">A credible prototype says what it cannot do.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Boundary title="Browser Bluetooth" body="A website can interact only with BLE peripherals the visitor explicitly chooses and permits. It is not a silent ambient scanner." />
            <Boundary title="Wi‑Fi CSI" body="Fine-grained channel sensing requires compatible chipsets, firmware, transmitters, calibration, and a controlled environment." />
            <Boundary title="Object inference" body="Attenuation can show that the radio environment changed. Material or object identity needs labeled data and cannot be assumed from RSSI alone." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className="rounded-xl border border-white/10 bg-black/65 px-3 py-3 backdrop-blur"><p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/30">{label}</p><p className={`mt-2 font-mono text-sm ${alert ? "text-rose-300" : "text-white/70"}`}>{value}</p></div>;
}

function Datum({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/28">{label}</dt><dd className="mt-1.5 text-xs text-white/65">{value}</dd></div>;
}

function Scenario({ icon, label, detail, onClick }: { icon: ReactNode; label: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left hover:border-emerald-300/25 hover:bg-emerald-300/[0.035]"><span className="text-emerald-200/60">{icon}</span><span><span className="block text-xs font-semibold text-white/65">{label}</span><span className="mt-1 block text-[10px] text-white/30">{detail}</span></span></button>;
}

function Boundary({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"><p className="text-sm font-semibold text-white/70">{title}</p><p className="mt-3 text-xs leading-6 text-white/38">{body}</p></div>;
}
