"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
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
  onPointerDown,
  controls,
  stats,
  tone = "accent",
}: {
  eyebrow: string;
  headerStats: Array<{ label: string; value: string }>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hostRef: RefObject<HTMLDivElement | null>;
  canvasLabel: string;
  onPointerDown?: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  controls: ReactNode;
  stats: Array<{ label: string; value: string; alert?: boolean }>;
  tone?: "accent" | "alert";
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-16">
      <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#08090d]">
        <StageHeader eyebrow={eyebrow} stats={headerStats} tone={tone} />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
          <div
            ref={hostRef}
            className="relative min-h-[580px] min-w-0 overflow-hidden bg-[#06070a] md:min-h-[680px]"
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={canvasLabel}
              onPointerDown={onPointerDown}
              className="block touch-none"
            />
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
function Blocktown() {
  const residentsRef = useRef<Resident[]>([]);
  const buildingsRef = useRef<TownBuilding[]>([]);
  const hourRef = useRef(7.5);
  const festivalRef = useRef(0);
  const visitsRef = useRef(0);
  const frameRef = useRef(0);
  const randomRef = useRef(mulberry32(hashSeed("blocktown-1")));
  const [tempo, setTempo] = useState(55);
  const tempoRef = useRef(tempo);
  const [revision, setRevision] = useState(1);
  const [selected, setSelected] = useState<Resident | null>(null);
  const [snapshot, setSnapshot] = useState<TownSnapshot>({
    residents: 6,
    hour: 7.5,
    happiness: 76,
    visits: 0,
    festival: 0,
  });

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  const initialize = useCallback((size: StageSize, seed: number) => {
    const random = mulberry32(hashSeed(`blocktown-${seed}`));
    randomRef.current = random;
    const w = size.width || 900;
    const h = size.height || 680;
    buildingsRef.current = [
      { id: 1, name: "Corner Café", kind: "food", x: w * 0.12, y: h * 0.18, w: 118, h: 76 },
      { id: 2, name: "Blue Park", kind: "fun", x: w * 0.66, y: h * 0.16, w: 142, h: 96 },
      { id: 3, name: "Town Hall", kind: "social", x: w * 0.61, y: h * 0.65, w: 150, h: 92 },
      { id: 4, name: "Row Homes", kind: "energy", x: w * 0.12, y: h * 0.64, w: 158, h: 102 },
    ];
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
        need: "fun",
        needs: {
          food: 58 + random() * 34,
          energy: 58 + random() * 34,
          social: 58 + random() * 34,
          fun: 58 + random() * 34,
        },
        visits: 0,
      };
    });
    hourRef.current = 7.5;
    festivalRef.current = 0;
    visitsRef.current = 0;
    setSelected(null);
  }, []);

  const publish = useCallback(() => {
    const residents = residentsRef.current;
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
      if (!current) return null;
      const live = residents.find((resident) => resident.id === current.id);
      return live
        ? { ...live, needs: { ...live.needs } }
        : null;
    });
  }, []);

  const updateTown = useCallback((dt: number, size: StageSize) => {
    if (!residentsRef.current.length) initialize(size, revision);
    const speed = 0.45 + tempoRef.current / 45;
    const random = randomRef.current;
    hourRef.current = (hourRef.current + dt * speed * 0.33) % 24;
    festivalRef.current = Math.max(0, festivalRef.current - dt * speed);

    residentsRef.current = residentsRef.current.map((resident) => {
      const next: Resident = {
        ...resident,
        needs: { ...resident.needs },
      };
      next.needs.food = Math.max(0, next.needs.food - dt * 1.25 * speed);
      next.needs.energy = Math.max(
        0,
        next.needs.energy - dt * 0.92 * speed,
      );
      next.needs.social = Math.max(
        0,
        next.needs.social - dt * (festivalRef.current > 0 ? 0.2 : 0.72) * speed,
      );
      next.needs.fun = Math.max(0, next.needs.fun - dt * 0.78 * speed);

      const dx = next.tx - next.x;
      const dy = next.ty - next.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 4) {
        const velocity = Math.min(distance, dt * 34 * speed);
        next.x += (dx / distance) * velocity;
        next.y += (dy / distance) * velocity;
      } else {
        if (next.task.startsWith("visiting")) {
          next.needs[next.need] = Math.min(
            100,
            next.needs[next.need] + dt * 24 * speed,
          );
        }
        const sorted = (Object.keys(next.needs) as Need[]).sort(
          (a, b) => next.needs[a] - next.needs[b],
        );
        const nextNeed =
          festivalRef.current > 0 && next.needs.social < 90
            ? "social"
            : sorted[0];
        const options = buildingsRef.current.filter(
          (building) => building.kind === nextNeed,
        );
        const building =
          options[Math.floor(random() * Math.max(1, options.length))] ??
          buildingsRef.current[Math.floor(random() * buildingsRef.current.length)];
        next.need = nextNeed;
        next.tx = building.x + building.w / 2 + (random() - 0.5) * 44;
        next.ty = building.y + building.h + 22 + random() * 22;
        next.task = `visiting ${building.name}`;
        next.visits += 1;
        visitsRef.current += 1;
      }
      return next;
    });
  }, [initialize, revision]);

  const paintTown = useCallback(
    (runtime: CreativeCanvasRuntime) => {
      const { context: context, size } = runtime;
      if (!context) return;
      if (!residentsRef.current.length) initialize(size, revision);
      const { width, height } = size;
      context.fillStyle = "#06070b";
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(96,165,250,.08)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 36) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 36) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

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

      for (const resident of residentsRef.current) {
        const chosen = selected?.id === resident.id;
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
        context.font = "9px ui-monospace, monospace";
        context.fillText(resident.name.toUpperCase(), resident.x - 14, resident.y + 20);
      }

      context.fillStyle = "rgba(5,7,11,.78)";
      context.fillRect(18, 18, 190, 64);
      context.fillStyle = "#dbeafe";
      context.font = "600 12px ui-monospace, monospace";
      context.fillText(
        `${formatHour(hourRef.current)} · ${festivalRef.current > 0 ? "STREET FESTIVAL" : "NORMAL DAY"}`,
        32,
        44,
      );
      context.fillStyle = "rgba(255,255,255,.58)";
      context.font = "10px ui-monospace, monospace";
      context.fillText("CLICK A RESIDENT TO INSPECT", 32, 64);
    },
    [initialize, revision, selected?.id],
  );

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      updateTown(dt, runtime.size);
      paintTown(runtime);
      frameRef.current += 1;
      if (frameRef.current % 20 === 0) publish();
    },
    onRepaint: paintTown,
    onResize: (_size, scale) => {
      residentsRef.current = residentsRef.current.map((resident) => ({
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

  function selectResident(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest: Resident | undefined;
    let distance = 34;
    for (const resident of residentsRef.current) {
      const candidate = Math.hypot(resident.x - x, resident.y - y);
      if (candidate < distance) {
        distance = candidate;
        nearest = resident;
      }
    }
    setSelected(
      nearest ? { ...nearest, needs: { ...nearest.needs } } : null,
    );
    stage.repaint();
  }

  function addBuilding(kind: "food" | "fun") {
    const size = stage.sizeRef.current;
    const count = buildingsRef.current.length;
    const w = 108;
    const h = 74;
    buildingsRef.current.push({
      id: count + 1,
      name: kind === "food" ? `Café ${count - 2}` : `Pocket Park ${count - 2}`,
      kind,
      x: size.width * (0.5 + ((count * 0.13) % 0.35)),
      y: size.height * (0.24 + ((count * 0.17) % 0.38)),
      w,
      h,
    });
    stage.repaint();
  }

  function resetTown() {
    const next = revision + 1;
    setRevision(next);
    initialize(stage.sizeRef.current, next);
    publish();
    stage.repaint();
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
      onPointerDown={selectResident}
      controls={
        <>
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
            onChange={setTempo}
          />
          <div className="mt-6 rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              {selected ? selected.name : "Resident inspector"}
            </p>
            <p className="mt-3 text-xs leading-6 text-white/65">
              {selected
                ? `${selected.task}. Lowest need: ${selectedNeed?.[0]} at ${Math.round(selectedNeed?.[1] ?? 0)}%.`
                : "Click any resident in the town to inspect their current motive."}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <StageButton onClick={() => addBuilding("food")}>
              Add café
            </StageButton>
            <StageButton onClick={() => addBuilding("fun")}>
              Add park
            </StageButton>
            <StageButton
              variant="alert"
              onClick={() => {
                festivalRef.current = 24;
                publish();
                stage.repaint();
              }}
              className="col-span-2"
            >
              Start street festival
            </StageButton>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <StageButton
              onClick={() => (stage.running ? stage.stop() : stage.start())}
              pressed={!stage.running}
            >
              {stage.running ? "Pause town" : "Resume town"}
            </StageButton>
            <StageButton variant="solid" onClick={resetTown}>
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

function Slipstream() {
  const carRef = useRef<RaceCar | null>(null);
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const inputRef = useRef<Record<DriveInput, boolean>>({
    left: false,
    right: false,
    throttle: false,
    brake: false,
    boost: false,
  });
  const frameRef = useRef(0);
  const autoPhaseRef = useRef(0);
  const [grip, setGrip] = useState(62);
  const [engine, setEngine] = useState(58);
  const tuningRef = useRef({ grip, engine });
  const [autopilot, setAutopilot] = useState(false);
  const autopilotRef = useRef(autopilot);
  const [snapshot, setSnapshot] = useState<RaceSnapshot>({
    speed: 0,
    lap: 0,
    lapTime: 0,
    bestTime: null,
    drift: 0,
    onTrack: true,
  });

  useEffect(() => {
    tuningRef.current = { grip, engine };
  }, [engine, grip]);
  useEffect(() => {
    autopilotRef.current = autopilot;
  }, [autopilot]);

  const resetCar = useCallback((size: StageSize) => {
    const rx = Math.max(120, size.width * 0.34);
    carRef.current = {
      x: size.width / 2 + rx,
      y: size.height / 2,
      angle: Math.PI / 2,
      speed: 0,
      lap: 0,
      lapTime: 0,
      bestTime: null,
      drift: 0,
      lastTheta: 0,
      offTrack: 0,
    };
    autoPhaseRef.current = 0;
    trailRef.current = [];
  }, []);

  const publish = useCallback(() => {
    const car = carRef.current;
    if (!car) return;
    setSnapshot({
      speed: Math.round(Math.abs(car.speed) * 9),
      lap: car.lap,
      lapTime: car.lapTime,
      bestTime: car.bestTime,
      drift: Math.round(car.drift),
      onTrack: car.offTrack < 0.5,
    });
  }, []);

  const updateCar = useCallback(
    (dt: number, size: StageSize) => {
      if (!carRef.current) resetCar(size);
      const car = carRef.current;
      if (!car) return;
      const { width, height } = size;
      const cx = width / 2;
      const cy = height / 2;
      const rx = Math.max(120, width * 0.34);
      const ry = Math.max(105, height * 0.3);
      const tuning = tuningRef.current;

      if (autopilotRef.current) {
        autoPhaseRef.current += dt * (0.52 + tuning.engine / 165);
        const phase = autoPhaseRef.current;
        car.x = cx + Math.cos(phase) * rx;
        car.y = cy + Math.sin(phase) * ry;
        car.angle = Math.atan2(Math.cos(phase) * ry, -Math.sin(phase) * rx);
        car.speed = 8 + tuning.engine / 12;
        car.lapTime += dt;
        if (phase >= Math.PI * 2) {
          autoPhaseRef.current -= Math.PI * 2;
          car.lap += 1;
          car.bestTime =
            car.bestTime === null ? car.lapTime : Math.min(car.bestTime, car.lapTime);
          car.lapTime = 0;
        }
        car.offTrack = 0;
      } else {
        const input = inputRef.current;
        const throttle = input.throttle ? 1 : input.brake ? -0.75 : 0;
        const power = 5.2 + tuning.engine / 16;
        car.speed += throttle * power * dt;
        car.speed *= Math.pow(input.brake ? 0.94 : 0.988, dt * 60);
        if (input.boost && car.speed > 2) car.speed += 5.5 * dt;
        car.speed = Math.max(-4.5, Math.min(17 + tuning.engine / 9, car.speed));

        const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
        const turnAuthority =
          (0.72 + tuning.grip / 105) *
          Math.min(1, Math.abs(car.speed) / 4.2);
        car.angle += steer * turnAuthority * dt * Math.sign(car.speed || 1);
        car.x += Math.cos(car.angle) * car.speed * dt * 10;
        car.y += Math.sin(car.angle) * car.speed * dt * 10;
        car.lapTime += dt;

        const normalized = Math.hypot((car.x - cx) / rx, (car.y - cy) / ry);
        const onTrack = normalized > 0.76 && normalized < 1.24;
        if (!onTrack) {
          car.speed *= Math.pow(0.95, dt * 60);
          car.offTrack += dt;
        } else {
          car.offTrack = Math.max(0, car.offTrack - dt * 2);
        }
        if (car.offTrack > 2.4) resetCar(size);

        const theta = Math.atan2((car.y - cy) / ry, (car.x - cx) / rx);
        if (
          onTrack &&
          car.lastTheta > 2.55 &&
          theta < -2.55 &&
          car.speed > 2
        ) {
          car.lap += 1;
          car.bestTime =
            car.bestTime === null ? car.lapTime : Math.min(car.bestTime, car.lapTime);
          car.lapTime = 0;
        }
        car.lastTheta = theta;

        const tangent = Math.atan2(
          Math.cos(theta) * ry,
          -Math.sin(theta) * rx,
        );
        const angleDifference = Math.abs(
          Math.atan2(
            Math.sin(car.angle - tangent),
            Math.cos(car.angle - tangent),
          ),
        );
        if (onTrack && Math.abs(car.speed) > 5 && angleDifference > 0.2) {
          car.drift += angleDifference * Math.abs(car.speed) * dt * 3.2;
        }
      }

      trailRef.current.push({ x: car.x, y: car.y });
      if (trailRef.current.length > 90) trailRef.current.shift();
    },
    [resetCar],
  );

  const paintRace = useCallback(
    (runtime: CreativeCanvasRuntime) => {
      const { context, size } = runtime;
      if (!context) return;
      if (!carRef.current) resetCar(size);
      const car = carRef.current;
      if (!car) return;
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

      context.fillStyle = "#f8fafc";
      context.fillRect(cx + rx - 10, cy - 57, 6, 114);
      context.fillStyle = "#111827";
      for (let line = 0; line < 6; line += 1) {
        context.fillRect(cx + rx - 10, cy - 57 + line * 19, 6, 10);
      }

      context.strokeStyle = "rgba(248,113,113,.35)";
      context.lineWidth = 2;
      context.beginPath();
      trailRef.current.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.stroke();

      context.save();
      context.translate(car.x, car.y);
      context.rotate(car.angle);
      context.shadowColor = "#60a5fa";
      context.shadowBlur = 14;
      context.fillStyle = snapshot.onTrack ? "#60a5fa" : "#f87171";
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
      context.fillRect(20, 20, 230, 72);
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
        autopilotRef.current ? "REFERENCE AUTOPILOT ACTIVE" : "MANUAL CONTROL",
        34,
        70,
      );
    },
    [resetCar, snapshot.onTrack],
  );

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      updateCar(dt, runtime.size);
      paintRace(runtime);
      frameRef.current += 1;
      if (frameRef.current % 12 === 0) publish();
    },
    onRepaint: paintRace,
    onResize: (_size, scale) => {
      const car = carRef.current;
      if (car) {
        car.x *= scale.x;
        car.y *= scale.y;
      }
      trailRef.current = trailRef.current.map((point) => ({
        x: point.x * scale.x,
        y: point.y * scale.y,
      }));
    },
  });

  useEffect(() => {
    const keyMap: Record<string, DriveInput> = {
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
    function setKey(event: KeyboardEvent, value: boolean) {
      const control = keyMap[event.key];
      if (!control) return;
      event.preventDefault();
      inputRef.current[control] = value;
    }
    const down = (event: KeyboardEvent) => setKey(event, true);
    const up = (event: KeyboardEvent) => setKey(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  function restartRace() {
    resetCar(stage.sizeRef.current);
    publish();
    stage.repaint();
  }

  return (
    <PlayableStage
      eyebrow="Slipstream Circuit · arcade vehicle lab"
      tone="alert"
      headerStats={[
        { label: "mode", value: autopilot ? "autopilot" : "manual" },
        { label: "track", value: snapshot.onTrack ? "clean" : "off limit" },
      ]}
      canvasRef={stage.canvasRef}
      hostRef={stage.hostRef}
      canvasLabel="Slipstream Circuit interactive arcade racing canvas"
      controls={
        <>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Drive the circuit
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Use WASD, the arrow keys, or these touch controls. Hold Space or
            Boost for extra power.
          </p>
          <ControlRange
            label="Tire grip"
            value={grip}
            min={20}
            max={95}
            display={`${grip}%`}
            onChange={setGrip}
          />
          <ControlRange
            label="Engine output"
            value={engine}
            min={25}
            max={95}
            display={`${engine}%`}
            onChange={setEngine}
          />
          <div className="mt-6 grid grid-cols-3 gap-2">
            <HoldButton
              label="Steer left"
              onChange={(active) => {
                inputRef.current.left = active;
              }}
            >
              ←
            </HoldButton>
            <HoldButton
              label="Accelerate"
              onChange={(active) => {
                inputRef.current.throttle = active;
              }}
            >
              ↑
            </HoldButton>
            <HoldButton
              label="Steer right"
              onChange={(active) => {
                inputRef.current.right = active;
              }}
            >
              →
            </HoldButton>
            <HoldButton
              label="Brake or reverse"
              onChange={(active) => {
                inputRef.current.brake = active;
              }}
            >
              Brake
            </HoldButton>
            <HoldButton
              label="Boost"
              onChange={(active) => {
                inputRef.current.boost = active;
              }}
              className="col-span-2"
            >
              Boost
            </HoldButton>
          </div>
          <div className="mt-4 grid gap-2">
            <StageButton
              variant={autopilot ? "alert" : "primary"}
              pressed={autopilot}
              onClick={() => {
                setAutopilot((value) => !value);
                restartRace();
              }}
            >
              {autopilot ? "Disable autopilot" : "Enable autopilot"}
            </StageButton>
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

interface HeroState {
  x: number;
  y: number;
  hearts: number;
  echoes: Set<string>;
  steps: number;
  spoke: boolean;
  completed: boolean;
  message: string;
}

function LanternVale() {
  const heroRef = useRef<HeroState>({
    x: 1,
    y: 1,
    hearts: 3,
    echoes: new Set(),
    steps: 0,
    spoke: false,
    completed: false,
    message: "Find the keeper and recover the three lost echoes.",
  });
  const [snapshot, setSnapshot] = useState({
    hearts: 3,
    echoes: 0,
    steps: 0,
    spoke: false,
    completed: false,
    message: "Find the keeper and recover the three lost echoes.",
  });
  const phaseRef = useRef(0);
  const moveCommandRef = useRef<(dx: number, dy: number) => void>(() => {});

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
    if (!context) return;
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
          context.font = `${Math.max(8, tile * 0.17)}px ui-monospace, monospace`;
          context.fillText("KEEPER", px + 3, py + tile - 5);
        }
        if (cell === "G") {
          context.strokeStyle =
            heroRef.current.echoes.size === 3 && heroRef.current.spoke
              ? "#60a5fa"
              : "#f87171";
          context.lineWidth = Math.max(2, tile * 0.08);
          context.strokeRect(px + tile * 0.22, py + tile * 0.12, tile * 0.56, tile * 0.76);
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

  const moveHero = useCallback(
    (dx: number, dy: number) => {
      const hero = heroRef.current;
      if (hero.completed) return;
      const nx = hero.x + dx;
      const ny = hero.y + dy;
      const cell = RPG_MAP[ny]?.[nx];
      if (!cell || cell === "#") {
        hero.message = "A stone wall blocks that direction.";
        publish();
        stage.repaint();
        return;
      }
      hero.steps += 1;
      if (cell === "X") {
        hero.hearts = Math.max(0, hero.hearts - 1);
        hero.message =
          hero.hearts > 0
            ? "The rift pushed you back. Choose another path."
            : "Your lantern faded, so the keeper restored your hearts.";
        if (hero.hearts === 0) hero.hearts = 3;
      } else {
        hero.x = nx;
        hero.y = ny;
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
      }
      publish();
      stage.repaint();
    },
    [publish, stage],
  );

  useEffect(() => {
    moveCommandRef.current = moveHero;
  }, [moveHero]);

  useEffect(() => {
    const keyMap: Record<string, [number, number]> = {
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
    function onKeyDown(event: KeyboardEvent) {
      const move = keyMap[event.key];
      if (!move) return;
      event.preventDefault();
      moveCommandRef.current(...move);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    stage.repaint();
  }

  function resetQuest() {
    heroRef.current = {
      x: 1,
      y: 1,
      hearts: 3,
      echoes: new Set(),
      steps: 0,
      spoke: false,
      completed: false,
      message: "Find the keeper and recover the three lost echoes.",
    };
    publish();
    stage.repaint();
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
            <StageButton
              onClick={() => (stage.running ? stage.stop() : stage.start())}
              pressed={!stage.running}
            >
              {stage.running ? "Pause animation" : "Resume animation"}
            </StageButton>
            <StageButton variant="solid" onClick={resetQuest}>
              New quest
            </StageButton>
          </div>
          <div className="mt-6 rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
              Controls
            </p>
            <p className="mt-2 text-xs leading-6 text-white/65">
              Keyboard: arrow keys or WASD. Touch and mouse: directional pad
              and Interact.
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
  const [action, setAction] = useState<AnimationState>("Run");
  const actionRef = useRef<AnimationState>(action);
  const [fps, setFps] = useState(10);
  const fpsRef = useRef(fps);
  const [exaggeration, setExaggeration] = useState(62);
  const exaggerationRef = useRef(exaggeration);
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const accumulatorRef = useRef(0);
  const rigRef = useRef<Rig>({ head: 46, torso: 74, limb: 63, seed: 1 });
  const [rigRevision, setRigRevision] = useState(1);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);
  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);
  useEffect(() => {
    exaggerationRef.current = exaggeration;
  }, [exaggeration]);

  const paintRig = useCallback((runtime: CreativeCanvasRuntime) => {
    const { context, size } = runtime;
    if (!context) return;
    const { width, height } = size;
    const rig = rigRef.current;
    const phase = (frameRef.current / 8) * Math.PI * 2;
    const amount = exaggerationRef.current / 100;
    const active = actionRef.current;

    context.fillStyle = "#06070a";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(96,165,250,.08)";
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 32) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = 0; y < height; y += 32) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const cx = width * 0.5;
    const ground = height * 0.76;
    const run = active === "Run" ? Math.sin(phase) : 0;
    const jump = active === "Jump" ? Math.max(0, Math.sin(phase)) : 0;
    const attack = active === "Attack" ? Math.sin(Math.min(Math.PI, phase % Math.PI)) : 0;
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

    const legSwing =
      active === "Jump"
        ? 0.7 * amount
        : active === "Run"
          ? run * 0.85 * amount
          : 0.08 * Math.sin(phase);
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
    context.fillText(`${fpsRef.current} FPS · RIG ${rig.seed}`, 34, 72);
  }, []);

  const stage = useCreativeCanvas({
    minHeight: 680,
    onFrame: (dt, _elapsed, runtime) => {
      accumulatorRef.current += dt;
      const frameDuration = 1 / fpsRef.current;
      if (accumulatorRef.current >= frameDuration) {
        accumulatorRef.current %= frameDuration;
        frameRef.current = (frameRef.current + 1) % 8;
        setFrame(frameRef.current);
      }
      paintRig(runtime);
    },
    onRepaint: paintRig,
  });

  function chooseFrame(index: number) {
    stage.stop();
    frameRef.current = index;
    setFrame(index);
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
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Animation director
          </p>
          <p className="mt-3 text-sm leading-7 text-white/70">
            Change the state, timing, and pose intensity, then pause to inspect
            any frame in the cycle.
          </p>
          <ControlSelect
            label="Animation state"
            value={action}
            options={ACTIONS}
            onChange={(value) => {
              setAction(value);
              actionRef.current = value;
              stage.repaint();
            }}
          />
          <ControlRange
            label="Frame rate"
            value={fps}
            min={2}
            max={18}
            display={`${fps} fps`}
            onChange={setFps}
          />
          <ControlRange
            label="Exaggeration"
            value={exaggeration}
            min={10}
            max={100}
            display={`${exaggeration}%`}
            onChange={setExaggeration}
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
            <StageButton
              onClick={() => (stage.running ? stage.stop() : stage.start())}
              pressed={!stage.running}
            >
              {stage.running ? "Pause" : "Play"}
            </StageButton>
            <StageButton onClick={randomizeRig}>New rig</StageButton>
            <StageButton
              variant="solid"
              className="col-span-2"
              onClick={() =>
                exportCanvasPng(stage.canvasRef.current, "frameforge-pose")
              }
            >
              Export current pose
            </StageButton>
          </div>
        </>
      }
      stats={[
        { label: "Animation", value: action },
        { label: "Frame rate", value: `${fps} fps` },
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
