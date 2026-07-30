import { hashSeed, mulberry32 } from "@/lib/seededRandom";
import type { TrailSlug, Weather } from "./trailData";
import { TRAIL_ROUTES } from "./trailData";

export interface LogEntry {
  /** Fraction of the run at which this entry appears, 0..1. */
  atProgress: number;
  /** Radio timestamp, "HH:MM". */
  time: string;
  text: string;
  /** Advisory entries render in the alert tint. */
  advisory: boolean;
}

const DEPARTURES = [
  "Base, ranger team is on the move. Radio checks every waypoint.",
  "Dispatch confirmed — team of three leaving the trailhead now.",
  "Trail register signed. Stepping off with full kit.",
  "Base, we are rolling. Weather logged at departure.",
];

const BY_TRAIL: Record<TrailSlug, string[]> = {
  "ridge-to-river": [
    "Scree field above the falls is stable. Crossing single file.",
    "Ridge wind picking up near the lookout — holding the line.",
    "Overlook camera swapped. Watershed reads clean to the north.",
    "Old burn scar visible from the spine. Regrowth is coming in strong.",
  ],
  "old-forest-circuit": [
    "Canopy closes in past the west bridge. Switching to headlamps.",
    "Owl roost on the north arc is active — two adults confirmed.",
    "Nurse log on the east arc has fresh growth. Logging coordinates.",
    "Creek crossing is ankle depth. Stones re-stacked for the next team.",
  ],
  "campground-loop": [
    "Sites seven through ten inspected. Fire rings cold.",
    "Bear boxes latched on the river row. One needs a new hinge.",
    "Trail counter at the junction reads two hundred and forty today.",
    "Water spigot by the lodge is running clear again.",
  ],
};

const BY_WEATHER: Record<Weather, { text: string; advisory: boolean }[]> = {
  Clear: [
    { text: "Visibility is unlimited. Ceiling clear to the horizon.", advisory: false },
    { text: "Warm and dry underfoot. Making good time.", advisory: false },
    { text: "Golden hour on the meadow — logging photos for the archive.", advisory: false },
  ],
  Storm: [
    { text: "ADVISORY — lightning grounded on the west ridge. Holding at shelter.", advisory: true },
    { text: "ADVISORY — creek is rising fast. Rerouting to the high line.", advisory: true },
    { text: "Rain is horizontal up here. Packs covered, moving between cells.", advisory: false },
    { text: "ADVISORY — trail washout flagged for the maintenance crew.", advisory: true },
  ],
  Snow: [
    { text: "Fresh powder above the treeline. Breaking trail slows us down.", advisory: false },
    { text: "ADVISORY — cornice forming on the lee slope. Keeping our distance.", advisory: true },
    { text: "Snow bridges holding. Probing before every crossing.", advisory: false },
  ],
};

const DAY_EVENTS = [
  "Elk herd grazing the meadow — thirty head, two calves.",
  "Day hikers passed heading down. All accounted for on the register.",
  "Red-tailed hawk circling the burn scar thermals.",
  "Marmot colony active near the boulder field.",
];

const NIGHT_EVENTS = [
  "Headlamps on. Eyeshine in the treeline — likely fox.",
  "Owl calls answering each other across the drainage.",
  "Camp lights visible down-valley. Quiet hours holding.",
  "Bat activity heavy over the river bend.",
];

function formatTime(startHour: number, minutesIn: number): string {
  const total = (startHour * 60 + Math.round(minutesIn)) % (24 * 60);
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function pick<T>(rng: () => number, pool: T[], count: number): T[] {
  const copy = [...pool];
  const picked: T[] = [];
  while (picked.length < count && copy.length > 0) {
    const index = Math.floor(rng() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }
  return picked;
}

/**
 * Deterministic radio log for one expedition. The same trail + weather +
 * hour always produces the same log; changing any input changes it.
 */
export function buildExpeditionLog(
  trailSlug: TrailSlug,
  weather: Weather,
  hour: number,
  discovery: string,
): LogEntry[] {
  const rng = mulberry32(hashSeed(`${trailSlug}|${weather}|${hour}`));
  const route = TRAIL_ROUTES[trailSlug];
  const daylight = hour >= 7 && hour < 19;

  const middle: { text: string; advisory: boolean }[] = [];
  pick(rng, BY_TRAIL[trailSlug], 1 + Math.floor(rng() * 2)).forEach((text) =>
    middle.push({ text, advisory: false }),
  );
  const weatherCount = weather === "Clear" ? 1 : 2;
  middle.push(...pick(rng, BY_WEATHER[weather], weatherCount));
  pick(rng, daylight ? DAY_EVENTS : NIGHT_EVENTS, 1).forEach((text) =>
    middle.push({ text, advisory: false }),
  );

  // Shuffle the middle deterministically, then spread across the run.
  for (let index = middle.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [middle[index], middle[swap]] = [middle[swap], middle[index]];
  }

  const entries: LogEntry[] = [];
  const departure = DEPARTURES[Math.floor(rng() * DEPARTURES.length)];
  entries.push({
    atProgress: 0.02,
    time: formatTime(hour, 0),
    text: departure,
    advisory: false,
  });

  const span = 0.85 - 0.14;
  middle.forEach((event, index) => {
    const base = 0.14 + (span * (index + 0.5)) / middle.length;
    const jitter = (rng() - 0.5) * (span / middle.length) * 0.6;
    const at = Math.min(0.88, Math.max(0.1, base + jitter));
    entries.push({
      atProgress: at,
      time: formatTime(hour, route.minutes * at),
      text: event.text,
      advisory: event.advisory,
    });
  });

  entries.push({
    atProgress: 1,
    time: formatTime(hour, route.minutes),
    text: `Route complete. ${discovery}`,
    advisory: false,
  });

  return entries.sort((a, b) => a.atProgress - b.atProgress);
}
