import type { TrailSlug, Weather } from "./trailData";

export interface FieldNote {
  combo: string;
  trail: TrailSlug;
  weather: Weather;
  title: string;
  text: string;
}

export function comboKey(trail: TrailSlug, weather: Weather): string {
  return `${trail}:${weather.toLowerCase()}`;
}

export const FIELD_NOTES: FieldNote[] = [
  {
    combo: "ridge-to-river:clear",
    trail: "ridge-to-river",
    weather: "Clear",
    title: "Full sightline",
    text: "From the overlook the whole watershed reads like a map — the river's old channel still shows as a pale scar through the meadow.",
  },
  {
    combo: "ridge-to-river:storm",
    trail: "ridge-to-river",
    weather: "Storm",
    title: "Storm corridor",
    text: "Lightning grounded twice on the west ridge. The team sheltered at the switchback and logged the strike pattern for the burn model.",
  },
  {
    combo: "ridge-to-river:snow",
    trail: "ridge-to-river",
    weather: "Snow",
    title: "First tracks",
    text: "Bighorn crossed the scree before the team did. A single line of eagle prints ended mid-slope where the bird simply left the ground.",
  },
  {
    combo: "old-forest-circuit:clear",
    trail: "old-forest-circuit",
    weather: "Clear",
    title: "Understory census",
    text: "Four owl roosts confirmed on the north arc, two of them new. The old-growth interior is quieter than any trail counter suggests.",
  },
  {
    combo: "old-forest-circuit:storm",
    trail: "old-forest-circuit",
    weather: "Storm",
    title: "Windthrow",
    text: "A century-old fir came down across the east arc. Rangers flagged a reroute and left the trunk in place as a nurse log.",
  },
  {
    combo: "old-forest-circuit:snow",
    trail: "old-forest-circuit",
    weather: "Snow",
    title: "Cold silence",
    text: "Snow load closed the canopy gaps and the circuit ran in near-total hush — broken once by a fox mousing off-trail.",
  },
  {
    combo: "campground-loop:clear",
    trail: "campground-loop",
    weather: "Clear",
    title: "Threshold hold",
    text: "Visitor flow peaked at golden hour and never breached the habitat threshold. The loop keeps its current capacity.",
  },
  {
    combo: "campground-loop:storm",
    trail: "campground-loop",
    weather: "Storm",
    title: "Shelter drill",
    text: "The team walked the loop in rain gear checking every site's drainage. Two pads flagged for regrade before peak season.",
  },
  {
    combo: "campground-loop:snow",
    trail: "campground-loop",
    weather: "Snow",
    title: "Off-season",
    text: "Empty pads under snow. Kit fox tracks wove between the fire rings, reclaiming the loop the moment people left.",
  },
];

const STORAGE_KEY = "creative.parkOperator.fieldNotes.v1";

interface StoredNotes {
  v: 1;
  unlocked: Record<string, string>;
}

export function loadUnlocked(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as StoredNotes;
    if (parsed && parsed.v === 1 && typeof parsed.unlocked === "object") {
      return parsed.unlocked;
    }
    return {};
  } catch {
    return {};
  }
}

export function saveUnlocked(unlocked: Record<string, string>): void {
  try {
    const value: StoredNotes = { v: 1, unlocked };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private browsing or storage quota — the collection just won't persist.
  }
}
