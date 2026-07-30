"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RafLoop {
  running: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * Single requestAnimationFrame loop with StrictMode-safe lifecycle.
 * Nothing starts at mount — `start()` is only ever called from user
 * interaction handlers, so double-invoked effects cannot double-start it.
 * The loop pauses while the document is hidden and resumes without a
 * time jump (delta is measured against the previous visible frame).
 */
export function useRafLoop(
  onFrame: (dt: number, elapsed: number) => void,
): RafLoop {
  const [running, setRunning] = useState(false);
  const onFrameRef = useRef(onFrame);
  const rafIdRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const runningRef = useRef(false);

  onFrameRef.current = onFrame;

  const tick = useCallback((now: number) => {
    if (!runningRef.current) {
      return;
    }
    const last = lastTsRef.current;
    // Clamp the delta so a GC pause or tab restore cannot inject a huge step.
    const dt = last === null ? 0 : Math.min(Math.max((now - last) / 1000, 0), 0.1);
    lastTsRef.current = now;
    elapsedRef.current += dt;
    onFrameRef.current(dt, elapsedRef.current);
    if (runningRef.current) {
      rafIdRef.current = window.requestAnimationFrame(tick);
    }
  }, []);

  const start = useCallback(() => {
    window.cancelAnimationFrame(rafIdRef.current);
    runningRef.current = true;
    lastTsRef.current = null;
    elapsedRef.current = 0;
    setRunning(true);
    rafIdRef.current = window.requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    runningRef.current = false;
    window.cancelAnimationFrame(rafIdRef.current);
    setRunning(false);
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        window.cancelAnimationFrame(rafIdRef.current);
        lastTsRef.current = null;
      } else if (runningRef.current) {
        rafIdRef.current = window.requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.cancelAnimationFrame(rafIdRef.current);
      runningRef.current = false;
    };
  }, [tick]);

  return { running, start, stop };
}
