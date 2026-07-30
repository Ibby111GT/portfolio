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

export type CreativeGroup =
  | "Spatial & fabrication"
  | "Automotive"
  | "Simulation & data"
  | "Generative art";

export interface CreativeProject {
  slug: string;
  number: string;
  title: string;
  category: CreativeCategory;
  group: CreativeGroup;
  description: string;
  interaction: string;
  purpose: string;
  capabilities: string[];
  decisions: string[];
  boundary: string;
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
    group: "Spatial & fabrication",
    description:
      "A CAD-led study of bespoke cabinet runs, material sequencing, hardware, lighting, and buildable module planning.",
    interaction: "Configure the run and produce a live cabinet specification.",
    purpose:
      "Make Division 6 casework understandable before fabrication by connecting the drawing, the assembly, and the configurable specification.",
    capabilities: [
      "3D spatial review",
      "Construction data modeling",
      "Live specification logic",
    ],
    decisions: [
      "Map every selected 3D part to a readable construction record.",
      "Separate drawing review, assembly inspection, and configuration into a deliberate sequence.",
    ],
    boundary:
      "Concept model for portfolio demonstration — not a sealed submittal, shop drawing, or fabrication document.",
    image: "/creative/cabinetry-studio.png",
    accent: "blue",
  },
  {
    slug: "panel-studio",
    number: "02",
    title: "Panel Studio",
    category: "Wall systems",
    group: "Spatial & fabrication",
    description:
      "An architectural wall-panel system explored through elevations, mounting details, acoustic performance, and material rhythm.",
    interaction: "Set the wall size, profile, spacing, finish, and lighting.",
    purpose:
      "Show how panel rhythm, substrate, access, acoustics, and lighting become one coordinated architectural system.",
    capabilities: [
      "Parametric layout",
      "Assembly callouts",
      "Material system design",
    ],
    decisions: [
      "Treat access and fastening as first-class design data instead of hiding them behind the finish.",
      "Express every configuration change as both a visual update and a readable specification.",
    ],
    boundary:
      "Concept model only — field dimensions, tested assemblies, engineering, and approved shop drawings govern construction.",
    image: "/creative/panel-studio.png",
    accent: "blue",
  },
  {
    slug: "wardrobe-atelier",
    number: "03",
    title: "Wardrobe Atelier",
    category: "Wardrobes",
    group: "Spatial & fabrication",
    description:
      "A modular wardrobe planner balancing hanging space, drawers, shoes, accessories, lighting, and room constraints.",
    interaction: "Select storage modules and optimize the layout to the room.",
    purpose:
      "Turn a vague storage request into a measurable module plan that exposes capacity, clearances, and trade-offs.",
    capabilities: [
      "Constraint-based planning",
      "Module composition",
      "Responsive product UI",
    ],
    decisions: [
      "Make every module consume real width so the interface cannot promise more storage than the room can hold.",
      "Surface capacity as plain numbers alongside the visual design.",
    ],
    boundary:
      "Planning prototype — site measurement, wall conditions, hardware loads, and fabrication drawings still control a real installation.",
    image: "/creative/wardrobe-atelier.png",
    accent: "blue",
  },
  {
    slug: "wood-object-index",
    number: "04",
    title: "Wood Object Index",
    category: "Product design",
    group: "Spatial & fabrication",
    description:
      "A collectible catalog of original wooden furniture, lighting, audio, serving, and desktop objects.",
    interaction: "Inspect construction, change materials, and curate a collection.",
    purpose:
      "Explore how a product catalog can teach construction, material intent, and object scale instead of behaving like a flat image gallery.",
    capabilities: [
      "Product-system UI",
      "Material variants",
      "Construction storytelling",
    ],
    decisions: [
      "Use a shared data model so material, joinery, dimensions, and use case stay consistent.",
      "Favor readable construction logic over decorative photorealism.",
    ],
    boundary:
      "Original concept collection — dimensions and assemblies are illustrative and have not been engineered for production.",
    image: "/creative/wood-object-index.png",
    accent: "red",
  },
  {
    slug: "apex-hypercars",
    number: "05",
    title: "Apex Hypercars",
    category: "Automotive",
    group: "Automotive",
    description:
      "A fictional hypercar developed as a technical blueprint, an editorial poster, and an interactive performance study.",
    interaction: "Switch from CAD to render, configure the car, and run a test.",
    purpose:
      "Connect automotive form, engineering telemetry, and editorial art direction inside one operable concept study.",
    capabilities: [
      "Vehicle configuration",
      "Performance simulation",
      "Editorial systems design",
    ],
    decisions: [
      "Keep the performance model transparent so mass, aero, and power changes have understandable consequences.",
      "Use one design language across blueprint, studio render, and live telemetry.",
    ],
    boundary:
      "Fictional concept vehicle and simplified performance model — not a homologated design or engineering prediction.",
    image: "/creative/apex-hypercars.png",
    accent: "red",
  },
  {
    slug: "park-operator",
    number: "06",
    title: "Wildlands Expedition Mapper",
    category: "Simulation",
    group: "Simulation & data",
    description:
      "A multi-park GIS route planner and atmospheric ranger simulation with live ecology, elevation telemetry, field radio, and portable map exports.",
    interaction:
      "Build a route, inspect its habitat, export the track, then launch a field expedition.",
    purpose:
      "Make route planning, terrain, biodiversity, and field operations legible in one GIS-inspired expedition workspace.",
    capabilities: [
      "Interactive geospatial UI",
      "GPX/KML export",
      "Environmental simulation",
    ],
    decisions: [
      "Keep route math and exports client-side so the planner needs no account or paid mapping key.",
      "Pair every route with ecological context instead of treating a park as an empty line.",
    ],
    boundary:
      "Portfolio simulation — not an official trail, closure, weather, emergency, or navigation source. Verify all travel with the National Park Service.",
    image: "/creative/park-operator.png",
    accent: "blue",
  },
  {
    slug: "signal-bloom",
    number: "07",
    title: "Signal Bloom",
    category: "Generative",
    group: "Generative art",
    description:
      "A pointer-reactive generative field of red and blue signals that drift, connect, and leave fading traces. No two frames are the same.",
    interaction: "Steer the field, tune density and velocity, and export a frame.",
    purpose:
      "Turn pointer movement and deterministic particle rules into a responsive digital artwork that can be replayed and exported.",
    capabilities: [
      "Canvas rendering",
      "Deterministic animation",
      "Image export",
    ],
    decisions: [
      "Use seeded behavior so the field feels alive without creating replay inconsistencies.",
      "Keep controls intentionally small so the artwork remains the primary interface.",
    ],
    boundary:
      "Generative artwork — visual output is illustrative and intentionally changes with interaction.",
    image: null,
    accent: "blue",
  },
  {
    slug: "sentinel-observatory",
    number: "08",
    title: "Sentinel Observatory",
    category: "Security",
    group: "Simulation & data",
    description:
      "A wireframe threat globe: simulated intrusion attempts trace great-circle arcs toward a home node while a glassy HUD reports the live tactical picture. The blueprint-viewer aesthetic applied to security operations.",
    interaction:
      "Drag to rotate the globe, tune the threat volume, and run a new sweep.",
    purpose:
      "Translate a moving incident stream into a spatial security picture that communicates concentration, severity, and response pressure.",
    capabilities: [
      "Security data visualization",
      "Canvas globe projection",
      "Deterministic event simulation",
    ],
    decisions: [
      "Use simulated great-circle paths without implying real geolocation or telemetry.",
      "Keep the tactical HUD subordinate to the incident story.",
    ],
    boundary:
      "All incidents, locations, identities, and metrics are synthetic. This is a visualization prototype, not a live threat feed.",
    image: null,
    accent: "red",
  },
  {
    slug: "verdant",
    number: "09",
    title: "Verdant",
    category: "Living systems",
    group: "Generative art",
    description:
      "A generative reforestation study. Plant seeds by touch and watch procedurally grown trees fill in a canopy — with a running, plain-English estimate of the carbon they draw down.",
    interaction: "Click the ground to plant, then shape the climate with rainfall and sunlight.",
    purpose:
      "Make the lag between planting, canopy growth, biodiversity, and carbon drawdown visible through a calm systems simulation.",
    capabilities: [
      "Procedural growth",
      "Climate-state modeling",
      "Accessible canvas interaction",
    ],
    decisions: [
      "Use an explicit illustrative carbon estimate instead of presenting a forecast.",
      "Let rainfall and sunlight alter growth so the system teaches dependency, not only decoration.",
    ],
    boundary:
      "Illustrative ecology model — not a forestry, carbon-credit, or land-management forecast.",
    image: null,
    accent: "blue",
  },
  {
    slug: "lumen-city",
    number: "10",
    title: "Lumen City",
    category: "Simulation",
    group: "Simulation & data",
    description:
      "A playable clean-energy grid. Balance wind, solar, and battery against a city that wakes, works, and sleeps — the skyline glows when supply holds and browns out when it slips.",
    interaction: "Set the generation mix and weather; keep the city lit through the day.",
    purpose:
      "Teach the difference between installed renewable capacity, variable generation, storage, and demand through a playable grid.",
    capabilities: [
      "Time-series simulation",
      "Energy telemetry",
      "Systems-balancing UI",
    ],
    decisions: [
      "Model storage as a finite bridge rather than a source of energy.",
      "Let the skyline communicate reliability before the visitor reads a chart.",
    ],
    boundary:
      "Simplified educational model — not a utility dispatch, engineering, finance, or grid-planning tool.",
    image: null,
    accent: "blue",
  },
];
