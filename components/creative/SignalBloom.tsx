"use client";

import { useEffect, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import {
  ControlRange,
  StageButton,
  StageHeader,
  StatStrip,
} from "@/components/creative/stage/controls";
import type { CreativeProject } from "@/lib/creativeProjects";
import { mulberry32 } from "@/lib/seededRandom";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

type Palette = "Dual signal" | "Blue hour" | "Red shift";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

export default function SignalBloom({
  project,
}: {
  project: CreativeProject;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [density, setDensity] = useState(72);
  const [velocity, setVelocity] = useState(12);
  const [palette, setPalette] = useState<Palette>("Dual signal");
  const [seed, setSeed] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Live parameters: the render loop reads these every frame, so velocity and
  // palette changes retune the running field instead of rebuilding it.
  const paramsRef = useRef({ velocity, palette });
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });
  // Assigned by the canvas effect only under reduced motion, so parameter and
  // field changes can request a single static repaint instead of a loop.
  const repaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const activeCanvas = canvasElement as HTMLCanvasElement;

    const hostElement = activeCanvas.parentElement as HTMLElement | null;
    if (!hostElement) {
      return;
    }

    const activeHost = hostElement as HTMLElement;
    const drawingContext = activeCanvas.getContext(
      "2d",
    ) as CanvasRenderingContext2D | null;
    if (!drawingContext) {
      return;
    }
    const activeContext = drawingContext as CanvasRenderingContext2D;

    const pointer = { x: 0, y: 0, active: false };
    let animationFrame = 0;

    function particleColor(
      activePalette: Palette,
      index: number,
      alpha: number,
    ) {
      if (activePalette === "Blue hour") {
        return `rgba(96,165,250,${alpha})`;
      }
      if (activePalette === "Red shift") {
        return `rgba(248,113,113,${alpha})`;
      }
      return index % 2 === 0
        ? `rgba(96,165,250,${alpha})`
        : `rgba(248,113,113,${alpha})`;
    }

    function renderFrame(clearFully: boolean) {
      const { width, height } = sizeRef.current;
      const { velocity: liveVelocity, palette: livePalette } =
        paramsRef.current;
      const particles = particlesRef.current;

      activeContext.fillStyle = clearFully ? "#050507" : "rgba(5,5,7,0.13)";
      activeContext.fillRect(0, 0, width, height);
      const speed = liveVelocity / 10;

      particles.forEach((particle, index) => {
        if (pointer.active) {
          const dx = pointer.x - particle.x;
          const dy = pointer.y - particle.y;
          const distance = Math.max(24, Math.hypot(dx, dy));
          if (distance < 180) {
            const force = (180 - distance) / 180;
            particle.vx += (dx / distance) * force * 0.018;
            particle.vy += (dy / distance) * force * 0.018;
          }
        }

        particle.vx *= 0.992;
        particle.vy *= 0.992;
        particle.x += (particle.vx + Math.cos(particle.phase) * 0.09) * speed;
        particle.y += (particle.vy + Math.sin(particle.phase) * 0.09) * speed;
        particle.phase += 0.009 * speed;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        activeContext.beginPath();
        activeContext.fillStyle = particleColor(livePalette, index, 0.8);
        activeContext.shadowColor = particleColor(livePalette, index, 0.95);
        activeContext.shadowBlur = 18;
        activeContext.arc(
          particle.x,
          particle.y,
          particle.radius + Math.sin(particle.phase) * 0.45,
          0,
          Math.PI * 2,
        );
        activeContext.fill();
        activeContext.shadowBlur = 0;

        for (
          let neighborIndex = index + 1;
          neighborIndex < particles.length;
          neighborIndex += 1
        ) {
          const neighbor = particles[neighborIndex];
          const distance = Math.hypot(
            particle.x - neighbor.x,
            particle.y - neighbor.y,
          );
          if (distance < 86) {
            activeContext.beginPath();
            activeContext.strokeStyle = particleColor(
              livePalette,
              index + neighborIndex,
              (1 - distance / 86) * 0.19,
            );
            activeContext.lineWidth = 0.7;
            activeContext.moveTo(particle.x, particle.y);
            activeContext.lineTo(neighbor.x, neighbor.y);
            activeContext.stroke();
          }
        }
      });
    }

    function resize() {
      const bounds = activeHost.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(320, bounds.width);
      const nextHeight = Math.max(520, bounds.height);
      const { width: previousWidth, height: previousHeight } = sizeRef.current;
      activeCanvas.width = Math.round(nextWidth * ratio);
      activeCanvas.height = Math.round(nextHeight * ratio);
      activeCanvas.style.width = `${nextWidth}px`;
      activeCanvas.style.height = `${nextHeight}px`;
      activeContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Remap the existing field to the new bounds instead of regenerating,
      // so a resize never re-randomizes the composition.
      if (previousWidth > 0 && previousHeight > 0) {
        const scaleX = nextWidth / previousWidth;
        const scaleY = nextHeight / previousHeight;
        if (scaleX !== 1 || scaleY !== 1) {
          particlesRef.current.forEach((particle) => {
            particle.x *= scaleX;
            particle.y *= scaleY;
          });
        }
      }
      sizeRef.current = { width: nextWidth, height: nextHeight };
      renderFrame(true);
    }

    function tick() {
      renderFrame(false);
      animationFrame = window.requestAnimationFrame(tick);
    }

    function updatePointer(event: PointerEvent) {
      const bounds = activeCanvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    }

    function releasePointer() {
      pointer.active = false;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(activeHost);
    activeCanvas.addEventListener("pointermove", updatePointer);
    activeCanvas.addEventListener("pointerdown", updatePointer);
    activeCanvas.addEventListener("pointerleave", releasePointer);
    activeCanvas.addEventListener("pointerup", releasePointer);

    resize();
    if (prefersReducedMotion) {
      repaintRef.current = () => renderFrame(true);
    } else {
      tick();
    }

    return () => {
      observer.disconnect();
      activeCanvas.removeEventListener("pointermove", updatePointer);
      activeCanvas.removeEventListener("pointerdown", updatePointer);
      activeCanvas.removeEventListener("pointerleave", releasePointer);
      activeCanvas.removeEventListener("pointerup", releasePointer);
      window.cancelAnimationFrame(animationFrame);
      repaintRef.current = null;
    };
  }, [prefersReducedMotion]);

  // Push parameter changes to the running loop; under reduced motion the loop
  // is not running, so request one static repaint instead.
  useEffect(() => {
    paramsRef.current.velocity = velocity;
    paramsRef.current.palette = palette;
    repaintRef.current?.();
  }, [palette, velocity]);

  // The particle field is rebuilt only when the seed or density changes, and
  // every random draw comes from the seeded PRNG so the same seed always
  // reproduces the same composition.
  useEffect(() => {
    const random = mulberry32(seed);
    const width = Math.max(sizeRef.current.width, 320);
    const height = Math.max(sizeRef.current.height, 520);
    particlesRef.current = Array.from({ length: density }, (_, index) => ({
      x: random() * width,
      y: random() * height,
      vx: (random() - 0.5) * 0.34,
      vy: (random() - 0.5) * 0.34,
      radius: 0.8 + random() * 2.1,
      phase: index * 0.47 + random() * 3,
    }));
    repaintRef.current?.();
  }, [density, seed]);

  function exportFrame() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const anchor = document.createElement("a");
    anchor.download = "signal-bloom.png";
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  }

  return (
    <CreativeProjectShell project={project}>
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050609]">
          <StageHeader
            eyebrow="Signal bloom · pointer-reactive field"
            stats={[{ label: "signals", value: String(density) }]}
          />
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div>
              <div className="relative min-h-[680px] overflow-hidden">
                <canvas
                  ref={canvasRef}
                  role="img"
                  className="absolute inset-0 h-full w-full touch-pan-y"
                  aria-label="Interactive generative field of red and blue light particles"
                />
              </div>
              <StatStrip
                items={[
                  { label: "Signals", value: String(density) },
                  { label: "Velocity", value: `${(velocity / 10).toFixed(1)}×` },
                  { label: "Spectrum", value: palette },
                ]}
              />
            </div>

            <aside className="border-t border-white/10 p-7 md:p-9 lg:border-l lg:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                Field controls
              </p>
              <p className="mt-3 text-xs leading-6 text-white/55">
                Drag or move your pointer through the field — nearby signals
                bend toward you, connect, and leave a fading trace.
              </p>

              <ControlRange
                label="Signal density"
                value={density}
                min={30}
                max={110}
                onChange={setDensity}
              />

              <ControlRange
                label="Field velocity"
                value={velocity}
                min={4}
                max={24}
                display={`${(velocity / 10).toFixed(1)}×`}
                tone="alert"
                onChange={setVelocity}
              />

              <div className="mt-8">
                <p className="text-xs text-white/55">Light spectrum</p>
                <div className="mt-3 space-y-2">
                  {(["Dual signal", "Blue hour", "Red shift"] as Palette[]).map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={palette === option}
                        onClick={() => setPalette(option)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                          palette === option
                            ? option === "Red shift"
                              ? "border-alert/55 bg-alert-soft"
                              : "border-accent/55 bg-accent-soft"
                            : "border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        {option}
                        <span
                          className={`h-2 w-14 rounded-full ${
                            option === "Dual signal"
                              ? "bg-gradient-to-r from-accent to-alert"
                              : option === "Blue hour"
                                ? "bg-accent"
                                : "bg-alert"
                          }`}
                        />
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">
                  Live composition
                </p>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  Every point has its own velocity. Lines appear only when two
                  signals come close enough to influence each other.
                </p>
              </div>

              <StageButton
                variant="primary"
                className="mt-8 w-full"
                onClick={() => setSeed((current) => current + 1)}
              >
                Create a new field
              </StageButton>
              <StageButton
                variant="ghost"
                className="mt-3 w-full"
                onClick={exportFrame}
              >
                Export this frame
              </StageButton>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}
