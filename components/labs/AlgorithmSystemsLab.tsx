"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  ControlRange,
  ControlSelect,
  StageButton,
  StageHeader,
  StatStrip,
} from "@/components/creative/stage/controls";
import { useCreativeCanvas } from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeCanvasRuntime } from "@/components/creative/stage/useCreativeCanvas";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

export type AlgorithmLabMode =
  | "pathfinder-arena"
  | "flowline"
  | "neuro-drivers";

const ALGORITHMS = ["A*", "Dijkstra", "Breadth-first", "Depth-first"] as const;

type Algorithm = (typeof ALGORITHMS)[number];

interface FrontierEntry {
  index: number;
  priority: number;
}

interface SearchState {
  algorithm: Algorithm;
  frontier: FrontierEntry[];
  costs: Map<number, number>;
  previous: Map<number, number>;
  visited: Set<number>;
  counter: number;
  accumulator: number;
  done: boolean;
  found: boolean;
}

interface GridWorld {
  cols: number;
  rows: number;
  start: number;
  goal: number;
  walls: Uint8Array;
  explored: number[];
  path: number[];
  search: SearchState | null;
}

interface FlowMachine {
  name: string;
  x: number;
  y: number;
  failable: boolean;
  serviceMean: number;
  failed: boolean;
  queue: number;
  busyFor: number;
  outbox: number;
}

interface FlowAgv {
  id: number;
  x: number;
  y: number;
  carrying: boolean;
  task: "idle" | "pickup" | "haul";
  target: number;
  origin: number;
}

interface FlowWorld {
  machines: FlowMachine[];
  agvs: FlowAgv[];
  random: () => number;
  clock: number;
  completed: number;
  nextArrival: number;
  nextAgvId: number;
}

interface Obstacle {
  angle: number;
  lane: number;
  radius: number;
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
  obstacles: Obstacle[];
  generation: number;
  clock: number;
  best: number;
  record: number;
}

interface LabMetrics {
  explored: number;
  pathLength: number;
  walls: number;
  searchState: "idle" | "searching" | "done";
  pathFound: boolean;
  completed: number;
  bottleneckQueue: number;
  bottleneckName: string;
  failedCount: number;
  alive: number;
  best: number;
  record: number;
  generation: number;
}

const POPULATION = 24;
const LANE_RADIUS = 0.31;
const LANE_SPREAD = 0.08;
const CRASH_LANE = 0.62;
const GENERATION_SECONDS = 12;
const SENSOR_RANGE = 1.2;
const START_ANGLE = -Math.PI / 2;
const CAR_RADIUS = 0.008;
const INPUT_LABELS = [
  "Obstacle L",
  "Obstacle R",
  "Lane error",
  "Speed",
  "Next gap",
] as const;
const OUTPUT_LABELS = ["Steer", "Throttle"] as const;

const PROCESS_A = 2;
const PROCESS_B = 3;
const OUTBOUND = 5;
const AGV_SPEED = 0.16;

const FLOW_STATIONS: ReadonlyArray<{
  name: string;
  x: number;
  y: number;
  failable: boolean;
  serviceMean: number;
}> = [
  { name: "Intake", x: 0.1, y: 0.5, failable: false, serviceMean: 0.9 },
  { name: "Cut", x: 0.3, y: 0.5, failable: true, serviceMean: 1.7 },
  { name: "Process A", x: 0.52, y: 0.26, failable: true, serviceMean: 3.4 },
  { name: "Process B", x: 0.52, y: 0.74, failable: true, serviceMean: 3.4 },
  { name: "Inspect", x: 0.74, y: 0.5, failable: true, serviceMean: 1.9 },
  { name: "Outbound", x: 0.9, y: 0.5, failable: false, serviceMean: 0 },
];

const FLOW_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, PROCESS_A],
  [1, PROCESS_B],
  [PROCESS_A, 4],
  [PROCESS_B, 4],
  [4, OUTBOUND],
];

const EMPTY_METRICS: LabMetrics = {
  explored: 0,
  pathLength: 0,
  walls: 0,
  searchState: "idle",
  pathFound: false,
  completed: 0,
  bottleneckQueue: 0,
  bottleneckName: "—",
  failedCount: 0,
  alive: POPULATION,
  best: 0,
  record: 0,
  generation: 1,
};

const COPY: Record<AlgorithmLabMode, { title: string; eyebrow: string }> = {
  "pathfinder-arena": {
    title: "PATHFINDER/ARENA",
    eyebrow: "Pathfinder arena · graph search live",
  },
  flowline: {
    title: "FLOWLINE",
    eyebrow: "Flowline · factory logistics live",
  },
  "neuro-drivers": {
    title: "NEURO/DRIVERS",
    eyebrow: "Neuro drivers · evolutionary control live",
  },
};

const INITIAL_STATUS: Record<AlgorithmLabMode, string> = {
  "pathfinder-arena": "Maze ready — pick an algorithm and run the search.",
  flowline: "Factory line ready — lots arriving at Intake.",
  "neuro-drivers": "Generation 1 on track with seeded obstacles.",
};

interface ProseCopy {
  whatThisIs: string;
  howToUse: string[];
  whatToLookFor: string[];
  architecture: string[];
  decisions: string[];
  limits: string[];
}

const PROSE: Record<AlgorithmLabMode, ProseCopy> = {
  "pathfinder-arena": {
    whatThisIs:
      "A maze laboratory that runs four classic search algorithms — A*, Dijkstra, breadth-first, and depth-first — over the same seeded maze. It shows every cell each algorithm inspects before committing to a route, so the trade-off between informed and uninformed search is visible instead of theoretical.",
    howToUse: [
      "Pick an algorithm from the Search algorithm menu — changing it immediately re-runs the search on the current maze.",
      "Press Run search to watch the frontier spread, or Advance search ×60 to move through it in fixed chunks.",
      "Click any cell to add or remove a wall. Seal the goal off completely and the lab reports No path found rather than inventing a route.",
      "Shift walls rolls a new maze and re-runs the current algorithm; Reset rolls a new maze and clears the search.",
    ],
    whatToLookFor: [
      "A* usually reaches the goal after exploring a fraction of the cells Dijkstra touches, yet both return the same shortest path length — that gap is the heuristic paying for itself.",
      "Breadth-first matches Dijkstra here because every step costs one; depth-first commits to deep corridors and often returns a much longer path.",
      "The Explored stat is the honest price of each run: same maze, same endpoints, very different amounts of work.",
    ],
    architecture: [
      "One client component serves all three lab routes; a mode prop selects the simulation, draw routine, and control set.",
      "The maze comes from a seeded mulberry32 stream and is re-rolled until a connectivity check passes, so every fresh maze is solvable by construction.",
      "All four algorithms share one priority-frontier loop: A* orders by cost plus Manhattan heuristic, Dijkstra by cost, breadth-first by a monotonically increasing enqueue counter (FIFO), depth-first by a decreasing counter (LIFO).",
      "The search runs incrementally — the animation expands roughly 90 cells per second, and the same stepper serves the Advance button synchronously.",
    ],
    decisions: [
      "One frontier, four orderings: implementing BFS and DFS as counter priorities in the same loop keeps the comparison honest — only the ordering differs between algorithms.",
      "The canvas redraws only while a search is animating; a finished grid costs zero frames per second.",
      "No path found is a first-class result: the path is reconstructed only when the goal was actually reached.",
    ],
    limits: [
      "The grid is 4-connected with uniform edge costs, so Dijkstra and breadth-first explore near-identically — weighted terrain would separate them.",
      "Depth-first still skips already-costed cells, a concession that keeps it terminating quickly on grids.",
      "It is a teaching instrument, not a routing engine: 600 cells, no diagonal movement, no obstacles appearing mid-search.",
    ],
  },
  flowline: {
    whatThisIs:
      "A miniature factory simulation: lots arrive at Intake, are cut, processed on one of two parallel machines, inspected, and shipped, with a fleet of autonomous vehicles hauling them between stations. Machine failures reroute work in real time, so capacity decisions play out in front of you.",
    howToUse: [
      "Set the AGV fleet slider — vehicles are added or retired in place without restarting the line.",
      "Raise Arrival rate to push more lots into Intake and find the line's breaking point.",
      "Fail a machine with its button, or click a station on the canvas. Fail Process A and its queue transfers to Process B; vehicles already en route retarget.",
      "Advance 10 s steps the whole factory synchronously; Pause and Resume control the live clock.",
    ],
    whatToLookFor: [
      "Failing one Process machine roughly halves mid-line capacity — watch the Bottleneck queue stat migrate to the surviving machine.",
      "More vehicles only help while machines have spare capacity; past that point Completed loads flattens and queues keep growing.",
      "A failed Inspect has no alternate route, so carriers hold their lots in place until it is repaired — nothing is silently dropped.",
    ],
    architecture: [
      "A discrete-step simulation: seeded arrivals at Intake, per-machine queues with seeded service times around fixed means, and an explicit Intake → Cut → Process A/B → Inspect → Outbound route table.",
      "AGVs are small state machines (idle, pickup, haul) moving in normalized coordinates; routing picks the shorter queue of the two Process machines at pickup time.",
      "Completed loads counts lots actually delivered to Outbound, and the bottleneck stat is the real maximum queue on the line.",
    ],
    decisions: [
      "Two parallel Process machines make rerouting real: a failure redistributes queued lots to the alternate instead of animating around a dead edge.",
      "Fleet changes are non-destructive — trimming retires idle vehicles first and lets carriers finish their delivery.",
      "All randomness flows from one seeded mulberry32 stream, so a given interaction sequence replays identically.",
    ],
    limits: [
      "Service and arrival times are uniform bands around means, not distributions fitted to real factory data.",
      "Vehicles travel point-to-point without congestion, collisions, or battery constraints.",
      "There is no work-in-progress cap, so an overloaded line grows queues without bound — deliberately, to make saturation visible.",
    ],
  },
  "neuro-drivers": {
    whatThisIs:
      "A population of 24 tiny neural networks learns to drive a ring road scattered with seeded obstacles. Each driver reads five real sensors, steers with a 5-6-2 network, and the best performers breed the next generation — with the champion cloned unchanged.",
    howToUse: [
      "Click any driver on the track, or press Select best driver, to load it into the layer inspector below the controls.",
      "Set Mutation rate to control how far children stray from their parents' weights at the next evolution.",
      "Set Track pressure to add lateral disturbance the networks must steer against.",
      "Run 1 generation completes the current generation synchronously and breeds the next; Pause and Resume control the live clock.",
    ],
    whatToLookFor: [
      "Early generations crash into the first obstacle; within a handful, drivers begin threading between discs — Best fitness climbs while Record preserves the all-time high.",
      "In the inspector, thick blue and red connections show which sensors actually drive steering; nodes brighten with activation as the selected driver approaches an obstacle.",
      "High mutation explores wildly and often regresses; low mutation refines slowly — the elite clone guarantees a generation never loses its best driver.",
    ],
    architecture: [
      "Each driver is a 5-6-2 tanh network: obstacle proximity ahead-left and ahead-right, lane error, speed, and the angular gap to the next obstacle in; steering and throttle out.",
      "Obstacles, initial weights, and mutation noise all derive from mulberry32 streams seeded per generation, so evolution is reproducible.",
      "Selection is elitist truncation: the top five drivers parent the next generation and the single best is copied without mutation.",
      "The inspector is a live SVG of the actual network — connection thickness proportional to weight magnitude, blue positive and red negative, node brightness proportional to activation.",
    ],
    decisions: [
      "Crash conditions are physical — obstacle contact or leaving the track — and never tied to UI sliders, so difficulty and evolution stay honest.",
      "The Mutation rate slider directly scales the weight-noise amplitude in evolve; it is the experiment's primary variable, not decoration.",
      "The selected driver index survives auto-evolution, so one lineage slot can be watched across generations.",
    ],
    limits: [
      "Fitness is simple distance-with-centering; there is no lap counting or time trial.",
      "The network is feedforward with no memory, so drivers cannot plan beyond their sensor horizon.",
      "Evolution is truncation selection without crossover — enough to show learning, not a full genetic algorithm.",
    ],
  },
};

export default function AlgorithmSystemsLab({
  mode,
}: {
  mode: AlgorithmLabMode;
}) {
  const copy = COPY[mode];
  const prose = PROSE[mode];

  const gridRef = useRef<GridWorld | null>(null);
  const flowRef = useRef<FlowWorld | null>(null);
  const neuroRef = useRef<NeuroWorld | null>(null);
  const roundRef = useRef(0);
  const telemetryRef = useRef(0);

  const [status, setStatus] = useState(INITIAL_STATUS[mode]);
  const [paused, setPaused] = useState(false);
  const [algorithm, setAlgorithm] = useState<Algorithm>("A*");
  const [fleet, setFleet] = useState(7);
  const [arrival, setArrival] = useState(55);
  const [mutation, setMutation] = useState(45);
  const [pressure, setPressure] = useState(38);
  const [selectedCar, setSelectedCar] = useState(0);
  const [snapshot, setSnapshot] = useState<Car | null>(() =>
    mode === "neuro-drivers" ? snapshotCar(createNeuro(1).cars[0]) : null,
  );
  const [failedMachines, setFailedMachines] = useState<boolean[]>(() =>
    FLOW_STATIONS.map(() => false),
  );
  const [metrics, setMetrics] = useState<LabMetrics>(EMPTY_METRICS);

  function ensureGrid(): GridWorld {
    if (gridRef.current === null) {
      gridRef.current = createGrid(roundRef.current);
    }
    return gridRef.current;
  }

  function ensureFlow(): FlowWorld {
    if (flowRef.current === null) {
      flowRef.current = createFlow(fleet);
    }
    return flowRef.current;
  }

  function ensureNeuro(): NeuroWorld {
    if (neuroRef.current === null) {
      neuroRef.current = createNeuro(1);
    }
    return neuroRef.current;
  }

  function pushMetrics(next: LabMetrics): void {
    setMetrics((current) => (metricsEqual(current, next) ? current : next));
  }

  function publishTelemetry(refreshSnapshot: boolean): void {
    if (mode === "pathfinder-arena") {
      pushMetrics(gridMetrics(ensureGrid()));
    }
    if (mode === "flowline") {
      pushMetrics(flowMetrics(ensureFlow()));
    }
    if (mode === "neuro-drivers") {
      const world = ensureNeuro();
      pushMetrics(neuroMetrics(world));
      if (refreshSnapshot || snapshot === null) {
        setSnapshot(snapshotCar(world.cars[selectedCar]));
      }
    }
  }

  function drawScene(runtime: CreativeCanvasRuntime): void {
    const context = runtime.context;
    if (!context) {
      return;
    }
    const { width, height } = runtime.size;
    context.fillStyle = "#070910";
    context.fillRect(0, 0, width, height);
    if (mode === "pathfinder-arena") {
      drawGrid(context, ensureGrid(), width, height);
    }
    if (mode === "flowline") {
      drawFlow(context, ensureFlow(), width, height);
    }
    if (mode === "neuro-drivers") {
      drawNeuro(context, ensureNeuro(), width, height, selectedCar);
    }
  }

  function throttledTelemetry(dt: number): void {
    telemetryRef.current += dt;
    if (telemetryRef.current > 0.45) {
      telemetryRef.current = 0;
      publishTelemetry(true);
    }
  }

  function completeGeneration(world: NeuroWorld): void {
    const finished = world.generation;
    const best = world.best;
    evolveNeuro(world, mutation);
    setStatus(
      `Generation ${finished} complete — best fitness ${best.toFixed(1)}, record ${world.record.toFixed(1)}. Generation ${world.generation} launched.`,
    );
    setSnapshot(snapshotCar(world.cars[selectedCar]));
    pushMetrics(neuroMetrics(world));
  }

  function finishSearch(world: GridWorld): void {
    const search = world.search;
    if (!search) {
      return;
    }
    if (search.found) {
      setStatus(
        `${search.algorithm} reached the goal — ${world.path.length}-cell path after exploring ${world.explored.length} cells.`,
      );
    } else {
      setStatus(
        `No path found — ${search.algorithm} exhausted ${world.explored.length} reachable cells.`,
      );
    }
    pushMetrics(gridMetrics(world));
  }

  function frameStep(dt: number, runtime: CreativeCanvasRuntime): void {
    if (mode === "pathfinder-arena") {
      const world = ensureGrid();
      const search = world.search;
      if (!search || search.done) {
        drawScene(runtime);
        stop();
        return;
      }
      search.accumulator += dt * 90;
      const expansions = Math.floor(search.accumulator);
      if (expansions > 0) {
        search.accumulator -= expansions;
        stepSearch(world, expansions);
      }
      drawScene(runtime);
      if (search.done) {
        finishSearch(world);
        stop();
        return;
      }
      throttledTelemetry(dt);
      return;
    }
    if (mode === "flowline") {
      updateFlow(ensureFlow(), dt, fleet, arrival);
    }
    if (mode === "neuro-drivers") {
      const world = ensureNeuro();
      updateNeuro(world, dt, pressure);
      const anyAlive = world.cars.some((car) => car.alive);
      if (!anyAlive || world.clock > GENERATION_SECONDS) {
        completeGeneration(world);
      }
    }
    drawScene(runtime);
    throttledTelemetry(dt);
  }

  const stage = useCreativeCanvas({
    minHeight: 660,
    autoStart: mode !== "pathfinder-arena",
    onFrame: (dt, _elapsed, runtime) => {
      frameStep(Math.min(0.04, dt), runtime);
    },
    onResize: (_size, _scale, runtime) => {
      drawScene(runtime);
    },
    onRepaint: (runtime) => {
      drawScene(runtime);
      publishTelemetry(false);
    },
  });
  const { canvasRef, hostRef, reducedMotion, repaint, start, stop } = stage;

  function togglePaused(): void {
    const next = !paused;
    setPaused(next);
    if (next) {
      stop();
    } else {
      start();
    }
    setStatus(next ? "Simulation paused." : "Simulation resumed.");
    repaint();
  }

  function startSearchWith(
    algo: Algorithm,
    source: "run" | "shift" | "select",
  ): void {
    const world = ensureGrid();
    beginSearch(world, algo);
    if (reducedMotion) {
      stepSearch(world, world.cols * world.rows + 10);
      finishSearch(world);
      repaint();
      return;
    }
    if (source === "shift") {
      setStatus(`Walls shifted — ${algo} re-running.`);
    } else if (source === "select") {
      setStatus(`${algo} selected — search re-running.`);
    } else {
      setStatus(`${algo} search running.`);
    }
    pushMetrics(gridMetrics(world));
    start();
    repaint();
  }

  function advanceSearch(): void {
    const world = ensureGrid();
    if (!world.search || world.search.done) {
      beginSearch(world, algorithm);
    }
    stepSearch(world, 60);
    const search = world.search;
    if (search && search.done) {
      finishSearch(world);
    } else {
      setStatus(
        `Advanced ${algorithm} by 60 expansions — ${world.explored.length} cells explored.`,
      );
      pushMetrics(gridMetrics(world));
    }
    repaint();
  }

  function shiftWalls(): void {
    roundRef.current += 1;
    gridRef.current = createGrid(roundRef.current);
    startSearchWith(algorithm, "shift");
  }

  function toggleMachine(index: number): void {
    const world = ensureFlow();
    const machine = world.machines[index];
    if (!machine || !machine.failable) {
      return;
    }
    machine.failed = !machine.failed;
    if (machine.failed) {
      const note = applyFailure(world, index);
      setStatus(`${machine.name} failed${note}.`);
    } else {
      setStatus(`${machine.name} repaired — service resumed.`);
    }
    setFailedMachines(world.machines.map((entry) => entry.failed));
    pushMetrics(flowMetrics(world));
    repaint();
  }

  function advanceFlow(): void {
    const world = ensureFlow();
    for (let step = 0; step < 100; step += 1) {
      updateFlow(world, 0.1, fleet, arrival);
    }
    setStatus(
      `Advanced 10 s of factory time — ${world.completed} loads completed.`,
    );
    pushMetrics(flowMetrics(world));
    repaint();
  }

  function runGeneration(): void {
    const world = ensureNeuro();
    let guard = 0;
    while (
      world.cars.some((car) => car.alive) &&
      world.clock <= GENERATION_SECONDS &&
      guard < 900
    ) {
      updateNeuro(world, 1 / 60, pressure);
      guard += 1;
    }
    completeGeneration(world);
    repaint();
  }

  function selectBestDriver(): void {
    const world = ensureNeuro();
    let bestIndex = 0;
    let bestFitness = -1;
    world.cars.forEach((car, index) => {
      if (car.fitness > bestFitness) {
        bestFitness = car.fitness;
        bestIndex = index;
      }
    });
    setSelectedCar(bestIndex);
    setSnapshot(snapshotCar(world.cars[bestIndex]));
    setStatus(
      `Driver ${bestIndex + 1} selected — best fitness ${bestFitness.toFixed(1)} this generation.`,
    );
    repaint();
  }

  function resetLab(): void {
    if (mode === "pathfinder-arena") {
      roundRef.current += 1;
      gridRef.current = createGrid(roundRef.current);
      stop();
      setStatus("New maze generated — run a search to explore it.");
      pushMetrics(gridMetrics(ensureGrid()));
    }
    if (mode === "flowline") {
      flowRef.current = createFlow(fleet);
      setFailedMachines(FLOW_STATIONS.map(() => false));
      setStatus("Factory reset — queues cleared and clock zeroed.");
      pushMetrics(flowMetrics(ensureFlow()));
    }
    if (mode === "neuro-drivers") {
      neuroRef.current = createNeuro(1);
      setSelectedCar(0);
      setSnapshot(snapshotCar(ensureNeuro().cars[0]));
      setStatus("Population reset to generation 1.");
      pushMetrics(neuroMetrics(ensureNeuro()));
    }
    repaint();
  }

  function interact(event: ReactPointerEvent<HTMLCanvasElement>): void {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (mode === "pathfinder-arena") {
      const world = ensureGrid();
      const col = Math.floor((x / bounds.width) * world.cols);
      const row = Math.floor((y / bounds.height) * world.rows);
      if (col < 0 || row < 0 || col >= world.cols || row >= world.rows) {
        return;
      }
      const index = row * world.cols + col;
      if (index === world.start || index === world.goal) {
        setStatus("Start and goal cells stay open.");
        repaint();
        return;
      }
      world.walls[index] = world.walls[index] === 1 ? 0 : 1;
      world.explored = [];
      world.path = [];
      world.search = null;
      stop();
      setStatus(
        world.walls[index] === 1
          ? `Wall added at row ${row + 1}, column ${col + 1}.`
          : `Wall removed at row ${row + 1}, column ${col + 1}.`,
      );
      pushMetrics(gridMetrics(world));
      repaint();
      return;
    }
    if (mode === "flowline") {
      const world = ensureFlow();
      let choice = -1;
      let bestDistance = 34;
      world.machines.forEach((machine, index) => {
        if (!machine.failable) {
          return;
        }
        const distance = Math.hypot(
          machine.x * bounds.width - x,
          machine.y * bounds.height - y,
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          choice = index;
        }
      });
      if (choice >= 0) {
        toggleMachine(choice);
      }
      return;
    }
    const world = ensureNeuro();
    const cx = bounds.width / 2;
    const cy = bounds.height / 2;
    const base = Math.min(bounds.width, bounds.height);
    let choice = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    world.cars.forEach((car, index) => {
      const radius = base * (LANE_RADIUS + car.lane * LANE_SPREAD);
      const px = cx + Math.cos(car.angle) * radius;
      const py = cy + Math.sin(car.angle) * radius;
      const distance = Math.hypot(px - x, py - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        choice = index;
      }
    });
    setSelectedCar(choice);
    setSnapshot(snapshotCar(world.cars[choice]));
    setStatus(`Driver ${choice + 1} selected.`);
    repaint();
  }

  const headerState =
    mode === "pathfinder-arena"
      ? metrics.searchState === "done"
        ? metrics.pathFound
          ? "path found"
          : "no path"
        : metrics.searchState
      : reducedMotion
        ? "manual"
        : paused
          ? "paused"
          : "running";

  const statItems =
    mode === "pathfinder-arena"
      ? [
          { label: "Explored", value: String(metrics.explored) },
          {
            label: "Path length",
            value:
              metrics.searchState === "done"
                ? metrics.pathFound
                  ? String(metrics.pathLength)
                  : "No path"
                : metrics.pathLength > 0
                  ? String(metrics.pathLength)
                  : "—",
            alert: metrics.searchState === "done" && !metrics.pathFound,
          },
          { label: "Walls", value: String(metrics.walls) },
          { label: "Algorithm", value: algorithm },
        ]
      : mode === "flowline"
        ? [
            { label: "Completed loads", value: String(metrics.completed) },
            {
              label: "Bottleneck queue",
              value:
                metrics.bottleneckQueue > 0
                  ? `${metrics.bottleneckName} · ${metrics.bottleneckQueue}`
                  : "0",
              alert: metrics.bottleneckQueue >= 8,
            },
            {
              label: "Failed machines",
              value: String(metrics.failedCount),
              alert: metrics.failedCount > 0,
            },
            { label: "Fleet", value: String(fleet) },
          ]
        : [
            {
              label: "Drivers alive",
              value: `${metrics.alive}/${POPULATION}`,
            },
            { label: "Best fitness", value: metrics.best.toFixed(1) },
            { label: "Record", value: metrics.record.toFixed(1) },
            { label: "Generation", value: String(metrics.generation) },
          ];

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#0b0d14] text-white">
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>
        <StageHeader
          eyebrow={copy.eyebrow}
          stats={[{ label: "state", value: headerState }]}
        />
        <div className="grid xl:grid-cols-[minmax(0,1fr)_370px]">
          <div ref={hostRef} className="relative min-h-[660px] overflow-hidden">
            <canvas
              ref={canvasRef}
              onPointerDown={interact}
              role="img"
              aria-label={`${copy.title} interactive canvas`}
              className="absolute inset-0 h-full w-full cursor-crosshair touch-pan-y"
            />
          </div>
          <aside className="border-t border-white/15 bg-[#0e1018] p-6 xl:border-l xl:border-t-0">
            {mode === "pathfinder-arena" ? (
              <>
                <ControlSelect
                  label="Search algorithm"
                  value={algorithm}
                  options={ALGORITHMS}
                  onChange={(value) => {
                    setAlgorithm(value);
                    startSearchWith(value, "select");
                  }}
                />
                <p className="mt-6 text-xs leading-6 text-white/65">
                  Click any grid cell to add or remove a wall — editing clears
                  the current search. Seal the goal off and the search reports
                  an honest No path found.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-2">
                  <StageButton
                    variant="primary"
                    onClick={() => {
                      startSearchWith(algorithm, "run");
                    }}
                  >
                    Run search
                  </StageButton>
                  <StageButton onClick={advanceSearch}>
                    Advance search ×60
                  </StageButton>
                  <StageButton onClick={shiftWalls}>Shift walls</StageButton>
                  <StageButton variant="solid" onClick={resetLab}>
                    Reset
                  </StageButton>
                </div>
              </>
            ) : null}
            {mode === "flowline" ? (
              <>
                <ControlRange
                  label="AGV fleet"
                  value={fleet}
                  min={3}
                  max={16}
                  display={String(fleet)}
                  onChange={(value) => {
                    setFleet(value);
                    const world = ensureFlow();
                    syncFleet(world, value);
                    pushMetrics(flowMetrics(world));
                    repaint();
                  }}
                />
                <ControlRange
                  label="Arrival rate"
                  value={arrival}
                  min={10}
                  max={100}
                  display={`${arrival}%`}
                  onChange={(value) => {
                    setArrival(value);
                    repaint();
                  }}
                />
                <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
                  Machine health
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {FLOW_STATIONS.map((station, index) =>
                    station.failable ? (
                      <StageButton
                        key={station.name}
                        pressed={failedMachines[index] === true}
                        variant={
                          failedMachines[index] === true ? "alert" : "ghost"
                        }
                        onClick={() => {
                          toggleMachine(index);
                        }}
                      >
                        {failedMachines[index] === true
                          ? `Repair ${station.name}`
                          : `Fail ${station.name}`}
                      </StageButton>
                    ) : null,
                  )}
                </div>
                <p className="mt-6 text-xs leading-6 text-white/65">
                  Failing Process A reroutes its queue to Process B and
                  retargets vehicles already en route. You can also click a
                  station on the canvas to toggle it.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-2">
                  {reducedMotion ? null : (
                    <StageButton pressed={paused} onClick={togglePaused}>
                      {paused ? "Resume" : "Pause"}
                    </StageButton>
                  )}
                  <StageButton onClick={advanceFlow}>Advance 10 s</StageButton>
                  <StageButton
                    variant="solid"
                    onClick={resetLab}
                    className={reducedMotion ? "col-span-2" : ""}
                  >
                    Reset
                  </StageButton>
                </div>
              </>
            ) : null}
            {mode === "neuro-drivers" ? (
              <>
                <ControlRange
                  label="Mutation rate"
                  value={mutation}
                  min={5}
                  max={95}
                  display={`${mutation}%`}
                  onChange={(value) => {
                    setMutation(value);
                    repaint();
                  }}
                />
                <ControlRange
                  label="Track pressure"
                  value={pressure}
                  min={10}
                  max={90}
                  display={`${pressure}%`}
                  onChange={(value) => {
                    setPressure(value);
                    repaint();
                  }}
                />
                <p className="mt-6 text-xs leading-6 text-white/65">
                  Click a driver on the track to inspect its live network.
                  Mutation rate scales the weight noise applied at the next
                  evolution; the champion is always cloned unmutated.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-2">
                  <StageButton onClick={selectBestDriver}>
                    Select best driver
                  </StageButton>
                  <StageButton variant="primary" onClick={runGeneration}>
                    Run 1 generation
                  </StageButton>
                  {reducedMotion ? null : (
                    <StageButton pressed={paused} onClick={togglePaused}>
                      {paused ? "Resume" : "Pause"}
                    </StageButton>
                  )}
                  <StageButton
                    variant="solid"
                    onClick={resetLab}
                    className={reducedMotion ? "col-span-2" : ""}
                  >
                    Reset
                  </StageButton>
                </div>
                {snapshot ? <NeuralInspector car={snapshot} /> : null}
              </>
            ) : null}
          </aside>
        </div>
        <StatStrip items={statItems} />
      </section>

      <section id="plain-english" className="mt-16 scroll-mt-32">
        <h2 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">
          Plain-English guide
        </h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              What this is
            </h3>
            <p className="mt-4 text-sm leading-7 text-fg-muted">
              {prose.whatThisIs}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              How to use it
            </h3>
            <ol className="mt-4 space-y-3">
              {prose.howToUse.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 text-sm leading-6 text-fg-muted"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-fg">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              What to look for
            </h3>
            <ul className="mt-4 space-y-3">
              {prose.whatToLookFor.map((item) => (
                <li key={item} className="text-sm leading-6 text-fg-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="technical-details" className="mt-16 scroll-mt-32">
        <h2 className="text-3xl font-semibold tracking-tight text-fg md:text-4xl">
          Technical details
        </h2>
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              Architecture
            </h3>
            <ul className="mt-4 space-y-3">
              {prose.architecture.map((item) => (
                <li key={item} className="text-sm leading-6 text-fg-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              Key decisions
            </h3>
            <ul className="mt-4 space-y-3">
              {prose.decisions.map((item) => (
                <li key={item} className="text-sm leading-6 text-fg-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              Scope and limits
            </h3>
            <ul className="mt-4 space-y-3">
              {prose.limits.map((item) => (
                <li key={item} className="text-sm leading-6 text-fg-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function metricsEqual(a: LabMetrics, b: LabMetrics): boolean {
  return (
    a.explored === b.explored &&
    a.pathLength === b.pathLength &&
    a.walls === b.walls &&
    a.searchState === b.searchState &&
    a.pathFound === b.pathFound &&
    a.completed === b.completed &&
    a.bottleneckQueue === b.bottleneckQueue &&
    a.bottleneckName === b.bottleneckName &&
    a.failedCount === b.failedCount &&
    a.alive === b.alive &&
    a.best === b.best &&
    a.record === b.record &&
    a.generation === b.generation
  );
}

function hasRoute(
  walls: Uint8Array,
  cols: number,
  rows: number,
  start: number,
  goal: number,
): boolean {
  const seen = new Uint8Array(walls.length);
  const queue: number[] = [start];
  seen[start] = 1;
  let head = 0;
  while (head < queue.length) {
    const index = queue[head] ?? -1;
    head += 1;
    if (index === goal) {
      return true;
    }
    if (index < 0) {
      continue;
    }
    const x = index % cols;
    const y = Math.floor(index / cols);
    const candidates: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of candidates) {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
        continue;
      }
      const next = ny * cols + nx;
      if (walls[next] === 1 || seen[next] === 1) {
        continue;
      }
      seen[next] = 1;
      queue.push(next);
    }
  }
  return false;
}

// Seeded maze with no free corridors: random walls at ~27% density,
// re-rolled until start and goal are provably connected. The carved
// fallback is deterministic and effectively unreachable at this density.
function createGrid(round: number): GridWorld {
  const cols = 30;
  const rows = 20;
  const start = cols + 1;
  const goal = (rows - 2) * cols + (cols - 2);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const random = mulberry32(hashSeed(`maze-${round}-${attempt}`));
    const walls = new Uint8Array(cols * rows);
    for (let index = 0; index < walls.length; index += 1) {
      walls[index] = random() < 0.27 ? 1 : 0;
    }
    walls[start] = 0;
    walls[goal] = 0;
    if (hasRoute(walls, cols, rows, start, goal)) {
      return { cols, rows, start, goal, walls, explored: [], path: [], search: null };
    }
  }
  const random = mulberry32(hashSeed(`maze-${round}-carved`));
  const walls = new Uint8Array(cols * rows);
  for (let index = 0; index < walls.length; index += 1) {
    walls[index] = random() < 0.27 ? 1 : 0;
  }
  let cx = start % cols;
  let cy = Math.floor(start / cols);
  const gx = goal % cols;
  const gy = Math.floor(goal / cols);
  walls[start] = 0;
  while (cx !== gx || cy !== gy) {
    const moveX = cx !== gx && (cy === gy || random() < 0.5);
    if (moveX) {
      cx += cx < gx ? 1 : -1;
    } else {
      cy += cy < gy ? 1 : -1;
    }
    walls[cy * cols + cx] = 0;
  }
  return { cols, rows, start, goal, walls, explored: [], path: [], search: null };
}

function beginSearch(world: GridWorld, algorithm: Algorithm): void {
  world.explored = [];
  world.path = [];
  world.search = {
    algorithm,
    frontier: [{ index: world.start, priority: 0 }],
    costs: new Map([[world.start, 0]]),
    previous: new Map(),
    visited: new Set(),
    counter: 1,
    accumulator: 0,
    done: false,
    found: false,
  };
}

function popNext(frontier: FrontierEntry[]): FrontierEntry | undefined {
  if (frontier.length === 0) {
    return undefined;
  }
  let bestIndex = 0;
  for (let index = 1; index < frontier.length; index += 1) {
    const candidate = frontier[index];
    const best = frontier[bestIndex];
    if (candidate && best && candidate.priority < best.priority) {
      bestIndex = index;
    }
  }
  const chosen = frontier[bestIndex];
  frontier.splice(bestIndex, 1);
  return chosen;
}

// One frontier, four orderings. A*: cost + Manhattan heuristic.
// Dijkstra: cost. Breadth-first: a monotonically increasing enqueue
// counter, so the minimum is the earliest enqueued (true FIFO).
// Depth-first: a decreasing counter, so the minimum is the most
// recently enqueued (true LIFO).
function expandNeighbors(
  world: GridWorld,
  search: SearchState,
  index: number,
): void {
  const x = index % world.cols;
  const y = Math.floor(index / world.cols);
  const goalX = world.goal % world.cols;
  const goalY = Math.floor(world.goal / world.cols);
  const candidates: Array<[number, number]> = [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
  for (const [nx, ny] of candidates) {
    if (nx < 0 || ny < 0 || nx >= world.cols || ny >= world.rows) {
      continue;
    }
    const next = ny * world.cols + nx;
    if (world.walls[next] === 1 || search.visited.has(next)) {
      continue;
    }
    const cost = (search.costs.get(index) ?? 0) + 1;
    const known = search.costs.get(next);
    if (known !== undefined && cost >= known) {
      continue;
    }
    search.costs.set(next, cost);
    search.previous.set(next, index);
    let priority = cost;
    if (search.algorithm === "A*") {
      priority = cost + Math.abs(nx - goalX) + Math.abs(ny - goalY);
    } else if (search.algorithm === "Breadth-first") {
      priority = search.counter;
      search.counter += 1;
    } else if (search.algorithm === "Depth-first") {
      priority = -search.counter;
      search.counter += 1;
    }
    search.frontier.push({ index: next, priority });
  }
}

function buildPath(world: GridWorld, search: SearchState): void {
  const path: number[] = [];
  let cursor = world.goal;
  let guard = world.cols * world.rows;
  while (cursor !== world.start && guard > 0) {
    path.unshift(cursor);
    const previous = search.previous.get(cursor);
    if (previous === undefined) {
      world.path = [];
      search.found = false;
      return;
    }
    cursor = previous;
    guard -= 1;
  }
  path.unshift(world.start);
  world.path = path;
}

function stepSearch(world: GridWorld, maxExpansions: number): void {
  const search = world.search;
  if (!search || search.done) {
    return;
  }
  let expansions = 0;
  while (expansions < maxExpansions) {
    const current = popNext(search.frontier);
    if (current === undefined) {
      search.done = true;
      search.found = false;
      return;
    }
    if (search.visited.has(current.index)) {
      continue;
    }
    search.visited.add(current.index);
    world.explored.push(current.index);
    expansions += 1;
    if (current.index === world.goal) {
      search.done = true;
      search.found = true;
      buildPath(world, search);
      return;
    }
    expandNeighbors(world, search, current.index);
  }
}

function countWalls(world: GridWorld): number {
  let total = 0;
  for (let index = 0; index < world.walls.length; index += 1) {
    total += world.walls[index] === 1 ? 1 : 0;
  }
  return total;
}

function gridMetrics(world: GridWorld): LabMetrics {
  return {
    ...EMPTY_METRICS,
    explored: world.explored.length,
    pathLength: world.path.length,
    walls: countWalls(world),
    searchState: world.search ? (world.search.done ? "done" : "searching") : "idle",
    pathFound: world.search ? world.search.found : false,
  };
}

function drawGrid(
  context: CanvasRenderingContext2D,
  world: GridWorld,
  width: number,
  height: number,
): void {
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
  for (const index of [world.start, world.goal]) {
    const x = (index % world.cols) * cellWidth + cellWidth / 2;
    const y = Math.floor(index / world.cols) * cellHeight + cellHeight / 2;
    context.beginPath();
    context.arc(x, y, Math.min(cellWidth, cellHeight) * 0.3, 0, Math.PI * 2);
    context.fill();
  }
}

function createFlow(fleet: number): FlowWorld {
  const machines: FlowMachine[] = FLOW_STATIONS.map((station) => ({
    name: station.name,
    x: station.x,
    y: station.y,
    failable: station.failable,
    serviceMean: station.serviceMean,
    failed: false,
    queue: 0,
    busyFor: 0,
    outbox: 0,
  }));
  const agvs: FlowAgv[] = Array.from({ length: fleet }, (_, id) => ({
    id,
    x: 0.1,
    y: 0.5,
    carrying: false,
    task: "idle",
    target: 0,
    origin: 0,
  }));
  return {
    machines,
    agvs,
    random: mulberry32(hashSeed("flowline-line")),
    clock: 0,
    completed: 0,
    nextArrival: 0.5,
    nextAgvId: fleet,
  };
}

function routeOptions(from: number): number[] {
  if (from === 0) {
    return [1];
  }
  if (from === 1) {
    return [PROCESS_A, PROCESS_B];
  }
  if (from === PROCESS_A || from === PROCESS_B) {
    return [4];
  }
  if (from === 4) {
    return [OUTBOUND];
  }
  return [];
}

// Next live stage for a lot leaving `from`; Cut picks whichever Process
// machine has the smaller load. Returns -1 when every option is failed,
// so nothing ever routes down a dead edge.
function routeFrom(world: FlowWorld, from: number): number {
  let choice = -1;
  let bestLoad = Number.POSITIVE_INFINITY;
  for (const option of routeOptions(from)) {
    const machine = world.machines[option];
    if (!machine || machine.failed) {
      continue;
    }
    const load = machine.queue + (machine.busyFor > 0 ? 1 : 0);
    if (load < bestLoad) {
      bestLoad = load;
      choice = option;
    }
  }
  return choice;
}

function moveToward(agv: FlowAgv, machine: FlowMachine, dt: number): boolean {
  const dx = machine.x - agv.x;
  const dy = machine.y - agv.y;
  const distance = Math.hypot(dx, dy);
  const step = AGV_SPEED * dt;
  if (distance <= step) {
    agv.x = machine.x;
    agv.y = machine.y;
    return true;
  }
  agv.x += (dx / distance) * step;
  agv.y += (dy / distance) * step;
  return false;
}

function assignPickup(world: FlowWorld, agv: FlowAgv): void {
  const claims = new Map<number, number>();
  for (const other of world.agvs) {
    if (other.task === "pickup") {
      claims.set(other.target, (claims.get(other.target) ?? 0) + 1);
    }
  }
  let choice = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < world.machines.length; index += 1) {
    const machine = world.machines[index];
    if (!machine || machine.outbox === 0) {
      continue;
    }
    if ((claims.get(index) ?? 0) >= machine.outbox) {
      continue;
    }
    if (routeFrom(world, index) === -1) {
      continue;
    }
    const distance = Math.hypot(machine.x - agv.x, machine.y - agv.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      choice = index;
    }
  }
  if (choice >= 0) {
    agv.task = "pickup";
    agv.target = choice;
  }
}

// Grow with fresh idle vehicles at Intake; trim by retiring idle or
// empty vehicles only — carriers finish their delivery first and are
// retired on a later tick, so no lot is ever destroyed.
function syncFleet(world: FlowWorld, fleet: number): void {
  while (world.agvs.length < fleet) {
    world.agvs.push({
      id: world.nextAgvId,
      x: 0.1,
      y: 0.5,
      carrying: false,
      task: "idle",
      target: 0,
      origin: 0,
    });
    world.nextAgvId += 1;
  }
  if (world.agvs.length > fleet) {
    for (
      let index = world.agvs.length - 1;
      index >= 0 && world.agvs.length > fleet;
      index -= 1
    ) {
      const agv = world.agvs[index];
      if (agv && !agv.carrying) {
        world.agvs.splice(index, 1);
      }
    }
  }
}

// When a machine fails: the in-service lot returns to a queue, and for
// the Process pair every queued lot redistributes to the live alternate.
function applyFailure(world: FlowWorld, index: number): string {
  const machine = world.machines[index];
  if (!machine) {
    return "";
  }
  const alternateIndex =
    index === PROCESS_A ? PROCESS_B : index === PROCESS_B ? PROCESS_A : -1;
  const alternate =
    alternateIndex >= 0 ? world.machines[alternateIndex] : undefined;
  const stranded = machine.queue + (machine.busyFor > 0 ? 1 : 0);
  const inService = machine.busyFor > 0 ? 1 : 0;
  machine.busyFor = 0;
  if (alternate && !alternate.failed && stranded > 0) {
    alternate.queue += stranded;
    machine.queue = 0;
    return ` — ${stranded} queued ${stranded === 1 ? "lot" : "lots"} rerouted to ${alternate.name}`;
  }
  machine.queue += inService;
  if (stranded > 0) {
    return ` — ${stranded} ${stranded === 1 ? "lot holds" : "lots hold"} until repair`;
  }
  return "";
}

function updateFlow(
  world: FlowWorld,
  dt: number,
  fleet: number,
  arrival: number,
): void {
  world.clock += dt;
  syncFleet(world, fleet);
  const intake = world.machines[0];
  if (intake) {
    world.nextArrival -= dt;
    while (world.nextArrival <= 0) {
      intake.queue += 1;
      const meanInterval = 120 / Math.max(10, arrival);
      world.nextArrival += meanInterval * (0.6 + world.random() * 0.8);
    }
  }
  for (let index = 0; index < world.machines.length; index += 1) {
    if (index === OUTBOUND) {
      continue;
    }
    const machine = world.machines[index];
    if (!machine || machine.failed) {
      continue;
    }
    if (machine.busyFor > 0) {
      machine.busyFor -= dt;
      if (machine.busyFor <= 0) {
        machine.busyFor = 0;
        machine.outbox += 1;
      }
    }
    if (machine.busyFor === 0 && machine.queue > 0) {
      machine.queue -= 1;
      machine.busyFor = machine.serviceMean * (0.7 + world.random() * 0.6);
    }
  }
  for (const agv of world.agvs) {
    if (agv.task === "idle") {
      assignPickup(world, agv);
    }
    if (agv.task === "pickup") {
      const machine = world.machines[agv.target];
      if (!machine || machine.outbox === 0) {
        agv.task = "idle";
        continue;
      }
      if (moveToward(agv, machine, dt)) {
        const destination = routeFrom(world, agv.target);
        if (destination === -1) {
          agv.task = "idle";
          continue;
        }
        machine.outbox -= 1;
        agv.carrying = true;
        agv.origin = agv.target;
        agv.target = destination;
        agv.task = "haul";
      }
      continue;
    }
    if (agv.task === "haul") {
      let machine = world.machines[agv.target];
      if (machine && machine.failed) {
        const alternate = routeFrom(world, agv.origin);
        if (alternate === -1) {
          continue;
        }
        agv.target = alternate;
        machine = world.machines[agv.target];
      }
      if (!machine) {
        continue;
      }
      if (moveToward(agv, machine, dt)) {
        if (agv.target === OUTBOUND) {
          world.completed += 1;
        } else {
          machine.queue += 1;
        }
        agv.carrying = false;
        agv.task = "idle";
      }
    }
  }
}

function flowMetrics(world: FlowWorld): LabMetrics {
  let bottleneckQueue = 0;
  let bottleneckName = "—";
  for (let index = 0; index < world.machines.length; index += 1) {
    if (index === OUTBOUND) {
      continue;
    }
    const machine = world.machines[index];
    if (!machine) {
      continue;
    }
    if (machine.queue > bottleneckQueue) {
      bottleneckQueue = machine.queue;
      bottleneckName = machine.name;
    }
  }
  return {
    ...EMPTY_METRICS,
    completed: world.completed,
    bottleneckQueue,
    bottleneckName,
    failedCount: world.machines.filter((machine) => machine.failed).length,
  };
}

function drawFlow(
  context: CanvasRenderingContext2D,
  world: FlowWorld,
  width: number,
  height: number,
): void {
  context.lineWidth = 3;
  for (const [fromIndex, toIndex] of FLOW_EDGES) {
    const from = world.machines[fromIndex];
    const to = world.machines[toIndex];
    if (!from || !to) {
      continue;
    }
    context.strokeStyle =
      from.failed || to.failed
        ? "rgba(248,113,113,.5)"
        : "rgba(96,165,250,.30)";
    context.beginPath();
    context.moveTo(from.x * width, from.y * height);
    context.lineTo(to.x * width, to.y * height);
    context.stroke();
  }
  context.font = "11px ui-monospace, monospace";
  context.textAlign = "center";
  for (const machine of world.machines) {
    context.fillStyle = machine.failed ? "#f87171" : "#60a5fa";
    context.fillRect(machine.x * width - 28, machine.y * height - 22, 56, 44);
    context.fillStyle = "#f5f5f5";
    context.fillText(machine.name, machine.x * width, machine.y * height + 40);
    if (machine.name === "Outbound") {
      context.fillText(
        `done ${world.completed}`,
        machine.x * width,
        machine.y * height + 54,
      );
    } else {
      context.fillText(
        `Q ${machine.queue} · out ${machine.outbox}`,
        machine.x * width,
        machine.y * height + 54,
      );
    }
  }
  for (const agv of world.agvs) {
    context.fillStyle = agv.carrying ? "#f5f5f5" : "#a3a3a3";
    context.fillRect(agv.x * width - 6, agv.y * height - 6, 12, 12);
  }
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

// One seeded stream per generation drives obstacles, weights, and
// mutation noise, so evolution replays identically. With parents, car 0
// is the elite: an exact, unmutated copy of the best driver.
function createNeuro(
  generation: number,
  parents?: Car[],
  mutationScale = 0,
  record = 0,
): NeuroWorld {
  const random = mulberry32(hashSeed(`neuro-gen-${generation}`));
  const obstacleCount = 3 + Math.floor(random() * 3);
  const obstacles: Obstacle[] = Array.from({ length: obstacleCount }, () => ({
    angle: normalizeAngle(START_ANGLE + 0.5 + random() * (Math.PI * 2 - 1)),
    lane: (random() - 0.5) * 0.8,
    radius: 0.018 + random() * 0.02,
  }));
  const cars: Car[] = Array.from({ length: POPULATION }, (_, id) => {
    const parent =
      parents && parents.length > 0 ? parents[id % parents.length] : undefined;
    const weights = Array.from({ length: 42 }, (_, index) => {
      if (!parent) {
        return random() * 2 - 1;
      }
      const base = parent.weights[index] ?? 0;
      if (id === 0) {
        return base;
      }
      return base + (random() - 0.5) * mutationScale;
    });
    return {
      id,
      angle: START_ANGLE,
      lane: 0,
      speed: 0.55,
      fitness: 0,
      alive: true,
      weights,
      inputs: [0, 0, 0, 0, 0],
      hidden: [0, 0, 0, 0, 0, 0],
      outputs: [0, 0],
    };
  });
  return { cars, obstacles, generation, clock: 0, best: 0, record };
}

// Five real sensors: obstacle proximity ahead-left, obstacle proximity
// ahead-right, lane error, speed, and the angular gap to the next
// obstacle. Crashes are physical: obstacle contact or leaving the track
// beyond the fixed CRASH_LANE threshold — never tied to UI sliders.
function updateNeuro(world: NeuroWorld, dt: number, pressure: number): void {
  world.clock += dt;
  for (const car of world.cars) {
    if (!car.alive) {
      continue;
    }
    let proximityLeft = 0;
    let proximityRight = 0;
    let nearestGap = SENSOR_RANGE;
    for (const obstacle of world.obstacles) {
      const ahead = normalizeAngle(obstacle.angle - car.angle);
      if (ahead > SENSOR_RANGE) {
        continue;
      }
      const proximity = 1 - ahead / SENSOR_RANGE;
      if (obstacle.lane < car.lane) {
        proximityLeft = Math.max(proximityLeft, proximity);
      } else {
        proximityRight = Math.max(proximityRight, proximity);
      }
      nearestGap = Math.min(nearestGap, ahead);
    }
    car.inputs = [
      proximityLeft,
      proximityRight,
      car.lane / CRASH_LANE,
      (car.speed - 0.45) / 0.75,
      1 - nearestGap / SENSOR_RANGE,
    ];
    car.hidden = Array.from({ length: 6 }, (_, hidden) => {
      let sum = 0;
      for (let input = 0; input < 5; input += 1) {
        sum += (car.inputs[input] ?? 0) * (car.weights[hidden * 5 + input] ?? 0);
      }
      return Math.tanh(sum);
    });
    car.outputs = [0, 1].map((output) => {
      let sum = 0;
      for (let hidden = 0; hidden < 6; hidden += 1) {
        sum += (car.hidden[hidden] ?? 0) * (car.weights[30 + output * 6 + hidden] ?? 0);
      }
      return Math.tanh(sum);
    });
    const steer = car.outputs[0] ?? 0;
    const throttle = car.outputs[1] ?? 0;
    car.lane += steer * dt * 1.5;
    car.lane +=
      Math.sin(car.angle * 3 + car.id * 0.7) * dt * (pressure / 100) * 0.3;
    car.speed = 0.45 + ((throttle + 1) / 2) * 0.75;
    car.angle = normalizeAngle(car.angle + car.speed * dt);
    car.fitness += car.speed * dt * Math.max(0, 1 - Math.abs(car.lane));
    if (Math.abs(car.lane) > CRASH_LANE) {
      car.alive = false;
    } else {
      const carTrack = LANE_RADIUS + car.lane * LANE_SPREAD;
      const carX = Math.cos(car.angle) * carTrack;
      const carY = Math.sin(car.angle) * carTrack;
      for (const obstacle of world.obstacles) {
        const obstacleTrack = LANE_RADIUS + obstacle.lane * LANE_SPREAD;
        const dx = carX - Math.cos(obstacle.angle) * obstacleTrack;
        const dy = carY - Math.sin(obstacle.angle) * obstacleTrack;
        if (Math.hypot(dx, dy) < obstacle.radius + CAR_RADIUS) {
          car.alive = false;
          break;
        }
      }
    }
    world.best = Math.max(world.best, car.fitness);
    world.record = Math.max(world.record, car.fitness);
  }
}

// Elitist truncation: top five parent the next generation; the mutation
// slider directly scales the weight-noise amplitude applied to children.
function evolveNeuro(world: NeuroWorld, mutationRate: number): void {
  const parents = [...world.cars]
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, 5);
  const scale = 0.05 + (mutationRate / 100) * 0.7;
  const next = createNeuro(world.generation + 1, parents, scale, world.record);
  world.cars = next.cars;
  world.obstacles = next.obstacles;
  world.generation = next.generation;
  world.clock = 0;
  world.best = 0;
  world.record = next.record;
}

function snapshotCar(car: Car | undefined): Car | null {
  if (!car) {
    return null;
  }
  return {
    ...car,
    weights: [...car.weights],
    inputs: [...car.inputs],
    hidden: [...car.hidden],
    outputs: [...car.outputs],
  };
}

function neuroMetrics(world: NeuroWorld): LabMetrics {
  return {
    ...EMPTY_METRICS,
    alive: world.cars.filter((car) => car.alive).length,
    best: Math.round(world.best * 10) / 10,
    record: Math.round(world.record * 10) / 10,
    generation: world.generation,
  };
}

function drawNeuro(
  context: CanvasRenderingContext2D,
  world: NeuroWorld,
  width: number,
  height: number,
  selected: number,
): void {
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height);
  context.strokeStyle = "rgba(255,255,255,.13)";
  context.lineWidth = base * (CRASH_LANE * LANE_SPREAD * 2);
  context.beginPath();
  context.arc(cx, cy, base * LANE_RADIUS, 0, Math.PI * 2);
  context.stroke();
  context.strokeStyle = "rgba(96,165,250,.38)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(cx, cy, base * LANE_RADIUS, 0, Math.PI * 2);
  context.stroke();
  for (const obstacle of world.obstacles) {
    const track = base * (LANE_RADIUS + obstacle.lane * LANE_SPREAD);
    const x = cx + Math.cos(obstacle.angle) * track;
    const y = cy + Math.sin(obstacle.angle) * track;
    context.fillStyle = "rgba(248,113,113,.35)";
    context.beginPath();
    context.arc(x, y, obstacle.radius * base, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#f87171";
    context.lineWidth = 1.5;
    context.stroke();
  }
  world.cars.forEach((car, index) => {
    const track = base * (LANE_RADIUS + car.lane * LANE_SPREAD);
    const x = cx + Math.cos(car.angle) * track;
    const y = cy + Math.sin(car.angle) * track;
    context.fillStyle = !car.alive
      ? "rgba(248,113,113,.3)"
      : index === selected
        ? "#f5f5f5"
        : "#60a5fa";
    context.save();
    context.translate(x, y);
    context.rotate(car.angle + Math.PI / 2);
    context.fillRect(-4, -8, 8, 16);
    context.restore();
  });
}

const INSPECTOR_INPUT_YS = [48, 94, 140, 186, 232];
const INSPECTOR_HIDDEN_YS = [40, 80, 120, 160, 200, 240];
const INSPECTOR_OUTPUT_YS = [100, 180];

// A real layer diagram of the live network: connection stroke width is
// proportional to |weight| (accent positive, alert negative) and node
// fill opacity is proportional to |activation|.
function NeuralInspector({ car }: { car: Car }) {
  const weightColor = (weight: number) => (weight >= 0 ? "#60a5fa" : "#f87171");
  const weightWidth = (weight: number) =>
    (0.5 + Math.min(2.2, Math.abs(weight) * 2)).toFixed(2);
  const weightOpacity = (weight: number) =>
    (0.25 + Math.min(0.55, Math.abs(weight) * 0.45)).toFixed(2);
  const nodeOpacity = (activation: number) =>
    (0.12 + Math.min(0.88, Math.abs(activation) * 0.88)).toFixed(2);
  return (
    <div className="mt-6 rounded-2xl border border-white/15 bg-black/20 p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">
          Driver {car.id + 1}
        </p>
        <span
          className={`font-mono text-[10px] ${car.alive ? "text-accent" : "text-alert"}`}
        >
          {car.alive ? "active" : "crashed"}
        </span>
      </div>
      <svg
        viewBox="0 0 352 260"
        role="img"
        aria-label={`Network diagram for driver ${car.id + 1}: five labeled inputs, six hidden units, and steer and throttle outputs`}
        className="mt-4 h-auto w-full"
      >
        <text x={70} y={16} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.62)">
          Input layer
        </text>
        <text x={200} y={16} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.62)">
          Hidden layer
        </text>
        <text x={306} y={16} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.62)">
          Output layer
        </text>
        {INSPECTOR_HIDDEN_YS.map((hiddenY, hidden) =>
          INSPECTOR_INPUT_YS.map((inputY, input) => {
            const weight = car.weights[hidden * 5 + input] ?? 0;
            return (
              <line
                key={`ih-${hidden}-${input}`}
                x1={103}
                y1={inputY}
                x2={193}
                y2={hiddenY}
                stroke={weightColor(weight)}
                strokeWidth={weightWidth(weight)}
                strokeOpacity={weightOpacity(weight)}
              />
            );
          }),
        )}
        {INSPECTOR_OUTPUT_YS.map((outputY, output) =>
          INSPECTOR_HIDDEN_YS.map((hiddenY, hidden) => {
            const weight = car.weights[30 + output * 6 + hidden] ?? 0;
            return (
              <line
                key={`ho-${output}-${hidden}`}
                x1={207}
                y1={hiddenY}
                x2={281}
                y2={outputY}
                stroke={weightColor(weight)}
                strokeWidth={weightWidth(weight)}
                strokeOpacity={weightOpacity(weight)}
              />
            );
          }),
        )}
        {INSPECTOR_INPUT_YS.map((inputY, input) => {
          const activation = car.inputs[input] ?? 0;
          return (
            <g key={`in-${INPUT_LABELS[input] ?? input}`}>
              <text
                x={78}
                y={inputY + 3}
                textAnchor="end"
                fontSize={10}
                fill="rgba(255,255,255,0.62)"
              >
                {INPUT_LABELS[input]}
              </text>
              <circle
                cx={96}
                cy={inputY}
                r={7}
                fill={weightColor(activation)}
                fillOpacity={nodeOpacity(activation)}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
              />
            </g>
          );
        })}
        {INSPECTOR_HIDDEN_YS.map((hiddenY, hidden) => {
          const activation = car.hidden[hidden] ?? 0;
          return (
            <circle
              key={`hid-${hiddenY}`}
              cx={200}
              cy={hiddenY}
              r={7}
              fill={weightColor(activation)}
              fillOpacity={nodeOpacity(activation)}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={1}
            />
          );
        })}
        {INSPECTOR_OUTPUT_YS.map((outputY, output) => {
          const activation = car.outputs[output] ?? 0;
          return (
            <g key={`out-${OUTPUT_LABELS[output] ?? output}`}>
              <circle
                cx={288}
                cy={outputY}
                r={7}
                fill={weightColor(activation)}
                fillOpacity={nodeOpacity(activation)}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
              />
              <text
                x={300}
                y={outputY + 3}
                textAnchor="start"
                fontSize={10}
                fill="rgba(255,255,255,0.62)"
              >
                {OUTPUT_LABELS[output]}
              </text>
            </g>
          );
        })}
      </svg>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/65">
        <div>
          <dt className="text-white/55">Fitness</dt>
          <dd className="mt-1 font-mono">{car.fitness.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-white/55">Lane error</dt>
          <dd className="mt-1 font-mono">{Math.abs(car.lane).toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
