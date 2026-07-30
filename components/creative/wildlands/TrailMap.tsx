"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { VIEWBOX, type TrailRoute } from "./trailData";

export interface TrailMapHandle {
  setProgress: (progress: number) => void;
}

interface WaypointPoint {
  x: number;
  y: number;
  at: number;
  label: string;
}

/**
 * SVG overlay that draws the expedition route over the park image. The
 * traveled portion draws on via stroke-dashoffset and the ranger marker
 * follows getPointAtLength — all mutated through refs, zero renders per
 * frame. preserveAspectRatio="xMidYMid slice" crops identically to the
 * underlying next/image object-cover, so the route stays on the terrain.
 */
const TrailMap = forwardRef<TrailMapHandle, { route: TrailRoute }>(
  function TrailMap({ route }, ref) {
    const pathRef = useRef<SVGPathElement>(null);
    const progressPathRef = useRef<SVGPathElement>(null);
    const markerRef = useRef<SVGCircleElement>(null);
    const waypointRefs = useRef<Array<SVGGElement | null>>([]);
    const totalLengthRef = useRef(0);
    const [waypoints, setWaypoints] = useState<WaypointPoint[]>([]);

    useLayoutEffect(() => {
      const path = pathRef.current;
      if (!path) {
        return;
      }
      try {
        const total = path.getTotalLength();
        totalLengthRef.current = total;
        const progressPath = progressPathRef.current;
        if (progressPath) {
          progressPath.style.strokeDasharray = `${total}`;
          progressPath.style.strokeDashoffset = `${total}`;
        }
        const start = path.getPointAtLength(0);
        markerRef.current?.setAttribute("cx", `${start.x}`);
        markerRef.current?.setAttribute("cy", `${start.y}`);
        setWaypoints(
          route.waypoints.map((waypoint) => {
            const point = path.getPointAtLength(waypoint.at * total);
            return {
              x: point.x,
              y: point.y,
              at: waypoint.at,
              label: waypoint.label,
            };
          }),
        );
      } catch {
        // getTotalLength is unavailable outside a real SVG DOM.
      }
    }, [route]);

    useImperativeHandle(
      ref,
      () => ({
        setProgress(progress: number) {
          const path = pathRef.current;
          const total = totalLengthRef.current;
          if (!path || total === 0) {
            return;
          }
          const clamped = Math.min(1, Math.max(0, progress));
          const progressPath = progressPathRef.current;
          if (progressPath) {
            progressPath.style.strokeDashoffset = `${total * (1 - clamped)}`;
          }
          const point = path.getPointAtLength(clamped * total);
          markerRef.current?.setAttribute("cx", `${point.x}`);
          markerRef.current?.setAttribute("cy", `${point.y}`);
          waypointRefs.current.forEach((group, index) => {
            const waypoint = route.waypoints[index];
            if (group && waypoint) {
              if (clamped >= waypoint.at && clamped > 0) {
                group.setAttribute("data-hit", "true");
              } else {
                group.removeAttribute("data-hit");
              }
            }
          });
        },
      }),
      [route],
    );

    return (
      <svg
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          d={route.path}
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={progressPathRef}
          d={route.path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {waypoints.map((waypoint, index) => (
          <g
            key={`${route.slug}-${waypoint.label}`}
            ref={(element) => {
              waypointRefs.current[index] = element;
            }}
            className="trail-waypoint"
          >
            <circle
              className="trail-waypoint-ping"
              cx={waypoint.x}
              cy={waypoint.y}
              r="1.6"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.4"
              opacity="0"
            />
            <circle
              className="trail-waypoint-dot"
              cx={waypoint.x}
              cy={waypoint.y}
              r="0.9"
              fill="rgba(255,255,255,0.35)"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.2"
            />
          </g>
        ))}
        <circle
          ref={markerRef}
          r="1.1"
          fill="#ffffff"
          stroke="var(--accent)"
          strokeWidth="0.5"
        />
      </svg>
    );
  },
);

export default TrailMap;
