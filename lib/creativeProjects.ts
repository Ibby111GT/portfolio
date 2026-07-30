export type CreativeCategory =
  | "Cabinetry"
  | "Wall systems"
  | "Wardrobes"
  | "Product design"
  | "Automotive"
  | "Simulation"
  | "Generative"
  | "Security"
  | "Living systems";

export interface CreativeProject {
  slug: string;
  number: string;
  title: string;
  category: CreativeCategory;
  description: string;
  interaction: string;
  /** Gallery preview image; null renders a generated poster instead. */
  image: string | null;
  accent: "red" | "blue";
}

export const CREATIVE_PROJECTS: CreativeProject[] = [
  {
    slug: "cabinetry-studio",
    number: "01",
    title: "Cabinetry Studio",
    category: "Cabinetry",
    description:
      "A CAD-led study of bespoke cabinet runs, material sequencing, hardware, lighting, and buildable module planning.",
    interaction: "Configure the run and produce a live cabinet specification.",
    image: "/creative/cabinetry-blueprint.png",
    accent: "blue",
  },
  {
    slug: "panel-studio",
    number: "02",
    title: "Panel Studio",
    category: "Wall systems",
    description:
      "An architectural wall-panel system explored through elevations, mounting details, acoustic performance, and material rhythm.",
    interaction: "Set the wall size, profile, spacing, finish, and lighting.",
    image: "/creative/panel-blueprint.png",
    accent: "blue",
  },
  {
    slug: "wardrobe-atelier",
    number: "03",
    title: "Wardrobe Atelier",
    category: "Wardrobes",
    description:
      "A modular wardrobe planner balancing hanging space, drawers, shoes, accessories, lighting, and room constraints.",
    interaction: "Select storage modules and optimize the layout to the room.",
    image: "/creative/wardrobe-blueprint.png",
    accent: "blue",
  },
  {
    slug: "wood-object-index",
    number: "04",
    title: "Wood Object Index",
    category: "Product design",
    description:
      "A collectible catalog of original wooden furniture, lighting, audio, serving, and desktop objects.",
    interaction: "Inspect construction, change materials, and curate a collection.",
    image: "/creative/wood-products-blueprint.png",
    accent: "red",
  },
  {
    slug: "apex-hypercars",
    number: "05",
    title: "Apex Hypercars",
    category: "Automotive",
    description:
      "A fictional hypercar developed as a technical blueprint, an editorial poster, and an interactive performance study.",
    interaction: "Switch from CAD to render, configure the car, and run a test.",
    image: "/creative/apex-blueprint.png",
    accent: "red",
  },
  {
    slug: "park-operator",
    number: "06",
    title: "Wildlands Expedition Mapper",
    category: "Simulation",
    description:
      "A multi-park GIS route planner and atmospheric ranger simulation with live ecology, elevation telemetry, field radio, and portable map exports.",
    interaction:
      "Build a route, inspect its habitat, export the track, then launch a field expedition.",
    image: "/creative/park-operator.png",
    accent: "blue",
  },
  {
    slug: "signal-bloom",
    number: "07",
    title: "Signal Bloom",
    category: "Generative",
    description:
      "A pointer-reactive generative field of red and blue signals that drift, connect, and leave fading traces. No two frames are the same.",
    interaction: "Steer the field, tune density and velocity, and export a frame.",
    image: null,
    accent: "blue",
  },
  {
    slug: "sentinel-observatory",
    number: "08",
    title: "Sentinel Observatory",
    category: "Security",
    description:
      "A wireframe threat globe: simulated intrusion attempts trace great-circle arcs toward a home node while a glassy HUD reports the live tactical picture. The blueprint-viewer aesthetic applied to security operations.",
    interaction:
      "Drag to rotate the globe, tune the threat volume, and run a new sweep.",
    image: null,
    accent: "red",
  },
  {
    slug: "verdant",
    number: "09",
    title: "Verdant",
    category: "Living systems",
    description:
      "A generative reforestation study. Plant seeds by touch and watch procedurally grown trees fill in a canopy — with a running, plain-English estimate of the carbon they draw down.",
    interaction: "Click the ground to plant, then shape the climate with rainfall and sunlight.",
    image: null,
    accent: "blue",
  },
  {
    slug: "lumen-city",
    number: "10",
    title: "Lumen City",
    category: "Simulation",
    description:
      "A playable clean-energy grid. Balance wind, solar, and battery against a city that wakes, works, and sleeps — the skyline glows when supply holds and browns out when it slips.",
    interaction: "Set the generation mix and weather; keep the city lit through the day.",
    image: null,
    accent: "blue",
  },
];
