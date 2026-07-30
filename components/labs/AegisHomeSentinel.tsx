"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  Bluetooth,
  CheckCircle2,
  Eye,
  FileJson,
  Home,
  Link2,
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
  rssi: number | null;
  confidence: number;
  lastSeen: number;
}

type DataMode = "demo" | "bluetooth" | "import";

interface BrowserBluetoothDevice {
  id: string;
  name?: string;
  gatt?: {
    connect(): Promise<{
      connected: boolean;
      getPrimaryService(name: string): Promise<{
        getCharacteristic(name: string): Promise<{
          readValue(): Promise<DataView>;
        }>;
      }>;
    }>;
  };
}

interface BluetoothNavigator extends Navigator {
  bluetooth?: {
    requestDevice(options: {
      acceptAllDevices: boolean;
      optionalServices: string[];
    }): Promise<BrowserBluetoothDevice>;
  };
}

interface SentinelEvent {
  id: number;
  second: number;
  kind: EventKind;
  title: string;
  detail: string;
  severity: "info" | "review" | "high";
}

const FLOORPLANS = {
  "Open loft": [
  { id: "entry", label: "Entry", x: 4, y: 8, w: 27, h: 34 },
  { id: "living", label: "Living room", x: 33, y: 8, w: 63, h: 50 },
  { id: "office", label: "Office", x: 4, y: 45, w: 27, h: 48 },
  { id: "kitchen", label: "Kitchen", x: 33, y: 61, w: 34, h: 32 },
  { id: "bedroom", label: "Bedroom", x: 69, y: 61, w: 27, h: 32 },
  ],
  "Long ranch": [
    { id: "entry", label: "Entry", x: 4, y: 8, w: 18, h: 84 },
    { id: "living", label: "Living room", x: 24, y: 8, w: 32, h: 40 },
    { id: "office", label: "Office", x: 58, y: 8, w: 38, h: 40 },
    { id: "kitchen", label: "Kitchen", x: 24, y: 51, w: 32, h: 41 },
    { id: "bedroom", label: "Bedroom", x: 58, y: 51, w: 38, h: 41 },
  ],
  "Split studio": [
    { id: "entry", label: "Entry", x: 4, y: 8, w: 22, h: 28 },
    { id: "living", label: "Living room", x: 28, y: 8, w: 68, h: 40 },
    { id: "office", label: "Office", x: 4, y: 39, w: 22, h: 53 },
    { id: "kitchen", label: "Kitchen", x: 28, y: 51, w: 30, h: 41 },
    { id: "bedroom", label: "Bedroom", x: 60, y: 51, w: 36, h: 41 },
  ],
} as const;
type FloorplanName = keyof typeof FLOORPLANS;
const ZONES = FLOORPLANS["Open loft"];

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
  trusted: "border-blue-300/45 bg-blue-300/10 text-blue-200",
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
  const [dataMode, setDataMode] = useState<DataMode>("demo");
  const [connectionStatus, setConnectionStatus] = useState(
    "Demo data is running. Choose a live input when you are ready.",
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [floorplan, setFloorplan] = useState<FloorplanName>("Open loft");
  const [router, setRouter] = useState({ x: 47, y: 43 });
  const [dragging, setDragging] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const nextEventId = useRef(3);
  const zones = FLOORPLANS[floorplan];

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
          const walking = dataMode === "demo" && index < 2;
          const x = walking
            ? Math.max(7, Math.min(93, device.x + Math.sin((second + index * 11) / 5) * 0.38))
            : device.x;
          const y = walking
            ? Math.max(11, Math.min(90, device.y + Math.cos((second + index * 13) / 6) * 0.28))
            : device.y;
          const distance = Math.max(1, Math.hypot(x - router.x, y - router.y) / 5);
          const wallPenalty = device.zone === "living" ? 0 : 7;
          const physicalRssi = Math.round(-31 - 20 * Math.log10(distance) - wallPenalty);
          return {
            ...device,
            x,
            y,
            rssi:
              device.rssi === null
                ? null
                : dataMode === "demo"
                  ? physicalRssi
                  : device.rssi,
            lastSeen: Math.max(0, Math.round(Math.abs(Math.sin(second + index)))),
          };
        }),
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [dataMode, router.x, router.y, running, second]);

  const selected = devices.find((device) => device.id === selectedId) ?? devices[0];
  const visibleEvents = events.filter(
    (event) => second - event.second <= retention * 60,
  );
  const unknownCount = devices.filter(
    (device) =>
      device.state !== "trusted" && device.confidence >= sensitivity,
  ).length;
  const risk = Math.min(
    100,
    unknownCount * 31 +
      visibleEvents.filter((event) => event.severity === "high").length * 18,
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
    setDataMode("demo");
    setConnectionStatus(
      "Demo data is running. Choose a live input when you are ready.",
    );
    setRouter({ x: 47, y: 43 });
  }

  function positionFromPointer(clientX: number, clientY: number) {
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: Math.max(3, Math.min(97, ((clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(5, Math.min(95, ((clientY - bounds.top) / bounds.height) * 100)),
    };
  }

  function zoneAt(x: number, y: number) {
    return (
      zones.find(
        (zone) =>
          x >= zone.x &&
          x <= zone.x + zone.w &&
          y >= zone.y &&
          y <= zone.y + zone.h,
      )?.id ?? "boundary"
    );
  }

  function dragDevice(id: string, clientX: number, clientY: number) {
    const point = positionFromPointer(clientX, clientY);
    if (!point) return;
    setDevices((current) =>
      current.map((device) =>
        device.id === id
          ? { ...device, ...point, zone: zoneAt(point.x, point.y) }
          : device,
      ),
    );
  }

  async function connectBluetooth() {
    const bluetooth = (navigator as BluetoothNavigator).bluetooth;
    if (!bluetooth) {
      setConnectionStatus(
        "Web Bluetooth is unavailable here. Use Chrome or Edge on desktop, or import authorized telemetry instead.",
      );
      return;
    }

    setIsConnecting(true);
    setConnectionStatus("Waiting for you to choose a Bluetooth device…");
    try {
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["battery_service", "device_information"],
      });
      let battery: number | null = null;
      let connected = false;
      if (device.gatt) {
        try {
          const server = await device.gatt.connect();
          connected = server.connected;
          const service = await server.getPrimaryService("battery_service");
          const characteristic =
            await service.getCharacteristic("battery_level");
          const value = await characteristic.readValue();
          battery = value.getUint8(0);
        } catch {
          // A granted BLE device may not expose GATT or the optional battery
          // service. Permission is still real and worth representing.
        }
      }
      const alias = `live-${device.id.slice(-6) || Date.now()}`;
      const liveDevice: Device = {
        id: alias,
        label: device.name?.trim() || "Permitted BLE device",
        kind: "ble",
        state: "trusted",
        zone: "entry",
        x: 23,
        y: 31,
        rssi: null,
        confidence: connected ? 99 : 90,
        lastSeen: 0,
      };
      setDevices((current) => [
        ...current.filter((item) => !item.id.startsWith("live-")),
        liveDevice,
      ]);
      setSelectedId(liveDevice.id);
      setDataMode("bluetooth");
      setConnectionStatus(
        `Live permission granted${connected ? " and GATT connected" : ""}${battery === null ? "" : ` · battery ${battery}%`}. Browser Bluetooth does not expose ambient RSSI.`,
      );
      addEvent({
        kind: "policy",
        title: "Permitted Bluetooth device added",
        detail:
          "The browser chooser supplied this device after explicit approval. No passive scan or person-level identity was performed.",
        severity: "info",
      });
    } catch (error) {
      const name =
        error instanceof DOMException ? error.name : "ConnectionError";
      setConnectionStatus(
        name === "NotFoundError"
          ? "No device was selected. Nothing was connected or stored."
          : "The Bluetooth request did not complete. You can retry or import telemetry.",
      );
    } finally {
      setIsConnecting(false);
    }
  }

  async function importTelemetry(file: File) {
    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error("Telemetry must be an array");
      }
      const imported = parsed.slice(0, 30).map((entry, index): Device => {
        if (!entry || typeof entry !== "object") {
          throw new Error("Invalid telemetry record");
        }
        const record = entry as Record<string, unknown>;
        const kind: SignalKind =
          record.kind === "wifi" || record.kind === "csi" ? record.kind : "ble";
        const state: DeviceState =
          record.state === "unknown" || record.state === "watch"
            ? record.state
            : "trusted";
        return {
          id: `import-${index + 1}`,
          label:
            typeof record.label === "string"
              ? record.label.slice(0, 42)
              : `Imported signal ${index + 1}`,
          kind,
          state,
          zone:
            typeof record.zone === "string" &&
            ZONES.some((zone) => zone.id === record.zone)
              ? record.zone
              : "entry",
          x:
            typeof record.x === "number"
              ? Math.max(6, Math.min(94, record.x))
              : 12 + (index * 13) % 76,
          y:
            typeof record.y === "number"
              ? Math.max(10, Math.min(91, record.y))
              : 20 + (index * 17) % 64,
          rssi:
            typeof record.rssi === "number"
              ? Math.max(-120, Math.min(-1, Math.round(record.rssi)))
              : null,
          confidence:
            typeof record.confidence === "number"
              ? Math.max(1, Math.min(100, Math.round(record.confidence)))
              : 80,
          lastSeen: 0,
        };
      });
      if (!imported.length) throw new Error("No telemetry records");
      setDevices(imported);
      setSelectedId(imported[0].id);
      setDataMode("import");
      setConnectionStatus(
        `${imported.length} authorized records loaded locally from ${file.name}. The file was not uploaded.`,
      );
      addEvent({
        kind: "policy",
        title: "Authorized telemetry imported",
        detail: `${imported.length} local records replaced the demonstration dataset. Raw file contents remain in this browser session.`,
        severity: "info",
      });
    } catch {
      setConnectionStatus(
        "That file could not be read. Use a JSON array with label, kind, state, zone, x, y, rssi, and confidence fields.",
      );
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
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
              <span className="grid h-9 w-9 place-items-center rounded-full border border-blue-300/25 bg-blue-300/10 text-blue-200"><ShieldCheck size={18} /></span>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-blue-200/65">
                Authorized RF sensing lab · {dataMode === "demo" ? "demo telemetry" : dataMode === "bluetooth" ? "permitted Bluetooth" : "imported telemetry"}
              </p>
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[7.5rem] lg:leading-[0.82]">
              AEGIS<span className="text-blue-300">/</span>HOME
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/48 md:text-lg">
              A privacy-first wireless sensing command center for learning how consented Wi‑Fi, Bluetooth, and CSI telemetry can reveal presence and environmental change—without pretending a browser can secretly identify people.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:w-80">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">System posture</p>
              <span className={`h-2 w-2 rounded-full ${risk ? "bg-amber-300" : "bg-blue-300"}`} />
            </div>
            <p className="mt-5 text-2xl font-semibold">{status}</p>
            <p className="mt-2 text-xs leading-5 text-white/40">Risk is an explainable simulation score, never a claim that a person was identified.</p>
          </div>
        </header>

        <section className="mt-10 rounded-[1.75rem] border border-blue-300/20 bg-blue-300/[0.035] p-5 md:p-6" aria-labelledby="live-input-title">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-blue-200/55">Choose the data source</p>
              <h2 id="live-input-title" className="mt-2 text-xl font-semibold">Demo, a device you permit, or your own sensor export.</h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/42">
                A public website cannot silently map your house. A real session must begin with your Bluetooth permission or a local JSON export from sensors you own.
              </p>
              <p className="mt-3 font-mono text-[10px] text-blue-100/60" role="status" aria-live="polite">{connectionStatus}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={connectBluetooth} disabled={isConnecting} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-300 px-4 py-2 text-xs font-semibold text-black disabled:cursor-wait disabled:opacity-55">
                <Bluetooth size={14} /> {isConnecting ? "Waiting for chooser…" : "Connect permitted BLE device"}
              </button>
              <button type="button" onClick={() => importRef.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/65 hover:bg-white/[0.05]">
                <FileJson size={14} /> Import authorized JSON
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                aria-label="Import authorized telemetry JSON"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importTelemetry(file);
                }}
              />
            </div>
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d0b]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-7">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setRunning((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-white/60 hover:bg-white/[0.05]" aria-label={running ? "Pause telemetry" : "Resume telemetry"}>
                {running ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-white/55">Session {running ? "streaming" : "paused"}</p>
                <p className="mt-1 font-mono text-[9px] text-white/25">T+{String(second).padStart(3, "0")}s · {dataMode === "demo" ? "demonstration" : dataMode === "bluetooth" ? "permitted device" : "local import"}</p>
              </div>
            </div>
            <div role="tablist" aria-label="Detection mode" className="flex rounded-full border border-white/10 bg-black/25 p-1">
              {(["presence", "change"] as const).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => setMode(item)} className={`rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] ${mode === item ? "bg-white text-black" : "text-white/40"}`}>
                  {item === "presence" ? "Presence map" : "Room-change map"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Floorplan</span>
              <select value={floorplan} onChange={(event) => setFloorplan(event.target.value as FloorplanName)} className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs text-white/70">
                {(Object.keys(FLOORPLANS) as FloorplanName[]).map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="p-4 md:p-7">
              <div ref={mapRef} className="relative min-h-[660px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07100d]" role="img" aria-label="Interactive floor plan showing deterministic wireless signals">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(110,231,183,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(110,231,183,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
                {zones.map((zone) => (
                  <button type="button" key={zone.id} onClick={() => setConnectionStatus(`${zone.label}: click or drag a signal marker into this room to recompute its distance, wall loss, and zone.`)} className="absolute border border-white/12 bg-white/[0.018] text-left transition-colors hover:bg-blue-400/[0.04]" style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }} aria-label={`Inspect ${zone.label}`}>
                    <span className="absolute left-3 top-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/24">{zone.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Move home router"
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 touch-none"
                  style={{ left: `${router.x}%`, top: `${router.y}%` }}
                  onPointerDown={(event) => { setDragging("router"); event.currentTarget.setPointerCapture(event.pointerId); }}
                  onPointerMove={(event) => { if (dragging === "router") { const point = positionFromPointer(event.clientX, event.clientY); if (point) setRouter(point); } }}
                  onPointerUp={() => setDragging(null)}
                >
                  <div className="absolute -inset-20 animate-ping rounded-full border border-blue-300/10 [animation-duration:3s]" />
                  <div className="relative grid h-11 w-11 place-items-center rounded-full border border-blue-300/40 bg-blue-300/10 text-blue-200"><Radio size={18} /></div>
                  <span className="absolute left-1/2 top-12 min-w-max -translate-x-1/2 rounded bg-black/75 px-2 py-1 font-mono text-[8px] text-white/55">Drag router</span>
                </button>
                <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/55 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/45 backdrop-blur">
                  Select a signal marker to inspect it
                </div>

                {mode === "change" ? (
                  <div className="absolute left-[34%] top-[62%] h-[29%] w-[32%] overflow-hidden rounded-xl border border-amber-300/30 bg-amber-300/[0.06]">
                    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,.22),transparent_58%)]" />
                    <p className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.15em] text-amber-200/65">Δ attenuation {100 - baseline}%</p>
                  </div>
                ) : null}

                {devices.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => setSelectedId(device.id)}
                    onPointerDown={(event) => { setDragging(device.id); event.currentTarget.setPointerCapture(event.pointerId); }}
                    onPointerMove={(event) => { if (dragging === device.id) dragDevice(device.id, event.clientX, event.clientY); }}
                    onPointerUp={() => setDragging(null)}
                    aria-label={`Inspect and drag ${device.label}`}
                    className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 touch-none transition-all duration-150"
                    style={{ left: `${device.x}%`, top: `${device.y}%` }}
                  >
                    <span className={`absolute left-1/2 top-1/2 -z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-25 ${device.state === "unknown" ? "animate-ping border-rose-300" : "border-blue-300"}`} />
                    <span className={`grid h-10 w-10 place-items-center rounded-full border shadow-[0_0_28px_rgba(52,211,153,.12)] ${STATE_STYLE[device.state]} ${selectedId === device.id ? "ring-2 ring-white/45 ring-offset-4 ring-offset-[#07100d]" : ""}`}>
                      {device.kind === "wifi" ? <Wifi size={15} /> : device.kind === "ble" ? <Bluetooth size={15} /> : <Activity size={15} />}
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-12 min-w-max -translate-x-1/2 rounded-md bg-black/75 px-2 py-1 font-mono text-[8px] text-white/55 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">{device.label}</span>
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
                    <Datum label="Zone" value={zones.find((zone) => zone.id === selected.zone)?.label ?? selected.zone} />
                    <Datum label="RSSI" value={selected.rssi === null ? "Not exposed" : `${selected.rssi} dBm`} />
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
                  <input type="range" min="20" max="95" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} className="mt-3 w-full accent-blue-300" />
                  <span className="mt-2 block text-[10px] leading-5 text-white/35">Only non-trusted signals at or above this confidence change the review score.</span>
                </label>
                <label className="mt-6 block">
                  <span className="flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>Session retention</span><span>{retention} min</span></span>
                  <input type="range" min="0" max="60" step="5" value={retention} onChange={(event) => setRetention(Number(event.target.value))} className="mt-3 w-full accent-blue-300" />
                  <span className="mt-2 block text-[10px] leading-5 text-white/35">Events older than this session window are removed automatically.</span>
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
              {visibleEvents.map((event) => (
                <div key={event.id} className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-xl border border-white/8 bg-white/[0.018] p-4">
                  <span className={`mt-1 h-2 w-2 rounded-full ${event.severity === "high" ? "bg-rose-400" : event.severity === "review" ? "bg-amber-300" : "bg-blue-300"}`} />
                  <div><p className="text-xs font-semibold text-white/75">{event.title}</p><p className="mt-1.5 text-[11px] leading-5 text-white/35">{event.detail}</p></div>
                  <span className="font-mono text-[8px] text-white/25">T+{event.second}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-blue-300/15 bg-blue-300/[0.035] p-6">
              <div className="flex items-center gap-3 text-blue-200"><CheckCircle2 size={18} /><h2 className="font-semibold">Privacy contract</h2></div>
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
                  <li key={number} className="grid grid-cols-[28px_1fr] gap-3"><span className="font-mono text-[9px] text-blue-200/55">{number}</span><div><p className="text-xs font-semibold text-white/70">{title}</p><p className="mt-1 text-[11px] leading-5 text-white/35">{detail}</p></div></li>
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
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-start gap-3">
              <Link2 size={17} className="mt-0.5 shrink-0 text-blue-200/60" />
              <div>
                <p className="text-sm font-semibold text-white/70">How to use this with a real house</p>
                <p className="mt-2 text-xs leading-6 text-white/40">
                  Use the Bluetooth button for a device you explicitly choose. For room-level telemetry, export privacy-minimized JSON from your own Home Assistant, Kismet, ESP32, or CSI collection pipeline and import it here. The browser keeps the file local and displays only session aliases.
                </p>
              </div>
            </div>
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
  return <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left hover:border-blue-300/25 hover:bg-blue-300/[0.035]"><span className="text-blue-200/60">{icon}</span><span><span className="block text-xs font-semibold text-white/65">{label}</span><span className="mt-1 block text-[10px] text-white/30">{detail}</span></span></button>;
}

function Boundary({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"><p className="text-sm font-semibold text-white/70">{title}</p><p className="mt-3 text-xs leading-6 text-white/38">{body}</p></div>;
}
