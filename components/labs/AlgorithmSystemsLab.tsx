"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  Pause,
  Play,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  ControlRange,
  ControlSelect,
  StageButton,
  StageHeader,
  StatStrip,
} from "@/components/creative/stage/controls";
import {
  useCreativeCanvas,
} from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeCanvasRuntime } from "@/components/creative/stage/useCreativeCanvas";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

export type AlgorithmLabMode =
  | "pathfinder-arena"
  | "flowline"
  | "neuro-drivers";

interface GridWorld {
  cols: number;
  rows: number;
  walls: Uint8Array;
  explored: number[];
  path: number[];
}

interface Agv {
  id: number;
  from: number;
  to: number;
  progress: number;
  carrying: boolean;
}

interface FlowWorld {
  machines: Array<{ name: string; x: number; y: number; failed: boolean; queue: number }>;
  agvs: Agv[];
  throughput: number;
  wait: number;
  clock: number;
}

interface Car {
  id: number;
  angle: number;
  lane: number;
  speed: number;
  fitness: number;
  alive: boolean;
  weights: number[];
  inputs: number[];
  hidden: number[];
  outputs: number[];
}

interface NeuroWorld {
  cars: Car[];
  generation: number;
  clock: number;
  best: number;
}

const COPY = {
  "pathfinder-arena": {
    title: "PATHFINDER/ARENA",
    eyebrow: "Graph search laboratory",
    purpose:
      "Compare how A*, Dijkstra, breadth-first, and depth-first search explore the same maze and recover a route.",
  },
  flowline: {
    title: "FLOWLINE",
    eyebrow: "Autonomous factory logistics",
    purpose:
      "Test how fleet size, arrival volume, queues, and machine failures affect material flow through a small factory.",
  },
  "neuro-drivers": {
    title: "NEURO/DRIVERS",
    eyebrow: "Evolutionary neural control",
    purpose:
      "Watch simple neural controllers steer a population, inspect live layer activations, and evolve the best weights.",
  },
} as const;

export default function AlgorithmSystemsLab({
  mode,
}: {
  mode: AlgorithmLabMode;
}) {
  const copy = COPY[mode];
  const gridRef = useRef<GridWorld>(createGrid(mode));
  const flowRef = useRef<FlowWorld>(createFlow(7));
  const neuroRef = useRef<NeuroWorld>(createNeuro(1));
  const telemetryClock = useRef(0);
  const [paused, setPaused] = useState(false);
  const [algorithm, setAlgorithm] = useState<
    "A*" | "Dijkstra" | "Breadth-first" | "Depth-first"
  >("A*");
  const [primary, setPrimary] = useState(mode === "flowline" ? 7 : 58);
  const [secondary, setSecondary] = useState(mode === "flowline" ? 55 : 38);
  const [selectedCar, setSelectedCar] = useState(0);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Car | null>(null);
  const [metrics, setMetrics] = useState({
    first: 0,
    second: 0,
    third: 0,
    generation: 1,
  });

  const reset = useCallback(() => {
    if (mode === "pathfinder-arena") gridRef.current = createGrid(mode);
    if (mode === "flowline") flowRef.current = createFlow(primary);
    if (mode === "neuro-drivers") neuroRef.current = createNeuro(1);
    setSelectedCar(0);
    setSelectedSnapshot(neuroRef.current.cars[0] ?? null);
  }, [mode, primary]);

  const draw = useCallback((runtime: CreativeCanvasRuntime) => {
    const context = runtime.context;
    if (!context) return;
    const { width, height } = runtime.size;
    context.fillStyle = "#070910";
    context.fillRect(0, 0, width, height);
    if (mode === "pathfinder-arena") drawGrid(context, gridRef.current, width, height);
    if (mode === "flowline") drawFlow(context, flowRef.current, width, height);
    if (mode === "neuro-drivers") drawNeuro(context, neuroRef.current, width, height, selectedCar);
  }, [mode, selectedCar]);

  const advance = useCallback(
    (dt: number, runtime: CreativeCanvasRuntime) => {
      if (paused) return;
      if (mode === "flowline") updateFlow(flowRef.current, dt, primary, secondary);
      if (mode === "neuro-drivers") {
        updateNeuro(neuroRef.current, dt, primary, secondary);
        if (!neuroRef.current.cars.some((car) => car.alive) || neuroRef.current.clock > 12) {
          evolveNeuro(neuroRef.current);
          setSelectedCar(0);
        }
      }
      draw(runtime);
      telemetryClock.current += dt;
      if (telemetryClock.current > 0.45) {
        telemetryClock.current = 0;
        if (mode === "pathfinder-arena") {
          setMetrics({
            first: gridRef.current.explored.length,
            second: gridRef.current.path.length,
            third: gridRef.current.walls.reduce((sum, wall) => sum + wall, 0),
            generation: 1,
          });
        }
        if (mode === "flowline") {
          const world = flowRef.current;
          setMetrics({
            first: world.throughput,
            second: Math.round(world.wait),
            third: world.machines.filter((machine) => machine.failed).length,
            generation: 1,
          });
        }
        if (mode === "neuro-drivers") {
          const world = neuroRef.current;
          setSelectedSnapshot(
            world.cars[selectedCar]
              ? {
                  ...world.cars[selectedCar],
                  inputs: [...world.cars[selectedCar].inputs],
                  hidden: [...world.cars[selectedCar].hidden],
                  outputs: [...world.cars[selectedCar].outputs],
                }
              : null,
          );
          setMetrics({
            first: world.cars.filter((car) => car.alive).length,
            second: Math.round(world.best),
            third: Math.round(world.clock * 10) / 10,
            generation: world.generation,
          });
        }
      }
    },
    [draw, mode, paused, primary, secondary, selectedCar],
  );

  const { canvasRef, hostRef, repaint } = useCreativeCanvas({
    minHeight: 660,
    onFrame: (dt, _elapsed, runtime) => advance(Math.min(0.04, dt), runtime),
    onResize: (_size, _scale, runtime) => draw(runtime),
    onRepaint: draw,
  });

  function interact(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (mode === "pathfinder-arena") {
      const world = gridRef.current;
      const col = Math.floor((x / bounds.width) * world.cols);
      const row = Math.floor((y / bounds.height) * world.rows);
      const index = row * world.cols + col;
      if (index !== world.cols + 1 && index !== (world.rows - 2) * world.cols + world.cols - 2) {
        world.walls[index] = world.walls[index] ? 0 : 1;
        world.explored = [];
        world.path = [];
      }
    }
    if (mode === "flowline") {
      const world = flowRef.current;
      let best = -1;
      let distance = 60;
      world.machines.forEach((machine, index) => {
        const dx = machine.x * bounds.width - x;
        const dy = machine.y * bounds.height - y;
        const next = Math.hypot(dx, dy);
        if (next < distance) {
          best = index;
          distance = next;
        }
      });
      if (best >= 0) world.machines[best].failed = !world.machines[best].failed;
    }
    if (mode === "neuro-drivers") {
      const world = neuroRef.current;
      const cx = bounds.width / 2;
      const cy = bounds.height / 2;
      let best = 0;
      let distance = Number.POSITIVE_INFINITY;
      world.cars.forEach((car, index) => {
        const radius = Math.min(bounds.width, bounds.height) * (0.28 + car.lane * 0.08);
        const px = cx + Math.cos(car.angle) * radius;
        const py = cy + Math.sin(car.angle) * radius;
        const next = Math.hypot(px - x, py - y);
        if (next < distance) {
          best = index;
          distance = next;
        }
      });
      setSelectedCar(best);
      const car = world.cars[best];
      setSelectedSnapshot(car ? { ...car, inputs: [...car.inputs], hidden: [...car.hidden], outputs: [...car.outputs] } : null);
    }
    repaint();
  }

  function runPathfinder() {
    if (mode !== "pathfinder-arena") return;
    const result = searchGrid(gridRef.current, algorithm);
    gridRef.current.explored = result.explored;
    gridRef.current.path = result.path;
    setMetrics({
      first: result.explored.length,
      second: result.path.length,
      third: gridRef.current.walls.reduce((sum, wall) => sum + wall, 0),
      generation: 1,
    });
    repaint();
  }

  const statItems = useMemo(() => {
    if (mode === "pathfinder-arena") {
      return [
        { label: "Explored", value: String(metrics.first) },
        { label: "Path length", value: String(metrics.second) },
        { label: "Walls", value: String(metrics.third) },
        { label: "Algorithm", value: algorithm },
      ];
    }
    if (mode === "flowline") {
      return [
        { label: "Completed loads", value: String(metrics.first) },
        { label: "Queue index", value: String(metrics.second), alert: metrics.second > 60 },
        { label: "Failed machines", value: String(metrics.third), alert: metrics.third > 0 },
        { label: "Fleet", value: String(primary) },
      ];
    }
    return [
      { label: "Drivers alive", value: String(metrics.first) },
      { label: "Best fitness", value: String(metrics.second) },
      { label: "Cycle time", value: `${metrics.third}s` },
      { label: "Generation", value: String(metrics.generation) },
    ];
  }, [algorithm, metrics, mode, primary]);

  return (
    <main className="min-h-screen bg-[#07080d] px-4 pb-28 pt-28 text-white sm:px-6 md:pt-32">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/projects#interactive-labs" className="font-mono text-xs uppercase tracking-[0.18em] text-white/60 hover:text-white">
          &lt;- All projects
        </Link>
        <header className="mt-8 grid gap-6 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-300/70">{copy.eyebrow}</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[7rem] lg:leading-[0.85]">{copy.title}</h1>
          </div>
          <div className="rounded-2xl border border-blue-300/20 bg-blue-300/[0.04] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">What this is for</p>
            <p className="mt-3 text-sm leading-7 text-white/70">{copy.purpose}</p>
          </div>
        </header>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-white/15 bg-[#0b0d14]">
          <StageHeader
            eyebrow={`${copy.title.replace("/", " ")} · live system`}
            stats={[{ label: "state", value: paused ? "paused" : "running" }]}
          />
          <div className="grid xl:grid-cols-[minmax(0,1fr)_370px]">
            <div ref={hostRef} className="relative min-h-[660px] overflow-hidden">
              <canvas ref={canvasRef} onPointerDown={interact} role="img" aria-label={`${copy.title} interactive algorithm canvas`} className="absolute inset-0 h-full w-full cursor-crosshair touch-none" />
            </div>
            <aside className="border-t border-white/15 bg-[#0e1018] p-6 xl:border-l xl:border-t-0">
              {mode === "pathfinder-arena" ? (
                <>
                  <ControlSelect label="Search algorithm" value={algorithm} options={["A*", "Dijkstra", "Breadth-first", "Depth-first"] as const} onChange={setAlgorithm} />
                  <p className="mt-6 text-xs leading-6 text-white/65">Click any grid cell to add or remove a wall, then run the selected algorithm against the same start and goal.</p>
                  <div className="mt-6"><StageButton variant="primary" onClick={runPathfinder} className="w-full">Run algorithm</StageButton></div>
                </>
              ) : null}
              {mode === "flowline" ? (
                <>
                  <ControlRange label="AGV fleet" value={primary} min={3} max={16} display={String(primary)} onChange={(value) => { setPrimary(value); flowRef.current = createFlow(value); }} />
                  <ControlRange label="Arrival volume" value={secondary} min={10} max={100} display={`${secondary}%`} onChange={setSecondary} />
                  <p className="mt-6 text-xs leading-6 text-white/65">Click a machine to fail or restore it. Vehicles reroute around failed stations and queues expose the capacity cost.</p>
                </>
              ) : null}
              {mode === "neuro-drivers" ? (
                <>
                  <ControlRange label="Mutation rate" value={primary} min={5} max={95} display={`${primary}%`} onChange={setPrimary} />
                  <ControlRange label="Track pressure" value={secondary} min={10} max={90} display={`${secondary}%`} onChange={setSecondary} />
                  <p className="mt-6 text-xs leading-6 text-white/65">Click a vehicle to inspect its five sensor inputs, six hidden activations, and two steering outputs.</p>
                  {selectedSnapshot ? <NeuralInspector car={selectedSnapshot} /> : null}
                </>
              ) : null}
              <div className="mt-7 grid grid-cols-2 gap-2">
                <StageButton onClick={() => setPaused((value) => !value)} pressed={paused}>{paused ? <><Play size={13} className="mr-2 inline" />Resume</> : <><Pause size={13} className="mr-2 inline" />Pause</>}</StageButton>
                <StageButton variant="solid" onClick={() => { reset(); repaint(); }}><RefreshCw size={13} className="mr-2 inline" />Reset</StageButton>
                {mode === "flowline" ? <StageButton variant="alert" onClick={() => { flowRef.current.machines[2].failed = !flowRef.current.machines[2].failed; repaint(); }} className="col-span-2">Toggle bottleneck</StageButton> : null}
                {mode === "neuro-drivers" ? <StageButton variant="primary" onClick={() => { evolveNeuro(neuroRef.current); setSelectedSnapshot(neuroRef.current.cars[0] ?? null); repaint(); }} className="col-span-2"><Zap size={13} className="mr-2 inline" />Evolve now</StageButton> : null}
              </div>
            </aside>
          </div>
          <StatStrip items={statItems} />
        </section>
      </div>
    </main>
  );
}

function createGrid(mode: string): GridWorld {
  const cols = 30;
  const rows = 20;
  const random = mulberry32(hashSeed(`maze-${mode}`));
  const walls = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const index = y * cols + x;
      walls[index] = random() < 0.24 ? 1 : 0;
      if (y === 1 || x === cols - 2) walls[index] = 0;
    }
  }
  walls[cols + 1] = 0;
  walls[(rows - 2) * cols + cols - 2] = 0;
  return { cols, rows, walls, explored: [], path: [] };
}

function searchGrid(world: GridWorld, algorithm: string) {
  const start = world.cols + 1;
  const goal = (world.rows - 2) * world.cols + world.cols - 2;
  const frontier: Array<{ index: number; cost: number; priority: number }> = [{ index: start, cost: 0, priority: 0 }];
  const previous = new Map<number, number>();
  const costs = new Map<number, number>([[start, 0]]);
  const explored: number[] = [];
  const visited = new Set<number>();
  const heuristic = (index: number) => {
    const x = index % world.cols;
    const y = Math.floor(index / world.cols);
    return Math.abs(x - (world.cols - 2)) + Math.abs(y - (world.rows - 2));
  };
  while (frontier.length) {
    if (algorithm === "Depth-first") frontier.sort((a, b) => a.priority - b.priority);
    else frontier.sort((a, b) => a.priority - b.priority);
    const current = algorithm === "Depth-first" ? frontier.pop()! : frontier.shift()!;
    if (visited.has(current.index)) continue;
    visited.add(current.index);
    explored.push(current.index);
    if (current.index === goal) break;
    const x = current.index % world.cols;
    const y = Math.floor(current.index / world.cols);
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < world.cols && ny < world.rows);
    for (const [nx, ny] of neighbors) {
      const next = ny * world.cols + nx;
      if (world.walls[next] || visited.has(next)) continue;
      const cost = (costs.get(current.index) ?? 0) + 1;
      if (!costs.has(next) || cost < costs.get(next)!) {
        costs.set(next, cost);
        previous.set(next, current.index);
        const priority =
          algorithm === "A*"
            ? cost + heuristic(next)
            : algorithm === "Dijkstra"
              ? cost
              : algorithm === "Depth-first"
                ? explored.length
                : frontier.length;
        frontier.push({ index: next, cost, priority });
      }
    }
  }
  const path: number[] = [];
  if (visited.has(goal)) {
    let current = goal;
    while (current !== start) {
      path.unshift(current);
      current = previous.get(current) ?? start;
    }
    path.unshift(start);
  }
  return { explored, path };
}

function drawGrid(context: CanvasRenderingContext2D, world: GridWorld, width: number, height: number) {
  const cellWidth = width / world.cols;
  const cellHeight = height / world.rows;
  const explored = new Set(world.explored);
  const path = new Set(world.path);
  for (let index = 0; index < world.walls.length; index += 1) {
    const x = (index % world.cols) * cellWidth;
    const y = Math.floor(index / world.cols) * cellHeight;
    context.fillStyle = world.walls[index]
      ? "rgba(255,255,255,.18)"
      : path.has(index)
        ? "#f87171"
        : explored.has(index)
          ? "rgba(96,165,250,.42)"
          : "rgba(255,255,255,.025)";
    context.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
  }
  context.fillStyle = "#f5f5f5";
  for (const index of [world.cols + 1, (world.rows - 2) * world.cols + world.cols - 2]) {
    const x = (index % world.cols) * cellWidth + cellWidth / 2;
    const y = Math.floor(index / world.cols) * cellHeight + cellHeight / 2;
    context.beginPath();
    context.arc(x, y, Math.min(cellWidth, cellHeight) * 0.3, 0, Math.PI * 2);
    context.fill();
  }
}

function createFlow(fleet: number): FlowWorld {
  const machines = [
    { name: "Inbound", x: 0.12, y: 0.5, failed: false, queue: 5 },
    { name: "Cut", x: 0.32, y: 0.25, failed: false, queue: 2 },
    { name: "Process", x: 0.55, y: 0.52, failed: false, queue: 3 },
    { name: "Inspect", x: 0.76, y: 0.26, failed: false, queue: 1 },
    { name: "Outbound", x: 0.88, y: 0.7, failed: false, queue: 0 },
  ];
  return {
    machines,
    agvs: Array.from({ length: fleet }, (_, id) => ({
      id,
      from: id % (machines.length - 1),
      to: (id % (machines.length - 1)) + 1,
      progress: (id / fleet) % 1,
      carrying: id % 2 === 0,
    })),
    throughput: 0,
    wait: 0,
    clock: 0,
  };
}

function updateFlow(world: FlowWorld, dt: number, fleet: number, arrival: number) {
  world.clock += dt;
  while (world.agvs.length < fleet) world.agvs.push({ id: world.agvs.length, from: 0, to: 1, progress: 0, carrying: true });
  world.agvs.length = Math.min(world.agvs.length, fleet);
  world.machines[0].queue += (arrival / 100) * dt * 0.8;
  for (const agv of world.agvs) {
    const target = world.machines[agv.to];
    const speed = target.failed ? 0.05 : 0.12 + (1 - Math.min(1, target.queue / 12)) * 0.13;
    agv.progress += speed * dt * 4;
    if (agv.progress >= 1) {
      agv.progress = 0;
      if (!target.failed) {
        target.queue = Math.max(0, target.queue - 1);
        const next = (agv.to + 1) % world.machines.length;
        agv.from = agv.to;
        agv.to = world.machines[next].failed ? (next + 1) % world.machines.length : next;
        if (agv.to === 0) world.throughput += 1;
      }
    }
  }
  world.wait = world.machines.reduce((sum, machine) => sum + machine.queue * (machine.failed ? 2 : 1), 0);
}

function drawFlow(context: CanvasRenderingContext2D, world: FlowWorld, width: number, height: number) {
  context.lineWidth = 3;
  for (let index = 0; index < world.machines.length - 1; index += 1) {
    const a = world.machines[index];
    const b = world.machines[index + 1];
    context.strokeStyle = b.failed ? "rgba(248,113,113,.6)" : "rgba(96,165,250,.28)";
    context.beginPath();
    context.moveTo(a.x * width, a.y * height);
    context.lineTo(b.x * width, b.y * height);
    context.stroke();
  }
  for (const machine of world.machines) {
    context.fillStyle = machine.failed ? "#f87171" : "#60a5fa";
    context.fillRect(machine.x * width - 28, machine.y * height - 22, 56, 44);
    context.fillStyle = "#fff";
    context.font = "11px ui-monospace";
    context.textAlign = "center";
    context.fillText(machine.name, machine.x * width, machine.y * height + 40);
    context.fillText(`Q ${Math.round(machine.queue)}`, machine.x * width, machine.y * height + 54);
  }
  for (const agv of world.agvs) {
    const a = world.machines[agv.from];
    const b = world.machines[agv.to];
    const x = (a.x + (b.x - a.x) * agv.progress) * width;
    const y = (a.y + (b.y - a.y) * agv.progress) * height;
    context.fillStyle = agv.carrying ? "#f5f5f5" : "#94a3b8";
    context.fillRect(x - 6, y - 6, 12, 12);
  }
}

function createNeuro(generation: number, parents?: Car[]): NeuroWorld {
  const random = mulberry32(hashSeed(`neuro-${generation}`));
  const cars = Array.from({ length: 24 }, (_, id) => {
    const parent = parents?.[id % parents.length];
    const weights = Array.from({ length: 42 }, (_, index) =>
      parent ? parent.weights[index] + (random() - 0.5) * 0.34 : random() * 2 - 1,
    );
    return { id, angle: random() * Math.PI * 2, lane: (random() - 0.5) * 0.35, speed: 0.55 + random() * 0.25, fitness: 0, alive: true, weights, inputs: [0, 0, 0, 0, 0], hidden: [0, 0, 0, 0, 0, 0], outputs: [0, 0] };
  });
  return { cars, generation, clock: 0, best: 0 };
}

function updateNeuro(world: NeuroWorld, dt: number, mutation: number, pressure: number) {
  world.clock += dt;
  for (const car of world.cars) {
    if (!car.alive) continue;
    car.inputs = [
      Math.sin(car.angle * 2) * 0.5 + 0.5,
      Math.cos(car.angle * 3) * 0.5 + 0.5,
      Math.max(0, 1 - Math.abs(car.lane) * 2),
      car.speed,
      pressure / 100,
    ];
    car.hidden = Array.from({ length: 6 }, (_, hidden) => {
      let sum = 0;
      for (let input = 0; input < 5; input += 1) sum += car.inputs[input] * car.weights[hidden * 5 + input];
      return Math.tanh(sum);
    });
    car.outputs = [0, 1].map((output) => {
      let sum = 0;
      for (let hidden = 0; hidden < 6; hidden += 1) sum += car.hidden[hidden] * car.weights[30 + output * 6 + hidden];
      return Math.tanh(sum);
    });
    const steering = car.outputs[0] * 0.34;
    const throttle = Math.max(0.2, (car.outputs[1] + 1) / 2);
    car.lane += steering * dt * (0.4 + pressure / 140);
    car.lane += Math.sin(car.angle * 4) * dt * pressure * 0.0008;
    car.speed = 0.42 + throttle * 0.8;
    car.angle += car.speed * dt;
    car.fitness += car.speed * dt * Math.max(0, 1 - Math.abs(car.lane));
    if (Math.abs(car.lane) > 0.62 + mutation / 500) car.alive = false;
    world.best = Math.max(world.best, car.fitness);
  }
}

function evolveNeuro(world: NeuroWorld) {
  const parents = [...world.cars].sort((a, b) => b.fitness - a.fitness).slice(0, 5);
  const next = createNeuro(world.generation + 1, parents);
  world.cars = next.cars;
  world.generation = next.generation;
  world.clock = 0;
  world.best = 0;
}

function drawNeuro(context: CanvasRenderingContext2D, world: NeuroWorld, width: number, height: number, selected: number) {
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height);
  context.strokeStyle = "rgba(255,255,255,.13)";
  context.lineWidth = base * 0.12;
  context.beginPath();
  context.arc(cx, cy, base * 0.31, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "rgba(96,165,250,.38)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, base * 0.31, 0, Math.PI * 2);
  context.stroke();
  world.cars.forEach((car, index) => {
    const radius = base * (0.31 + car.lane * 0.08);
    const x = cx + Math.cos(car.angle) * radius;
    const y = cy + Math.sin(car.angle) * radius;
    context.fillStyle = !car.alive ? "rgba(248,113,113,.3)" : index === selected ? "#f5f5f5" : "#60a5fa";
    context.save();
    context.translate(x, y);
    context.rotate(car.angle + Math.PI / 2);
    context.fillRect(-4, -8, 8, 16);
    context.restore();
  });
}

function NeuralInspector({ car }: { car: Car }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/12 bg-black/20 p-4">
      <div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">Driver {car.id + 1}</p><span className={`font-mono text-[10px] ${car.alive ? "text-blue-300" : "text-red-300"}`}>{car.alive ? "active" : "retired"}</span></div>
      <div className="mt-4 grid grid-cols-[1fr_1.1fr_.7fr] gap-3">
        {[car.inputs, car.hidden, car.outputs].map((layer, layerIndex) => (
          <div key={layerIndex} className="flex flex-col justify-center gap-2">
            {layer.map((value, index) => <span key={index} className="mx-auto block rounded-full border border-blue-300/30 bg-blue-300/10" style={{ width: 8 + Math.abs(value) * 13, height: 8 + Math.abs(value) * 13, opacity: 0.4 + Math.abs(value) * 0.6 }} />)}
          </div>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/65"><div><dt className="text-white/45">Fitness</dt><dd className="mt-1 font-mono">{car.fitness.toFixed(2)}</dd></div><div><dt className="text-white/45">Lane error</dt><dd className="mt-1 font-mono">{Math.abs(car.lane).toFixed(2)}</dd></div></dl>
    </div>
  );
}
