export type Coordinate = [longitude: number, latitude: number];
export type RouteKind = "drive" | "hike" | "water";
export type SpeciesCategory = "wildlife" | "plants" | "bugs";

export interface ParkRoute {
  type: "Feature";
  geometry: {
    type: "LineString";
    coordinates: Coordinate[];
  };
  properties: {
    id: string;
    name: string;
    kind: RouteKind;
    difficulty: "Easy" | "Moderate" | "Strenuous";
    zone: string;
    elevations: number[];
  };
}

export interface ParkStation {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: Coordinate;
  };
  properties: {
    id: string;
    name: string;
    kind: "Ranger station" | "Emergency shelter" | "Fire tower";
  };
}

export interface HabitatZone {
  id: string;
  label: string;
  center: Coordinate;
  radiusMeters: number;
}

export interface ParkSpecies {
  id: string;
  name: string;
  category: SpeciesCategory;
  detail: string;
  status: string;
  risk: "Low" | "Seasonal" | "Caution";
  zone: string;
}

export interface ParkPreset {
  id: string;
  name: string;
  state: string;
  center: [latitude: number, longitude: number];
  zoom: number;
  routes: ParkRoute[];
  stations: ParkStation[];
  zones: HabitatZone[];
  species: ParkSpecies[];
}

function route(
  id: string,
  name: string,
  kind: RouteKind,
  difficulty: ParkRoute["properties"]["difficulty"],
  zone: string,
  coordinates: Coordinate[],
  elevations: number[],
): ParkRoute {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates },
    properties: { id, name, kind, difficulty, zone, elevations },
  };
}

function station(
  id: string,
  name: string,
  kind: ParkStation["properties"]["kind"],
  coordinates: Coordinate,
): ParkStation {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: { id, name, kind },
  };
}

export const PARKS: ParkPreset[] = [
  {
    id: "yellowstone",
    name: "Yellowstone",
    state: "Wyoming · Montana · Idaho",
    center: [44.62, -110.51],
    zoom: 9,
    routes: [
      route(
        "yellowstone-grand-loop",
        "Grand Loop Scenic Drive",
        "drive",
        "Easy",
        "geyser-basin",
        [
          [-110.828, 44.46],
          [-110.857, 44.646],
          [-110.704, 44.725],
          [-110.497, 44.719],
          [-110.37, 44.55],
          [-110.491, 44.446],
        ],
        [2240, 2070, 2285, 2390, 2360, 2380],
      ),
      route(
        "yellowstone-washburn",
        "Mount Washburn Trail",
        "hike",
        "Strenuous",
        "alpine-ridge",
        [
          [-110.434, 44.797],
          [-110.429, 44.803],
          [-110.425, 44.809],
          [-110.428, 44.815],
          [-110.434, 44.82],
        ],
        [2690, 2820, 2990, 3090, 3122],
      ),
      route(
        "yellowstone-river",
        "Yellowstone River Paddle",
        "water",
        "Moderate",
        "river-corridor",
        [
          [-110.5, 44.72],
          [-110.475, 44.695],
          [-110.45, 44.68],
          [-110.405, 44.65],
          [-110.37, 44.62],
          [-110.3, 44.55],
        ],
        [2380, 2370, 2352, 2335, 2315, 2280],
      ),
    ],
    stations: [
      station(
        "yellowstone-canyon-station",
        "Canyon Ranger Station",
        "Ranger station",
        [-110.491, 44.735],
      ),
      station(
        "yellowstone-washburn-tower",
        "Washburn Fire Lookout",
        "Fire tower",
        [-110.434, 44.82],
      ),
    ],
    zones: [
      {
        id: "geyser-basin",
        label: "Geyser Basin",
        center: [-110.81, 44.49],
        radiusMeters: 18000,
      },
      {
        id: "alpine-ridge",
        label: "Alpine Ridge",
        center: [-110.43, 44.81],
        radiusMeters: 9000,
      },
      {
        id: "river-corridor",
        label: "River Corridor",
        center: [-110.42, 44.65],
        radiusMeters: 14000,
      },
    ],
    species: [
      {
        id: "yellowstone-grizzly",
        name: "Grizzly Bear",
        category: "wildlife",
        detail: "Forages across subalpine meadows and forest edges.",
        status: "Active at dawn",
        risk: "Caution",
        zone: "alpine-ridge",
      },
      {
        id: "yellowstone-elk",
        name: "Rocky Mountain Elk",
        category: "wildlife",
        detail: "Seasonal herds cross riparian flats.",
        status: "Rut in autumn",
        risk: "Seasonal",
        zone: "river-corridor",
      },
      {
        id: "yellowstone-bison",
        name: "American Bison",
        category: "wildlife",
        detail: "Road-adjacent grazing corridors require distance.",
        status: "Herd nearby",
        risk: "Caution",
        zone: "geyser-basin",
      },
      {
        id: "yellowstone-lodgepole",
        name: "Lodgepole Pine",
        category: "plants",
        detail: "Fire-adapted forest covering the volcanic plateau.",
        status: "Dominant canopy",
        risk: "Low",
        zone: "geyser-basin",
      },
      {
        id: "yellowstone-lupin",
        name: "Silvery Lupine",
        category: "plants",
        detail: "Nitrogen-fixing wildflower of open meadows.",
        status: "Summer bloom",
        risk: "Low",
        zone: "alpine-ridge",
      },
      {
        id: "yellowstone-beetle",
        name: "Mountain Pine Beetle",
        category: "bugs",
        detail: "A small forest-health indicator monitored by crews.",
        status: "Survey active",
        risk: "Seasonal",
        zone: "alpine-ridge",
      },
    ],
  },
  {
    id: "yosemite",
    name: "Yosemite",
    state: "California",
    center: [37.745, -119.59],
    zoom: 11,
    routes: [
      route(
        "yosemite-valley-drive",
        "Yosemite Valley Loop",
        "drive",
        "Easy",
        "valley-floor",
        [
          [-119.736, 37.715],
          [-119.69, 37.718],
          [-119.64, 37.725],
          [-119.59, 37.74],
          [-119.56, 37.75],
          [-119.605, 37.755],
        ],
        [1210, 1200, 1195, 1205, 1220, 1210],
      ),
      route(
        "yosemite-mist-trail",
        "Mist Trail",
        "hike",
        "Strenuous",
        "granite-falls",
        [
          [-119.558, 37.732],
          [-119.55, 37.73],
          [-119.545, 37.726],
          [-119.535, 37.724],
          [-119.523, 37.727],
        ],
        [1220, 1330, 1510, 1720, 1850],
      ),
      route(
        "yosemite-merced",
        "Merced River Run",
        "water",
        "Moderate",
        "riparian-zone",
        [
          [-119.72, 37.718],
          [-119.68, 37.721],
          [-119.65, 37.725],
          [-119.59, 37.735],
          [-119.55, 37.728],
        ],
        [1210, 1207, 1204, 1201, 1198],
      ),
    ],
    stations: [
      station(
        "yosemite-valley-center",
        "Yosemite Valley Ranger Station",
        "Ranger station",
        [-119.59, 37.748],
      ),
      station(
        "yosemite-glacier-shelter",
        "Glacier Point Shelter",
        "Emergency shelter",
        [-119.573, 37.708],
      ),
    ],
    zones: [
      {
        id: "valley-floor",
        label: "Valley Floor",
        center: [-119.62, 37.735],
        radiusMeters: 6000,
      },
      {
        id: "granite-falls",
        label: "Granite Falls",
        center: [-119.535, 37.726],
        radiusMeters: 2800,
      },
      {
        id: "riparian-zone",
        label: "Merced Riparian Zone",
        center: [-119.64, 37.724],
        radiusMeters: 5000,
      },
    ],
    species: [
      {
        id: "yosemite-bear",
        name: "American Black Bear",
        category: "wildlife",
        detail: "Moves between oak woodland and high-country forage.",
        status: "Dawn movement",
        risk: "Caution",
        zone: "valley-floor",
      },
      {
        id: "yosemite-sheep",
        name: "Sierra Nevada Bighorn",
        category: "wildlife",
        detail: "Rare alpine specialist on exposed granite.",
        status: "Protected",
        risk: "Seasonal",
        zone: "granite-falls",
      },
      {
        id: "yosemite-marmot",
        name: "Yellow-bellied Marmot",
        category: "wildlife",
        detail: "Basks near talus and high-elevation ledges.",
        status: "Day active",
        risk: "Low",
        zone: "granite-falls",
      },
      {
        id: "yosemite-ponderosa",
        name: "Ponderosa Pine",
        category: "plants",
        detail: "Warm-slope conifer with fire-resistant bark.",
        status: "Stable canopy",
        risk: "Low",
        zone: "valley-floor",
      },
      {
        id: "yosemite-dogwood",
        name: "Pacific Dogwood",
        category: "plants",
        detail: "Spring flowering tree of the shaded valley.",
        status: "Spring bloom",
        risk: "Low",
        zone: "riparian-zone",
      },
      {
        id: "yosemite-butterfly",
        name: "Monarch Butterfly",
        category: "bugs",
        detail: "Migratory pollinator using meadow milkweed.",
        status: "Migration window",
        risk: "Seasonal",
        zone: "riparian-zone",
      },
    ],
  },
  {
    id: "zion",
    name: "Zion",
    state: "Utah",
    center: [37.27, -112.97],
    zoom: 11,
    routes: [
      route(
        "zion-canyon-drive",
        "Zion Canyon Scenic Drive",
        "drive",
        "Easy",
        "canyon-floor",
        [
          [-112.987, 37.201],
          [-112.998, 37.25],
          [-112.981, 37.272],
          [-112.96, 37.3],
          [-112.947, 37.32],
        ],
        [1180, 1210, 1260, 1320, 1375],
      ),
      route(
        "zion-angels-landing",
        "Angels Landing",
        "hike",
        "Strenuous",
        "sandstone-ridge",
        [
          [-112.956, 37.268],
          [-112.952, 37.272],
          [-112.949, 37.275],
          [-112.947, 37.279],
          [-112.948, 37.282],
        ],
        [1310, 1430, 1600, 1720, 1765],
      ),
      route(
        "zion-virgin-river",
        "Virgin River Narrows",
        "water",
        "Strenuous",
        "narrows",
        [
          [-113.01, 37.2],
          [-112.99, 37.235],
          [-112.98, 37.25],
          [-112.96, 37.29],
          [-112.95, 37.31],
        ],
        [1170, 1190, 1210, 1280, 1330],
      ),
    ],
    stations: [
      station(
        "zion-visitor-center",
        "Zion Canyon Ranger Desk",
        "Ranger station",
        [-112.987, 37.201],
      ),
      station(
        "zion-lava-lookout",
        "Lava Point Fire Tower",
        "Fire tower",
        [-113.122, 37.386],
      ),
    ],
    zones: [
      {
        id: "canyon-floor",
        label: "Canyon Floor",
        center: [-112.98, 37.255],
        radiusMeters: 5600,
      },
      {
        id: "sandstone-ridge",
        label: "Sandstone Ridge",
        center: [-112.949, 37.278],
        radiusMeters: 2400,
      },
      {
        id: "narrows",
        label: "The Narrows",
        center: [-112.956, 37.3],
        radiusMeters: 3600,
      },
    ],
    species: [
      {
        id: "zion-sheep",
        name: "Desert Bighorn Sheep",
        category: "wildlife",
        detail: "Navigates steep sandstone shelves above the road.",
        status: "Active at dawn",
        risk: "Seasonal",
        zone: "sandstone-ridge",
      },
      {
        id: "zion-condor",
        name: "California Condor",
        category: "wildlife",
        detail: "Wide-ranging scavenger using warm canyon thermals.",
        status: "Aerial survey",
        risk: "Low",
        zone: "sandstone-ridge",
      },
      {
        id: "zion-mule-deer",
        name: "Mule Deer",
        category: "wildlife",
        detail: "Browses cottonwood edges around dusk.",
        status: "Dusk active",
        risk: "Caution",
        zone: "canyon-floor",
      },
      {
        id: "zion-cottonwood",
        name: "Fremont Cottonwood",
        category: "plants",
        detail: "Riparian anchor along the Virgin River.",
        status: "Water dependent",
        risk: "Low",
        zone: "narrows",
      },
      {
        id: "zion-yucca",
        name: "Banana Yucca",
        category: "plants",
        detail: "Dry-slope succulent pollinated by yucca moths.",
        status: "Spring bloom",
        risk: "Low",
        zone: "canyon-floor",
      },
      {
        id: "zion-firefly",
        name: "Western Firefly",
        category: "bugs",
        detail: "Rare evening signal near moist canyon pockets.",
        status: "Night survey",
        risk: "Seasonal",
        zone: "narrows",
      },
    ],
  },
  {
    id: "great-smoky",
    name: "Great Smoky Mountains",
    state: "Tennessee · North Carolina",
    center: [35.61, -83.53],
    zoom: 10,
    routes: [
      route(
        "smoky-cades-cove",
        "Cades Cove Loop Road",
        "drive",
        "Easy",
        "cove-meadow",
        [
          [-83.82, 35.6],
          [-83.79, 35.59],
          [-83.76, 35.605],
          [-83.77, 35.625],
          [-83.81, 35.63],
          [-83.82, 35.6],
        ],
        [540, 525, 555, 575, 565, 540],
      ),
      route(
        "smoky-alum-cave",
        "Alum Cave Trail",
        "hike",
        "Strenuous",
        "high-ridge",
        [
          [-83.441, 35.628],
          [-83.439, 35.618],
          [-83.436, 35.61],
          [-83.438, 35.6],
          [-83.44, 35.59],
        ],
        [1160, 1260, 1450, 1720, 1980],
      ),
      route(
        "smoky-little-river",
        "Little River Water Trail",
        "water",
        "Moderate",
        "hemlock-river",
        [
          [-83.62, 35.68],
          [-83.59, 35.665],
          [-83.55, 35.64],
          [-83.51, 35.625],
          [-83.48, 35.61],
        ],
        [680, 650, 620, 590, 565],
      ),
    ],
    stations: [
      station(
        "smoky-sugarlands",
        "Sugarlands Ranger Station",
        "Ranger station",
        [-83.51, 35.687],
      ),
      station(
        "smoky-leconte-shelter",
        "Mount Le Conte Shelter",
        "Emergency shelter",
        [-83.437, 35.655],
      ),
    ],
    zones: [
      {
        id: "cove-meadow",
        label: "Cades Cove Meadow",
        center: [-83.79, 35.61],
        radiusMeters: 6500,
      },
      {
        id: "high-ridge",
        label: "High Ridge",
        center: [-83.438, 35.61],
        radiusMeters: 4800,
      },
      {
        id: "hemlock-river",
        label: "Hemlock River",
        center: [-83.55, 35.64],
        radiusMeters: 7000,
      },
    ],
    species: [
      {
        id: "smoky-bear",
        name: "American Black Bear",
        category: "wildlife",
        detail: "High-density population crossing forest and meadow.",
        status: "Active corridor",
        risk: "Caution",
        zone: "cove-meadow",
      },
      {
        id: "smoky-elk",
        name: "Elk",
        category: "wildlife",
        detail: "Reintroduced grazer monitored in open valleys.",
        status: "Rut in autumn",
        risk: "Seasonal",
        zone: "cove-meadow",
      },
      {
        id: "smoky-salamander",
        name: "Red-cheeked Salamander",
        category: "wildlife",
        detail: "Endemic indicator of cool, moist forest health.",
        status: "After rainfall",
        risk: "Low",
        zone: "hemlock-river",
      },
      {
        id: "smoky-hemlock",
        name: "Eastern Hemlock",
        category: "plants",
        detail: "Shade-forming conifer protecting cool streams.",
        status: "Under monitoring",
        risk: "Seasonal",
        zone: "hemlock-river",
      },
      {
        id: "smoky-flame-azalea",
        name: "Flame Azalea",
        category: "plants",
        detail: "Bright ridge bloom in late spring.",
        status: "Seasonal bloom",
        risk: "Low",
        zone: "high-ridge",
      },
      {
        id: "smoky-firefly",
        name: "Synchronous Firefly",
        category: "bugs",
        detail: "Coordinated light display in humid forest clearings.",
        status: "Night cycle",
        risk: "Seasonal",
        zone: "hemlock-river",
      },
    ],
  },
];

export const ROUTE_COLORS: Record<RouteKind, string> = {
  drive: "#10b981",
  hike: "#f59e0b",
  water: "#22d3ee",
};

export const ROUTE_LABELS: Record<RouteKind, string> = {
  drive: "Scenic drives",
  hike: "Hiking trails",
  water: "Water routes",
};
