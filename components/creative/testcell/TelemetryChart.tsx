"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type RefObject,
} from "react";
import { MPH_PER_MS, type Milestone, type RunSample } from "./physics";

export interface TelemetryChartHandle {
  draw: () => void;
}

const MAX_MPH = 300;
const MAX_RPM = 9000;
const MIN_DOMAIN_S = 20;

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Canvas telemetry trace. Owns no loop and no React state — the parent's
 * rAF loop calls `draw()` through the handle, and the samples/milestones
 * arrive through refs so a frame never triggers a render.
 */
const TelemetryChart = forwardRef<
  TelemetryChartHandle,
  {
    samplesRef: RefObject<RunSample[]>;
    ghostRef: RefObject<RunSample[] | null>;
    milestonesRef: RefObject<Milestone[]>;
  }
>(function TelemetryChart({ samplesRef, ghostRef, milestonesRef }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  function draw() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    const { width, height } = sizeRef.current;
    if (width === 0 || height === 0) {
      return;
    }

    const accent = cssVar("--accent") || "#60a5fa";
    const alert = cssVar("--alert") || "#f87171";
    const samples = samplesRef.current ?? [];
    const ghost = ghostRef.current;
    const milestones = milestonesRef.current ?? [];

    const pad = { left: 44, right: 44, top: 14, bottom: 24 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const lastT = samples.length > 0 ? samples[samples.length - 1].t : 0;
    const ghostT = ghost && ghost.length > 0 ? ghost[ghost.length - 1].t : 0;
    const domain = Math.max(lastT, ghostT, MIN_DOMAIN_S);

    const xAt = (t: number) => pad.left + (t / domain) * plotW;
    const ySpeed = (v: number) =>
      pad.top + plotH - (Math.min(v * MPH_PER_MS, MAX_MPH) / MAX_MPH) * plotH;
    const yRpm = (rpm: number) =>
      pad.top + plotH - (Math.min(rpm, MAX_RPM) / MAX_RPM) * plotH;

    context.clearRect(0, 0, width, height);

    // Grid + axis labels.
    context.strokeStyle = "rgba(255,255,255,0.08)";
    context.fillStyle = "rgba(255,255,255,0.35)";
    context.lineWidth = 1;
    context.font =
      "9px var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";
    for (let mph = 0; mph <= MAX_MPH; mph += 60) {
      const y = pad.top + plotH - (mph / MAX_MPH) * plotH;
      context.beginPath();
      context.moveTo(pad.left, y);
      context.lineTo(pad.left + plotW, y);
      context.stroke();
      context.textAlign = "right";
      context.fillText(`${mph}`, pad.left - 6, y + 3);
    }
    // Right-hand rpm axis at its own clean 2k steps — instrument labels,
    // never fractional k.
    context.textAlign = "left";
    for (let rpm = 0; rpm <= MAX_RPM; rpm += 2000) {
      const y = yRpm(rpm);
      context.fillText(
        rpm === 0 ? "0" : `${rpm / 1000}k`,
        pad.left + plotW + 6,
        y + 3,
      );
    }
    const timeStep = domain > 40 ? 10 : 5;
    for (let t = 0; t <= domain; t += timeStep) {
      const x = xAt(t);
      context.beginPath();
      context.moveTo(x, pad.top);
      context.lineTo(x, pad.top + plotH);
      context.stroke();
      context.textAlign = "center";
      context.fillText(`${t}s`, x, height - 8);
    }

    const trace = (
      points: RunSample[],
      value: (sample: RunSample) => number,
      style: string,
      lineWidth: number,
    ) => {
      if (points.length < 2) {
        return;
      }
      // Stride-downsample when there are far more samples than pixels.
      const stride = Math.max(1, Math.floor(points.length / (plotW * 2)));
      context.beginPath();
      context.strokeStyle = style;
      context.lineWidth = lineWidth;
      context.lineJoin = "round";
      for (let index = 0; index < points.length; index += stride) {
        const sample = points[index];
        const x = xAt(sample.t);
        const y = value(sample);
        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      const last = points[points.length - 1];
      context.lineTo(xAt(last.t), value(last));
      context.stroke();
    };

    if (ghost && ghost.length > 1) {
      trace(ghost, (sample) => ySpeed(sample.v), "rgba(255,255,255,0.28)", 1);
    }
    trace(samples, (sample) => yRpm(sample.rpm), alert, 1.25);
    trace(samples, (sample) => ySpeed(sample.v), accent, 2);

    // Milestone notches on the time axis.
    context.fillStyle = "rgba(255,255,255,0.7)";
    milestones.forEach((milestone) => {
      const x = xAt(milestone.t);
      context.fillRect(x - 0.5, pad.top + plotH - 8, 1, 8);
      context.textAlign = "center";
      context.fillText(milestone.label, x, pad.top + plotH - 12);
    });
  }

  const drawRef = useRef(draw);
  drawRef.current = draw;

  useImperativeHandle(ref, () => ({ draw: () => drawRef.current() }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) {
      return;
    }
    function fitToHost() {
      if (!canvas || !host) {
        return;
      }
      const bounds = host.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { width: bounds.width, height: bounds.height };
      canvas.width = Math.round(bounds.width * ratio);
      canvas.height = Math.round(bounds.height * ratio);
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
      const context = canvas.getContext("2d");
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawRef.current();
    }
    // Size immediately — ResizeObserver callbacks only fire during rendering
    // steps, which never happen while the document is hidden.
    fitToHost();
    const observer = new ResizeObserver(fitToHost);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Telemetry chart plotting vehicle speed and engine rpm against run time"
    />
  );
});

export default TelemetryChart;
