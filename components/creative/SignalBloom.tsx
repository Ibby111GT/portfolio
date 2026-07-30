"use client";

import { useEffect, useRef, useState } from "react";
import CreativeProjectShell from "@/components/creative/CreativeProjectShell";
import type { CreativeProject } from "@/lib/creativeProjects";

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

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let particles: Particle[] = [];

    function createParticle(index: number): Particle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        radius: 0.8 + Math.random() * 2.1,
        phase: index * 0.47 + Math.random() * 3,
      };
    }

    function resize() {
      const bounds = activeHost.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, bounds.width);
      height = Math.max(520, bounds.height);
      activeCanvas.width = Math.round(width * ratio);
      activeCanvas.height = Math.round(height * ratio);
      activeCanvas.style.width = `${width}px`;
      activeCanvas.style.height = `${height}px`;
      activeContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: density }, (_, index) =>
        createParticle(index),
      );
      activeContext.fillStyle = "#050507";
      activeContext.fillRect(0, 0, width, height);
    }

    function particleColor(index: number, alpha: number) {
      if (palette === "Blue hour") {
        return `rgba(96,165,250,${alpha})`;
      }
      if (palette === "Red shift") {
        return `rgba(248,113,113,${alpha})`;
      }
      return index % 2 === 0
        ? `rgba(96,165,250,${alpha})`
        : `rgba(248,113,113,${alpha})`;
    }

    function draw() {
      activeContext.fillStyle = "rgba(5,5,7,0.13)";
      activeContext.fillRect(0, 0, width, height);
      const speed = velocity / 10;

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
        activeContext.fillStyle = particleColor(index, 0.8);
        activeContext.shadowColor = particleColor(index, 0.95);
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

      if (!reducedMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
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
    draw();

    return () => {
      observer.disconnect();
      activeCanvas.removeEventListener("pointermove", updatePointer);
      activeCanvas.removeEventListener("pointerdown", updatePointer);
      activeCanvas.removeEventListener("pointerleave", releasePointer);
      activeCanvas.removeEventListener("pointerup", releasePointer);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [density, palette, seed, velocity]);

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
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#080808]">
          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="relative min-h-[760px] overflow-hidden">
              <canvas
                ref={canvasRef}
                role="img"
                className="absolute inset-0 h-full w-full touch-none"
                aria-label="Interactive generative field of red and blue light particles"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent p-7 pb-28 md:p-12 md:pb-32">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
                  Generative canvas · pointer reactive
                </p>
                <h1 className="mt-4 text-5xl font-semibold leading-[0.92] tracking-[-0.045em] md:text-8xl">
                  Signal
                  <br />
                  Bloom
                </h1>
                <p className="mt-6 max-w-lg text-sm leading-7 text-white/55 md:text-base">
                  Move through the field. Nearby signals bend toward you,
                  connect, and leave a fading trace. No two frames are the same.
                </p>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/80 to-transparent p-7 pt-28 md:p-10 md:pt-32">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Drag or move your pointer through the field
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  {density} signals
                </p>
              </div>
            </div>

            <aside className="border-t border-white/10 p-7 md:p-9 lg:border-l lg:border-t-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                Field controls
              </p>

              <label className="mt-8 block">
                <span className="flex justify-between text-xs text-white/50">
                  <span>Signal density</span>
                  <span className="font-mono">{density}</span>
                </span>
                <input
                  type="range"
                  min="30"
                  max="110"
                  value={density}
                  onChange={(event) => setDensity(Number(event.target.value))}
                  className="mt-4 w-full accent-blue-500"
                />
              </label>

              <label className="mt-8 block">
                <span className="flex justify-between text-xs text-white/50">
                  <span>Field velocity</span>
                  <span className="font-mono">
                    {(velocity / 10).toFixed(1)}×
                  </span>
                </span>
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={velocity}
                  onChange={(event) => setVelocity(Number(event.target.value))}
                  className="mt-4 w-full accent-red-500"
                />
              </label>

              <div className="mt-8">
                <p className="text-xs text-white/50">Light spectrum</p>
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
                            : "border-white/10 text-white/50 hover:text-white"
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
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                  Live composition
                </p>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Every point has its own velocity. Lines appear only when two
                  signals come close enough to influence each other.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSeed((current) => current + 1)}
                className="mt-8 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Create a new field
              </button>
              <button
                type="button"
                onClick={exportFrame}
                className="mt-3 w-full rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 transition-colors hover:text-white"
              >
                Export this frame
              </button>
            </aside>
          </div>
        </div>
      </section>
    </CreativeProjectShell>
  );
}
