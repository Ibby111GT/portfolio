"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import {
  ControlRange,
  ControlSelect,
  StageButton,
  StageHeader,
  StatStrip,
} from "@/components/creative/stage/controls";
import {
  exportCanvasPng,
  useCreativeCanvas,
} from "@/components/creative/stage/useCreativeCanvas";
import type {
  CreativeCanvasRuntime,
  StageSize,
} from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeProject } from "@/lib/creativeProjects";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

type PlayableSlug =
  | "blocktown-stories"
  | "slipstream-circuit"
  | "lantern-vale"
  | "frameforge";

export default function PlayableWorlds({
  project,
}: {
  project: CreativeProject;
}) {
  const slug = project.slug as PlayableSlug;
  let experience: ReactNode;

  switch (slug) {
    case "blocktown-stories":
      experience = <Blocktown />;
      break;
    case "slipstream-circuit":
      experience = <Slipstream />;
      break;
    case "lantern-vale":
      experience = <LanternVale />;
      break;
    case "frameforge":
      experience = <Frameforge />;
      break;
    default:
      experience = null;
  }

  return (
    <CreativeProjectShell project={project}>{experience}</CreativeProjectShell>
  );
}

function PlayableStage({
  eyebrow,
  headerStats,
  canvasRef,
  hostRef,
  canvasLabel,
  canvasCursor = "",
  onPointerDown,
  stageLabel,
  onStageKeyDown,
  onStageKeyUp,
  hint,
  controls,
  stats,
  tone = "accent",
}: {
  eyebrow: string;
  headerStats: Array<{ label: string; value: string }>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hostRef: RefObject<HTMLDivElement | null>;
  canvasLabel: string;
  canvasCursor?: string;
  onPointerDown?: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  /**
   * When provided, the stage wrapper becomes a focusable role="application"
   * region and keyboard input is scoped to it — the page keeps its normal
   * keyboard behavior everywhere else.
   */
  stageLabel?: string;
  onStageKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onStageKeyUp?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  hint?: string;
  controls: ReactNode;
  stats: Array<{ label: string; value: string; alert?: boolean }>;
  tone?: "accent" | "alert";
}) {
  const interactive = Boolean(stageLabel);
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-16">
      <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#08090d]">
        <StageHeader eyebrow={eyebrow} stats={headerStats} tone={tone} />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col">
            <div
              ref={hostRef}
              tabIndex={interactive ? 0 : undefined}
              role={interactive ? "application" : undefined}
              aria-label={interactive ? stageLabel : undefined}
              onKeyDown={onStageKeyDown}
              onKeyUp={onStageKeyUp}
              className="relative min-h-[580px] flex-1 overflow-hidden bg-[#06070a] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:min-h-[680px]"
            >
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={canvasLabel}
                onPointerDown={onPointerDown}
                className={`block touch-pan-y ${canvasCursor}`}
              />
            </div>
            {hint ? (
              <p className="border-t border-white/10 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                {hint}
              </p>
            ) : null}
          </div>
          <aside className="border-t border-white/15 bg-[#0d0e13] p-6 lg:border-l lg:border-t-0">
            {controls}
          </aside>
        </div>
        <StatStrip items={stats} />
      </div>
    </section>
  );
}

type Need = "food" | "energy" | "social" | "fun";

interface Resident {
  id: number;
  name: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  task: string;
  need: Need;
  needs: Record<Need, number>;
  visits: number;
  /** Seconds (sim time) left at the current building; 0 = not dwelling. */
  dwell: number;
}

interface TownBuilding {
  id: number;
  name: string;
  kind: Need | "home";
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TownSnapshot {
  residents: number;
  hour: number;
  happiness: number;
  visits: number;
  festival: number;
}

const RESIDENT_NAMES = ["Mika", "Juno", "Sol", "Pip", "Ari", "Nova"];
const BUILDING_GAP = 18;
const PLACED_W = 108;
const PLACED_H = 74;

function rectGap(
  building: TownBuilding,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  const gapX = Math.max(
    0,
    Math.max(building.x - (x + w), x - (building.x + building.w)),
  );
  const gapY = Math.max(
    0,
    Math.max(building.y - (y + h), y - (building.y + building.h)),
  );
  return Math.hypot(gapX, gapY);
}

function clearanceAt(
  buildings: TownBuilding[],
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  let clearance = Infinity;
  for (const building of buildings) {
    clearance = Math.min(clearance, rectGap(building, x, y, w, h));
  }
  return clearance;
}

/**
 * Deterministic spot finder: samples seeded candidates and keeps the one with
 * the largest clearance from every existing building.
 */
function findFreeSpot(
  buildings: TownBuilding[],
  size: StageSize,
  w: number,
  h: number,
  random: () => number,
): { x: number; y: number; clearance: number } {
  const width = Math.max(size.width, 360);
  const height = Math.max(size.height, 480);
  let best = { x: width / 2 - w / 2, y: height / 2 - h / 2, clearance: -1 };
  for (let candidate = 0; candidate < 48; candidate += 1) {
    const x = 14 + random() * Math.max(1, width - w - 28);
    const y = 14 + random() * Math.max(1, height - h - 28);
    const clearance = clearanceAt(buildings, x, y, w, h);
    if (clearance > best.clearance) {
      best = { x, y, clearance };
    }
  }
  return best;
}

function Blocktown() {
  // Created lazily: a mutable container passed straight to useRef() would be
  // treated as immutable by the React Compiler, and this one is mutated every
  // frame.
  const residentsRef = useRef<Resident[] | null>(null);
  const getResidents = useCallback((): Resident[] => {
    let residents = residentsRef.current;
    if (residents === null) {
      residents = [];
      residentsRef.current = residents;
    }
    return residents;
  }, []);
  const buildingsRef = useRef<TownBuilding[]>([]);
  const hourRef = useRef(7.5);
  const festivalRef = useRef(0);
  const visitsRef = useRef(0);
  const frameRef = useRef(0);
  const randomRef = useRef(mulberry32(hashSeed("blocktown-1")));
  const seededRef = useRef<string | null>(null);
  const [tempo, setTempo] = useState(55);
  const tempoRef = useRef(tempo);
  const [revision, setRevision] = useState(1);
  const [placement, setPlacement] = useState<"food" | "fun" | null>(null);
  // Paint-time mirrors: handlers sync these refs before calling repaint, so
  // the canvas is never one interaction stale under reduced motion or pause.
  const placementRef = useRef<"food" | "fun" | null>(null);
  const [selected, setSelected] = useState<Resident | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState(
    "Town simulation ready. Click a resident to inspect them.",
  );
  const [snapshot, setSnapshot] = useState<TownSnapshot>({
    residents: 6,
    hour: 7.5,
    happiness: 76,
    visits: 0,
    festival: 0,
  });

  const initialize = useCallback((size: StageSize, seed: number) => {
    const random = mulberry32(hashSeed(`blocktown-${seed}`));
    randomRef.current = random;
    const w = size.width || 900;
    const h = size.height || 680;
    const draft: TownBuilding[] = [
      { id: 1, name: "Corner Café", kind: "food", x: w * 0.12, y: h * 0.18, w: 118, h: 76 },
      { id: 2, name: "Blue Park", kind: "fun", x: w * 0.66, y: h * 0.16, w: 142, h: 96 },
      { id: 3, name: "Town Hall", kind: "social", x: w * 0.61, y: h * 0.65, w: 150, h: 92 },
      { id: 4, name: "Row Homes", kind: "energy", x: w * 0.12, y: h * 0.64, w: 158, h: 102 },
    ];
    // Buildings must never stack: any collision in the seed layout is
    // re-homed to the best free seeded spot before the town goes live.
    const placed: TownBuilding[] = [];
    for (const building of draft) {
      const clearance = clearanceAt(
        placed,
        building.x,
        building.y,
        building.w,
        building.h,
      );
      if (clearance >= BUILDING_GAP) {
        placed.push(building);
      } else {
        const spot = findFreeSpot(
          placed,
          { width: w, height: h },
          building.w,
          building.h,
          random,
        );
        placed.push({ ...building, x: spot.x, y: spot.y });
      }
    }
    buildingsRef.current = placed;
    residentsRef.current = RESIDENT_NAMES.map((name, index) => {
      const x = w * (0.34 + random() * 0.3);
      const y = h * (0.32 + random() * 0.35);
      return {
        id: index + 1,
        name,
        x,
        y,
        tx: x,
        ty: y,
        color: index % 3 === 0 ? "#f87171" : index % 2 === 0 ? "#dbeafe" : "#60a5fa",
        task: "starting the day",
        need: "fun" as Need,
        needs: {
          food: 58 + random() * 34,
          energy: 58 + random() * 34,
          social: 58 + random() * 34,
          fun: 58 + random() * 34,
        },
        visits: 0,
        dwell: 0,
      };
    });
    hourRef.current = 7.5;
    festivalRef.current = 0;
    visitsRef.current = 0;
    selectedIdRef.current = null;
    setSelected(null);
  }, []);

  const publish = useCallback(() => {
    const residents = getResidents();
    const happiness = residents.length
      ? residents.reduce(
          (sum, resident) =>
            sum +
            Object.values(resident.needs).reduce(
              (needSum, value) => needSum + value,
              0,
            ) /
              4,
          0,
        ) / residents.length
      : 0;
    setSnapshot({
      residents: residents.length,
      hour: hourRef.current,
      happiness: Math.round(happiness),
      visits: visitsRef.current,
      festival: festivalRef.current,
    });
    setSelected((current) => {
      if (!current) {
        return null;
      }
      const live = residents.find((resident) => resident.id === current.id);
      return live ? { ...live, needs: { ...live.needs } } : null;
    });
  }, [getResidents]);

  const retarget = useCallback(
    (resident: Resident, random: () => number) => {
      const sorted = (Object.keys(resident.needs) as Need[]).sort(
        (a, b) => resident.needs[a] - resident.needs[b],
      );
      const nextNeed: Need =
        festivalRef.current > 0 && resident.needs.social < 90
          ? "social"
          : sorted[0];
      const options = buildingsRef.current.filter(
        (building) => building.kind === nextNeed,
      );
      const pool = options.length ? options : buildingsRef.current;
      const building = pool[Math.floor(random() * pool.length)];
      if (!building) {
        return;
      }
      resident.need = nextNeed;
      resident.tx = building.x + building.w / 2 + (random() - 0.5) * 44;
      resident.ty = building.y + building.h + 22 + random() * 22;
      resident.task = `visiting ${building.name}`;
    },
    [],
  );

  const updateTown = useCallback(
    (dt: number, size: StageSize) => {
      if (!getResidents().length) {
        initialize(size, revision);
      }
      const speed = 0.45 + tempoRef.current / 45;
      const dts = dt * speed;
      const random = randomRef.current;
      hourRef.current = (hourRef.current + dts * 0.33) % 24;
      festivalRef.current = Math.max(0, festivalRef.current - dts);

      // Residents are mutated in place: no per-frame array or object rebuild.
      for (const resident of getResidents()) {
        const needs = resident.needs;
        needs.food = Math.max(0, needs.food - dts * 1.25);
        needs.energy = Math.max(0, needs.energy - dts * 0.92);
        needs.social = Math.max(
          0,
          needs.social - dts * (festivalRef.current > 0 ? 0.2 : 0.72),
        );
        needs.fun = Math.max(0, needs.fun - dts * 0.78);

        if (resident.dwell > 0) {
          // Dwell: the matched need recovers much faster than any decay, so a
          // completed visit meaningfully restores the resident.
          needs[resident.need] = Math.min(
            100,
            needs[resident.need] + dts * 30,
          );
          resident.dwell -= dts;
          if (resident.dwell <= 0) {
            resident.dwell = 0;
            resident.visits += 1;
            visitsRef.current += 1;
            retarget(resident, random);
          }
          continue;
        }

        const dx = resident.tx - resident.x;
        const dy = resident.ty - resident.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 4) {
          const velocity = Math.min(distance, dts * 34);
          resident.x += (dx / distance) * velocity;
          resident.y += (dy / distance) * velocity;
        } else if (resident.task.startsWith("visiting")) {
          // Arrived: seeded 2-4 s dwell (sim time, so it scales with tempo).
          resident.dwell = 2 + random() * 2;
        } else {
          // Initial "starting the day" arrival: pick a goal without counting
          // a completed visit — this is what made visits start at 6.
          retarget(resident, random);
        }
      }
    },
    [getResidents, initialize, retarget, revision],
  );

  const paintTown = useCallback(
    (runtime: CreativeCanvasRuntime) => {
      const { context, size } = runtime;
      if (!context) {
        return;
      }
      if (!getResidents().length) {
        initialize(size, revision);
      }
      const { width, height } = size;
      context.fillStyle = "#06070b";
      context.fillRect(0, 0, width, height);

      // One path for the whole grid — a single stroke call.
      context.strokeStyle = "rgba(96,165,250,.08)";
      context.lineWidth = 1;
      context.beginPath();
      for (let x = 0; x < width; x += 36) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      for (let y = 0; y < height; y += 36) {
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      context.stroke();

      context.fillStyle = "#11151f";
      context.fillRect(width * 0.3, 0, width * 0.18, height);
      context.fillRect(0, height * 0.43, width, height * 0.16);
      context.strokeStyle = "rgba(255,255,255,.16)";
      context.setLineDash([16, 15]);
      context.beginPath();
      context.moveTo(width * 0.39, 0);
      context.lineTo(width * 0.39, height);
      context.moveTo(0, height * 0.51);
      context.lineTo(width, height * 0.51);
      context.stroke();
      context.setLineDash([]);

      for (const building of buildingsRef.current) {
        const isPark = building.kind === "fun";
        context.fillStyle = "rgba(0,0,0,.4)";
        context.fillRect(building.x + 8, building.y + 10, building.w, building.h);
        context.fillStyle = isPark
          ? "rgba(96,165,250,.2)"
          : building.kind === "social"
            ? "#16223a"
            : building.kind === "food"
              ? "#3b1720"
              : "#172033";
        context.fillRect(building.x, building.y, building.w, building.h);
        context.strokeStyle =
          building.kind === "food" ? "#f87171" : "#60a5fa";
        context.lineWidth = 2;
        context.strokeRect(building.x, building.y, building.w, building.h);
        if (!isPark) {
          for (let windowIndex = 0; windowIndex < 3; windowIndex += 1) {
            context.fillStyle = "rgba(219,234,254,.6)";
            context.fillRect(
              building.x + 16 + windowIndex * 31,
              building.y + 22,
              17,
              19,
            );
          }
        } else {
          context.fillStyle = "#60a5fa";
          for (let tree = 0; tree < 5; tree += 1) {
            context.fillRect(
              building.x + 18 + tree * 24,
              building.y + 22 + (tree % 2) * 21,
              13,
              21,
            );
          }
        }
        context.fillStyle = "rgba(255,255,255,.8)";
        context.font = "10px ui-monospace, monospace";
        context.fillText(
          building.name.toUpperCase(),
          building.x + 10,
          building.y + building.h - 10,
        );
      }

      if (festivalRef.current > 0) {
        context.fillStyle = "rgba(248,113,113,.75)";
        for (let index = 0; index < 11; index += 1) {
          context.fillRect(
            width * 0.42 + index * 19,
            height * 0.48 + Math.sin(index) * 8,
            6,
            6,
          );
        }
      }

      for (const resident of getResidents()) {
        const chosen = selectedIdRef.current === resident.id;
        context.fillStyle = chosen ? "#ffffff" : resident.color;
        context.fillRect(resident.x - 6, resident.y - 15, 12, 15);
        context.fillStyle = resident.color;
        context.fillRect(resident.x - 8, resident.y - 8, 16, 14);
        if (chosen) {
          context.strokeStyle = "#f87171";
          context.lineWidth = 2;
          context.strokeRect(resident.x - 13, resident.y - 21, 26, 31);
        }
        context.fillStyle = "rgba(255,255,255,.72)";
        context.font = "10px ui-monospace, monospace";
        context.fillText(resident.name.toUpperCase(), resident.x - 14, resident.y + 20);
      }

      context.fillStyle = "rgba(5,7,11,.78)";
      context.fillRect(18, 18, 232, 64);
      context.fillStyle = "#dbeafe";
      context.font = "600 12px ui-monospace, monospace";
      context.fillText(
        `${formatHour(hourRef.current)} · ${festivalRef.current > 0 ? "STREET FESTIVAL" : "NORMAL DAY"}`,
        32,
        44,
      );
      context.fillStyle = "rgba(255,255,255,.58)";
      context.font = "10px ui-monospace, monospace";
      context.fillText(
        placementRef.current
          ? "PLACEMENT ARMED — CLICK AN OPEN SPOT"
          : `TEMPO ${Math.round(tempoRef.current)}% · CLICK A RESIDENT`,
        32,
        64,
      );
    },
    [getResidents, initialize, revision],
  );

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      updateTown(dt, runtime.size);
      paintTown(runtime);
      frameRef.current += 1;
      if (frameRef.current % 20 === 0) {
        publish();
      }
    },
    onRepaint: paintTown,
    onResize: (_size, scale) => {
      residentsRef.current = getResidents().map((resident) => ({
        ...resident,
        x: resident.x * scale.x,
        tx: resident.tx * scale.x,
        y: resident.y * scale.y,
        ty: resident.ty * scale.y,
        needs: { ...resident.needs },
      }));
      buildingsRef.current = buildingsRef.current.map((building) => ({
        ...building,
        x: building.x * scale.x,
        y: building.y * scale.y,
      }));
    },
  });
  const { reducedMotion, repaint, sizeRef } = stage;

  const runTicks = useCallback(
    (count: number) => {
      for (let tick = 0; tick < count; tick += 1) {
        updateTown(1 / 60, sizeRef.current);
      }
    },
    [sizeRef, updateTown],
  );

  // Reduced motion: the town starts already lived-in (600 seeded ticks) and
  // time is driven by the Advance 1 hour button instead of the frame loop.
  useEffect(() => {
    if (!reducedMotion) {
      return;
    }
    const key = `rm-${revision}`;
    if (seededRef.current === key) {
      return;
    }
    seededRef.current = key;
    runTicks(600);
    setStatus(
      "Reduced motion: the town is pre-simulated. Use Advance 1 hour to move time.",
    );
    publish();
    repaint();
  }, [publish, reducedMotion, repaint, revision, runTicks]);

  function commitBuilding(kind: "food" | "fun", x: number, y: number) {
    const kindCount = buildingsRef.current.filter(
      (building) => building.kind === kind,
    ).length;
    const name =
      kind === "food"
        ? `Café ${kindCount + 1}`
        : `Pocket Park ${kindCount + 1}`;
    buildingsRef.current.push({
      id: buildingsRef.current.length + 1,
      name,
      kind,
      x,
      y,
      w: PLACED_W,
      h: PLACED_H,
    });
    placementRef.current = null;
    setPlacement(null);
    setStatus(`${name} placed.`);
    publish();
    repaint();
  }

  function placeBuildingAt(kind: "food" | "fun", x: number, y: number) {
    const size = sizeRef.current;
    const px = Math.min(
      Math.max(x - PLACED_W / 2, 10),
      Math.max(10, size.width - PLACED_W - 10),
    );
    const py = Math.min(
      Math.max(y - PLACED_H / 2, 10),
      Math.max(10, size.height - PLACED_H - 10),
    );
    const clearance = clearanceAt(
      buildingsRef.current,
      px,
      py,
      PLACED_W,
      PLACED_H,
    );
    if (clearance < BUILDING_GAP) {
      setStatus(
        "Too close to an existing building — pick a clearer spot or use Auto-place.",
      );
      repaint();
      return;
    }
    commitBuilding(kind, px, py);
  }

  function handleCanvasPointer(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (placement) {
      placeBuildingAt(placement, x, y);
      return;
    }
    let nearest: Resident | undefined;
    let distance = 34;
    for (const resident of getResidents()) {
      const candidate = Math.hypot(resident.x - x, resident.y - y);
      if (candidate < distance) {
        distance = candidate;
        nearest = resident;
      }
    }
    selectedIdRef.current = nearest ? nearest.id : null;
    setSelected(nearest ? { ...nearest, needs: { ...nearest.needs } } : null);
    setStatus(
      nearest ? `${nearest.name} selected.` : "No resident near that spot.",
    );
    repaint();
  }

  function togglePlacement(kind: "food" | "fun") {
    const next = placement === kind ? null : kind;
    placementRef.current = next;
    setPlacement(next);
    if (next === null) {
      setStatus("Placement cancelled.");
    } else {
      setStatus(
        next === "food"
          ? "Café placement armed — click an empty spot, or use Auto-place."
          : "Park placement armed — click an empty spot, or use Auto-place.",
      );
    }
    repaint();
  }

  function autoPlace() {
    if (!placement) {
      return;
    }
    const random = mulberry32(
      hashSeed(`blocktown-place-${revision}-${buildingsRef.current.length}`),
    );
    const spot = findFreeSpot(
      buildingsRef.current,
      sizeRef.current,
      PLACED_W,
      PLACED_H,
      random,
    );
    if (spot.clearance < BUILDING_GAP) {
      setStatus("No open ground left for another building.");
      repaint();
      return;
    }
    commitBuilding(placement, spot.x, spot.y);
  }

  function selectNextResident() {
    const residents = getResidents();
    if (!residents.length) {
      return;
    }
    const currentIndex = residents.findIndex(
      (resident) => resident.id === selected?.id,
    );
    const next = residents[(currentIndex + 1) % residents.length];
    selectedIdRef.current = next.id;
    setSelected({ ...next, needs: { ...next.needs } });
    setStatus(`${next.name} selected.`);
    repaint();
  }

  function startFestival() {
    festivalRef.current = 24;
    setStatus("Street festival started — residents gather downtown.");
    publish();
    repaint();
  }

  function advanceHour() {
    let advanced = 0;
    let guard = 0;
    while (advanced < 1 && guard < 6000) {
      const before = hourRef.current;
      updateTown(1 / 60, sizeRef.current);
      let delta = hourRef.current - before;
      if (delta < 0) {
        delta += 24;
      }
      advanced += delta;
      guard += 1;
    }
    setStatus(`Advanced to ${formatHour(hourRef.current)}.`);
    publish();
    repaint();
  }

  function resetTown() {
    const next = revision + 1;
    setRevision(next);
    initialize(sizeRef.current, next);
    placementRef.current = null;
    setPlacement(null);
    setStatus("A new day begins.");
    publish();
    repaint();
  }

  const selectedNeed = selected
    ? (Object.entries(selected.needs) as Array<[Need, number]>).sort(
        (a, b) => a[1] - b[1],
      )[0]
    : null;

  return (
    <PlayableStage
      eyebrow="Blocktown Stories · autonomous neighborhood"
      headerStats={[
        { label: "day", value: formatHour(snapshot.hour) },
        {
          label: "event",
          value: snapshot.festival > 0 ? "festival" : "normal",
        },
      ]}
      canvasRef={stage.canvasRef}
      hostRef={stage.hostRef}
      canvasLabel="Blocktown Stories interactive life simulation canvas"
      canvasCursor={placement ? "cursor-crosshair" : ""}
      onPointerDown={handleCanvasPointer}
      hint={
        placement
          ? "Placement armed — click an empty spot, or use Auto-place"
          : "Click a resident to inspect · keyboard: Select next resident"
      }
      controls={
        <>
          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            What this is for
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Explore how small autonomous agents choose goals from changing
            needs, available places, time, and town events.
          </p>
          <ControlRange
            label="Time speed"
            value={tempo}
            min={10}
            max={100}
            display={`${tempo}%`}
            onChange={(value) => {
              setTempo(value);
              tempoRef.current = value;
              publish();
              repaint();
            }}
          />
          <div className="mt-6 rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              {selected ? selected.name : "Resident inspector"}
            </p>
            <p className="mt-3 text-xs leading-6 text-white/65">
              {selected
                ? `${selected.task}. Lowest need: ${selectedNeed?.[0]} at ${Math.round(selectedNeed?.[1] ?? 0)}%. Visits completed: ${selected.visits}.`
                : "Click any resident in the town, or use Select next resident, to inspect their current motive."}
            </p>
          </div>
          <p className="mt-3 text-xs leading-6 text-white/65" aria-hidden="true">
            {status}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StageButton onClick={() => togglePlacement("food")}>
              {placement === "food" ? "Cancel café" : "Add café"}
            </StageButton>
            <StageButton onClick={() => togglePlacement("fun")}>
              {placement === "fun" ? "Cancel park" : "Add park"}
            </StageButton>
            {placement ? (
              <StageButton
                variant="primary"
                className="col-span-2"
                onClick={autoPlace}
              >
                Auto-place
              </StageButton>
            ) : null}
            <StageButton
              variant="alert"
              onClick={startFestival}
              className="col-span-2"
            >
              Start street festival
            </StageButton>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StageButton onClick={selectNextResident}>
              Select next resident
            </StageButton>
            <StageButton onClick={advanceHour}>Advance 1 hour</StageButton>
            {reducedMotion ? null : (
              <StageButton
                onClick={() => {
                  if (stage.running) {
                    stage.stop();
                  } else {
                    stage.start();
                  }
                }}
              >
                {stage.running ? "Pause town" : "Resume town"}
              </StageButton>
            )}
            <StageButton
              variant="solid"
              onClick={resetTown}
              className={reducedMotion ? "col-span-2" : ""}
            >
              New day
            </StageButton>
          </div>
        </>
      }
      stats={[
        { label: "Residents", value: String(snapshot.residents) },
        { label: "Town happiness", value: `${snapshot.happiness}%` },
        { label: "Completed visits", value: String(snapshot.visits) },
        {
          label: "Selected",
          value: selected?.name ?? "None",
          alert: selectedNeed ? selectedNeed[1] < 25 : false,
        },
      ]}
    />
  );
}

function formatHour(hour: number) {
  const whole = Math.floor(hour) % 24;
  const minutes = Math.floor((hour - Math.floor(hour)) * 60);
  const suffix = whole >= 12 ? "PM" : "AM";
  const display = whole % 12 || 12;
  return `${display}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

interface RaceCar {
  x: number;
  y: number;
  angle: number;
  speed: number;
  lap: number;
  lapTime: number;
  bestTime: number | null;
  drift: number;
  lastTheta: number;
  offTrack: number;
}

interface RaceSnapshot {
  speed: number;
  lap: number;
  lapTime: number;
  bestTime: number | null;
  drift: number;
  onTrack: boolean;
}

type DriveInput = "left" | "right" | "throttle" | "brake" | "boost";

const DRIVE_KEYS: Record<string, DriveInput> = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "throttle",
  w: "throttle",
  W: "throttle",
  ArrowDown: "brake",
  s: "brake",
  S: "brake",
  " ": "boost",
};

const TRAIL_LENGTH = 90;
const PHYSICS_STEP = 1 / 120;
/** Spawn just before the start/finish line at theta = pi (left side). */
const START_THETA = Math.PI - 0.12;

function ellipseTangent(theta: number, rx: number, ry: number): number {
  return Math.atan2(Math.cos(theta) * ry, -Math.sin(theta) * rx);
}

/**
 * Crossing the theta = pi line. The first crossing only starts lap 1; a best
 * time is recorded from genuinely completed laps onward.
 */
function crossStartLine(car: RaceCar): void {
  if (car.lap >= 1) {
    car.bestTime =
      car.bestTime === null ? car.lapTime : Math.min(car.bestTime, car.lapTime);
  }
  car.lap += 1;
  car.lapTime = 0;
}

function Slipstream() {
  const carRef = useRef<RaceCar | null>(null);
  // Same lazy-container reason as Blocktown's residents: the trail ring
  // buffer is mutated every frame and on resize.
  const trailRef = useRef<{
    points: Array<{ x: number; y: number }>;
    head: number;
    count: number;
  } | null>(null);
  const getTrail = useCallback(() => {
    let trail = trailRef.current;
    if (trail === null) {
      trail = { points: [], head: 0, count: 0 };
      trailRef.current = trail;
    }
    return trail;
  }, []);
  const inputRef = useRef<Record<DriveInput, boolean>>({
    left: false,
    right: false,
    throttle: false,
    brake: false,
    boost: false,
  });
  const frameRef = useRef(0);
  const autoPhaseRef = useRef(START_THETA);
  const nextLapAtRef = useRef(Math.PI);
  const accumulatorRef = useRef(0);
  const trailTickRef = useRef(0);
  const forcedAutopilotRef = useRef(false);
  const [grip, setGrip] = useState(62);
  const [engine, setEngine] = useState(58);
  const tuningRef = useRef({ grip, engine });
  const [autopilot, setAutopilot] = useState(false);
  const autopilotRef = useRef(false);
  const [status, setStatus] = useState(
    "Manual control ready. Click or focus the stage to drive.",
  );
  const [snapshot, setSnapshot] = useState<RaceSnapshot>({
    speed: 0,
    lap: 0,
    lapTime: 0,
    bestTime: null,
    drift: 0,
    onTrack: true,
  });

  const pushTrail = useCallback((x: number, y: number) => {
    const trail = getTrail();
    const point = trail.points[trail.head];
    if (point) {
      point.x = x;
      point.y = y;
    } else {
      trail.points[trail.head] = { x, y };
    }
    trail.head = (trail.head + 1) % TRAIL_LENGTH;
    trail.count = Math.min(trail.count + 1, TRAIL_LENGTH);
  }, [getTrail]);

  const resetCar = useCallback((size: StageSize) => {
    const cx = size.width / 2;
    const cy = size.height / 2;
    const rx = Math.max(120, size.width * 0.34);
    const ry = Math.max(105, size.height * 0.3);
    carRef.current = {
      x: cx + Math.cos(START_THETA) * rx,
      y: cy + Math.sin(START_THETA) * ry,
      angle: ellipseTangent(START_THETA, rx, ry),
      speed: 0,
      lap: 0,
      lapTime: 0,
      bestTime: null,
      drift: 0,
      lastTheta: START_THETA,
      offTrack: 0,
    };
    autoPhaseRef.current = START_THETA;
    nextLapAtRef.current = Math.PI;
    accumulatorRef.current = 0;
    getTrail().head = 0;
    getTrail().count = 0;
  }, [getTrail]);

  const publish = useCallback(() => {
    const car = carRef.current;
    if (!car) {
      return;
    }
    setSnapshot({
      speed: Math.round(Math.abs(car.speed) * 9),
      lap: car.lap,
      lapTime: car.lapTime,
      bestTime: car.bestTime,
      drift: Math.round(car.drift),
      onTrack: car.offTrack < 0.5,
    });
  }, []);

  const stepPhysics = useCallback(
    (h: number, size: StageSize) => {
      if (!carRef.current) {
        resetCar(size);
      }
      const car = carRef.current;
      if (!car) {
        return;
      }
      const { width, height } = size;
      const cx = width / 2;
      const cy = height / 2;
      const rx = Math.max(120, width * 0.34);
      const ry = Math.max(105, height * 0.3);
      const tuning = tuningRef.current;

      if (autopilotRef.current) {
        autoPhaseRef.current += h * (0.52 + tuning.engine / 165);
        const phase = autoPhaseRef.current;
        car.x = cx + Math.cos(phase) * rx;
        car.y = cy + Math.sin(phase) * ry;
        car.angle = ellipseTangent(phase, rx, ry);
        car.speed = 8 + tuning.engine / 12;
        car.lapTime += h;
        while (autoPhaseRef.current >= nextLapAtRef.current) {
          crossStartLine(car);
          nextLapAtRef.current += Math.PI * 2;
        }
        car.offTrack = 0;
        car.lastTheta = Math.atan2(Math.sin(phase), Math.cos(phase));
      } else {
        const input = inputRef.current;
        const throttle = input.throttle ? 1 : input.brake ? -0.75 : 0;
        const power = 5.2 + tuning.engine / 16;
        car.speed += throttle * power * h;
        car.speed *= Math.pow(input.brake ? 0.94 : 0.988, h * 60);
        if (input.boost && car.speed > 2) {
          car.speed += 5.5 * h;
        }
        car.speed = Math.max(-4.5, Math.min(17 + tuning.engine / 9, car.speed));

        const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
        const turnAuthority =
          (0.72 + tuning.grip / 105) * Math.min(1, Math.abs(car.speed) / 4.2);
        car.angle += steer * turnAuthority * h * Math.sign(car.speed || 1);
        car.x += Math.cos(car.angle) * car.speed * h * 10;
        car.y += Math.sin(car.angle) * car.speed * h * 10;
        car.lapTime += h;

        const normalized = Math.hypot((car.x - cx) / rx, (car.y - cy) / ry);
        const onTrack = normalized > 0.76 && normalized < 1.24;
        if (!onTrack) {
          car.speed *= Math.pow(0.95, h * 60);
          car.offTrack += h;
        } else {
          car.offTrack = Math.max(0, car.offTrack - h * 2);
        }
        if (car.offTrack > 2.4) {
          // Recovery, not a reset: rejoin the racing line at the same spot
          // with a time penalty. Laps and best time survive; only the
          // explicit Reset run button zeroes the session.
          const rescueTheta = Math.atan2((car.y - cy) / ry, (car.x - cx) / rx);
          car.x = cx + Math.cos(rescueTheta) * rx;
          car.y = cy + Math.sin(rescueTheta) * ry;
          car.angle = ellipseTangent(rescueTheta, rx, ry);
          car.speed = 0;
          car.offTrack = 0;
          car.lapTime += 2;
          car.lastTheta = rescueTheta;
          setStatus(
            "Recovered to the racing line: +2s lap penalty, laps and best time kept.",
          );
        }

        const theta = Math.atan2((car.y - cy) / ry, (car.x - cx) / rx);
        if (onTrack && car.lastTheta > 2.55 && theta < -2.55 && car.speed > 2) {
          crossStartLine(car);
        }
        car.lastTheta = theta;

        const tangent = ellipseTangent(theta, rx, ry);
        const angleDifference = Math.abs(
          Math.atan2(
            Math.sin(car.angle - tangent),
            Math.cos(car.angle - tangent),
          ),
        );
        if (onTrack && Math.abs(car.speed) > 5 && angleDifference > 0.2) {
          car.drift += angleDifference * Math.abs(car.speed) * h * 3.2;
        }
      }

      trailTickRef.current += 1;
      if (trailTickRef.current % 2 === 0) {
        pushTrail(car.x, car.y);
      }
    },
    [pushTrail, resetCar],
  );

  // Fixed-step accumulator: physics always advances in 1/120 s substeps, so
  // behavior is identical at any display refresh rate.
  const updateCar = useCallback(
    (dt: number, size: StageSize) => {
      accumulatorRef.current += Math.min(dt, 0.25);
      while (accumulatorRef.current >= PHYSICS_STEP) {
        accumulatorRef.current -= PHYSICS_STEP;
        stepPhysics(PHYSICS_STEP, size);
      }
    },
    [stepPhysics],
  );

  const paintRace = useCallback(
    (runtime: CreativeCanvasRuntime) => {
      const { context, size } = runtime;
      if (!context) {
        return;
      }
      if (!carRef.current) {
        resetCar(size);
      }
      const car = carRef.current;
      if (!car) {
        return;
      }
      const { width, height } = size;
      const cx = width / 2;
      const cy = height / 2;
      const rx = Math.max(120, width * 0.34);
      const ry = Math.max(105, height * 0.3);

      context.fillStyle = "#06070a";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#151925";
      context.beginPath();
      context.ellipse(cx, cy, rx + 62, ry + 62, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#070910";
      context.beginPath();
      context.ellipse(
        cx,
        cy,
        Math.max(48, rx - 62),
        Math.max(42, ry - 62),
        0,
        0,
        Math.PI * 2,
      );
      context.fill();

      context.strokeStyle = "rgba(96,165,250,.55)";
      context.lineWidth = 2;
      context.setLineDash([14, 16]);
      context.beginPath();
      context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);

      // Checkered start/finish line at theta = pi — the side where laps are
      // actually counted.
      const lineX = cx - rx;
      const cell = 9;
      for (let row = 0; row < 2; row += 1) {
        for (let column = 0; column < 8; column += 1) {
          context.fillStyle = (row + column) % 2 === 0 ? "#f8fafc" : "#111827";
          context.fillRect(
            lineX - 36 + column * cell,
            cy - cell + row * cell,
            cell,
            cell,
          );
        }
      }

      const trail = getTrail();
      if (trail.count > 1) {
        context.strokeStyle = "rgba(248,113,113,.35)";
        context.lineWidth = 2;
        context.beginPath();
        const start =
          (trail.head - trail.count + TRAIL_LENGTH * 2) % TRAIL_LENGTH;
        for (let index = 0; index < trail.count; index += 1) {
          const point = trail.points[(start + index) % TRAIL_LENGTH];
          if (!point) {
            continue;
          }
          if (index === 0) {
            context.moveTo(point.x, point.y);
          } else {
            context.lineTo(point.x, point.y);
          }
        }
        context.stroke();
      }

      context.save();
      context.translate(car.x, car.y);
      context.rotate(car.angle);
      context.shadowColor = "#60a5fa";
      context.shadowBlur = 14;
      // Live off-track state at paint time — never a stale snapshot.
      context.fillStyle = car.offTrack < 0.5 ? "#60a5fa" : "#f87171";
      context.fillRect(-15, -9, 30, 18);
      context.fillStyle = "#dbeafe";
      context.fillRect(-4, -7, 11, 14);
      context.fillStyle = "#05070b";
      context.fillRect(-11, -12, 8, 4);
      context.fillRect(4, -12, 8, 4);
      context.fillRect(-11, 8, 8, 4);
      context.fillRect(4, 8, 8, 4);
      if (inputRef.current.boost) {
        context.fillStyle = "#f87171";
        context.fillRect(-24, -5, 9, 10);
      }
      context.restore();

      context.fillStyle = "rgba(5,7,11,.82)";
      context.fillRect(20, 20, 240, 72);
      context.fillStyle = "#dbeafe";
      context.font = "600 14px ui-monospace, monospace";
      context.fillText(
        `${Math.round(Math.abs(car.speed) * 9)} KM/H · LAP ${car.lap}`,
        34,
        48,
      );
      context.fillStyle = "rgba(255,255,255,.58)";
      context.font = "10px ui-monospace, monospace";
      context.fillText(
        `${autopilotRef.current ? "AUTOPILOT" : "MANUAL"} · GRIP ${Math.round(tuningRef.current.grip)}% · ENG ${Math.round(tuningRef.current.engine)}%`,
        34,
        70,
      );
    },
    [getTrail, resetCar],
  );

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      updateCar(dt, runtime.size);
      paintRace(runtime);
      frameRef.current += 1;
      if (frameRef.current % 12 === 0) {
        publish();
      }
    },
    onRepaint: paintRace,
    onResize: (_size, scale) => {
      const car = carRef.current;
      if (car) {
        car.x *= scale.x;
        car.y *= scale.y;
      }
      for (const point of getTrail().points) {
        if (point) {
          point.x *= scale.x;
          point.y *= scale.y;
        }
      }
    },
  });
  const { reducedMotion, repaint, sizeRef } = stage;

  // Reduced motion: the loop never runs, so the reference autopilot becomes
  // the driver and Advance 2 s becomes the throttle for time.
  useEffect(() => {
    if (!reducedMotion || forcedAutopilotRef.current) {
      return;
    }
    forcedAutopilotRef.current = true;
    setAutopilot(true);
    autopilotRef.current = true;
    repaint();
  }, [reducedMotion, repaint]);

  function handleStageKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const control = DRIVE_KEYS[event.key];
    if (!control) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }
    inputRef.current[control] = true;
  }

  function handleStageKeyUp(event: ReactKeyboardEvent<HTMLDivElement>) {
    const control = DRIVE_KEYS[event.key];
    if (!control) {
      return;
    }
    event.preventDefault();
    inputRef.current[control] = false;
  }

  function handleGripChange(value: number) {
    setGrip(value);
    tuningRef.current = { ...tuningRef.current, grip: value };
    publish();
    repaint();
  }

  function handleEngineChange(value: number) {
    setEngine(value);
    tuningRef.current = { ...tuningRef.current, engine: value };
    publish();
    repaint();
  }

  function toggleAutopilot() {
    const next = !autopilot;
    setAutopilot(next);
    autopilotRef.current = next;
    const size = sizeRef.current;
    const car = carRef.current;
    if (car) {
      const cx = size.width / 2;
      const cy = size.height / 2;
      const rx = Math.max(120, size.width * 0.34);
      const ry = Math.max(105, size.height * 0.3);
      const theta = Math.atan2((car.y - cy) / ry, (car.x - cx) / rx);
      if (next) {
        // Continue from the car's current position; the next line crossing
        // is the theta = pi point ahead of it.
        autoPhaseRef.current = theta;
        nextLapAtRef.current = theta >= Math.PI ? Math.PI * 3 : Math.PI;
      } else {
        car.lastTheta = theta;
      }
    }
    setStatus(next ? "Reference autopilot engaged." : "Manual control engaged.");
    publish();
    repaint();
  }

  function advanceTwoSeconds() {
    const size = sizeRef.current;
    for (let step = 0; step < 240; step += 1) {
      stepPhysics(PHYSICS_STEP, size);
    }
    setStatus("Advanced two seconds of race time.");
    publish();
    repaint();
  }

  function restartRace() {
    resetCar(sizeRef.current);
    setStatus("Race reset: laps, timers, and best lap cleared.");
    publish();
    repaint();
  }

  return (
    <PlayableStage
      eyebrow="Slipstream Circuit · arcade vehicle lab"
      tone="alert"
      headerStats={[
        { label: "mode", value: autopilot ? "autopilot" : "manual" },
        { label: "track", value: snapshot.onTrack ? "clean" : "off limit" },
        {
          label: "best",
          value:
            snapshot.bestTime === null
              ? "—"
              : `${snapshot.bestTime.toFixed(1)}s`,
        },
      ]}
      canvasRef={stage.canvasRef}
      hostRef={stage.hostRef}
      canvasLabel="Slipstream Circuit interactive arcade racing canvas"
      stageLabel="Slipstream Circuit driving stage. Steer with A and D or the left and right arrow keys, accelerate with W or up, brake with S or down, and hold Space to boost."
      onStageKeyDown={handleStageKeyDown}
      onStageKeyUp={handleStageKeyUp}
      hint={
        reducedMotion
          ? "Reduced motion: Advance 2 s drives the reference autopilot"
          : "Click or focus the stage, then use WASD/arrows"
      }
      controls={
        <>
          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Drive the circuit
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            {reducedMotion
              ? "Reduced motion is on: the reference autopilot drives, and each press of Advance 2 s moves the race forward."
              : "Click or focus the stage and use WASD or the arrow keys, or hold these touch controls. Hold Space or Boost for extra power."}
          </p>
          <ControlRange
            label="Tire grip"
            value={grip}
            min={20}
            max={95}
            display={`${grip}%`}
            onChange={handleGripChange}
          />
          <ControlRange
            label="Engine output"
            value={engine}
            min={25}
            max={95}
            display={`${engine}%`}
            onChange={handleEngineChange}
          />
          {reducedMotion ? null : (
            <div className="mt-6 grid grid-cols-3 gap-2">
              <HoldButton
                label="Steer left"
                onChange={(active) => {
                  inputRef.current.left = active;
                  repaint();
                }}
              >
                ←
              </HoldButton>
              <HoldButton
                label="Accelerate"
                onChange={(active) => {
                  inputRef.current.throttle = active;
                  repaint();
                }}
              >
                ↑
              </HoldButton>
              <HoldButton
                label="Steer right"
                onChange={(active) => {
                  inputRef.current.right = active;
                  repaint();
                }}
              >
                →
              </HoldButton>
              <HoldButton
                label="Brake or reverse"
                onChange={(active) => {
                  inputRef.current.brake = active;
                  repaint();
                }}
              >
                Brake
              </HoldButton>
              <HoldButton
                label="Boost"
                onChange={(active) => {
                  inputRef.current.boost = active;
                  repaint();
                }}
                className="col-span-2"
              >
                Boost
              </HoldButton>
            </div>
          )}
          <div className="mt-4 grid gap-2">
            <StageButton
              variant={autopilot ? "alert" : "primary"}
              onClick={toggleAutopilot}
            >
              {autopilot ? "Disable autopilot" : "Enable autopilot"}
            </StageButton>
            {reducedMotion ? null : (
              <StageButton
                onClick={() => {
                  if (stage.running) {
                    stage.stop();
                  } else {
                    stage.start();
                  }
                }}
              >
                {stage.running ? "Pause race" : "Resume race"}
              </StageButton>
            )}
            <StageButton onClick={advanceTwoSeconds}>Advance 2 s</StageButton>
            <StageButton variant="solid" onClick={restartRace}>
              Reset run
            </StageButton>
          </div>
        </>
      }
      stats={[
        { label: "Speed", value: `${snapshot.speed} km/h` },
        { label: "Lap", value: String(snapshot.lap) },
        { label: "Current lap", value: `${snapshot.lapTime.toFixed(1)}s` },
        {
          label: "Drift score",
          value: String(snapshot.drift),
          alert: !snapshot.onTrack,
        },
      ]}
    />
  );
}

function HoldButton({
  label,
  children,
  onChange,
  className = "",
}: {
  label: string;
  children: ReactNode;
  onChange: (active: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onChange(true);
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onPointerLeave={() => onChange(false)}
      onKeyDown={(event) => {
        if (event.key !== " " && event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        onChange(true);
      }}
      onKeyUp={(event) => {
        if (event.key !== " " && event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        onChange(false);
      }}
      onBlur={() => onChange(false)}
      className={`min-h-12 touch-none rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 active:bg-blue-400 active:text-black ${className}`}
    >
      {children}
    </button>
  );
}

const RPG_MAP = [
  "################",
  "#......#.......#",
  "#.##...#..R....#",
  "#......N.......#",
  "#..R....###....#",
  "#..............#",
  "#....####......#",
  "#.........R....#",
  "#..X......X....#",
  "#..............#",
  "#............G.#",
  "################",
] as const;

const RPG_MOVE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  A: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
  D: [1, 0],
  ArrowUp: [0, -1],
  w: [0, -1],
  W: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  S: [0, 1],
};

interface HeroState {
  x: number;
  y: number;
  safeX: number;
  safeY: number;
  hearts: number;
  echoes: Set<string>;
  steps: number;
  spoke: boolean;
  completed: boolean;
  message: string;
}

function freshHero(): HeroState {
  return {
    x: 1,
    y: 1,
    safeX: 1,
    safeY: 1,
    hearts: 3,
    echoes: new Set(),
    steps: 0,
    spoke: false,
    completed: false,
    message: "Find the keeper and recover the three lost echoes.",
  };
}

function LanternVale() {
  const heroRef = useRef<HeroState>(freshHero());
  const [snapshot, setSnapshot] = useState({
    hearts: 3,
    echoes: 0,
    steps: 0,
    spoke: false,
    completed: false,
    message: "Find the keeper and recover the three lost echoes.",
  });
  const phaseRef = useRef(0);

  const publish = useCallback(() => {
    const hero = heroRef.current;
    setSnapshot({
      hearts: hero.hearts,
      echoes: hero.echoes.size,
      steps: hero.steps,
      spoke: hero.spoke,
      completed: hero.completed,
      message: hero.message,
    });
  }, []);

  const paintRpg = useCallback((runtime: CreativeCanvasRuntime) => {
    const { context, size } = runtime;
    if (!context) {
      return;
    }
    const { width, height } = size;
    const cols = RPG_MAP[0].length;
    const rows = RPG_MAP.length;
    const tile = Math.min(width / cols, height / rows);
    const ox = (width - tile * cols) / 2;
    const oy = (height - tile * rows) / 2;
    context.fillStyle = "#05070b";
    context.fillRect(0, 0, width, height);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const cell = RPG_MAP[y][x];
        const px = ox + x * tile;
        const py = oy + y * tile;
        context.fillStyle =
          cell === "#"
            ? "#172033"
            : (x + y) % 2
              ? "#0d121c"
              : "#101724";
        context.fillRect(px + 1, py + 1, tile - 2, tile - 2);
        if (cell === "#") {
          context.fillStyle = "rgba(96,165,250,.18)";
          context.fillRect(px + 5, py + 5, tile - 10, tile - 10);
        }
        if (cell === "R" && !heroRef.current.echoes.has(`${x},${y}`)) {
          const pulse = 4 + Math.sin(phaseRef.current * 3 + x) * 2;
          context.fillStyle = "#60a5fa";
          context.fillRect(
            px + tile / 2 - pulse,
            py + tile / 2 - pulse,
            pulse * 2,
            pulse * 2,
          );
          context.strokeStyle = "rgba(219,234,254,.8)";
          context.strokeRect(
            px + tile / 2 - pulse - 3,
            py + tile / 2 - pulse - 3,
            pulse * 2 + 6,
            pulse * 2 + 6,
          );
        }
        if (cell === "X") {
          context.fillStyle = "#f87171";
          context.fillRect(px + tile * 0.28, py + tile * 0.28, tile * 0.44, tile * 0.44);
          context.fillStyle = "#05070b";
          context.fillRect(px + tile * 0.42, py + tile * 0.2, tile * 0.16, tile * 0.6);
        }
        if (cell === "N") {
          context.fillStyle = "#dbeafe";
          context.fillRect(px + tile * 0.34, py + tile * 0.23, tile * 0.32, tile * 0.55);
          context.fillStyle = "#60a5fa";
          context.fillRect(px + tile * 0.25, py + tile * 0.62, tile * 0.5, tile * 0.2);
          context.fillStyle = "#ffffff";
          context.font = `${Math.max(10, tile * 0.17)}px ui-monospace, monospace`;
          context.fillText("KEEPER", px + 3, py + tile - 5);
        }
        if (cell === "G") {
          const open =
            heroRef.current.echoes.size === 3 && heroRef.current.spoke;
          context.strokeStyle = open ? "#60a5fa" : "#f87171";
          context.lineWidth = Math.max(2, tile * 0.08);
          context.strokeRect(px + tile * 0.22, py + tile * 0.12, tile * 0.56, tile * 0.76);
          if (open) {
            // Gate state is never color-only: an open gate says so.
            context.fillStyle = "#dbeafe";
            context.font = `600 ${Math.max(10, Math.round(tile * 0.2))}px ui-monospace, monospace`;
            context.fillText("OPEN", px + tile * 0.26, py + tile * 0.55);
          } else {
            // Locked gate carries a padlock glyph.
            context.strokeStyle = "#f87171";
            context.lineWidth = Math.max(2, tile * 0.05);
            context.beginPath();
            context.arc(px + tile * 0.5, py + tile * 0.4, tile * 0.12, Math.PI, 0);
            context.stroke();
            context.fillStyle = "#f87171";
            context.fillRect(px + tile * 0.36, py + tile * 0.4, tile * 0.28, tile * 0.24);
          }
        }
      }
    }

    const hero = heroRef.current;
    const hx = ox + hero.x * tile;
    const hy = oy + hero.y * tile + Math.sin(phaseRef.current * 5) * 2;
    context.shadowColor = "#60a5fa";
    context.shadowBlur = 14;
    context.fillStyle = "#60a5fa";
    context.fillRect(hx + tile * 0.28, hy + tile * 0.34, tile * 0.44, tile * 0.42);
    context.fillStyle = "#dbeafe";
    context.fillRect(hx + tile * 0.36, hy + tile * 0.18, tile * 0.28, tile * 0.25);
    context.shadowBlur = 0;
    context.fillStyle = "#f87171";
    context.fillRect(hx + tile * 0.2, hy + tile * 0.69, tile * 0.6, tile * 0.1);
  }, []);

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      phaseRef.current += dt;
      paintRpg(runtime);
    },
    onRepaint: paintRpg,
  });
  const { reducedMotion, repaint } = stage;

  const moveHero = useCallback(
    (dx: number, dy: number) => {
      const hero = heroRef.current;
      if (hero.completed) {
        hero.message = "The quest is complete — choose New quest to play again.";
        publish();
        repaint();
        return;
      }
      const nx = hero.x + dx;
      const ny = hero.y + dy;
      const cell = RPG_MAP[ny]?.[nx];
      if (!cell || cell === "#") {
        hero.message = "A stone wall blocks that direction.";
        publish();
        repaint();
        return;
      }
      if (cell === "X") {
        // Rifts cost a heart and throw the hero back to the last safe tile.
        // Steps only count successful moves, so this is not one.
        hero.hearts -= 1;
        if (hero.hearts <= 0) {
          const reborn = freshHero();
          reborn.message =
            "Quest reset: the last rift drained your final heart. You wake at the trailhead with three hearts and no echoes.";
          heroRef.current = reborn;
        } else {
          hero.x = hero.safeX;
          hero.y = hero.safeY;
          hero.message = `A rift burned a heart (${hero.hearts} left) and threw you back to safe ground.`;
        }
        publish();
        repaint();
        return;
      }
      hero.x = nx;
      hero.y = ny;
      hero.safeX = nx;
      hero.safeY = ny;
      hero.steps += 1;
      if (cell === "R") {
        const key = `${nx},${ny}`;
        if (!hero.echoes.has(key)) {
          hero.echoes.add(key);
          hero.message = `Echo recovered: ${hero.echoes.size} of 3.`;
        }
      } else if (cell === "N") {
        hero.message = "The keeper is here. Use Interact to speak.";
      } else if (cell === "G") {
        hero.message = "The valley gate is here. Use Interact when ready.";
      }
      publish();
      repaint();
    },
    [publish, repaint],
  );

  function handleStageKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const move = RPG_MOVE_KEYS[event.key];
    if (!move) {
      return;
    }
    event.preventDefault();
    moveHero(move[0], move[1]);
  }

  function interact() {
    const hero = heroRef.current;
    const neighbors = [
      RPG_MAP[hero.y]?.[hero.x],
      RPG_MAP[hero.y - 1]?.[hero.x],
      RPG_MAP[hero.y + 1]?.[hero.x],
      RPG_MAP[hero.y]?.[hero.x - 1],
      RPG_MAP[hero.y]?.[hero.x + 1],
    ];
    if (neighbors.includes("N")) {
      hero.spoke = true;
      hero.message =
        hero.echoes.size === 3
          ? "Keeper: The echoes are whole. Take them to the valley gate."
          : `Keeper: ${3 - hero.echoes.size} lost echo${3 - hero.echoes.size === 1 ? "" : "es"} remain.`;
    } else if (neighbors.includes("G")) {
      if (hero.echoes.size === 3 && hero.spoke) {
        hero.completed = true;
        hero.message = "Quest complete: the lantern gate is open.";
      } else {
        hero.message = hero.spoke
          ? "The gate needs all three echoes."
          : "The keeper must teach you how to open this gate.";
      }
    } else {
      hero.message = "There is nothing nearby to interact with.";
    }
    publish();
    repaint();
  }

  function advanceGlow() {
    phaseRef.current += 1.6;
    repaint();
  }

  function resetQuest() {
    heroRef.current = freshHero();
    publish();
    repaint();
  }

  return (
    <PlayableStage
      eyebrow="Lantern Vale · miniature RPG systems"
      headerStats={[
        { label: "quest", value: snapshot.completed ? "complete" : "active" },
        { label: "objective", value: `${snapshot.echoes}/3 echoes` },
      ]}
      canvasRef={stage.canvasRef}
      hostRef={stage.hostRef}
      canvasLabel="Lantern Vale interactive blocky role-playing game canvas"
      stageLabel="Lantern Vale quest stage. Move the hero one tile at a time with the arrow keys or W A S D."
      onStageKeyDown={handleStageKeyDown}
      hint="Click or focus the stage, then use WASD/arrows"
      controls={
        <>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Quest log
          </p>
          <p
            className="mt-3 min-h-20 text-sm leading-7 text-white/70"
            role="status"
            aria-live="polite"
          >
            {snapshot.message}
          </p>
          <div className="mx-auto mt-6 grid max-w-[220px] grid-cols-3 gap-2">
            <span />
            <PadButton label="Move up" onClick={() => moveHero(0, -1)}>
              ↑
            </PadButton>
            <span />
            <PadButton label="Move left" onClick={() => moveHero(-1, 0)}>
              ←
            </PadButton>
            <PadButton label="Move down" onClick={() => moveHero(0, 1)}>
              ↓
            </PadButton>
            <PadButton label="Move right" onClick={() => moveHero(1, 0)}>
              →
            </PadButton>
          </div>
          <div className="mt-5 grid gap-2">
            <StageButton variant="primary" onClick={interact}>
              Interact
            </StageButton>
            {reducedMotion ? (
              <StageButton onClick={advanceGlow}>Advance glow</StageButton>
            ) : (
              <StageButton
                onClick={() => {
                  if (stage.running) {
                    stage.stop();
                  } else {
                    stage.start();
                  }
                }}
              >
                {stage.running ? "Pause animation" : "Resume animation"}
              </StageButton>
            )}
            <StageButton variant="solid" onClick={resetQuest}>
              New quest
            </StageButton>
          </div>
          <div className="mt-6 rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              Controls
            </p>
            <p className="mt-2 text-xs leading-6 text-white/65">
              Keyboard: click or focus the stage, then use the arrow keys or
              WASD. Touch and mouse: directional pad and Interact.
            </p>
          </div>
        </>
      }
      stats={[
        { label: "Hearts", value: "♥".repeat(snapshot.hearts), alert: snapshot.hearts < 2 },
        { label: "Echoes", value: `${snapshot.echoes} / 3` },
        { label: "Steps", value: String(snapshot.steps) },
        { label: "Keeper", value: snapshot.spoke ? "Spoken to" : "Find them" },
      ]}
    />
  );
}

function PadButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid min-h-14 place-items-center rounded-xl border border-white/15 bg-white/[0.04] text-lg font-semibold text-white/75 active:bg-blue-400 active:text-black"
    >
      {children}
    </button>
  );
}

type AnimationState = "Idle" | "Run" | "Jump" | "Attack";

interface Rig {
  head: number;
  torso: number;
  limb: number;
  seed: number;
}

function Frameforge() {
  const ACTIONS = useMemo(
    () => ["Idle", "Run", "Jump", "Attack"] as const,
    [],
  );
  const reducedMotion = usePrefersReducedMotion();
  const reducedMotionRef = useRef(reducedMotion);
  const [action, setAction] = useState<AnimationState>("Run");
  const actionRef = useRef<AnimationState>("Run");
  const [fps, setFps] = useState(10);
  const fpsRef = useRef(10);
  const [exaggeration, setExaggeration] = useState(62);
  const exaggerationRef = useRef(62);
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const accumulatorRef = useRef(0);
  const rigRef = useRef<Rig>({ head: 46, torso: 74, limb: 63, seed: 1 });
  const [rigRevision, setRigRevision] = useState(1);
  const [status, setStatus] = useState("Animation director ready.");

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  const paintRig = useCallback((runtime: CreativeCanvasRuntime) => {
    const { context, size } = runtime;
    if (!context) {
      return;
    }
    const { width, height } = size;
    const rig = rigRef.current;
    const phase = (frameRef.current / 8) * Math.PI * 2;
    const amount = exaggerationRef.current / 100;
    const active = actionRef.current;

    context.fillStyle = "#06070a";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(96,165,250,.08)";
    context.lineWidth = 1;
    context.beginPath();
    for (let x = 0; x < width; x += 32) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 32) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();

    const cx = width * 0.5;
    const ground = height * 0.76;
    const run = active === "Run" ? Math.sin(phase) : 0;
    const jump = active === "Jump" ? Math.max(0, Math.sin(phase)) : 0;
    // One attack arc per 8-frame cycle: phase/2 sweeps 0..pi exactly once.
    const attack =
      active === "Attack" ? Math.sin(Math.min(Math.PI, phase * 0.5)) : 0;
    const idle = active === "Idle" ? Math.sin(phase) * 3 * amount : 0;
    const bodyY = ground - rig.torso - rig.head - 54 - jump * 96 * amount + idle;
    const torsoLean = run * 0.11 * amount + attack * 0.18 * amount;

    context.save();
    context.translate(cx, bodyY + rig.head + 12);
    context.rotate(torsoLean);
    context.fillStyle = "#60a5fa";
    context.shadowColor = "#60a5fa";
    context.shadowBlur = 18;
    context.fillRect(-rig.head / 2, -rig.head - 7, rig.head, rig.head);
    context.fillStyle = "#dbeafe";
    context.fillRect(rig.head * 0.05, -rig.head * 0.78, 8, 8);
    context.fillStyle = "#2563eb";
    context.fillRect(-24, 0, 48, rig.torso);
    context.fillStyle = "#f87171";
    context.fillRect(-24, 0, 48, 9);
    context.shadowBlur = 0;

    const armSwing =
      active === "Attack"
        ? -1.2 + attack * 1.75 * amount
        : run * 0.82 * amount;
    drawLimb(context, -22, 10, rig.limb, 12, armSwing, "#60a5fa");
    drawLimb(context, 22, 10, rig.limb, 12, -armSwing, "#dbeafe");

    // Idle leg sway scales with the exaggeration amount like every other pose.
    const legSwing =
      active === "Jump"
        ? 0.7 * amount
        : active === "Run"
          ? run * 0.85 * amount
          : 0.08 * Math.sin(phase) * amount;
    drawLimb(context, -13, rig.torso - 2, rig.limb, 14, legSwing, "#dbeafe");
    drawLimb(context, 13, rig.torso - 2, rig.limb, 14, -legSwing, "#60a5fa");
    context.restore();

    context.strokeStyle = "rgba(248,113,113,.7)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(width * 0.14, ground + 6);
    context.lineTo(width * 0.86, ground + 6);
    context.stroke();

    context.fillStyle = "rgba(5,7,11,.84)";
    context.fillRect(20, 20, 238, 76);
    context.fillStyle = "#dbeafe";
    context.font = "600 14px ui-monospace, monospace";
    context.fillText(`${active.toUpperCase()} · FRAME ${frameRef.current + 1}/8`, 34, 49);
    context.fillStyle = "rgba(255,255,255,.58)";
    context.font = "10px ui-monospace, monospace";
    context.fillText(
      reducedMotionRef.current
        ? `STATIC · RIG ${rig.seed}`
        : `${fpsRef.current} FPS · RIG ${rig.seed}`,
      34,
      72,
    );
  }, []);

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      accumulatorRef.current += dt;
      const frameDuration = 1 / fpsRef.current;
      const advanceBy = Math.floor(accumulatorRef.current / frameDuration);
      if (advanceBy > 0) {
        accumulatorRef.current -= advanceBy * frameDuration;
        const next = (frameRef.current + advanceBy) % 8;
        // setFrame only when the integer frame actually changes.
        if (next !== frameRef.current) {
          frameRef.current = next;
          setFrame(next);
        }
      }
      paintRig(runtime);
    },
    onRepaint: paintRig,
  });

  function handleActionChange(value: AnimationState) {
    setAction(value);
    actionRef.current = value;
    setStatus(`Animation state set to ${value}.`);
    stage.repaint();
  }

  function handleFpsChange(value: number) {
    setFps(value);
    fpsRef.current = value;
    setStatus(`Frame rate set to ${value} fps.`);
    stage.repaint();
  }

  function handleExaggerationChange(value: number) {
    setExaggeration(value);
    exaggerationRef.current = value;
    setStatus(`Exaggeration set to ${value}%.`);
    stage.repaint();
  }

  function chooseFrame(index: number) {
    stage.stop();
    frameRef.current = index;
    setFrame(index);
    setStatus(`Inspecting frame ${index + 1}.`);
    stage.repaint();
  }

  function advanceFrame() {
    stage.stop();
    const next = (frameRef.current + 1) % 8;
    frameRef.current = next;
    setFrame(next);
    setStatus(`Advanced to frame ${next + 1}.`);
    stage.repaint();
  }

  function randomizeRig() {
    const nextSeed = rigRef.current.seed + 1;
    const random = mulberry32(hashSeed(`frameforge-${nextSeed}`));
    rigRef.current = {
      head: 38 + random() * 18,
      torso: 64 + random() * 24,
      limb: 54 + random() * 22,
      seed: nextSeed,
    };
    setRigRevision(nextSeed);
    setStatus(`Rig ${nextSeed} generated.`);
    stage.repaint();
  }

  return (
    <PlayableStage
      eyebrow="Frameforge · procedural character animation"
      tone="alert"
      headerStats={[
        { label: "state", value: action },
        { label: "frame", value: `${frame + 1}/8` },
      ]}
      canvasRef={stage.canvasRef}
      hostRef={stage.hostRef}
      canvasLabel="Frameforge interactive blocky character animation canvas"
      controls={
        <>
          <p className="sr-only" role="status" aria-live="polite">
            {status}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Animation director
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Change the state, timing, and pose intensity, then step through any
            frame in the cycle.
          </p>
          <ControlSelect
            label="Animation state"
            value={action}
            options={ACTIONS}
            onChange={handleActionChange}
          />
          <ControlRange
            label="Frame rate"
            value={fps}
            min={2}
            max={18}
            display={`${fps} fps`}
            onChange={handleFpsChange}
          />
          <ControlRange
            label="Exaggeration"
            value={exaggeration}
            min={10}
            max={100}
            display={`${exaggeration}%`}
            onChange={handleExaggerationChange}
          />
          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              Frame timeline
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Inspect frame ${index + 1}`}
                  aria-pressed={frame === index}
                  onClick={() => chooseFrame(index)}
                  className={`min-h-11 rounded-lg border font-mono text-[10px] ${
                    frame === index
                      ? "border-blue-300 bg-blue-300 text-black"
                      : "border-white/15 text-white/65"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {reducedMotion ? null : (
              <StageButton
                onClick={() => {
                  if (stage.running) {
                    stage.stop();
                  } else {
                    stage.start();
                  }
                }}
              >
                {stage.running ? "Pause" : "Play"}
              </StageButton>
            )}
            <StageButton onClick={advanceFrame}>Advance frame</StageButton>
            <StageButton onClick={randomizeRig}>New rig</StageButton>
            <StageButton
              variant="solid"
              className="col-span-2"
              onClick={() => {
                exportCanvasPng(stage.canvasRef.current, "frameforge-pose");
                setStatus("Current pose exported as PNG.");
              }}
            >
              Export current pose
            </StageButton>
          </div>
        </>
      }
      stats={[
        { label: "Animation", value: action },
        {
          label: "Frame rate",
          value: reducedMotion ? "static" : `${fps} fps`,
        },
        { label: "Exaggeration", value: `${exaggeration}%` },
        { label: "Rig revision", value: String(rigRevision) },
      ]}
    />
  );
}

function drawLimb(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  thickness: number,
  angle: number,
  color: string,
) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = color;
  context.fillRect(-thickness / 2, 0, thickness, length);
  context.fillStyle = "#f87171";
  context.fillRect(-thickness / 2 - 2, length - 8, thickness + 4, 10);
  context.restore();
}
