"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
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
  type CreativeCanvasRuntime,
} from "@/components/creative/stage/useCreativeCanvas";
import type { CreativeProject } from "@/lib/creativeProjects";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

type MazeSize = "Compact" | "Standard" | "Vast";

const SIZE_CELLS: Record<MazeSize, number> = {
  Compact: 11,
  Standard: 15,
  Vast: 21,
};

const ECHO_TARGET = 5;
const MAX_SHIELD = 3;
const PULSE_RANGE = 5;
const PULSE_COOLDOWN = 1.5;
const STUN_SECONDS = 5;

interface Drone {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  stunned: number;
}

interface World {
  tiles: Uint8Array;
  span: number;
  echoes: Array<{ x: number; y: number; taken: boolean }>;
  exitX: number;
  exitY: number;
  drones: Drone[];
  px: number;
  py: number;
  angle: number;
  moves: number;
  elapsed: number;
  shield: number;
  pulseAt: number;
  pulseFlash: number;
  finished: boolean;
}

interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

function generateWorld(mazeNumber: number, size: MazeSize): World {
  const cells = SIZE_CELLS[size];
  const span = cells * 2 + 1;
  const random = mulberry32(hashSeed(`echo-maze-${mazeNumber}-${size}`));
  const tiles = new Uint8Array(span * span).fill(1);
  const cellIndex = (cx: number, cy: number) => (cy * 2 + 1) * span + (cx * 2 + 1);

  // Recursive backtracker over the cell grid; walls live on even tiles.
  const visited = new Uint8Array(cells * cells);
  const stack: Array<[number, number]> = [[0, 0]];
  visited[0] = 1;
  tiles[cellIndex(0, 0)] = 0;
  const deadEnds: Array<[number, number]> = [];
  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const options: Array<[number, number]> = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < cells && ny < cells && !visited[ny * cells + nx]) {
        options.push([nx, ny]);
      }
    }
    if (options.length === 0) {
      if (stack.length > 1) {
        deadEnds.push([cx, cy]);
      }
      stack.pop();
      continue;
    }
    const [nx, ny] = options[Math.floor(random() * options.length)];
    visited[ny * cells + nx] = 1;
    tiles[cellIndex(nx, ny)] = 0;
    tiles[((cy + ny + 1) * span + (cx + nx + 1))] = 0;
    stack.push([nx, ny]);
  }

  // Breadth-first distances from the start cell rank the dead-ends so the
  // exit is genuinely far and the echoes spread across the maze.
  const distance = new Int32Array(cells * cells).fill(-1);
  distance[0] = 0;
  const queue: Array<[number, number]> = [[0, 0]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift() as [number, number];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cells || ny >= cells) continue;
      if (tiles[(cy + ny + 1) * span + (cx + nx + 1)] === 1) continue;
      if (distance[ny * cells + nx] >= 0) continue;
      distance[ny * cells + nx] = distance[cy * cells + cx] + 1;
      queue.push([nx, ny]);
    }
  }
  const ranked = [...deadEnds].sort(
    (a, b) => distance[b[1] * cells + b[0]] - distance[a[1] * cells + a[0]],
  );
  const exitCell = ranked[0] ?? [cells - 1, cells - 1];
  const echoCells = ranked.slice(1, 1 + ECHO_TARGET);
  while (echoCells.length < ECHO_TARGET) {
    echoCells.push([
      Math.floor(random() * cells),
      Math.floor(random() * cells),
    ]);
  }
  const toTile = (cell: [number, number]) => ({
    x: cell[0] * 2 + 1.5,
    y: cell[1] * 2 + 1.5,
  });

  const droneCount = size === "Vast" ? 3 : 2;
  const drones: Drone[] = Array.from({ length: droneCount }, (_, index) => {
    const cell = ranked[2 + ECHO_TARGET + index] ?? [
      Math.floor(cells / 2),
      Math.floor(cells / 2),
    ];
    const spot = toTile(cell);
    return { x: spot.x, y: spot.y, targetX: spot.x, targetY: spot.y, stunned: 0 };
  });

  return {
    tiles,
    span,
    echoes: echoCells.map((cell) => ({ ...toTile(cell), taken: false })),
    exitX: toTile(exitCell).x,
    exitY: toTile(exitCell).y,
    drones,
    px: 1.5,
    py: 1.5,
    angle: 0,
    moves: 0,
    elapsed: 0,
    shield: MAX_SHIELD,
    pulseAt: -PULSE_COOLDOWN,
    pulseFlash: 0,
    finished: false,
  };
}

function tileAt(world: World, x: number, y: number): number {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= world.span || ty >= world.span) {
    return 1;
  }
  return world.tiles[ty * world.span + tx];
}

function castRay(world: World, angle: number): { dist: number; side: number } {
  // Standard DDA grid traversal.
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  let mapX = Math.floor(world.px);
  let mapY = Math.floor(world.py);
  const deltaX = Math.abs(dirX) < 1e-8 ? 1e8 : Math.abs(1 / dirX);
  const deltaY = Math.abs(dirY) < 1e-8 ? 1e8 : Math.abs(1 / dirY);
  const stepX = dirX < 0 ? -1 : 1;
  const stepY = dirY < 0 ? -1 : 1;
  let sideX = dirX < 0 ? (world.px - mapX) * deltaX : (mapX + 1 - world.px) * deltaX;
  let sideY = dirY < 0 ? (world.py - mapY) * deltaY : (mapY + 1 - world.py) * deltaY;
  let side = 0;
  for (let bound = 0; bound < 128; bound += 1) {
    if (sideX < sideY) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    if (
      mapX < 0 ||
      mapY < 0 ||
      mapX >= world.span ||
      mapY >= world.span ||
      world.tiles[mapY * world.span + mapX] === 1
    ) {
      break;
    }
  }
  const dist = side === 0 ? sideX - deltaX : sideY - deltaY;
  return { dist: Math.max(0.01, dist), side };
}

function hasLineOfSight(world: World, x: number, y: number): boolean {
  const dx = x - world.px;
  const dy = y - world.py;
  const dist = Math.hypot(dx, dy);
  const steps = Math.ceil(dist * 4);
  for (let index = 1; index < steps; index += 1) {
    const t = index / steps;
    if (tileAt(world, world.px + dx * t, world.py + dy * t) === 1) {
      return false;
    }
  }
  return true;
}

export default function EchoMaze({ project }: { project: CreativeProject }) {
  const [mazeNumber, setMazeNumber] = useState(1);
  const [size, setSize] = useState<MazeSize>("Standard");
  const [fov, setFov] = useState(78);
  const [minimap, setMinimap] = useState(true);
  const [status, setStatus] = useState(
    "Maze 1 ready. Focus the view and move with WASD or the arrow keys.",
  );
  const [hud, setHud] = useState({
    echoes: 0,
    shield: MAX_SHIELD,
    moves: 0,
    seconds: 0,
  });
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  // The world is created only inside getWorld (never passed through a hook),
  // so the React Compiler knows it is legitimately mutable sim state.
  const worldRef = useRef<World | null>(null);
  const getWorld = useCallback((): World => {
    let world = worldRef.current;
    if (world === null) {
      world = generateWorld(1, "Standard");
      worldRef.current = world;
    }
    return world;
  }, []);
  const inputRef = useRef<InputState>({
    forward: false,
    back: false,
    left: false,
    right: false,
  });
  const fovRef = useRef(fov);
  const minimapRef = useRef(minimap);
  const publishTickRef = useRef(0);

  useEffect(() => {
    fovRef.current = fov;
  }, [fov]);
  useEffect(() => {
    minimapRef.current = minimap;
  }, [minimap]);

  const publish = useCallback(() => {
    const world = getWorld();
    setHud({
      echoes: world.echoes.filter((echo) => echo.taken).length,
      shield: world.shield,
      moves: Math.round(world.moves),
      seconds: Math.round(world.elapsed),
    });
  }, [getWorld]);

  function paint(runtime: CreativeCanvasRuntime) {
    const context = runtime.context;
    if (!context) {
      return;
    }
    const world = getWorld();
    const { width, height } = runtime.size;
    const fovRad = (fovRef.current * Math.PI) / 180;

    // Ceiling and floor.
    const skyGradient = context.createLinearGradient(0, 0, 0, height / 2);
    skyGradient.addColorStop(0, "#0b1120");
    skyGradient.addColorStop(1, "#050609");
    context.fillStyle = skyGradient;
    context.fillRect(0, 0, width, height / 2);
    const floorGradient = context.createLinearGradient(0, height / 2, 0, height);
    floorGradient.addColorStop(0, "#050609");
    floorGradient.addColorStop(1, "#101318");
    context.fillStyle = floorGradient;
    context.fillRect(0, height / 2, width, height / 2);

    // Walls via raycasting, keeping a z-buffer for sprite occlusion.
    const columnWidth = 2;
    const columns = Math.ceil(width / columnWidth);
    const zBuffer = new Float32Array(columns);
    for (let column = 0; column < columns; column += 1) {
      const rayOffset = (column / columns - 0.5) * fovRad;
      const ray = castRay(world, world.angle + rayOffset);
      const corrected = ray.dist * Math.cos(rayOffset);
      zBuffer[column] = corrected;
      const wallHeight = Math.min(height, height / corrected);
      const lightness = Math.max(9, 46 - corrected * 4.2) - ray.side * 5;
      context.fillStyle = `hsl(220, 18%, ${lightness}%)`;
      context.fillRect(
        column * columnWidth,
        (height - wallHeight) / 2,
        columnWidth,
        wallHeight,
      );
    }

    // Sprites: echoes, the exit gate, drones — farthest first.
    const sprites: Array<{
      x: number;
      y: number;
      kind: "echo" | "exit" | "drone" | "stunned";
    }> = [];
    for (const echo of world.echoes) {
      if (!echo.taken) {
        sprites.push({ x: echo.x, y: echo.y, kind: "echo" });
      }
    }
    sprites.push({ x: world.exitX, y: world.exitY, kind: "exit" });
    for (const drone of world.drones) {
      sprites.push({
        x: drone.x,
        y: drone.y,
        kind: drone.stunned > 0 ? "stunned" : "drone",
      });
    }
    const withDepth = sprites
      .map((sprite) => {
        const relX = sprite.x - world.px;
        const relY = sprite.y - world.py;
        const depth =
          relX * Math.cos(world.angle) + relY * Math.sin(world.angle);
        const lateral =
          -relX * Math.sin(world.angle) + relY * Math.cos(world.angle);
        return { ...sprite, depth, lateral };
      })
      .filter((sprite) => sprite.depth > 0.2)
      .sort((a, b) => b.depth - a.depth);
    for (const sprite of withDepth) {
      const screenX =
        width / 2 + (sprite.lateral / (sprite.depth * Math.tan(fovRad / 2))) * (width / 2);
      const column = Math.floor(screenX / columnWidth);
      if (column < 0 || column >= columns || zBuffer[column] < sprite.depth) {
        continue;
      }
      const scale = height / sprite.depth;
      const radius = scale * (sprite.kind === "exit" ? 0.34 : 0.16);
      const centerY = height / 2 + scale * 0.12;
      if (sprite.kind === "echo") {
        context.fillStyle = "rgba(96,165,250,0.22)";
        context.beginPath();
        context.arc(screenX, centerY, radius * 1.8, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#60a5fa";
        context.beginPath();
        context.arc(screenX, centerY, radius, 0, Math.PI * 2);
        context.fill();
      } else if (sprite.kind === "exit") {
        context.strokeStyle = "rgba(255,255,255,0.85)";
        context.lineWidth = Math.max(2, radius * 0.2);
        context.beginPath();
        context.arc(screenX, centerY, radius, 0, Math.PI * 2);
        context.stroke();
        context.strokeStyle = "rgba(96,165,250,0.7)";
        context.beginPath();
        context.arc(screenX, centerY, radius * 0.62, 0, Math.PI * 2);
        context.stroke();
      } else {
        const stunned = sprite.kind === "stunned";
        context.fillStyle = stunned
          ? "rgba(248,113,113,0.35)"
          : "#f87171";
        context.beginPath();
        context.moveTo(screenX, centerY - radius);
        context.lineTo(screenX + radius, centerY);
        context.lineTo(screenX, centerY + radius);
        context.lineTo(screenX - radius, centerY);
        context.closePath();
        context.fill();
      }
    }

    // Pulse flash feedback.
    if (world.pulseFlash > 0) {
      context.strokeStyle = `rgba(96,165,250,${world.pulseFlash * 0.7})`;
      context.lineWidth = 3;
      context.beginPath();
      context.arc(
        width / 2,
        height,
        (1 - world.pulseFlash) * height * 0.7 + 40,
        Math.PI,
        Math.PI * 2,
      );
      context.stroke();
    }

    // Minimap: canvas-drawn content, never a DOM overlay.
    if (minimapRef.current) {
      const cell = Math.max(2, Math.floor(140 / world.span));
      const mapSize = cell * world.span;
      const originX = width - mapSize - 14;
      const originY = height - mapSize - 14;
      context.fillStyle = "rgba(3,4,7,0.78)";
      context.fillRect(originX - 6, originY - 6, mapSize + 12, mapSize + 12);
      for (let y = 0; y < world.span; y += 1) {
        for (let x = 0; x < world.span; x += 1) {
          if (world.tiles[y * world.span + x] === 1) {
            context.fillStyle = "rgba(255,255,255,0.16)";
            context.fillRect(originX + x * cell, originY + y * cell, cell, cell);
          }
        }
      }
      for (const echo of world.echoes) {
        if (!echo.taken) {
          context.fillStyle = "#60a5fa";
          context.fillRect(
            originX + echo.x * cell - 1,
            originY + echo.y * cell - 1,
            3,
            3,
          );
        }
      }
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.fillRect(
        originX + world.exitX * cell - 2,
        originY + world.exitY * cell - 2,
        4,
        4,
      );
      for (const drone of world.drones) {
        context.fillStyle = drone.stunned > 0 ? "rgba(248,113,113,0.4)" : "#f87171";
        context.fillRect(
          originX + drone.x * cell - 1,
          originY + drone.y * cell - 1,
          3,
          3,
        );
      }
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(
        originX + world.px * cell,
        originY + world.py * cell,
        2.5,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    if (world.finished) {
      context.fillStyle = "rgba(3,4,7,0.55)";
      context.fillRect(0, height / 2 - 34, width, 68);
      context.fillStyle = "#ffffff";
      context.font = "600 22px ui-sans-serif, system-ui, sans-serif";
      context.textAlign = "center";
      context.fillText(
        `Run complete — ${Math.round(world.moves)} moves`,
        width / 2,
        height / 2 + 8,
      );
      context.textAlign = "start";
    }
  }

  function tryMove(world: World, distance: number) {
    const dirX = Math.cos(world.angle) * distance;
    const dirY = Math.sin(world.angle) * distance;
    const margin = 0.22;
    const nextX = world.px + dirX;
    const nextY = world.py + dirY;
    if (
      tileAt(world, nextX + Math.sign(dirX) * margin, world.py) === 0 &&
      tileAt(world, nextX, world.py) === 0
    ) {
      world.px = nextX;
    }
    if (
      tileAt(world, world.px, nextY + Math.sign(dirY) * margin) === 0 &&
      tileAt(world, world.px, nextY) === 0
    ) {
      world.py = nextY;
    }
    world.moves += Math.abs(distance) * 1.4;
  }

  const collectAndResolve = useCallback(
    (world: World, announce: (message: string) => void) => {
      for (const echo of world.echoes) {
        if (!echo.taken && Math.hypot(echo.x - world.px, echo.y - world.py) < 0.6) {
          echo.taken = true;
          const found = world.echoes.filter((item) => item.taken).length;
          announce(
            found === ECHO_TARGET
              ? "All echoes recovered — find the white gate."
              : `Echo recovered — ${found} of ${ECHO_TARGET}.`,
          );
        }
      }
      const collected = world.echoes.every((echo) => echo.taken);
      if (
        collected &&
        !world.finished &&
        Math.hypot(world.exitX - world.px, world.exitY - world.py) < 0.7
      ) {
        world.finished = true;
        const moves = Math.round(world.moves);
        setBestMoves((current) =>
          current === null ? moves : Math.min(current, moves),
        );
        announce(`Run complete in ${moves} moves. Start a new maze when ready.`);
      }
      for (const drone of world.drones) {
        if (drone.stunned > 0) {
          continue;
        }
        if (Math.hypot(drone.x - world.px, drone.y - world.py) < 0.55) {
          world.shield -= 1;
          const away = Math.atan2(world.py - drone.y, world.px - drone.x);
          world.px += Math.cos(away) * 0.8;
          world.py += Math.sin(away) * 0.8;
          drone.stunned = STUN_SECONDS * 0.6;
          if (world.shield <= 0) {
            for (const echo of world.echoes) {
              echo.taken = false;
            }
            world.px = 1.5;
            world.py = 1.5;
            world.angle = 0;
            world.shield = MAX_SHIELD;
            world.moves = 0;
            world.elapsed = 0;
            announce("Shield lost — the run restarts from the entrance.");
          } else {
            announce(`Drone contact — shield ${world.shield} of ${MAX_SHIELD}.`);
          }
        }
      }
    },
    [],
  );

  const updateDrones = useCallback((world: World, dt: number) => {
    const random = mulberry32(
      hashSeed(`echo-drift-${mazeNumber}-${Math.floor(world.elapsed * 2)}`),
    );
    for (const drone of world.drones) {
      if (drone.stunned > 0) {
        drone.stunned -= dt;
        continue;
      }
      const sees =
        Math.hypot(drone.x - world.px, drone.y - world.py) < 5 &&
        hasLineOfSight(world, drone.x, drone.y);
      const speed = sees ? 1.7 : 1.05;
      let dirX = (sees ? world.px : drone.targetX) - drone.x;
      let dirY = (sees ? world.py : drone.targetY) - drone.y;
      const span = Math.hypot(dirX, dirY);
      if (span < 0.3 && !sees) {
        // Pick the next open neighbor tile as a waypoint.
        const options: Array<[number, number]> = [];
        for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]] as const) {
          if (tileAt(world, drone.x + dx / 2, drone.y + dy / 2) === 0) {
            options.push([drone.x + dx, drone.y + dy]);
          }
        }
        if (options.length > 0) {
          const [nx, ny] = options[Math.floor(random() * options.length)];
          drone.targetX = nx;
          drone.targetY = ny;
        }
        continue;
      }
      if (span > 0.001) {
        dirX /= span;
        dirY /= span;
        const nextX = drone.x + dirX * speed * dt;
        const nextY = drone.y + dirY * speed * dt;
        if (tileAt(world, nextX, nextY) === 0) {
          drone.x = nextX;
          drone.y = nextY;
        } else if (!sees) {
          drone.targetX = drone.x;
          drone.targetY = drone.y;
        }
      }
    }
  }, [mazeNumber]);

  const stage = useCreativeCanvas({
    minHeight: 540,
    contextSettings: { alpha: false },
    onFrame: (dt, _elapsed, runtime) => {
      const world = getWorld();
      const input = inputRef.current;
      if (!world.finished) {
        world.elapsed += dt;
        if (input.forward) {
          tryMove(world, 3.1 * dt);
        }
        if (input.back) {
          tryMove(world, -2.4 * dt);
        }
        if (input.left) {
          world.angle -= 2.5 * dt;
        }
        if (input.right) {
          world.angle += 2.5 * dt;
        }
        updateDrones(world, dt);
        collectAndResolve(world, setStatus);
      }
      world.pulseFlash = Math.max(0, world.pulseFlash - dt * 3);
      paint(runtime);
      publishTickRef.current += 1;
      if (publishTickRef.current % 12 === 0) {
        publish();
      }
    },
    onRepaint: (runtime) => {
      paint(runtime);
      publish();
    },
  });
  const { reducedMotion, repaint, canvasRef, hostRef } = stage;

  // Rebuild the world when the maze number or size changes.
  useEffect(() => {
    worldRef.current = generateWorld(mazeNumber, size);
    repaint();
  }, [mazeNumber, repaint, size]);

  // Turn-based stepping keeps the game fully playable under reduced motion:
  // each command moves the player one step, then the drones take one beat.
  const stepCommand = useCallback(
    (command: "forward" | "back" | "left" | "right") => {
      const world = getWorld();
      if (world.finished) {
        return;
      }
      if (command === "forward") {
        tryMove(world, 0.55);
      } else if (command === "back") {
        tryMove(world, -0.55);
      } else if (command === "left") {
        world.angle -= Math.PI / 10;
      } else {
        world.angle += Math.PI / 10;
      }
      world.elapsed += 0.5;
      updateDrones(world, 0.5);
      collectAndResolve(world, setStatus);
      repaint();
    },
    [collectAndResolve, getWorld, repaint, updateDrones],
  );

  const firePulse = useCallback(() => {
    const world = getWorld();
    if (world.elapsed - world.pulseAt < PULSE_COOLDOWN) {
      return;
    }
    world.pulseAt = world.elapsed;
    world.pulseFlash = 1;
    let hit = 0;
    for (const drone of world.drones) {
      const dist = Math.hypot(drone.x - world.px, drone.y - world.py);
      if (dist > PULSE_RANGE || drone.stunned > 0) {
        continue;
      }
      const bearing = Math.atan2(drone.y - world.py, drone.x - world.px);
      let offset = bearing - world.angle;
      while (offset > Math.PI) offset -= Math.PI * 2;
      while (offset < -Math.PI) offset += Math.PI * 2;
      if (Math.abs(offset) < 0.42 && hasLineOfSight(world, drone.x, drone.y)) {
        drone.stunned = STUN_SECONDS;
        hit += 1;
      }
    }
    setStatus(
      hit > 0
        ? `Pulse fired — ${hit} drone${hit > 1 ? "s" : ""} stunned.`
        : "Pulse fired — nothing in the beam.",
    );
    if (reducedMotion) {
      repaint();
    }
  }, [getWorld, reducedMotion, repaint]);

  const HANDLED_KEYS = new Set([
    "w", "a", "s", "d", "W", "A", "S", "D",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ",
  ]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!HANDLED_KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    if (event.key === " ") {
      if (!event.repeat) {
        firePulse();
      }
      return;
    }
    const command =
      event.key === "w" || event.key === "W" || event.key === "ArrowUp"
        ? "forward"
        : event.key === "s" || event.key === "S" || event.key === "ArrowDown"
          ? "back"
          : event.key === "a" || event.key === "A" || event.key === "ArrowLeft"
            ? "left"
            : "right";
    if (reducedMotion) {
      if (!event.repeat) {
        stepCommand(command);
      }
      return;
    }
    inputRef.current[command] = true;
  }

  function handleKeyUp(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!HANDLED_KEYS.has(event.key) || event.key === " ") {
      return;
    }
    const command =
      event.key === "w" || event.key === "W" || event.key === "ArrowUp"
        ? "forward"
        : event.key === "s" || event.key === "S" || event.key === "ArrowDown"
          ? "back"
          : event.key === "a" || event.key === "A" || event.key === "ArrowLeft"
            ? "left"
            : "right";
    inputRef.current[command] = false;
  }

  const setHeld = useCallback(
    (command: "forward" | "back" | "left" | "right", value: boolean) => {
      inputRef.current[command] = value;
    },
    [],
  );

  // Under reduced motion a click is one discrete step; under normal motion
  // movement comes from press-and-hold (pointer or WASD), so click is a no-op.
  const pressMove = useCallback(
    (command: "forward" | "back" | "left" | "right") => {
      if (reducedMotion) {
        stepCommand(command);
      }
    },
    [reducedMotion, stepCommand],
  );

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-[1500px] px-4 pb-24 sm:px-6 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050609]">
          <StageHeader
            eyebrow="Echo maze · first-person raycaster"
            stats={[
              { label: "maze", value: String(mazeNumber).padStart(2, "0") },
              { label: "mode", value: reducedMotion ? "turn-based" : `${hud.seconds}s` },
            ]}
          />
          <div className="grid xl:grid-cols-[minmax(0,1fr)_380px]">
            <div>
              <div
                ref={hostRef}
                role="application"
                aria-label="First-person maze view. Move with W A S D or the arrow keys; press Space to fire a stun pulse."
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                className="relative min-h-[540px] overflow-hidden outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent md:min-h-[640px]"
              >
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label="Raycast first-person render of the maze with glowing echo cores, patrol drones, and an exit gate"
                  className="absolute inset-0 h-full w-full touch-pan-y"
                />
              </div>
              <StatStrip
                items={[
                  { label: "Echoes", value: `${hud.echoes}/${ECHO_TARGET}` },
                  {
                    label: "Shield",
                    value: `${hud.shield}/${MAX_SHIELD}`,
                    alert: hud.shield <= 1,
                  },
                  { label: "Moves", value: String(hud.moves) },
                  {
                    label: "Best run",
                    value: bestMoves === null ? "—" : `${bestMoves} moves`,
                  },
                ]}
              />
            </div>
            <aside className="border-t border-white/10 bg-[#08090c] p-6 md:p-8 xl:border-l xl:border-t-0">
              <p className="sr-only" role="status" aria-live="polite">
                {status}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                How to play
              </p>
              <p className="mt-3 text-xs leading-6 text-white/60">
                Click the view to focus it, then move with WASD or the arrow
                keys. Collect all {ECHO_TARGET} blue echo cores, avoid the red
                patrol drones (Space fires a stun pulse), and escape through
                the white gate.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <span />
                <MoveButton
                  label="Forward"
                  onClick={() => pressMove("forward")}
                  onPointerDown={() => setHeld("forward", true)}
                  onPointerUp={() => setHeld("forward", false)}
                  onPointerLeave={() => setHeld("forward", false)}
                >
                  ↑
                </MoveButton>
                <span />
                <MoveButton
                  label="Turn left"
                  onClick={() => pressMove("left")}
                  onPointerDown={() => setHeld("left", true)}
                  onPointerUp={() => setHeld("left", false)}
                  onPointerLeave={() => setHeld("left", false)}
                >
                  ←
                </MoveButton>
                <MoveButton
                  label="Back"
                  onClick={() => pressMove("back")}
                  onPointerDown={() => setHeld("back", true)}
                  onPointerUp={() => setHeld("back", false)}
                  onPointerLeave={() => setHeld("back", false)}
                >
                  ↓
                </MoveButton>
                <MoveButton
                  label="Turn right"
                  onClick={() => pressMove("right")}
                  onPointerDown={() => setHeld("right", true)}
                  onPointerUp={() => setHeld("right", false)}
                  onPointerLeave={() => setHeld("right", false)}
                >
                  →
                </MoveButton>
              </div>
              <StageButton variant="alert" className="mt-3 w-full" onClick={firePulse}>
                Fire stun pulse
              </StageButton>
              <ControlSelect
                label="Maze size"
                value={size}
                options={["Compact", "Standard", "Vast"]}
                onChange={(value) => {
                  setSize(value);
                  setStatus(`${value} maze generated.`);
                }}
              />
              <ControlRange
                label="Field of view"
                value={fov}
                min={60}
                max={100}
                display={`${fov}°`}
                onChange={(value) => {
                  setFov(value);
                  if (reducedMotion) {
                    repaint();
                  }
                }}
              />
              <div className="mt-6 grid grid-cols-2 gap-2">
                <StageButton
                  variant="ghost"
                  pressed={minimap}
                  onClick={() => {
                    setMinimap((current) => {
                      const next = !current;
                      setStatus(next ? "Minimap shown." : "Minimap hidden.");
                      return next;
                    });
                    repaint();
                  }}
                >
                  Minimap
                </StageButton>
                <StageButton
                  variant="primary"
                  onClick={() => {
                    setMazeNumber((current) => current + 1);
                    setStatus(`Maze ${mazeNumber + 1} generated.`);
                  }}
                >
                  New maze
                </StageButton>
              </div>
              <StageButton
                variant="solid"
                className="mt-2 w-full"
                onClick={() => {
                  exportCanvasPng(canvasRef.current, `echo-maze-${mazeNumber}`);
                  setStatus("View exported as PNG.");
                }}
              >
                Export PNG
              </StageButton>
              <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-white/55">
                Every maze is generated from a seed, so the same maze number
                and size always produce the same layout, echo positions, and
                patrol routes. The 3D view is classic grid raycasting — no 3D
                engine, just one ray of math per screen column.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}

function MoveButton({
  label,
  children,
  ...handlers
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      {...handlers}
      className="min-h-12 touch-none select-none rounded-xl border border-white/15 text-base font-semibold text-white/75 transition-colors hover:bg-white/[0.06] active:bg-accent-soft"
    >
      {children}
    </button>
  );
}
