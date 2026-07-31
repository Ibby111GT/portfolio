"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import {
  ControlRange,
  StageButton,
  StageHeader,
  StatStrip,
} from "@/components/creative/stage/controls";
import { mulberry32 } from "@/lib/seededRandom";
import type { CreativeProject } from "@/lib/creativeProjects";

/**
 * Verdant — a generative reforestation study. Click the ground to plant a
 * seed; each seed grows a procedural tree whose branching depth depends on
 * the rainfall and sunlight you set. A running estimate translates the living
 * canopy into a plain-English carbon figure. Calm, replayable, world-positive.
 *
 * Deterministic per seed. No network. The carbon numbers are illustrative,
 * not a certified model — the point is the feeling of tending something grow.
 */

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  width: number;
  grow: number; // 0..1 current growth of this segment
  delay: number;
}

interface Tree {
  x: number;
  ground: number;
  branches: Branch[];
  age: number;
  maxAge: number;
  hue: number;
  canopy: number;
}

const MAX_TREES = 60;

export default function Verdant({ project }: { project: CreativeProject }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treesRef = useRef<Tree[]>([]);
  const seedCounterRef = useRef(1);
  const [rainfall, setRainfall] = useState(58);
  const [sunlight, setSunlight] = useState(66);
  const [planted, setPlanted] = useState(0);
  const [canopy, setCanopy] = useState(0);
  const paramRef = useRef({ rainfall, sunlight });
  // The mount effect stores its render closure here so handlers outside the
  // effect (reset, the climate sliders) can repaint under reduced motion.
  const renderRef = useRef<(() => void) | null>(null);
  const loopRunningRef = useRef(false);
  const repaintFrameRef = useRef(0);

  // Schedule exactly one repaint when the continuous rAF loop is not running
  // (reduced motion). When the loop is live it repaints every frame anyway.
  function scheduleRepaint() {
    if (loopRunningRef.current || repaintFrameRef.current !== 0) {
      return;
    }
    repaintFrameRef.current = window.requestAnimationFrame(() => {
      repaintFrameRef.current = 0;
      renderRef.current?.();
    });
  }

  const carbon = useMemo(() => {
    // Illustrative: ~21 kg CO2/year per mature tree, scaled by canopy fill.
    const perYear = canopy * 21;
    return {
      perYear: Math.round(perYear),
      lifetime: Math.round(perYear * 40),
      trees: planted,
    };
  }, [canopy, planted]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) {
      return;
    }
    const hostEl = canvasEl.parentElement;
    if (!hostEl) {
      return;
    }
    const ctxEl = canvasEl.getContext("2d");
    if (!ctxEl) {
      return;
    }
    // Non-null aliases: TypeScript drops control-flow narrowing across the
    // nested render/resize closures, so we re-assert the narrowed types here.
    const canvas: HTMLCanvasElement = canvasEl;
    const host: HTMLElement = hostEl;
    const ctx: CanvasRenderingContext2D = ctxEl;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let horizon = 0;
    let animation = 0;

    function resize() {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, bounds.width);
      height = Math.max(520, bounds.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      horizon = height * 0.72;
    }

    function buildTree(x: number, ground: number, id: number): Tree {
      const rand = mulberry32(id * 2654435761);
      const { rainfall: rain, sunlight: sun } = paramRef.current;
      const vigor = 0.4 + (rain / 100) * 0.6;
      const reach = 0.5 + (sun / 100) * 0.7;
      const maxDepth = Math.round(4 + (rain / 100) * 3 + (sun / 100) * 2);
      const branches: Branch[] = [];
      const trunkLen = (46 + rand() * 26) * (0.7 + reach * 0.4);

      function grow(
        x1: number,
        y1: number,
        angle: number,
        length: number,
        depth: number,
        delay: number,
      ) {
        const x2 = x1 + Math.cos(angle) * length;
        const y2 = y1 + Math.sin(angle) * length;
        branches.push({
          x1,
          y1,
          x2,
          y2,
          depth,
          width: Math.max(0.8, (maxDepth - depth + 1) * 0.9),
          grow: 0,
          delay,
        });
        if (depth >= maxDepth) {
          return;
        }
        const forks = rand() > 0.35 ? 2 : 3;
        for (let index = 0; index < forks; index += 1) {
          const spread = (rand() - 0.5) * (0.9 + (1 - reach) * 0.5);
          const nextAngle = angle + spread - 0.05;
          grow(
            x2,
            y2,
            nextAngle,
            length * (0.72 + rand() * 0.1) * vigor,
            depth + 1,
            delay + 0.6 + depth * 0.35,
          );
        }
      }

      grow(x, ground, -Math.PI / 2, trunkLen, 0, 0);
      return {
        x,
        ground,
        branches,
        age: 0,
        maxAge: branches.reduce((max, b) => Math.max(max, b.delay + 1), 1),
        hue: 96 + rand() * 40,
        canopy: (maxDepth / 9) * (0.6 + reach * 0.4),
      };
    }

    function plant(clientX: number, clientY: number) {
      const bounds = canvas.getBoundingClientRect();
      const x = clientX - bounds.left;
      const y = clientY - bounds.top;
      if (y < horizon - 40 || treesRef.current.length >= MAX_TREES) {
        return;
      }
      const ground = Math.min(Math.max(y, horizon), height - 12);
      const id = seedCounterRef.current;
      seedCounterRef.current += 1;
      treesRef.current.push(buildTree(x, ground, id));
      setPlanted(treesRef.current.length);
    }

    function paintSky() {
      const { sunlight: sun, rainfall: rain } = paramRef.current;
      const top = ctx.createLinearGradient(0, 0, 0, horizon);
      const warmth = 0.3 + (sun / 100) * 0.5;
      top.addColorStop(0, `rgba(${18 + sun * 0.3}, ${26 + sun * 0.5}, ${44 + rain * 0.2}, 1)`);
      top.addColorStop(1, `rgba(${10 + warmth * 20}, ${18 + warmth * 26}, ${28}, 1)`);
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, width, horizon);
      // sun/moon
      const sx = width * 0.78;
      const sy = horizon * (0.7 - (sun / 100) * 0.35);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
      glow.addColorStop(0, `rgba(255, ${210 + sun * 0.3}, 150, ${0.28 + (sun / 100) * 0.3})`);
      glow.addColorStop(1, "rgba(255,210,150,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 90, sy - 90, 180, 180);
    }

    function paintGround() {
      const { rainfall: rain } = paramRef.current;
      const soil = ctx.createLinearGradient(0, horizon, 0, height);
      soil.addColorStop(0, `rgba(${26 + rain * 0.1}, ${44 + rain * 0.3}, ${28}, 1)`);
      soil.addColorStop(1, "rgba(10,18,12,1)");
      ctx.fillStyle = soil;
      ctx.fillRect(0, horizon, width, height - horizon);
      ctx.strokeStyle = "rgba(96,165,250,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(width, horizon);
      ctx.stroke();
    }

    function drawTree(tree: Tree) {
      tree.branches.forEach((branch) => {
        const local = Math.max(0, Math.min(1, tree.age - branch.delay));
        if (local <= 0) {
          return;
        }
        branch.grow = local;
        const x2 = branch.x1 + (branch.x2 - branch.x1) * local;
        const y2 = branch.y1 + (branch.y2 - branch.y1) * local;
        ctx.beginPath();
        ctx.lineCap = "round";
        ctx.lineWidth = branch.width;
        if (branch.depth < 2) {
          ctx.strokeStyle = "rgba(74,54,38,0.95)";
        } else {
          const leafAlpha = 0.35 + (branch.depth / 9) * 0.5;
          ctx.strokeStyle = `hsla(${tree.hue}, 55%, ${42 + branch.depth * 3}%, ${leafAlpha})`;
        }
        ctx.moveTo(branch.x1, branch.y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        // leaf tuft at the tips
        if (branch.depth >= 4 && local > 0.85) {
          ctx.beginPath();
          ctx.fillStyle = `hsla(${tree.hue}, 60%, 52%, 0.5)`;
          ctx.arc(x2, y2, branch.width * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    function render() {
      paintSky();
      paintGround();
      let totalCanopy = 0;
      treesRef.current.forEach((tree) => {
        if (tree.age < tree.maxAge) {
          tree.age += 0.05;
        }
        drawTree(tree);
        totalCanopy += tree.canopy * Math.min(1, tree.age / tree.maxAge);
      });
      // Normalize canopy to a 0..~1.2 fill figure for the carbon readout.
      const fill = totalCanopy;
      setCanopy((current) =>
        Math.abs(current - fill) > 0.02 ? Number(fill.toFixed(2)) : current,
      );
      if (!reduced) {
        animation = window.requestAnimationFrame(render);
      }
    }

    function onPointerDown(event: PointerEvent) {
      plant(event.clientX, event.clientY);
      if (reduced) {
        // grow instantly to full for reduced-motion users
        treesRef.current.forEach((tree) => {
          tree.age = tree.maxAge;
        });
        render();
      }
    }

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) {
        render();
      }
    });
    observer.observe(host);
    canvas.addEventListener("pointerdown", onPointerDown);

    renderRef.current = render;
    loopRunningRef.current = !reduced;

    resize();
    render();

    return () => {
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.cancelAnimationFrame(animation);
      window.cancelAnimationFrame(repaintFrameRef.current);
      repaintFrameRef.current = 0;
      renderRef.current = null;
      loopRunningRef.current = false;
    };
  }, []);

  function reset() {
    treesRef.current = [];
    seedCounterRef.current = 1;
    setPlanted(0);
    setCanopy(0);
    scheduleRepaint();
  }

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050609]">
          <StageHeader
            eyebrow="Verdant · generative reforestation"
            stats={[{ label: "trees", value: String(planted) }]}
          />
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div>
              <div className="relative min-h-[760px] cursor-crosshair overflow-hidden">
                <canvas
                  ref={canvasRef}
                  role="img"
                  className="absolute inset-0 h-full w-full touch-pan-y"
                  aria-label="A landscape where clicking the ground plants procedurally grown trees"
                />
              </div>
              <StatStrip
                items={[
                  { label: "Trees planted", value: String(planted) },
                  {
                    label: "Drawdown / year",
                    value: `${carbon.perYear.toLocaleString()} kg CO₂`,
                  },
                  {
                    label: "Lifetime CO₂",
                    value: `${(carbon.lifetime / 1000).toFixed(1)}t`,
                  },
                ]}
              />
            </div>

            <aside className="border-t border-white/10 p-7 md:p-9 lg:border-l lg:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                Climate
              </p>
              <p className="mt-3 text-xs leading-6 text-white/55">
                Click the ground to plant a seed. Rainfall and sunlight shape
                how each tree branches — then watch the canopy, and the carbon
                it draws down, add up.
              </p>

              <ControlRange
                label="Rainfall"
                value={rainfall}
                min={10}
                max={100}
                display={`${rainfall}%`}
                onChange={(value) => {
                  setRainfall(value);
                  paramRef.current = { ...paramRef.current, rainfall: value };
                  scheduleRepaint();
                }}
              />

              <ControlRange
                label="Sunlight"
                value={sunlight}
                min={10}
                max={100}
                display={`${sunlight}%`}
                onChange={(value) => {
                  setSunlight(value);
                  paramRef.current = { ...paramRef.current, sunlight: value };
                  scheduleRepaint();
                }}
              />

              <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">
                  What you are seeing
                </p>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Each tree is grown branch by branch from a seeded rule set —
                  wetter, sunnier settings produce deeper, fuller canopies. The
                  carbon figure is illustrative (~21 kg CO₂ per mature tree per
                  year), scaled by how full the canopy has grown.
                </p>
              </div>

              <StageButton
                variant="ghost"
                className="mt-8 w-full"
                onClick={reset}
              >
                Clear the land
              </StageButton>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}
