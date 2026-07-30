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
  | "Design & fabrication"
  | "Interactive simulations"
  | "Generative systems";

export interface CreativeReadingItem {
  label: string;
  detail: string;
}

export interface CreativeProject {
  slug: string;
  number: string;
  title: string;
  category: CreativeCategory;
  group: CreativeGroup;
  description: string;
  interaction: string;
  purpose: string;
  steps: string[];
  reading: CreativeReadingItem[];
  architecture: string[];
  evidenceMode: string;
  capabilities: string[];
  decisions: string[];
  boundary: string;
  boundaryTone?: "scope" | "safety";
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
    group: "Design & fabrication",
    description:
      "Rotate and explode a cabinet assembly, select any part, and read how it would be built.",
    interaction:
      "Review the drawing, dissect the 3D assembly, then configure the cabinet run.",
    purpose:
      "Make Division 6 casework understandable before fabrication by connecting the drawing, the assembly, and the configurable specification.",
    steps: [
      "Switch between the technical drawing and finished-room view.",
      "Open the 3D assembly, select a part, and move the exploded-view control.",
      "Change the layout, material, hardware, and lighting to update the specification.",
    ],
    reading: [
      {
        label: "Drawing",
        detail: "The design intent: dimensions, finish, hardware, and alignment.",
      },
      {
        label: "3D assembly",
        detail: "The physical parts and the order in which they come together.",
      },
      {
        label: "Live specification",
        detail: "A planning estimate that responds to the choices you make.",
      },
    ],
    architecture: [
      "Typed project data keeps dimensions, materials, and construction notes consistent.",
      "React Three Fiber renders selectable cabinet parts and the exploded assembly.",
      "Client-side state recalculates modules, budget range, and lead-time guidance.",
    ],
    evidenceMode: "Interactive construction concept model",
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
    boundaryTone: "scope",
    image: "/creative/cabinetry-studio.png",
    accent: "blue",
  },
  {
    slug: "panel-studio",
    number: "02",
    title: "Panel Studio",
    category: "Wall systems",
    group: "Design & fabrication",
    description:
      "Change a wall’s size, finish, spacing, and lighting to see the complete panel system update.",
    interaction: "Set the wall size, profile, spacing, finish, and lighting.",
    purpose:
      "Show how panel rhythm, substrate, access, acoustics, and lighting become one coordinated architectural system.",
    steps: [
      "Review the elevation and finished wall to understand the intended rhythm.",
      "Select parts in the 3D model to see the panel, rail, substrate, and reveal.",
      "Change wall dimensions, spacing, profile, finish, and lighting.",
    ],
    reading: [
      {
        label: "Panel rhythm",
        detail: "How repeated widths and gaps organize the wall visually.",
      },
      {
        label: "Mounting build-up",
        detail: "The hidden rails, substrate, and access space behind the finish.",
      },
      {
        label: "Performance",
        detail: "Illustrative coverage, material, and acoustic planning values.",
      },
    ],
    architecture: [
      "A parametric layout divides the selected wall width into buildable panel modules.",
      "The shared 3D viewer maps every visible layer to a construction explanation.",
      "Configuration state updates quantities, finish coverage, and lighting intent together.",
    ],
    evidenceMode: "Interactive architectural assembly concept",
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
    boundaryTone: "scope",
    image: "/creative/panel-studio.png",
    accent: "blue",
  },
  {
    slug: "wardrobe-atelier",
    number: "03",
    title: "Wardrobe Atelier",
    category: "Wardrobes",
    group: "Design & fabrication",
    description:
      "Build a wardrobe from storage modules and see when the design no longer fits the room.",
    interaction: "Select storage modules and optimize the layout to the room.",
    purpose:
      "Turn a vague storage request into a measurable module plan that exposes capacity, clearances, and trade-offs.",
    steps: [
      "Set the available room width and review the starting wardrobe layout.",
      "Add hanging, drawer, shoe, and accessory modules.",
      "Watch remaining width and storage capacity to catch an overfilled design.",
    ],
    reading: [
      {
        label: "Room width",
        detail: "The hard limit that every selected storage module must share.",
      },
      {
        label: "Module mix",
        detail: "The balance between hanging, folded clothing, shoes, and accessories.",
      },
      {
        label: "Capacity",
        detail: "A readable estimate of what the selected arrangement can hold.",
      },
    ],
    architecture: [
      "Each storage module has a defined width, capacity, and functional role.",
      "A constraint engine totals the selected modules against the room dimension.",
      "The interface presents spatial trade-offs as both a layout and plain numbers.",
    ],
    evidenceMode: "Constraint-based space-planning prototype",
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
    boundaryTone: "scope",
    image: "/creative/wardrobe-atelier.png",
    accent: "blue",
  },
  {
    slug: "wood-object-index",
    number: "04",
    title: "Wood Object Index",
    category: "Product design",
    group: "Design & fabrication",
    description:
      "Explore original wooden objects, change their materials, and inspect how each one is assembled.",
    interaction: "Inspect construction, change materials, and curate a collection.",
    purpose:
      "Explore how a product catalog can teach construction, material intent, and object scale instead of behaving like a flat image gallery.",
    steps: [
      "Choose an object from the collection.",
      "Open its construction view and inspect the joinery, dimensions, and intended use.",
      "Change the wood species and save the pieces you would keep.",
    ],
    reading: [
      {
        label: "Object record",
        detail: "One source for the object’s use, scale, material, and construction.",
      },
      {
        label: "Material variant",
        detail: "A visual study of how species and finish change the same form.",
      },
      {
        label: "Collection",
        detail: "A small product-curation interaction stored only in the browser.",
      },
    ],
    architecture: [
      "A shared object schema drives names, materials, dimensions, and construction notes.",
      "Reusable product views keep the catalog consistent across different object types.",
      "Local interface state manages material variants and the visitor’s temporary collection.",
    ],
    evidenceMode: "Original product-system concept collection",
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
    boundaryTone: "scope",
    image: "/creative/wood-object-index.png",
    accent: "red",
  },
  {
    slug: "apex-hypercars",
    number: "05",
    title: "Apex Hypercars",
    category: "Automotive",
    group: "Design & fabrication",
    description:
      "Configure a fictional hypercar and see how mass, aerodynamics, and power change its simulated run.",
    interaction:
      "Compare blueprint and render, tune the car, run a test, and inspect the telemetry.",
    purpose:
      "Connect automotive form, engineering telemetry, and editorial art direction inside one operable concept study.",
    steps: [
      "Switch between the blueprint and finished studio render.",
      "Change power, mass, tires, and aerodynamic setup to create a configuration.",
      "Run the performance test, compare timing splits, and inspect the telemetry trace.",
    ],
    reading: [
      {
        label: "Predicted result",
        detail: "The simplified model’s estimate before you run the configured car.",
      },
      {
        label: "Timing splits",
        detail: "How the simulated run progresses through acceleration checkpoints.",
      },
      {
        label: "Telemetry",
        detail: "A visual trace showing how the configuration changes the run.",
      },
    ],
    architecture: [
      "A deterministic client-side model combines power, mass, traction, and aero inputs.",
      "One configuration state drives the technical view, predicted result, and animated test.",
      "Canvas telemetry translates the run into readable timing and performance traces.",
    ],
    evidenceMode: "Simplified deterministic performance simulation",
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
    boundaryTone: "scope",
    image: "/creative/apex-hypercars.png",
    accent: "red",
  },
  {
    slug: "park-operator",
    number: "06",
    title: "Wildlands Expedition Mapper",
    category: "Simulation",
    group: "Interactive simulations",
    description:
      "Build a national-park route, inspect elevation and wildlife, then export the track.",
    interaction:
      "Build a route, inspect its habitat, export the track, then launch a field expedition.",
    purpose:
      "Make route planning, terrain, biodiversity, and field operations legible in one GIS-inspired expedition workspace.",
    steps: [
      "Choose a park and a suggested hiking, driving, or water route.",
      "Turn map layers on and inspect distance, time, elevation, habitat, and safety context.",
      "Build your own waypoints or export the selected route as GPX, KML, Google Maps, or Apple Maps.",
      "Launch the ranger simulation to change weather, hear the radio, and unlock a field note.",
    ],
    reading: [
      {
        label: "Route telemetry",
        detail: "Distance, estimated travel time, difficulty, and elevation change.",
      },
      {
        label: "Ecosystem panel",
        detail: "Illustrative species associated with the selected habitat zone.",
      },
      {
        label: "Field operation",
        detail: "A separate atmospheric simulation of weather, visitors, wildlife, and ranger dispatch.",
      },
    ],
    architecture: [
      "Hand-authored park and route data supplies coordinates, elevations, habitat zones, and species.",
      "Leaflet renders CARTO tiles when available while local overlays continue without the basemap.",
      "Client-side utilities calculate distance and generate GPX, KML, Google, and Apple export formats.",
    ],
    evidenceMode: "Hand-authored route scenarios with an optional CARTO basemap",
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
    boundaryTone: "safety",
    image: "/creative/park-operator.png",
    accent: "blue",
  },
  {
    slug: "signal-bloom",
    number: "07",
    title: "Signal Bloom",
    category: "Generative",
    group: "Generative systems",
    description:
      "Steer a generative particle field and export the composition you create.",
    interaction: "Steer the field, tune density and velocity, and export a frame.",
    purpose:
      "Turn pointer movement and deterministic particle rules into a responsive digital artwork that can be replayed and exported.",
    steps: [
      "Move the pointer across the field to bend nearby particle paths.",
      "Change density, speed, and the red/blue palette.",
      "Regenerate the field or export the current frame as an image.",
    ],
    reading: [
      {
        label: "Particles",
        detail: "Small moving signals governed by speed, direction, and local attraction.",
      },
      {
        label: "Connections",
        detail: "Temporary lines drawn when signals move close to one another.",
      },
      {
        label: "Trace",
        detail: "The fading history that turns motion into a layered composition.",
      },
    ],
    architecture: [
      "A Canvas 2D loop updates particle positions and proximity connections each frame.",
      "Seeded regeneration makes a selected setup reproducible while interaction remains fluid.",
      "The browser captures the current canvas directly for image export.",
    ],
    evidenceMode: "Seeded procedural canvas artwork",
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
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
  {
    slug: "sentinel-observatory",
    number: "08",
    title: "Sentinel Observatory",
    category: "Security",
    group: "Interactive simulations",
    description:
      "Rotate a synthetic threat globe and see how simulated incidents change the tactical picture.",
    interaction:
      "Drag to rotate the globe, tune the threat volume, and run a new sweep.",
    purpose:
      "Translate a moving incident stream into a spatial security picture that communicates concentration, severity, and response pressure.",
    steps: [
      "Drag the globe to inspect the simulated source regions and home node.",
      "Change threat volume and playback speed, then run a new sweep.",
      "Compare the incident arcs with the severity, region, and response readouts.",
    ],
    reading: [
      {
        label: "Incident arc",
        detail: "A simulated connection from a source region toward the monitored node.",
      },
      {
        label: "Severity",
        detail: "A visual priority signal, not proof that a real attack occurred.",
      },
      {
        label: "Tactical picture",
        detail: "A summary of concentration and pressure across the current synthetic sweep.",
      },
    ],
    architecture: [
      "Synthetic incidents are generated from a repeatable seeded scenario.",
      "Canvas projection converts latitude and longitude into a rotatable wireframe globe.",
      "The same event state drives arcs, severity styling, counters, and the incident feed.",
    ],
    evidenceMode: "Synthetic incident and geospatial visualization",
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
    boundaryTone: "scope",
    image: null,
    accent: "red",
  },
  {
    slug: "verdant",
    number: "09",
    title: "Verdant",
    category: "Living systems",
    group: "Generative systems",
    description:
      "Plant a procedural forest and see how rain and sunlight change its growth.",
    interaction: "Click the ground to plant, then shape the climate with rainfall and sunlight.",
    purpose:
      "Make the lag between planting, canopy growth, biodiversity, and carbon drawdown visible through a calm systems simulation.",
    steps: [
      "Click the ground to plant individual seeds or use the planting controls.",
      "Change rainfall and sunlight to create a different growing environment.",
      "Watch canopy, biodiversity, age, and illustrative carbon values change over time.",
    ],
    reading: [
      {
        label: "Canopy",
        detail: "The share of the simulated ground covered by mature tree crowns.",
      },
      {
        label: "Biodiversity",
        detail: "An illustrative index that rises as the forest becomes more varied.",
      },
      {
        label: "Carbon",
        detail: "A teaching estimate tied to simulated growth, not a credit calculation.",
      },
    ],
    architecture: [
      "Procedural rules grow each planted tree through visible life stages.",
      "Rainfall and sunlight modify growth rates and survival inside the local simulation.",
      "Canvas rendering and plain-language counters share the same ecosystem state.",
    ],
    evidenceMode: "Illustrative procedural ecology model",
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
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
  {
    slug: "lumen-city",
    number: "10",
    title: "Lumen City",
    category: "Simulation",
    group: "Interactive simulations",
    description:
      "Balance wind, solar, storage, and demand to keep a simulated city powered.",
    interaction: "Set the generation mix and weather; keep the city lit through the day.",
    purpose:
      "Teach the difference between installed renewable capacity, variable generation, storage, and demand through a playable grid.",
    steps: [
      "Set wind, solar, and battery capacity before starting the clock.",
      "Change the weather and follow demand as the city moves through the day.",
      "Use storage to cover shortfalls and keep the reliability indicator healthy.",
    ],
    reading: [
      {
        label: "Generation",
        detail: "What the selected wind and solar assets can produce right now.",
      },
      {
        label: "Demand",
        detail: "The city’s changing need for electricity across the simulated day.",
      },
      {
        label: "Storage",
        detail: "A finite bridge that can shift energy through time but cannot create it.",
      },
    ],
    architecture: [
      "A time-series model calculates variable generation and demand for each hour.",
      "A finite battery state charges on surplus and discharges during shortfalls.",
      "One shared simulation state drives the skyline, charts, alerts, and reliability score.",
    ],
    evidenceMode: "Simplified energy-balancing simulation",
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
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
  {
    slug: "continuum-engine",
    number: "11",
    title: "Continuum Engine",
    category: "Generative",
    group: "Generative systems",
    description:
      "Conduct a luminous topology made from thousands of agents, orbital attractors, and reproducible field rules.",
    interaction:
      "Choose a topology, bend its gravity, freeze time, and export your universe.",
    purpose:
      "Turn abstract vector mathematics into a tactile instrument where deterministic rules, emergence, and human intervention remain visible at the same time.",
    steps: [
      "Choose a field recipe or build one from topology, turbulence, symmetry, and velocity controls.",
      "Move or drag through the canvas to inject a temporary gravitational attractor.",
      "Freeze and step through time, regenerate from a named seed, or export the current universe.",
    ],
    reading: [
      {
        label: "Topology field",
        detail: "A vector function that gives every point in space a direction of travel.",
      },
      {
        label: "Tracer population",
        detail: "Thousands of short-lived agents reveal the otherwise invisible field through motion.",
      },
      {
        label: "Emergent structure",
        detail: "Braids, shells, voids, and orbits appear without being explicitly drawn.",
      },
    ],
    architecture: [
      "A seeded particle engine initializes up to 3,200 reproducible tracers and recycles them across finite lifetimes.",
      "Three continuous vector functions combine polar coordinates, lattice waves, rotational symmetry, and time-varying turbulence.",
      "Pointer gravity, live telemetry, reduced-motion rendering, frame stepping, and canvas export operate entirely client-side.",
    ],
    evidenceMode: "Seeded real-time vector-field synthesis",
    capabilities: [
      "Generative mathematics",
      "High-density Canvas rendering",
      "Interactive systems design",
      "Deterministic export",
    ],
    decisions: [
      "Use tracers instead of drawing curves directly so the image reveals the behavior of the system rather than illustrating a predefined composition.",
      "Separate deterministic initialization from pointer intervention so a universe can be reproduced before it becomes personal.",
      "Expose freeze and single-frame stepping to make a fast-moving generative process inspectable.",
    ],
    boundary:
      "Generative artwork and systems study. Telemetry describes the internal simulation only; it does not represent a physical scientific model.",
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
  {
    slug: "digital-biosphere",
    number: "12",
    title: "Digital Biosphere",
    category: "Living systems",
    group: "Generative systems",
    description:
      "Watch an autonomous ecology feed, hunt, reproduce, mutate, die, and recycle itself—then disturb its climate.",
    interaction:
      "Inspect a lineage, change the climate, introduce species, or trigger an ecological shock.",
    purpose:
      "Make artificial-life principles legible by exposing how local rules create population cycles, adaptation, collapse, and recovery.",
    steps: [
      "Let the ecosystem run and watch three species establish their own population rhythm.",
      "Select an organism to inspect its energy, age, generation, and inherited genome.",
      "Change rainfall or temperature, add a species, or trigger a drought, nutrient rain, or energy bloom.",
    ],
    reading: [
      {
        label: "Agents",
        detail:
          "Independent organisms sense nearby resources or prey and spend energy to move.",
      },
      {
        label: "Genome",
        detail:
          "Speed, sensing, efficiency, fertility, and color mutate as traits pass to offspring.",
      },
      {
        label: "Nutrient cycle",
        detail:
          "Death creates matter that recyclers return to the substrate, completing the food web.",
      },
    ],
    architecture: [
      "A deterministic agent engine updates sensing, steering, metabolism, predation, reproduction, mutation, aging, and decomposition every frame.",
      "Climate variables alter resource growth and metabolic pressure while event controls introduce discrete ecological shocks.",
      "Canvas rendering, lineage inspection, population history, accessibility fallbacks, and all state remain local to the browser.",
    ],
    evidenceMode: "Seeded agent-based artificial-life simulation",
    capabilities: [
      "Artificial life simulation",
      "Agent-based modeling",
      "Evolutionary systems",
      "Canvas data visualization",
    ],
    decisions: [
      "Use three interdependent trophic roles so population balance emerges from feedback rather than a scripted timeline.",
      "Expose inherited genomes and generation numbers so evolution is visible instead of implied.",
      "Let every corpse re-enter the resource cycle so death remains part of the system’s logic.",
    ],
    boundary:
      "Artificial-life artwork and educational systems model. Species, genetics, ecology, and metrics are synthetic and are not biological forecasts.",
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
];
