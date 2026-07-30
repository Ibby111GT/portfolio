"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { useRafLoop } from "@/lib/useRafLoop";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";

export interface StageSize {
  width: number;
  height: number;
}

export interface CreativeCanvasCallbacks {
  /** Current drawing resources passed to every callback. */
  onFrame: (
    dt: number,
    elapsed: number,
    runtime: CreativeCanvasRuntime,
  ) => void;
  /** Advance and paint one animated frame. Called only while the loop runs. */
  /**
   * Remap long-lived world state to the new bounds. Called after the canvas
   * has been resized but before the repaint, so a resize rescales the piece
   * instead of resetting it.
   */
  onResize?: (
    size: StageSize,
    scale: { x: number; y: number },
    runtime: CreativeCanvasRuntime,
  ) => void;
  /**
   * Paint one complete static frame from current state. Called after every
   * resize, from `repaint()`, and it is the only painter under reduced
   * motion — every control handler must end with `repaint()` so no
   * interaction is ever visually inert.
   */
  onRepaint: (runtime: CreativeCanvasRuntime) => void;
}

export interface CreativeCanvasRuntime {
  context: CanvasRenderingContext2D | null;
  size: StageSize;
}

export interface CreativeCanvasOptions extends CreativeCanvasCallbacks {
  /** Lower bounds for the stage; defaults match the existing demos. */
  minWidth?: number;
  minHeight?: number;
  /** Passed to getContext("2d") once at mount (e.g. { alpha: false }). */
  contextSettings?: CanvasRenderingContext2DSettings;
  /** Start the loop from the mount effect when motion is allowed. Default true. */
  autoStart?: boolean;
}

export interface CreativeCanvasStage {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hostRef: RefObject<HTMLDivElement | null>;
  contextRef: RefObject<CanvasRenderingContext2D | null>;
  sizeRef: RefObject<StageSize>;
  running: boolean;
  reducedMotion: boolean;
  start: () => void;
  stop: () => void;
  /** Request one static frame via onRepaint. Safe to call at any time. */
  repaint: () => void;
}

/**
 * Shared canvas stage for the creative experiences: DPR-aware sizing (capped
 * at 2), a ResizeObserver that preserves world state through resizes, the
 * StrictMode-safe rAF loop (which pauses on hidden tabs), and a real
 * reduced-motion contract — the loop never starts, and `repaint()` gives
 * every control an immediate static paint instead of a dead end.
 */
export function useCreativeCanvas(
  options: CreativeCanvasOptions,
): CreativeCanvasStage {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef<StageSize>({ width: 0, height: 0 });
  const reducedMotion = usePrefersReducedMotion();

  // Latest-callback pattern: frame/resize/repaint always see the newest
  // closures without retriggering the mount effect.
  const callbacksRef = useRef<CreativeCanvasCallbacks>(options);
  useEffect(() => {
    callbacksRef.current = options;
  });

  const boundsRef = useRef({
    minWidth: options.minWidth ?? 320,
    minHeight: options.minHeight ?? 520,
  });
  useEffect(() => {
    boundsRef.current = {
      minWidth: options.minWidth ?? 320,
      minHeight: options.minHeight ?? 520,
    };
  });

  // Mount-only settings: a context is created once per canvas element.
  const settingsRef = useRef(options.contextSettings);
  const autoStartRef = useRef(options.autoStart ?? true);

  const runtime = useCallback(
    (): CreativeCanvasRuntime => ({
      context: contextRef.current,
      size: sizeRef.current,
    }),
    [],
  );

  const loop = useRafLoop((dt, elapsed) =>
    callbacksRef.current.onFrame(dt, elapsed, runtime()),
  );
  const { start, stop } = loop;

  const repaint = useCallback(() => {
    callbacksRef.current.onRepaint(runtime());
  }, [runtime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) {
      return;
    }
    const context = canvas.getContext("2d", settingsRef.current);
    if (!context) {
      return;
    }
    contextRef.current = context;

    function resize() {
      if (!canvas || !host || !context) {
        return;
      }
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(boundsRef.current.minWidth, bounds.width);
      const nextHeight = Math.max(boundsRef.current.minHeight, bounds.height);
      const previous = sizeRef.current;
      canvas.width = Math.round(nextWidth * ratio);
      canvas.height = Math.round(nextHeight * ratio);
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      sizeRef.current = { width: nextWidth, height: nextHeight };
      if (
        previous.width > 0 &&
        previous.height > 0 &&
        (previous.width !== nextWidth || previous.height !== nextHeight)
      ) {
        callbacksRef.current.onResize?.(
          { width: nextWidth, height: nextHeight },
          { x: nextWidth / previous.width, y: nextHeight / previous.height },
          runtime(),
        );
      }
      callbacksRef.current.onRepaint(runtime());
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    if (!reducedMotion && autoStartRef.current) {
      // Effect-start is safe here: useRafLoop.start() cancels any prior
      // frame first, so a StrictMode double-invoked effect cannot stack loops.
      start();
    }

    return () => {
      observer.disconnect();
      stop();
      contextRef.current = null;
    };
  }, [reducedMotion, runtime, start, stop]);

  return {
    canvasRef,
    hostRef,
    contextRef,
    sizeRef,
    running: loop.running,
    reducedMotion,
    start,
    stop,
    repaint,
  };
}

/** Download the current canvas contents as a PNG. */
export function exportCanvasPng(
  canvas: HTMLCanvasElement | null,
  filename: string,
): void {
  if (!canvas) {
    return;
  }
  const anchor = document.createElement("a");
  anchor.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  anchor.href = canvas.toDataURL("image/png");
  anchor.click();
}
