"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { REDLINE } from "./physics";

export interface SpeedGaugeHandle {
  update: (mph: number, rpm: number, gear: number) => void;
}

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 82;
const RPM_RADIUS = 64;
const START_ANGLE = 135; // degrees; sweep 270° clockwise to 45°
const SWEEP = 270;

function arcPath(radius: number, sweepDegrees: number): string {
  const start = polar(radius, START_ANGLE);
  const end = polar(radius, START_ANGLE + sweepDegrees);
  const large = sweepDegrees > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}

// Coordinates are rounded to fixed strings so the server-rendered SVG and
// the client hydration produce byte-identical attributes.
function polar(radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: (CENTER + radius * Math.cos(radians)).toFixed(2),
    y: (CENTER + radius * Math.sin(radians)).toFixed(2),
  };
}

const FULL_ARC = arcPath(RADIUS, SWEEP);
const FULL_ARC_LENGTH = Math.round(((2 * Math.PI * RADIUS) / 360) * SWEEP);
const RPM_ARC = arcPath(RPM_RADIUS, SWEEP);
const RPM_ARC_LENGTH = Math.round(((2 * Math.PI * RPM_RADIUS) / 360) * SWEEP);

/**
 * SVG speed + rpm gauge. `update()` mutates attributes directly through
 * refs, so the 60 fps run never causes a React render.
 */
const SpeedGauge = forwardRef<SpeedGaugeHandle, { maxMph: number }>(
  function SpeedGauge({ maxMph }, ref) {
    const speedArcRef = useRef<SVGPathElement>(null);
    const rpmArcRef = useRef<SVGPathElement>(null);
    const mphTextRef = useRef<SVGTextElement>(null);
    const gearTextRef = useRef<SVGTextElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        update(mph: number, rpm: number, gear: number) {
          const speedFraction = Math.min(1, Math.max(0, mph / maxMph));
          speedArcRef.current?.setAttribute(
            "stroke-dashoffset",
            `${FULL_ARC_LENGTH * (1 - speedFraction)}`,
          );
          const rpmFraction = Math.min(1, Math.max(0, rpm / REDLINE));
          rpmArcRef.current?.setAttribute(
            "stroke-dashoffset",
            `${RPM_ARC_LENGTH * (1 - rpmFraction)}`,
          );
          if (mphTextRef.current) {
            mphTextRef.current.textContent = `${Math.round(mph)}`;
          }
          if (gearTextRef.current) {
            gearTextRef.current.textContent = `G${gear}`;
          }
        },
      }),
      [maxMph],
    );

    const ticks = [];
    for (let mph = 0; mph <= maxMph; mph += 30) {
      const angle = START_ANGLE + (mph / maxMph) * SWEEP;
      const outer = polar(RADIUS + 8, angle);
      const inner = polar(RADIUS + 2, angle);
      ticks.push(
        <line
          key={mph}
          x1={inner.x}
          y1={inner.y}
          x2={outer.x}
          y2={outer.y}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1"
        />,
      );
    }

    return (
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[220px]"
        role="img"
        aria-label="Speed gauge with rpm ring and current gear"
      >
        <path
          d={FULL_ARC}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          ref={speedArcRef}
          d={FULL_ARC}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={FULL_ARC_LENGTH}
          strokeDashoffset={FULL_ARC_LENGTH}
        />
        <path
          d={RPM_ARC}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          ref={rpmArcRef}
          d={RPM_ARC}
          fill="none"
          stroke="var(--alert)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={RPM_ARC_LENGTH}
          strokeDashoffset={RPM_ARC_LENGTH}
        />
        {ticks}
        <text
          ref={mphTextRef}
          x={CENTER}
          y={CENTER - 2}
          textAnchor="middle"
          fill="white"
          fontSize="34"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        >
          0
        </text>
        <text
          x={CENTER}
          y={CENTER + 18}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize="9"
          letterSpacing="2"
        >
          MPH
        </text>
        <text
          ref={gearTextRef}
          x={CENTER}
          y={CENTER + 42}
          textAnchor="middle"
          fill="rgba(255,255,255,0.75)"
          fontSize="13"
          fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        >
          G1
        </text>
      </svg>
    );
  },
);

export default SpeedGauge;
