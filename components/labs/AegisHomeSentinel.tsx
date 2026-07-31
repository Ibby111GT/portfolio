"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { ControlRange, StageButton } from "@/components/creative/stage/controls";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

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
  /** Real ticks elapsed since this signal last changed zones. */
  lastSeen: number;
  /** Demo walkers wander between zones; static markers do not. */
  mobile: boolean;
  /** Zone label a walker is currently heading toward, if any. */
  destination: string | null;
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

interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  attenuationDb: number;
}

interface Point {
  x: number;
  y: number;
}

interface WalkerState {
  random: () => number;
  targetX: number;
  targetY: number;
  targetZone: string;
  dwell: number;
  scripted: boolean;
}

type Inspection =
  | { type: "device"; id: string }
  | { type: "zone"; id: string }
  | { type: "router" };

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
type Zone = (typeof FLOORPLANS)[FloorplanName][number];

/**
 * Interior walls per floorplan, as segments in the same 0-100 percent space
 * as the zones. Gaps between segments are doorways. RSSI honestly subtracts
 * the attenuation of every wall the device-to-router path crosses.
 */
const WALLS: Record<FloorplanName, Wall[]> = {
  "Open loft": [
    { x1: 32, y1: 8, x2: 32, y2: 38, attenuationDb: 5 },
    { x1: 32, y1: 46, x2: 32, y2: 93, attenuationDb: 6 },
    { x1: 4, y1: 43.5, x2: 24, y2: 43.5, attenuationDb: 4 },
    { x1: 33, y1: 59.5, x2: 58, y2: 59.5, attenuationDb: 5 },
    { x1: 71, y1: 59.5, x2: 96, y2: 59.5, attenuationDb: 5 },
    { x1: 68, y1: 68, x2: 68, y2: 93, attenuationDb: 3 },
  ],
  "Long ranch": [
    { x1: 23, y1: 8, x2: 23, y2: 68, attenuationDb: 6 },
    { x1: 57, y1: 8, x2: 57, y2: 34, attenuationDb: 4 },
    { x1: 24, y1: 49.5, x2: 44, y2: 49.5, attenuationDb: 5 },
    { x1: 58, y1: 49.5, x2: 82, y2: 49.5, attenuationDb: 5 },
    { x1: 57, y1: 51, x2: 57, y2: 76, attenuationDb: 3 },
  ],
  "Split studio": [
    { x1: 27, y1: 8, x2: 27, y2: 28, attenuationDb: 5 },
    { x1: 4, y1: 37.5, x2: 20, y2: 37.5, attenuationDb: 4 },
    { x1: 27, y1: 42, x2: 27, y2: 92, attenuationDb: 6 },
    { x1: 28, y1: 49.5, x2: 48, y2: 49.5, attenuationDb: 5 },
    { x1: 62, y1: 49.5, x2: 96, y2: 49.5, attenuationDb: 5 },
    { x1: 59, y1: 58, x2: 59, y2: 92, attenuationDb: 3 },
  ],
};

const DEVICE_SEEDS: Array<{
  id: string;
  label: string;
  kind: SignalKind;
  state: DeviceState;
  zone: string;
  mobile: boolean;
}> = [
  { id: "d-01", label: "Resident phone", kind: "wifi", state: "trusted", zone: "living", mobile: true },
  { id: "d-02", label: "Fitness band", kind: "ble", state: "trusted", zone: "living", mobile: true },
  { id: "d-03", label: "Work laptop", kind: "wifi", state: "trusted", zone: "office", mobile: false },
  { id: "d-04", label: "Kitchen beacon", kind: "ble", state: "trusted", zone: "kitchen", mobile: false },
];

const INITIAL_EVENTS: SentinelEvent[] = [
  { id: 1, second: 0, kind: "policy", title: "Privacy boundary active", detail: "Identifiers are session aliases; raw addresses are neither retained nor displayed.", severity: "info" },
  { id: 2, second: 0, kind: "policy", title: "Baseline loaded", detail: "Five authorized zones and four consented devices are represented.", severity: "info" },
];

const STATE_STYLE: Record<DeviceState, string> = {
  trusted: "border-accent/45 bg-accent-soft text-accent",
  unknown: "border-alert/55 bg-alert-soft text-alert",
  watch: "border-alert/40 bg-alert-soft text-white/75",
};

const DEMO_STATUS = "Demo data is running. Choose a live input when you are ready.";

function orientation(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function segmentsCross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const o1 = orientation(ax, ay, bx, by, cx, cy);
  const o2 = orientation(ax, ay, bx, by, dx, dy);
  const o3 = orientation(cx, cy, dx, dy, ax, ay);
  const o4 = orientation(cx, cy, dx, dy, bx, by);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

function wallsCrossed(x1: number, y1: number, x2: number, y2: number, walls: Wall[]): Wall[] {
  return walls.filter((wall) => segmentsCross(x1, y1, x2, y2, wall.x1, wall.y1, wall.x2, wall.y2));
}

function wallLossBetween(x1: number, y1: number, x2: number, y2: number, walls: Wall[]): number {
  return wallsCrossed(x1, y1, x2, y2, walls).reduce((sum, wall) => sum + wall.attenuationDb, 0);
}

function zoneAtIn(zones: readonly Zone[], x: number, y: number): string {
  const hit = zones.find(
    (zone) => x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h,
  );
  return hit ? hit.id : "boundary";
}

function zoneLabelIn(zones: readonly Zone[], zoneId: string): string {
  const hit = zones.find((zone) => zone.id === zoneId);
  return hit ? hit.label : "Boundary";
}

function adjacentZones(zones: readonly Zone[], zoneId: string): Zone[] {
  const current = zones.find((zone) => zone.id === zoneId);
  if (!current) {
    return [...zones];
  }
  return zones.filter((zone) => {
    if (zone.id === zoneId) {
      return false;
    }
    const gapX = Math.max(zone.x - (current.x + current.w), current.x - (zone.x + zone.w));
    const gapY = Math.max(zone.y - (current.y + current.h), current.y - (zone.y + zone.h));
    return gapX <= 4 && gapY <= 4;
  });
}

function seededPointIn(zone: Zone, random: () => number): Point {
  return {
    x: zone.x + zone.w * (0.25 + random() * 0.5),
    y: zone.y + zone.h * (0.25 + random() * 0.5),
  };
}

/** Monotone map from RSSI to display confidence: stronger signal, higher confidence. */
function confidenceFromRssi(rssi: number): number {
  return Math.max(20, Math.min(99, Math.round(99 + (rssi + 40) * 1.3)));
}

/** Live BLE and imported records carry real (or absent) measurements; only demo markers are simulated. */
function isSimulated(device: Device): boolean {
  if (device.rssi === null) {
    return false;
  }
  return !device.id.startsWith("import-") && !device.id.startsWith("live-");
}

/** Log-distance path loss plus per-wall attenuation along the router path. */
function withPhysics(device: Device, routerPoint: Point, walls: Wall[]): Device {
  if (!isSimulated(device)) {
    return device;
  }
  const meters = Math.max(1, Math.hypot(device.x - routerPoint.x, device.y - routerPoint.y) / 5);
  const loss = wallLossBetween(device.x, device.y, routerPoint.x, routerPoint.y, walls);
  const rssi = Math.max(-95, Math.min(-28, Math.round(-31 - 20 * Math.log10(meters) - loss)));
  return { ...device, rssi, confidence: confidenceFromRssi(rssi) };
}

/** Deterministic router + device layout for a floorplan; same plan, same layout. */
function seedLayout(plan: FloorplanName): { router: Point; devices: Device[] } {
  const zones = FLOORPLANS[plan];
  const walls = WALLS[plan];
  const random = mulberry32(hashSeed(`aegis-layout-${plan}`));
  const living = zones.find((zone) => zone.id === "living") ?? zones[0];
  const router = seededPointIn(living, random);
  const devices = DEVICE_SEEDS.map((seed) => {
    const zone = zones.find((item) => item.id === seed.zone) ?? zones[0];
    const point = seededPointIn(zone, random);
    const base: Device = {
      id: seed.id,
      label: seed.label,
      kind: seed.kind,
      state: seed.state,
      zone: zone.id,
      x: point.x,
      y: point.y,
      rssi: -50,
      confidence: 50,
      lastSeen: 0,
      mobile: seed.mobile,
      destination: null,
    };
    return withPhysics(base, router, walls);
  });
  return { router, devices };
}

function pickWalkTarget(walker: WalkerState, zones: readonly Zone[], currentZone: string): void {
  const options = zones.filter((zone) => zone.id !== currentZone);
  const pool = options.length > 0 ? options : [...zones];
  const index = Math.min(Math.floor(walker.random() * pool.length), pool.length - 1);
  const zone = pool[index];
  walker.targetZone = zone.id;
  walker.targetX = zone.x + zone.w * (0.4 + walker.random() * 0.2);
  walker.targetY = zone.y + zone.h * (0.4 + walker.random() * 0.2);
}

/** Delete events older than the retention window, then keep the newest 12. */
function pruneEvents(list: SentinelEvent[], clock: number, retentionMinutes: number): SentinelEvent[] {
  const horizon = retentionMinutes * 60;
  return list.filter((event) => clock - event.second <= horizon).slice(0, 12);
}

export default function AegisHomeSentinel() {
  const reducedMotion = usePrefersReducedMotion();
  const [floorplan, setFloorplan] = useState<FloorplanName>("Open loft");
  const [devices, setDevices] = useState<Device[]>(() => seedLayout("Open loft").devices);
  const [router, setRouter] = useState<Point>(() => seedLayout("Open loft").router);
  const [events, setEvents] = useState<SentinelEvent[]>(INITIAL_EVENTS);
  const [running, setRunning] = useState(true);
  const [second, setSecond] = useState(0);
  const [sensitivity, setSensitivity] = useState(68);
  const [retention, setRetention] = useState(15);
  const [inspection, setInspection] = useState<Inspection>({ type: "device", id: "d-01" });
  const [mode, setMode] = useState<"presence" | "change">("presence");
  const [baseline, setBaseline] = useState(92);
  const [dataMode, setDataMode] = useState<DataMode>("demo");
  const [connectionStatus, setConnectionStatus] = useState(DEMO_STATUS);
  const [isConnecting, setIsConnecting] = useState(false);
  const [announce, setAnnounce] = useState("Select any marker, room, or the router to inspect it.");
  const [dragging, setDragging] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const nextEventId = useRef(3);

  // Geometry and clock mirrors: the single 1 Hz interval reads these refs so
  // router drags, plan switches, and slider moves never tear it down.
  const devicesRef = useRef<Device[]>(devices);
  const routerRef = useRef<Point>(router);
  const floorplanRef = useRef<FloorplanName>(floorplan);
  const sensitivityRef = useRef(sensitivity);
  const retentionRef = useRef(retention);
  const secondRef = useRef(second);
  const walkersRef = useRef<Record<string, WalkerState>>({});
  const rssiHistoryRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    devicesRef.current = devices;
    routerRef.current = router;
    floorplanRef.current = floorplan;
    sensitivityRef.current = sensitivity;
    retentionRef.current = retention;
    secondRef.current = second;
  });

  const zones = FLOORPLANS[floorplan];
  const walls = WALLS[floorplan];
  const kitchenZone = zones.find((zone) => zone.id === "kitchen") ?? null;

  function commitDevices(next: Device[]) {
    devicesRef.current = next;
    setDevices(next);
  }

  const addEvent = (event: Omit<SentinelEvent, "id" | "second">) => {
    const stamped: SentinelEvent = { ...event, id: nextEventId.current, second: secondRef.current };
    nextEventId.current += 1;
    const clock = secondRef.current;
    const horizonMinutes = retentionRef.current;
    setEvents((current) => pruneEvents([stamped, ...current], clock, horizonMinutes));
  };

  /**
   * Advance the deterministic simulation by whole ticks. Walkers step toward
   * seeded targets, zones are recomputed from geometry, RSSI follows the
   * distance + wall model, and sensitivity gates which events get created.
   */
  const advanceSimulation = useCallback((tickCount: number, sourceMode: DataMode) => {
    const plan = floorplanRef.current;
    const zonesNow = FLOORPLANS[plan];
    const wallsNow = WALLS[plan];
    const routerNow = routerRef.current;
    const isDemo = sourceMode === "demo";
    const sensitivityNow = sensitivityRef.current;
    const trendThreshold = (100 - sensitivityNow) / 4;
    const created: Array<Omit<SentinelEvent, "id">> = [];
    let announcement = "";
    let clock = secondRef.current;
    let working = devicesRef.current;
    for (let tick = 0; tick < tickCount; tick += 1) {
      clock += 1;
      working = working.map((device) => {
        const next = { ...device };
        let walker = walkersRef.current[device.id];
        const eligible = walker?.scripted === true || (isDemo && device.mobile);
        if (eligible) {
          if (!walker) {
            walker = {
              random: mulberry32(hashSeed(`aegis-walk-${plan}-${device.id}`)),
              targetX: next.x,
              targetY: next.y,
              targetZone: next.zone,
              dwell: 0,
              scripted: false,
            };
            pickWalkTarget(walker, zonesNow, next.zone);
            next.destination = zoneLabelIn(zonesNow, walker.targetZone);
            walkersRef.current[device.id] = walker;
          }
          if (walker.dwell > 0) {
            walker.dwell -= 1;
            if (walker.dwell === 0) {
              pickWalkTarget(walker, zonesNow, next.zone);
              next.destination = zoneLabelIn(zonesNow, walker.targetZone);
            }
          } else {
            const dx = walker.targetX - next.x;
            const dy = walker.targetY - next.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 1.2) {
              if (walker.scripted && !(isDemo && device.mobile)) {
                delete walkersRef.current[device.id];
              } else {
                walker.scripted = false;
                walker.dwell = 20 + Math.floor(walker.random() * 41);
              }
              next.destination = null;
            } else {
              const step = Math.min(distance, 1.3);
              next.x += (dx / distance) * step;
              next.y += (dy / distance) * step;
            }
          }
        }
        const zoneNow = zoneAtIn(zonesNow, next.x, next.y);
        if (zoneNow !== device.zone) {
          next.zone = zoneNow;
          next.lastSeen = 0;
          const scriptedArrival = walker?.scripted === true && walker.targetZone === zoneNow;
          if (scriptedArrival && device.state === "trusted") {
            next.state = "watch";
          }
          if (zoneNow !== "boundary") {
            const fromLabel = zoneLabelIn(zonesNow, device.zone);
            const toLabel = zoneLabelIn(zonesNow, zoneNow);
            if (device.state !== "trusted") {
              created.push({ kind: "movement", second: clock, title: `${device.label} changed zones`, detail: `Moved from ${fromLabel} to ${toLabel}. Non-trusted signals always log zone changes.`, severity: "high" });
              announcement = `${device.label} moved from ${fromLabel} to ${toLabel}.`;
            } else if (sensitivityNow >= 60) {
              created.push({ kind: "movement", second: clock, title: `${device.label} changed zones`, detail: `Walked from ${fromLabel} to ${toLabel}; RSSI now reflects the new distance and wall path.`, severity: "review" });
              announcement = `${device.label} moved from ${fromLabel} to ${toLabel}.`;
            }
          }
        } else {
          next.lastSeen = device.lastSeen + 1;
        }
        const settled = withPhysics(next, routerNow, wallsNow);
        if (isSimulated(settled) && settled.rssi !== null) {
          const history = rssiHistoryRef.current[device.id] ?? [];
          history.push(settled.rssi);
          if (history.length > 6) {
            history.shift();
          }
          rssiHistoryRef.current[device.id] = history;
          if (history.length === 6) {
            let rising = true;
            let falling = true;
            for (let index = 1; index < history.length; index += 1) {
              const delta = history[index] - history[index - 1];
              if (delta < 0) {
                rising = false;
              }
              if (delta > 0) {
                falling = false;
              }
            }
            const total = history[5] - history[0];
            if ((rising || falling) && total !== 0 && Math.abs(total) > trendThreshold) {
              created.push({ kind: "movement", second: clock, title: `Sustained RSSI trend: ${settled.label}`, detail: `${Math.abs(total)} dB ${total > 0 ? "rise" : "drop"} across 5 ticks cleared the ${trendThreshold.toFixed(1)} dB gate set by sensitivity.`, severity: settled.state === "trusted" ? "review" : "high" });
              rssiHistoryRef.current[device.id] = [history[5]];
            }
          }
        }
        return settled;
      });
    }
    secondRef.current = clock;
    devicesRef.current = working;
    setSecond(clock);
    setDevices(working);
    const horizonMinutes = retentionRef.current;
    if (created.length > 0) {
      const stamped = created.map((event) => {
        const id = nextEventId.current;
        nextEventId.current += 1;
        return { ...event, id };
      });
      stamped.reverse();
      setEvents((current) => pruneEvents([...stamped, ...current], clock, horizonMinutes));
    } else {
      setEvents((current) => pruneEvents(current, clock, horizonMinutes));
    }
    if (announcement) {
      setAnnounce(announcement);
    }
  }, []);

  // One interval per (running, dataMode, reducedMotion). Geometry lives in
  // refs, so router drags and plan switches never freeze or restart time.
  useEffect(() => {
    if (!running || reducedMotion) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      advanceSimulation(1, dataMode);
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [advanceSimulation, dataMode, reducedMotion, running]);

  const inspectedDevice =
    inspection.type === "device"
      ? devices.find((device) => device.id === inspection.id) ?? devices[0] ?? null
      : null;
  const inspectedZone =
    inspection.type === "zone"
      ? zones.find((zone) => zone.id === inspection.id) ?? null
      : null;
  const zoneOccupants = inspectedZone
    ? devices.filter((device) => device.zone === inspectedZone.id)
    : [];
  const meanZoneAttenuation =
    zoneOccupants.length > 0
      ? zoneOccupants.reduce((sum, device) => sum + wallLossBetween(device.x, device.y, router.x, router.y, walls), 0) / zoneOccupants.length
      : null;
  const inspectorTitle =
    inspection.type === "device"
      ? "Signal inspector"
      : inspection.type === "zone"
        ? "Zone inspector"
        : "Router link budget";

  const unknownCount = devices.filter(
    (device) => device.state !== "trusted" && device.confidence >= sensitivity,
  ).length;
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

  function positionFromPointer(clientX: number, clientY: number): Point | null {
    const bounds = mapRef.current?.getBoundingClientRect();
    if (!bounds) {
      return null;
    }
    return {
      x: Math.max(3, Math.min(97, ((clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(5, Math.min(95, ((clientY - bounds.top) / bounds.height) * 100)),
    };
  }

  function moveDevice(id: string, x: number, y: number) {
    const plan = floorplanRef.current;
    const zonesNow = FLOORPLANS[plan];
    const wallsNow = WALLS[plan];
    const routerNow = routerRef.current;
    const next = devicesRef.current.map((device) => {
      if (device.id !== id) {
        return device;
      }
      const zone = zoneAtIn(zonesNow, x, y);
      const moved = { ...device, x, y, zone, lastSeen: zone === device.zone ? device.lastSeen : 0 };
      return withPhysics(moved, routerNow, wallsNow);
    });
    commitDevices(next);
  }

  function moveRouter(x: number, y: number) {
    const point = { x, y };
    routerRef.current = point;
    setRouter(point);
    const wallsNow = WALLS[floorplanRef.current];
    commitDevices(devicesRef.current.map((device) => withPhysics(device, point, wallsNow)));
  }

  function dragDevice(id: string, clientX: number, clientY: number) {
    const point = positionFromPointer(clientX, clientY);
    if (!point) {
      return;
    }
    moveDevice(id, point.x, point.y);
  }

  function applyFloorplan(name: FloorplanName) {
    setFloorplan(name);
    floorplanRef.current = name;
    const layout = seedLayout(name);
    routerRef.current = layout.router;
    setRouter(layout.router);
    const zonesNow = FLOORPLANS[name];
    const wallsNow = WALLS[name];
    const next = devicesRef.current.map((device) => {
      const random = mulberry32(hashSeed(`aegis-snap-${name}-${device.id}`));
      const zone = zonesNow.find((item) => item.id === device.zone) ?? zonesNow[0];
      const point = seededPointIn(zone, random);
      const snapped = { ...device, x: point.x, y: point.y, zone: zone.id, lastSeen: 0, destination: null };
      return withPhysics(snapped, layout.router, wallsNow);
    });
    commitDevices(next);
    walkersRef.current = {};
    rssiHistoryRef.current = {};
    setAnnounce(`${name} floorplan applied — router and signals snapped to seeded positions.`);
  }

  function injectUnknown() {
    if (devicesRef.current.some((device) => device.id === "unknown-01")) {
      setInspection({ type: "device", id: "unknown-01" });
      setAnnounce("Unknown signal is already present — selected it in the inspector.");
      return;
    }
    const plan = floorplanRef.current;
    const zonesNow = FLOORPLANS[plan];
    const entry = zonesNow.find((zone) => zone.id === "entry") ?? zonesNow[0];
    const random = mulberry32(hashSeed(`aegis-unknown-${plan}`));
    const point = seededPointIn(entry, random);
    const base: Device = {
      id: "unknown-01",
      label: "Unrecognized signal",
      kind: "ble",
      state: "unknown",
      zone: entry.id,
      x: point.x,
      y: point.y,
      rssi: -50,
      confidence: 50,
      lastSeen: 0,
      mobile: false,
      destination: null,
    };
    const stranger = withPhysics(base, routerRef.current, WALLS[plan]);
    commitDevices([...devicesRef.current, stranger]);
    setInspection({ type: "device", id: stranger.id });
    addEvent({
      kind: "arrival",
      title: "Unknown BLE signal entered",
      detail: "A rotating session alias crossed the entry threshold. Identity is intentionally unresolved.",
      severity: "high",
    });
    setAnnounce(`Unknown signal appeared in the ${entry.label.toLowerCase()}.`);
  }

  function simulateMovement() {
    const target = inspectedDevice ?? devices[0];
    if (!target) {
      setAnnounce("No signals are available to move.");
      return;
    }
    const plan = floorplanRef.current;
    const zonesNow = FLOORPLANS[plan];
    const neighbours = adjacentZones(zonesNow, target.zone);
    const pool = neighbours.length > 0 ? neighbours : zonesNow.filter((zone) => zone.id !== target.zone);
    const scenarioRandom = mulberry32(hashSeed(`aegis-scenario-${plan}-${target.id}-${secondRef.current}`));
    const index = Math.min(Math.floor(scenarioRandom() * pool.length), pool.length - 1);
    const zone = pool[index];
    const existing = walkersRef.current[target.id];
    const walkRandom = existing ? existing.random : mulberry32(hashSeed(`aegis-walk-${plan}-${target.id}`));
    walkersRef.current[target.id] = {
      random: walkRandom,
      targetZone: zone.id,
      targetX: zone.x + zone.w * (0.4 + scenarioRandom() * 0.2),
      targetY: zone.y + zone.h * (0.4 + scenarioRandom() * 0.2),
      dwell: 0,
      scripted: true,
    };
    commitDevices(
      devicesRef.current.map((device) =>
        device.id === target.id ? { ...device, destination: zone.label } : device,
      ),
    );
    setInspection({ type: "device", id: target.id });
    addEvent({
      kind: "movement",
      title: `${target.label} started a scripted walk`,
      detail: `Heading to the ${zone.label.toLowerCase()}; the zone-change event fires when the walk actually crosses into it.`,
      severity: "info",
    });
    setAnnounce(
      `${target.label} is walking to the ${zone.label.toLowerCase()}. ${reducedMotion ? "Use the Advance buttons to step the walk." : "Watch the map as ticks arrive."}`,
    );
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
    setAnnounce("Room-change overlay armed over the kitchen zone of the active floorplan.");
  }

  function recalibrate() {
    const plan = floorplanRef.current;
    const layout = seedLayout(plan);
    routerRef.current = layout.router;
    setRouter(layout.router);
    commitDevices(layout.devices);
    walkersRef.current = {};
    rssiHistoryRef.current = {};
    secondRef.current = 0;
    setSecond(0);
    setEvents(INITIAL_EVENTS);
    nextEventId.current = 3;
    setBaseline(96);
    setMode("presence");
    setDataMode("demo");
    setInspection({ type: "device", id: layout.devices[0]?.id ?? "d-01" });
    setConnectionStatus(DEMO_STATUS);
    setAnnounce("Baseline recalibrated; the demo layout was reseeded deterministically.");
  }

  function updateSensitivity(value: number) {
    setSensitivity(value);
    sensitivityRef.current = value;
  }

  function updateRetention(value: number) {
    setRetention(value);
    retentionRef.current = value;
    const clock = secondRef.current;
    setEvents((current) => pruneEvents(current, clock, value));
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
          const characteristic = await service.getCharacteristic("battery_level");
          const value = await characteristic.readValue();
          battery = value.getUint8(0);
        } catch {
          // A granted BLE device may not expose GATT or the optional battery
          // service. Permission is still real and worth representing.
        }
      }
      const fallbackAlias = hashSeed(device.name ?? "ble-device").toString(16).slice(0, 6);
      const alias = `live-${device.id.slice(-6) || fallbackAlias}`;
      const plan = floorplanRef.current;
      const zonesNow = FLOORPLANS[plan];
      const entry = zonesNow.find((zone) => zone.id === "entry") ?? zonesNow[0];
      const point = seededPointIn(entry, mulberry32(hashSeed(`aegis-live-${alias}`)));
      const liveDevice: Device = {
        id: alias,
        label: device.name?.trim() || "Permitted BLE device",
        kind: "ble",
        state: "trusted",
        zone: entry.id,
        x: point.x,
        y: point.y,
        rssi: null,
        confidence: connected ? 99 : 90,
        lastSeen: 0,
        mobile: false,
        destination: null,
      };
      commitDevices([
        ...devicesRef.current
          .filter((item) => !item.id.startsWith("live-"))
          .map((item) => ({ ...item, destination: null })),
        liveDevice,
      ]);
      setInspection({ type: "device", id: liveDevice.id });
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
      const name = error instanceof DOMException ? error.name : "ConnectionError";
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
      const plan = floorplanRef.current;
      const zonesNow = FLOORPLANS[plan];
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
        const declaredZone =
          typeof record.zone === "string" && zonesNow.some((zone) => zone.id === record.zone)
            ? record.zone
            : null;
        let x: number;
        let y: number;
        if (typeof record.x === "number" && typeof record.y === "number") {
          x = Math.max(6, Math.min(94, record.x));
          y = Math.max(10, Math.min(91, record.y));
        } else {
          const fallbackZone =
            zonesNow.find((zone) => zone.id === declaredZone) ??
            zonesNow.find((zone) => zone.id === "entry") ??
            zonesNow[0];
          const random = mulberry32(hashSeed(`aegis-import-${plan}-${index}`));
          const point = seededPointIn(fallbackZone, random);
          x = point.x;
          y = point.y;
        }
        return {
          id: `import-${index + 1}`,
          label:
            typeof record.label === "string"
              ? record.label.slice(0, 42)
              : `Imported signal ${index + 1}`,
          kind,
          state,
          zone: zoneAtIn(zonesNow, x, y),
          x,
          y,
          rssi:
            typeof record.rssi === "number"
              ? Math.max(-120, Math.min(-1, Math.round(record.rssi)))
              : null,
          confidence:
            typeof record.confidence === "number"
              ? Math.max(1, Math.min(100, Math.round(record.confidence)))
              : 80,
          lastSeen: 0,
          mobile: false,
          destination: null,
        };
      });
      if (!imported.length) {
        throw new Error("No telemetry records");
      }
      commitDevices(imported);
      walkersRef.current = {};
      rssiHistoryRef.current = {};
      setInspection({ type: "device", id: imported[0].id });
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
      if (importRef.current) {
        importRef.current.value = "";
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#050807] px-4 pb-28 pt-28 text-white sm:px-6 md:pt-32">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/projects#interactive-labs" className="font-mono text-xs uppercase tracking-[0.18em] text-white/60 hover:text-white">
          &lt;- All projects
        </Link>

        <header className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-accent/25 bg-accent-soft text-accent"><ShieldCheck size={18} /></span>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
                Authorized RF sensing lab · {dataMode === "demo" ? "demo telemetry" : dataMode === "bluetooth" ? "permitted Bluetooth" : "imported telemetry"}
              </p>
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[7.5rem] lg:leading-[0.82]">
              AEGIS<span className="text-accent">/</span>HOME
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
              A privacy-first wireless sensing command center for learning how consented Wi‑Fi, Bluetooth, and CSI telemetry can reveal presence and environmental change—without pretending a browser can secretly identify people. Everything on the map is a deterministic physics simulation — RSSI is computed from distance and wall attenuation, not from real radios.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 lg:w-80">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">System posture</p>
              <span className={`h-2 w-2 rounded-full ${risk ? "bg-alert" : "bg-accent"}`} />
            </div>
            <p className="mt-5 text-2xl font-semibold">{status}</p>
            <p className="mt-2 text-xs leading-5 text-white/65">Risk is an explainable simulation score, never a claim that a person was identified.</p>
          </div>
        </header>

        <section className="mt-10 rounded-[1.75rem] border border-accent/20 bg-accent-soft p-5 md:p-6" aria-labelledby="live-input-title">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Choose the data source</p>
              <h2 id="live-input-title" className="mt-2 text-xl font-semibold">Demo, a device you permit, or your own sensor export.</h2>
              <p className="mt-2 max-w-3xl text-xs leading-6 text-white/65">
                A public website cannot silently map your house. Demo mode is a deterministic physics simulation — RSSI is computed from distance and wall attenuation, not from real radios. A real session must begin with your Bluetooth permission or a local JSON export from sensors you own.
              </p>
              <p className="mt-3 font-mono text-[10px] text-accent" role="status" aria-live="polite">{connectionStatus}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={connectBluetooth} disabled={isConnecting} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white disabled:cursor-wait disabled:opacity-55">
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
                  if (file) {
                    void importTelemetry(file);
                  }
                }}
              />
            </div>
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#090d0b]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-7">
            <div className="flex flex-wrap items-center gap-3">
              {reducedMotion ? null : (
                <button type="button" onClick={() => setRunning((value) => !value)} className="grid h-10 w-10 place-items-center rounded-full border border-white/12 text-white/60 hover:bg-white/[0.05]" aria-label={running ? "Pause telemetry" : "Resume telemetry"}>
                  {running ? <Pause size={15} /> : <Play size={15} />}
                </button>
              )}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-white/55">
                  {reducedMotion ? "Session manual" : `Session ${running ? "streaming" : "paused"}`}
                </p>
                <p className="mt-1 font-mono text-[10px] text-white/55">T+{String(second).padStart(3, "0")}s · {dataMode === "demo" ? "demonstration" : dataMode === "bluetooth" ? "permitted device" : "local import"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StageButton variant="ghost" onClick={() => advanceSimulation(60, dataMode)}>
                  Advance 1 min
                </StageButton>
                <StageButton variant="ghost" onClick={() => advanceSimulation(600, dataMode)}>
                  Advance 10 min
                </StageButton>
              </div>
            </div>
            <div role="tablist" aria-label="Detection mode" className="flex rounded-full border border-white/10 bg-black/25 p-1">
              {(["presence", "change"] as const).map((item) => (
                <button key={item} type="button" role="tab" aria-selected={mode === item} onClick={() => setMode(item)} className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] ${mode === item ? "bg-white text-black" : "text-white/60"}`}>
                  {item === "presence" ? "Presence map" : "Room-change map"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">Floorplan</span>
              <select value={floorplan} onChange={(event) => applyFloorplan(event.target.value as FloorplanName)} className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs text-white/70">
                {(Object.keys(FLOORPLANS) as FloorplanName[]).map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
          </div>

          <div className="grid xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="p-4 md:p-7">
              <div ref={mapRef} className="relative min-h-[660px] touch-pan-y overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#07100d]" role="group" aria-label="Interactive floor plan with selectable rooms, draggable signal markers, and a draggable router">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(96,165,250,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
                {zones.map((zone) => (
                  <button
                    type="button"
                    key={zone.id}
                    onClick={() => {
                      setInspection({ type: "zone", id: zone.id });
                      setAnnounce(`${zone.label} selected — the inspector shows its occupants and wall attenuation.`);
                    }}
                    className={`absolute border text-left transition-colors ${inspection.type === "zone" && inspection.id === zone.id ? "border-accent/40 bg-accent-soft" : "border-white/12 bg-white/[0.018] hover:bg-accent-soft"}`}
                    style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%` }}
                    aria-label={`Inspect ${zone.label}`}
                  >
                    <span className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">{zone.label}</span>
                  </button>
                ))}
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {walls.map((wall) => (
                    <line
                      key={`${wall.x1}-${wall.y1}-${wall.x2}-${wall.y2}`}
                      x1={wall.x1}
                      y1={wall.y1}
                      x2={wall.x2}
                      y2={wall.y2}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1.2}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
                <button
                  type="button"
                  aria-label="Inspect and drag home router"
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 touch-none"
                  style={{ left: `${router.x}%`, top: `${router.y}%` }}
                  onClick={() => {
                    setInspection({ type: "router" });
                    setAnnounce("Router selected — the inspector shows the link budget for every signal.");
                  }}
                  onPointerDown={(event) => {
                    setDragging("router");
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => {
                    if (dragging === "router") {
                      const point = positionFromPointer(event.clientX, event.clientY);
                      if (point) {
                        moveRouter(point.x, point.y);
                      }
                    }
                  }}
                  onPointerUp={() => setDragging(null)}
                >
                  <div className="absolute -inset-20 animate-ping rounded-full border border-accent/10 motion-reduce:hidden [animation-duration:3s]" />
                  <div className="absolute -inset-10 hidden rounded-full border border-accent/15 motion-reduce:block" />
                  <div className={`relative grid h-11 w-11 place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent ${inspection.type === "router" ? "ring-2 ring-white/45 ring-offset-4 ring-offset-[#07100d]" : ""}`}><Radio size={18} /></div>
                  <span className="absolute left-1/2 top-12 min-w-max -translate-x-1/2 rounded bg-black/75 px-2 py-1 font-mono text-[10px] text-white/60">Drag router</span>
                </button>
                <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/60 backdrop-blur">
                  Select a marker, room, or the router to inspect it
                </div>

                {mode === "change" && kitchenZone ? (
                  <div className="absolute overflow-hidden rounded-xl border border-alert/30 bg-alert-soft" style={{ left: `${kitchenZone.x}%`, top: `${kitchenZone.y}%`, width: `${kitchenZone.w}%`, height: `${kitchenZone.h}%` }}>
                    <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_70%_50%,rgba(248,113,113,.2),transparent_58%)] motion-reduce:hidden" />
                    <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_70%_50%,rgba(248,113,113,.14),transparent_58%)] motion-reduce:block" />
                    <p className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.15em] text-white/75">Δ attenuation {100 - baseline}%</p>
                  </div>
                ) : null}

                {devices.map((device) => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => setInspection({ type: "device", id: device.id })}
                    onPointerDown={(event) => {
                      setDragging(device.id);
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                      if (dragging === device.id) {
                        dragDevice(device.id, event.clientX, event.clientY);
                      }
                    }}
                    onPointerUp={() => setDragging(null)}
                    aria-label={`Inspect and drag ${device.label}`}
                    className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 touch-none transition-all duration-150"
                    style={{ left: `${device.x}%`, top: `${device.y}%` }}
                  >
                    {device.state === "unknown" ? (
                      <>
                        <span className="absolute left-1/2 top-1/2 -z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-alert opacity-25 motion-reduce:hidden" />
                        <span className="absolute left-1/2 top-1/2 -z-10 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-alert opacity-30 motion-reduce:block" />
                      </>
                    ) : (
                      <span className="absolute left-1/2 top-1/2 -z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent opacity-25" />
                    )}
                    <span className={`grid h-10 w-10 place-items-center rounded-full border shadow-[0_0_28px_rgba(96,165,250,.12)] ${STATE_STYLE[device.state]} ${inspection.type === "device" && inspection.id === device.id ? "ring-2 ring-white/45 ring-offset-4 ring-offset-[#07100d]" : ""}`}>
                      {device.kind === "wifi" ? <Wifi size={15} /> : device.kind === "ble" ? <Bluetooth size={15} /> : <Activity size={15} />}
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-12 min-w-max -translate-x-1/2 rounded-md bg-black/75 px-2 py-1 font-mono text-[10px] text-white/60 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">{device.label}</span>
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
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">{inspectorTitle}</p>
              <p role="status" aria-live="polite" className="mt-2 min-h-5 text-[11px] leading-5 text-white/65">{announce}</p>

              {inspection.type === "device" && inspectedDevice ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{inspectedDevice.label}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-white/55">session alias {inspectedDevice.id}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 font-mono text-[10px] uppercase ${STATE_STYLE[inspectedDevice.state]}`}>{inspectedDevice.state}</span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    <Datum label="Modality" value={inspectedDevice.kind.toUpperCase()} />
                    <Datum label="Zone" value={zoneLabelIn(zones, inspectedDevice.zone)} />
                    <Datum label="RSSI" value={inspectedDevice.rssi === null ? "Not exposed" : `${inspectedDevice.rssi} dBm`} />
                    <Datum label="Confidence" value={`${inspectedDevice.confidence}%`} />
                    <Datum label="Zone dwell" value={`${inspectedDevice.lastSeen}s`} />
                    <Datum label="Heading" value={inspectedDevice.destination ?? "Holding position"} />
                    <Datum label="Wall loss" value={inspectedDevice.rssi === null ? "—" : `${wallLossBetween(inspectedDevice.x, inspectedDevice.y, router.x, router.y, walls)} dB`} />
                    <Datum label="Identity" value="Not inferred" />
                  </dl>
                  <ControlRange
                    label="Position X"
                    value={Math.round(inspectedDevice.x)}
                    min={0}
                    max={100}
                    display={`${Math.round(inspectedDevice.x)}%`}
                    onChange={(value) => moveDevice(inspectedDevice.id, value, inspectedDevice.y)}
                  />
                  <ControlRange
                    label="Position Y"
                    value={Math.round(inspectedDevice.y)}
                    min={0}
                    max={100}
                    display={`${Math.round(inspectedDevice.y)}%`}
                    onChange={(value) => moveDevice(inspectedDevice.id, inspectedDevice.x, value)}
                  />
                </div>
              ) : null}

              {inspection.type === "zone" && inspectedZone ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{inspectedZone.label}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-white/55">zone {inspectedZone.id}</p>
                    </div>
                    <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-1 font-mono text-[10px] uppercase text-white/75">{zoneOccupants.length} inside</span>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-4">
                    <Datum label="Occupants" value={String(zoneOccupants.length)} />
                    <Datum label="Mean wall attenuation" value={meanZoneAttenuation === null ? "—" : `${meanZoneAttenuation.toFixed(1)} dB`} />
                  </dl>
                  <ul className="mt-4 space-y-2">
                    {zoneOccupants.map((device) => (
                      <li key={device.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-white/75">{device.label}</span>
                        <span className="font-mono text-white/60">{device.rssi === null ? "RSSI not exposed" : `${device.rssi} dBm`}</span>
                      </li>
                    ))}
                    {zoneOccupants.length === 0 ? (
                      <li className="text-xs text-white/60">No signals are inside this zone right now.</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              {inspection.type === "router" ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Home router</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.13em] text-white/55">at {Math.round(router.x)}% · {Math.round(router.y)}%</p>
                    </div>
                    <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-1 font-mono text-[10px] uppercase text-white/75">{devices.length} links</span>
                  </div>
                  <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {devices.map((device) => {
                      const crossed = wallsCrossed(device.x, device.y, router.x, router.y, walls);
                      const loss = crossed.reduce((sum, wall) => sum + wall.attenuationDb, 0);
                      return (
                        <li key={device.id} className="rounded-lg border border-white/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-white/75">{device.label}</span>
                            <span className="font-mono text-xs text-white/70">{device.rssi === null ? "Not exposed" : `${device.rssi} dBm`}</span>
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-white/55">{crossed.length} wall{crossed.length === 1 ? "" : "s"} crossed · {loss} dB attenuation</p>
                        </li>
                      );
                    })}
                  </ul>
                  <ControlRange
                    label="Position X"
                    value={Math.round(router.x)}
                    min={0}
                    max={100}
                    display={`${Math.round(router.x)}%`}
                    onChange={(value) => moveRouter(value, router.y)}
                  />
                  <ControlRange
                    label="Position Y"
                    value={Math.round(router.y)}
                    min={0}
                    max={100}
                    display={`${Math.round(router.y)}%`}
                    onChange={(value) => moveRouter(router.x, value)}
                  />
                </div>
              ) : null}

              <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Run a safe scenario</p>
              <div className="mt-3 grid gap-2">
                <Scenario icon={<TriangleAlert size={15} />} label="Unknown signal arrives" detail="Add an unidentified, rotating BLE alias at the entry" onClick={injectUnknown} />
                <Scenario icon={<Activity size={15} />} label="Signal changes rooms" detail="Walk the selected signal into an adjacent room over ticks" onClick={simulateMovement} />
                <Scenario icon={<Home size={15} />} label="Room baseline changes" detail="Model sustained obstruction or reflection" onClick={simulateObjectChange} />
              </div>

              <div className="mt-7 border-t border-white/10 pt-2">
                <ControlRange
                  label="Detection sensitivity"
                  value={sensitivity}
                  min={20}
                  max={95}
                  display={`${sensitivity}%`}
                  onChange={updateSensitivity}
                />
                <p className="mt-2 text-[10px] leading-5 text-white/60">
                  Gates what gets logged: trusted-signal zone changes are recorded only at 60% or higher; unknown signals always log; an RSSI trend event needs a sustained {((100 - sensitivity) / 4).toFixed(1)} dB drift across 5 ticks. Non-trusted signals at or above this confidence also raise the review score.
                </p>
                <ControlRange
                  label="Session retention"
                  value={retention}
                  min={0}
                  max={60}
                  step={5}
                  display={`${retention} min`}
                  onChange={updateRetention}
                />
                <p className="mt-2 text-[10px] leading-5 text-white/60">
                  Events older than {retention} minutes of simulated time are deleted from the session log — pruned from state, not hidden — and only the newest 12 survive.
                </p>
              </div>
              <button type="button" onClick={recalibrate} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-white/12 px-4 py-3 text-xs font-semibold text-white/65 hover:bg-white/[0.04]">
                <RefreshCw size={13} /> Recalibrate safe baseline
              </button>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#090d0b] p-5 md:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Decision timeline</p>
                <h2 className="mt-2 text-xl font-semibold">What the sentinel noticed</h2>
              </div>
              <Eye size={18} className="text-white/55" />
            </div>
            <div className="mt-6 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="grid grid-cols-[auto_1fr_auto] gap-4 rounded-xl border border-white/10 bg-white/[0.018] p-4">
                  <span className={`mt-1 h-2 w-2 rounded-full ${event.severity === "high" ? "bg-alert" : event.severity === "review" ? "bg-alert/50" : "bg-accent"}`} />
                  <div>
                    <p className="text-xs font-semibold text-white/75">{event.title}</p>
                    <p className="mt-1.5 text-[11px] leading-5 text-white/65">{event.detail}</p>
                  </div>
                  <span className="font-mono text-[10px] text-white/55">T+{event.second}s</span>
                </div>
              ))}
              {events.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.018] p-4 text-xs text-white/60">
                  No events inside the retention window. Raise Session retention or run a scenario.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-accent/15 bg-accent-soft p-6">
              <div className="flex items-center gap-3 text-accent"><CheckCircle2 size={18} /><h2 className="font-semibold">Privacy contract</h2></div>
              <ul className="mt-5 space-y-3 text-xs leading-6 text-white/65">
                <li>Explicit opt-in for every real Bluetooth connection.</li>
                <li>Session aliases replace raw hardware addresses.</li>
                <li>No face, name, or person-level identity inference.</li>
                <li>Short, user-controlled local retention by default.</li>
                <li>Alerts explain the evidence and uncertainty.</li>
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-[#090d0b] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Research-to-product architecture</p>
              <ol className="mt-5 space-y-4">
                {[
                  ["01", "Authorized sensors", "Consented BLE devices, owned-network telemetry, or compatible CSI hardware."],
                  ["02", "Privacy transform", "Rotate aliases, discard payloads, minimize retention, and enforce an allowlist."],
                  ["03", "Feature pipeline", "Smooth RSSI/CSI trends, compare baselines, and require sustained evidence."],
                  ["04", "Explainable policy", "Convert anomalies into reviewable events—not claims about identity."],
                ].map(([number, title, detail]) => (
                  <li key={number} className="grid grid-cols-[28px_1fr] gap-3">
                    <span className="font-mono text-[10px] text-accent">{number}</span>
                    <div>
                      <p className="text-xs font-semibold text-white/75">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-white/60">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mt-20 border-t border-white/10 pt-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Technical boundary</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight">A credible prototype says what it cannot do.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Boundary title="Browser Bluetooth" body="A website can interact only with BLE peripherals the visitor explicitly chooses and permits. It is not a silent ambient scanner." />
            <Boundary title="Wi‑Fi CSI" body="Fine-grained channel sensing requires compatible chipsets, firmware, transmitters, calibration, and a controlled environment." />
            <Boundary title="Object inference" body="Attenuation can show that the radio environment changed. Material or object identity needs labeled data and cannot be assumed from RSSI alone." />
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-start gap-3">
              <Link2 size={17} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-white/75">How to use this with a real house</p>
                <p className="mt-2 text-xs leading-6 text-white/65">
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
  return (
    <div className="rounded-xl border border-white/10 bg-black/65 px-3 py-3 backdrop-blur">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">{label}</p>
      <p className={`mt-2 font-mono text-sm ${alert ? "text-alert" : "text-white/70"}`}>{value}</p>
    </div>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">{label}</dt>
      <dd className="mt-1.5 text-xs text-white/65">{value}</dd>
    </div>
  );
}

function Scenario({ icon, label, detail, onClick }: { icon: ReactNode; label: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-left hover:border-accent/25 hover:bg-accent-soft">
      <span className="text-accent">{icon}</span>
      <span>
        <span className="block text-xs font-semibold text-white/65">{label}</span>
        <span className="mt-1 block text-[10px] text-white/60">{detail}</span>
      </span>
    </button>
  );
}

function Boundary({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white/75">{title}</p>
      <p className="mt-3 text-xs leading-6 text-white/60">{body}</p>
    </div>
  );
}
