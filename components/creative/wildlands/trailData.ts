// Trail routes authored against public/creative/park-operator.png (1536x1024).
// Coordinates live in the image's own aspect (viewBox 0 0 100 66.67); the
// overlay SVG renders with preserveAspectRatio="xMidYMid slice", which crops
// exactly like next/image's centered object-cover — so these constants stay
// glued to the terrain at every viewport size.

export type TrailSlug =
  | "ridge-to-river"
  | "old-forest-circuit"
  | "campground-loop";

export interface TrailWaypoint {
  /** Fraction of total path length, 0..1. */
  at: number;
  label: string;
}

export interface TrailRoute {
  slug: TrailSlug;
  /** SVG path in 0-100 x / 0-66.67 y image coordinates. */
  path: string;
  waypoints: TrailWaypoint[];
  /** Trip length in minutes, used for radio-log timestamps. */
  minutes: number;
}

export const VIEWBOX = "0 0 100 66.67";

export const TRAIL_ROUTES: Record<TrailSlug, TrailRoute> = {
  // Lodge → meadow → falls overlook → summit ridge → fire lookout →
  // switchbacks down to the west bridge → river terrace.
  "ridge-to-river": {
    slug: "ridge-to-river",
    path: "M 79 30 C 73 27.5, 68 26.5, 62 25 S 51 21.5, 46.5 17.5 S 42 10.5, 37 11 S 26 16, 18 21.5 S 19.5 31, 23 37.5 C 25 40.5, 27.5 42.5, 30.5 43.5",
    waypoints: [
      { at: 0.2, label: "Meadow gate" },
      { at: 0.42, label: "Falls overlook" },
      { at: 0.63, label: "Fire lookout" },
      { at: 1, label: "River terrace" },
    ],
    minutes: 420,
  },
  // Closed loop through the old growth between the two bridges.
  "old-forest-circuit": {
    slug: "old-forest-circuit",
    path: "M 45.5 47.5 C 41 47.5, 37.5 46.5, 34 45 S 25.5 41.5, 23.5 38.5 S 24.5 31.5, 28.5 30 S 36.5 31.5, 40 33 S 43.5 37.5, 44.5 41 S 45.5 44.5, 45.5 47.5",
    waypoints: [
      { at: 0.28, label: "West bridge" },
      { at: 0.52, label: "Old-growth stand" },
      { at: 0.8, label: "Riverbank flats" },
      { at: 1, label: "Trailhead return" },
    ],
    minutes: 210,
  },
  // Easy loop from the ranger station around the campground sites.
  "campground-loop": {
    slug: "campground-loop",
    path: "M 79 31 C 78 34, 76 37, 72 39.5 S 64 44.5, 59 43.5 S 54 40, 56.5 36.5 S 63 32.5, 68 31.5 S 75.5 30.5, 79 31",
    waypoints: [
      { at: 0.34, label: "Riverside sites" },
      { at: 0.62, label: "West loop" },
      { at: 1, label: "Ranger station" },
    ],
    minutes: 150,
  },
};

export type Weather = "Clear" | "Storm" | "Snow";

const WEATHER_FACTOR: Record<Weather, number> = {
  Clear: 1,
  Snow: 1.15,
  Storm: 1.3,
};

/** Wall-clock expedition duration in seconds for a trail + weather. */
export function expeditionDuration(
  distanceMiles: number,
  weather: Weather,
): number {
  const base = (6 + distanceMiles * 0.45) * WEATHER_FACTOR[weather];
  return Math.min(12, Math.max(8, base));
}
