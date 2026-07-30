// Deterministic point-mass performance model for the Apex test cell.
// Everything is SI internally; mph appears only at the display boundary.
// Fixed-step integration (h = 1/240 s) means a given configuration always
// produces the bit-identical run, which keeps ghost-lap comparisons honest.

export type AeroMode = "Road" | "Track" | "Vmax";

export interface RunConfig {
  aero: AeroMode;
  wheelSize: number;
}

export interface RunSample {
  /** Sim time, seconds. */
  t: number;
  /** Speed, m/s. */
  v: number;
  rpm: number;
  gear: number;
}

export interface Milestone {
  id: "sixty" | "onetwenty" | "quarter" | "vmax";
  label: string;
  t: number;
  value: string;
}

export interface RunState {
  config: RunConfig;
  t: number;
  v: number;
  x: number;
  gear: number;
  rpm: number;
  accel: number;
  accumulator: number;
  stepCount: number;
  samples: RunSample[];
  milestones: Milestone[];
  vmaxMs: number;
  done: boolean;
}

export interface RunResult {
  config: RunConfig;
  samples: RunSample[];
  milestones: Milestone[];
  topSpeedMph: number;
  zeroToSixtyS: number | null;
  quarterMileS: number | null;
  durationS: number;
}

const MASS = 1420; // kg
const POWER = 820_000; // W at the crank
const ETA = 0.88; // drivetrain efficiency
const RHO = 1.225;
const G = 9.81;
const MU = 1.2; // tire friction coefficient
export const REDLINE = 8500;
export const IDLE_RPM = 1800;
const GEARS = [2.9, 2.29, 1.81, 1.43, 1.13, 0.89, 0.7];
const STEP = 1 / 240;
const SAMPLE_EVERY = 4; // record at 60 Hz sim time

/** Wall-clock seconds map to sim seconds at this rate during playback. */
export const SIM_SCALE = 6;

export const MPH_PER_MS = 2.23694;
const SIXTY_MS = 60 / MPH_PER_MS;
const ONETWENTY_MS = 120 / MPH_PER_MS;
const QUARTER_MILE_M = 402.336;

const AERO: Record<AeroMode, { cda: number; kDf: number; finalDrive: number }> =
  {
    // cda calibrated so the drag-limited top speed matches the published spec
    // (Road 258 / Track 232 / Vmax 284 mph on 21-inch wheels); kDf calibrated
    // so downforce at 150 mph equals the published kg figure.
    Road: { cda: 0.75, kDf: 1.05, finalDrive: 3.31 },
    Track: { cda: 1.04, kDf: 1.88, finalDrive: 3.55 },
    Vmax: { cda: 0.56, kDf: 0.68, finalDrive: 3.05 },
  };

function tireRadius(wheelSize: number): number {
  return 0.0127 * wheelSize + 0.089; // metres of rolling radius
}

function rollingCoefficient(wheelSize: number): number {
  return 0.01 + (wheelSize - 21) * 0.002;
}

/** Larger wheels add rotational inertia — the config's real accel tradeoff. */
function effectiveMass(wheelSize: number): number {
  return MASS * (1.04 + (wheelSize - 20) * 0.015);
}

function rpmAt(v: number, gear: number, config: RunConfig): number {
  const radius = tireRadius(config.wheelSize);
  const ratio = GEARS[gear] * AERO[config.aero].finalDrive;
  const rpm = (v / radius) * ratio * 9.5493;
  return Math.min(REDLINE, Math.max(IDLE_RPM, rpm));
}

function netForce(v: number, config: RunConfig): number {
  const { cda, kDf } = AERO[config.aero];
  const normalLoad = MASS * G + kDf * v * v;
  const traction = MU * normalLoad;
  const engine = (ETA * POWER) / Math.max(v, 8);
  const drive = Math.min(engine, traction);
  const drag = 0.5 * RHO * cda * v * v;
  const rolling = rollingCoefficient(config.wheelSize) * MASS * G;
  return drive - drag - rolling;
}

/** Drag-limited top speed for a configuration, via bisection. */
export function solveVmax(config: RunConfig): number {
  let low = 40;
  let high = 160;
  for (let iteration = 0; iteration < 48; iteration += 1) {
    const mid = (low + high) / 2;
    if (netForce(mid, config) > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

export function createRunState(aero: AeroMode, wheelSize: number): RunState {
  const config: RunConfig = { aero, wheelSize };
  return {
    config,
    t: 0,
    v: 0,
    x: 0,
    gear: 0,
    rpm: IDLE_RPM,
    accel: 0,
    accumulator: 0,
    stepCount: 0,
    samples: [{ t: 0, v: 0, rpm: IDLE_RPM, gear: 1 }],
    milestones: [],
    vmaxMs: solveVmax(config),
    done: false,
  };
}

function integrateStep(state: RunState): void {
  const config = state.config;
  const previousV = state.v;
  const force = netForce(state.v, config);
  const accel = force / effectiveMass(config.wheelSize);
  state.accel = accel;
  state.v = Math.max(0, state.v + accel * STEP);
  state.x += state.v * STEP;
  state.t += STEP;
  state.stepCount += 1;

  state.rpm = rpmAt(state.v, state.gear, config);
  if (state.rpm >= REDLINE - 1 && state.gear < GEARS.length - 1) {
    state.gear += 1;
    state.rpm = rpmAt(state.v, state.gear, config);
  }

  if (state.stepCount % SAMPLE_EVERY === 0) {
    state.samples.push({
      t: state.t,
      v: state.v,
      rpm: state.rpm,
      gear: state.gear + 1,
    });
  }

  const crossed = (threshold: number) =>
    previousV < threshold && state.v >= threshold;

  if (crossed(SIXTY_MS)) {
    state.milestones.push({
      id: "sixty",
      label: "0–60 mph",
      t: state.t,
      value: `${state.t.toFixed(1)} s`,
    });
  }
  if (crossed(ONETWENTY_MS)) {
    state.milestones.push({
      id: "onetwenty",
      label: "0–120 mph",
      t: state.t,
      value: `${state.t.toFixed(1)} s`,
    });
  }
  if (
    state.x >= QUARTER_MILE_M &&
    !state.milestones.some((item) => item.id === "quarter")
  ) {
    state.milestones.push({
      id: "quarter",
      label: "¼ mile",
      t: state.t,
      value: `${state.t.toFixed(1)} s · ${Math.round(state.v * MPH_PER_MS)} mph`,
    });
  }

  const atPlateau = state.t > 6 && accel < 0.3;
  if (state.v >= state.vmaxMs * 0.985 || atPlateau) {
    state.done = true;
    state.milestones.push({
      id: "vmax",
      label: "Top speed",
      t: state.t,
      value: `${Math.round(state.v * MPH_PER_MS)} mph`,
    });
    state.samples.push({
      t: state.t,
      v: state.v,
      rpm: state.rpm,
      gear: state.gear + 1,
    });
  }
}

/** Advance the run by a slice of sim time (already SIM_SCALE-multiplied). */
export function stepRun(state: RunState, simSeconds: number): void {
  if (state.done) {
    return;
  }
  state.accumulator += simSeconds;
  while (state.accumulator >= STEP && !state.done) {
    state.accumulator -= STEP;
    integrateStep(state);
  }
}

export function toResult(state: RunState): RunResult {
  const sixty = state.milestones.find((item) => item.id === "sixty");
  const quarter = state.milestones.find((item) => item.id === "quarter");
  return {
    config: state.config,
    samples: state.samples,
    milestones: state.milestones,
    topSpeedMph: Math.round(state.v * MPH_PER_MS),
    zeroToSixtyS: sixty ? sixty.t : null,
    quarterMileS: quarter ? quarter.t : null,
    durationS: state.t,
  };
}

/** Run a configuration to completion instantly (reduced motion, spec strip). */
export function simulateFull(aero: AeroMode, wheelSize: number): RunResult {
  const state = createRunState(aero, wheelSize);
  // Hard cap well beyond any real completion point (120 sim-seconds).
  for (let index = 0; index < 120 / STEP && !state.done; index += 1) {
    integrateStep(state);
  }
  return toResult(state);
}
