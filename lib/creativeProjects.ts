export type CreativeCategory =
  | "Cabinetry"
  | "Wall systems"
  | "Wardrobes"
  | "Product design"
  | "Automotive"
  | "Simulation"
  | "Generative"
  | "Security"
  | "Living systems"
  | "Life simulation"
  | "Arcade driving"
  | "RPG systems"
  | "Character animation"
  | "First-person exploration";

export type CreativeGroup =
  | "Design & fabrication"
  | "Interactive simulations"
  | "Generative systems"
  | "Playable worlds";

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
      "Bend the field with your pointer, or switch the attractor on and steer it with the X and Y sliders.",
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
      "Pointer or keyboard attractor gravity, live telemetry, a resize-stable composition, reduced-motion static rendering with frame stepping, and PNG export all run client-side.",
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
      "Canvas rendering, lineage inspection, population history, reduced-motion time stepping, keyboard lineage cycling, and live status announcements all remain local to the browser.",
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
  {
    slug: "murmuration",
    number: "13",
    title: "Murmuration",
    category: "Living systems",
    group: "Generative systems",
    description:
      "Conduct a leaderless flock whose collective motion emerges from alignment, cohesion, separation, and fear.",
    interaction:
      "Tune the flock rules, place a predator, pause the field, or export a frame.",
    purpose:
      "Make swarm intelligence visible by showing how independent agents create coordinated motion from only local information.",
    steps: [
      "Adjust cohesion and separation to change the flock’s social behavior.",
      "Click the field to place a predator and force a collective response.",
      "Pause, regenerate, or export the resulting formation.",
    ],
    reading: [
      { label: "Alignment", detail: "Each agent turns toward nearby headings." },
      { label: "Cohesion", detail: "Neighbors pull one another toward a local center." },
      { label: "Separation", detail: "Short-range repulsion prevents collisions." },
    ],
    architecture: [
      "A deterministic boids engine evaluates local neighborhoods every frame.",
      "A predator field adds a moving repulsive force without scripting the flock’s escape path.",
      "A shared DPR-aware canvas stage preserves agents through resizes and supports reduced motion.",
    ],
    evidenceMode: "Real-time agent-based flock simulation",
    capabilities: ["Swarm algorithms", "Vector mathematics", "Canvas systems", "Interactive art"],
    decisions: [
      "Keep every agent autonomous so global formations remain emergent.",
      "Use a visible predator radius to explain the disturbance without over-labeling the field.",
    ],
    boundary:
      "Generative systems study; behavior is algorithmic and does not model a specific animal population.",
    image: null,
    accent: "blue",
  },
  {
    slug: "automata-atlas",
    number: "14",
    title: "Automata Atlas",
    category: "Generative",
    group: "Generative systems",
    description:
      "Paint a field of cells, change its neighborhood rules, and watch order, oscillation, and collapse emerge.",
    interaction:
      "Choose a rule family, paint cells, pause, step one generation, or export the grid.",
    purpose:
      "Turn cellular automata from an abstract algorithm into a laboratory for emergence, stability, and rule comparison.",
    steps: [
      "Choose Conway Life, HighLife, Seeds, or tune the thresholds.",
      "Click cells to alter the current population.",
      "Pause and step once to inspect a single generational transition.",
    ],
    reading: [
      { label: "Cell state", detail: "Each cell is either living or inactive." },
      { label: "Neighborhood", detail: "Eight adjacent cells determine the next state." },
      { label: "Generation", detail: "Every cell updates simultaneously from the same prior grid." },
    ],
    architecture: [
      "A toroidal grid stores cell state in a compact typed array.",
      "Preset and tunable birth/survival rules share one deterministic transition engine.",
      "Direct painting, pause, single-step, resize, and export remain local to the browser.",
    ],
    evidenceMode: "Interactive cellular-automata engine",
    capabilities: ["Cellular automata", "Typed arrays", "State transitions", "Algorithm visualization"],
    decisions: [
      "Expose single-generation stepping so cause and effect can be inspected.",
      "Use wraparound boundaries so edge cells follow the same rules as the center.",
    ],
    boundary:
      "Algorithmic exploration; patterns are mathematical states rather than biological forecasts.",
    image: null,
    accent: "blue",
  },
  {
    slug: "load-path",
    number: "15",
    title: "Load Path",
    category: "Simulation",
    group: "Generative systems",
    description:
      "Move a force across an architectural frame and watch tension and compression redistribute instantly.",
    interaction:
      "Choose a frame, move the load, change its magnitude, and export the stress composition.",
    purpose:
      "Explain structural load transfer with a visual, inspectable approximation that connects geometry to internal force.",
    steps: [
      "Choose a bridge, cantilever, or tower frame.",
      "Click the span or move the load-position control.",
      "Increase the load and watch member color and thickness respond.",
    ],
    reading: [
      { label: "Blue members", detail: "Axial tension from the joint-equilibrium solve; intensity tracks force." },
      { label: "Red members", detail: "Axial compression from the same solve; intensity tracks force." },
      { label: "Load arrow", detail: "The applied point force driving the current distribution." },
    ],
    architecture: [
      "Three hand-authored determinate topologies — bridge, cantilever, and tower — each with its own supports.",
      "Member forces come from a method-of-joints equilibrium solve, recomputed by Gaussian elimination on every control change.",
      "Canvas rendering maps force sign and magnitude to a consistent blue/red visual language with support glyphs.",
    ],
    evidenceMode: "Interactive method-of-joints truss solver",
    capabilities: ["Graph modeling", "Vector forces", "Engineering visualization", "Parametric systems"],
    decisions: [
      "Separate tension and compression by both hue and thickness.",
      "Keep the model deliberately inspectable instead of presenting opaque finite-element output.",
    ],
    boundary:
      "Educational approximation only—not structural analysis, engineering advice, or a basis for construction.",
    image: null,
    accent: "red",
  },
  {
    slug: "terraform",
    number: "16",
    title: "Terraform",
    category: "Living systems",
    group: "Generative systems",
    description:
      "Shape a micro-climate where rain flows downhill, terrain erodes, water gathers, and vegetation responds.",
    interaction:
      "Select a climate, adjust rain and heat, then click the terrain to drop a local storm.",
    purpose:
      "Show how coupled environmental variables produce landscape change without scripting the final composition.",
    steps: [
      "Choose a basin, plateau, or delta climate.",
      "Adjust rainfall and temperature to change water and plant pressure.",
      "Click the terrain to add a storm and watch water find lower ground.",
    ],
    reading: [
      { label: "Elevation", detail: "Procedural terrain controls the direction of water flow." },
      { label: "Water", detail: "Rain accumulates, moves toward lower cells, and evaporates." },
      { label: "Vegetation", detail: "Growth responds to moisture, elevation, and temperature stress." },
    ],
    architecture: [
      "Seeded procedural terrain initializes elevation and vegetation fields.",
      "A grid simulation updates rainfall, downhill flow, erosion, evaporation, and growth.",
      "Local storm input and climate controls disturb the same continuous system.",
    ],
    evidenceMode: "Procedural micro-climate simulation",
    capabilities: ["Procedural terrain", "Environmental modeling", "Grid simulation", "Generative systems"],
    decisions: [
      "Couple water and vegetation so the artwork has memory and feedback.",
      "Make storms spatial inputs rather than global decoration.",
    ],
    boundary:
      "Generative environmental artwork; values are synthetic and not a climate, hydrology, or land-use forecast.",
    image: null,
    accent: "blue",
  },
  {
    slug: "blocktown-stories",
    number: "17",
    title: "Blocktown Stories",
    category: "Life simulation",
    group: "Playable worlds",
    description:
      "Run a tiny block-built neighborhood where residents manage energy, food, friendship, and fun on their own.",
    interaction:
      "Inspect residents, change the pace of time, add a community space, or start a street festival.",
    purpose:
      "Demonstrate autonomous decision-making, needs-based behavior, time simulation, and readable world state through a playful life-simulation interface.",
    steps: [
      "Select a resident to inspect their current need, destination, and daily routine.",
      "Change the simulation speed and watch residents choose where to go without scripted paths.",
      "Add a park or café, then start a street festival to change the neighborhood’s behavior.",
    ],
    reading: [
      {
        label: "Need bars",
        detail:
          "Food, energy, friendship, and fun decline over time and influence each resident’s next destination.",
      },
      {
        label: "Daily routine",
        detail:
          "Residents choose a suitable building, travel there, and recover the need that matters most.",
      },
      {
        label: "Town event",
        detail:
          "A temporary festival increases social activity and changes how the shared spaces are used.",
      },
    ],
    architecture: [
      "A needs-based agent system continuously ranks goals for every resident.",
      "A block-grid town model maps each building type to the needs it can satisfy.",
      "Time, path movement, resident inspection, building placement, and event state run entirely in the browser.",
    ],
    evidenceMode: "Deterministic needs-based life simulation",
    capabilities: [
      "Agent decision systems",
      "Simulation state management",
      "Canvas world rendering",
      "Interactive game UI",
    ],
    decisions: [
      "Expose each resident’s current motive so autonomous behavior remains understandable.",
      "Use short, repeatable routines instead of pretending to simulate a complete human life.",
      "Let new buildings change agent choices so player input has a visible systemic effect.",
    ],
    boundary:
      "Playful systems prototype. Residents, needs, routines, and outcomes are fictional and intentionally simplified.",
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
  {
    slug: "slipstream-circuit",
    number: "18",
    title: "Slipstream Circuit",
    category: "Arcade driving",
    group: "Playable worlds",
    description:
      "Drive a blocky time-trial car, tune its grip and power, chase clean laps, and build a drift score.",
    interaction:
      "Steer with the keyboard or touch controls, adjust the car, enable autopilot, and reset the run.",
    purpose:
      "Show real-time vehicle input, simplified handling physics, collision recovery, lap tracking, and touch-friendly game controls in one browser experience.",
    steps: [
      "Use the arrow keys, WASD, or the on-screen controls to steer, accelerate, brake, and boost.",
      "Adjust grip and engine output to change how quickly the car rotates and accelerates.",
      "Complete a clean lap manually or enable autopilot to inspect the reference racing line.",
    ],
    reading: [
      {
        label: "Racing line",
        detail:
          "The dashed blue guide shows the stable reference path around the circuit.",
      },
      {
        label: "Drift score",
        detail:
          "Points increase when the car moves quickly while its heading and travel direction diverge.",
      },
      {
        label: "Track limits",
        detail:
          "Leaving the paved ring reduces speed and triggers recovery when the car travels too far away.",
      },
    ],
    architecture: [
      "A fixed-step vehicle model combines throttle, braking, steering, grip, drag, and boost.",
      "Elliptical track-distance checks power limits, recovery, checkpoint progress, and lap timing.",
      "Keyboard, pointer, and touch input feed the same control state for consistent play.",
    ],
    evidenceMode: "Real-time arcade vehicle simulation",
    capabilities: [
      "Game input systems",
      "Vehicle-motion modeling",
      "Collision and lap logic",
      "Responsive controls",
    ],
    decisions: [
      "Favor readable arcade handling over an opaque or falsely realistic tire model.",
      "Provide autopilot as an inspectable reference rather than making it the default.",
      "Keep touch controls visible so the experience remains playable without a keyboard.",
    ],
    boundary:
      "Arcade driving prototype with fictional performance values; it is not a vehicle-dynamics or driver-training model.",
    boundaryTone: "scope",
    image: null,
    accent: "red",
  },
  {
    slug: "lantern-vale",
    number: "19",
    title: "Lantern Vale",
    category: "RPG systems",
    group: "Playable worlds",
    description:
      "Explore a compact blocky quest, recover three lost echoes, speak with the keeper, and unlock the valley gate.",
    interaction:
      "Move with the keyboard or directional controls, collect echoes, interact with characters, and finish the quest.",
    purpose:
      "Demonstrate tile-map logic, collision rules, quest state, inventory, character interaction, and accessible game controls without relying on a game engine.",
    steps: [
      "Move through the map with the arrow keys, WASD, or the directional buttons.",
      "Collect all three blue echoes while avoiding unstable red tiles.",
      "Speak with the keeper, travel to the gate, and use the interaction control to complete the quest.",
    ],
    reading: [
      {
        label: "Blue echoes",
        detail:
          "Collectible quest items that update the inventory and unlock the final objective.",
      },
      {
        label: "Red rifts",
        detail:
          "Hazard tiles that cost one heart and return the hero to the last safe tile.",
      },
      {
        label: "Quest log",
        detail:
          "A short state machine explains the next objective and records completion.",
      },
    ],
    architecture: [
      "A compact tile map stores walls, walkable ground, hazards, characters, collectibles, and the exit gate.",
      "A deterministic movement reducer handles collision, inventory, damage, dialogue, and quest transitions.",
      "Keyboard and on-screen controls share the same movement and interaction commands.",
    ],
    evidenceMode: "Playable tile-based RPG systems prototype",
    capabilities: [
      "Tile-map systems",
      "Finite-state quests",
      "Collision and inventory logic",
      "Accessible game controls",
    ],
    decisions: [
      "Keep the quest deliberately small so every state transition can be inspected in one visit.",
      "Use color, shape, and text labels together so important tiles do not depend on color alone.",
      "Make the on-screen directional pad equal to the keyboard path instead of treating mobile as a passive preview.",
    ],
    boundary:
      "Original miniature game prototype. The story, characters, map, and rules are fictional.",
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
  {
    slug: "frameforge",
    number: "20",
    title: "Frameforge",
    category: "Character animation",
    group: "Playable worlds",
    description:
      "Direct a blocky character rig through idle, run, jump, and attack states while inspecting every animation frame.",
    interaction:
      "Choose an animation state, tune timing and exaggeration, scrub the frames, randomize the rig, or export a pose.",
    purpose:
      "Make an animation state machine, procedural posing, frame timing, and sprite-oriented art direction visible in a compact indie-production tool.",
    steps: [
      "Choose idle, run, jump, or attack to change the active animation state.",
      "Adjust frame rate and exaggeration, then select individual timeline frames to inspect the pose.",
      "Randomize the character proportions or export the current frame as an image.",
    ],
    reading: [
      {
        label: "State machine",
        detail:
          "Each named action uses a distinct set of timing, body, arm, and leg rules.",
      },
      {
        label: "Timeline",
        detail:
          "Eight selectable frames reveal how the current motion changes over one animation cycle.",
      },
      {
        label: "Procedural rig",
        detail:
          "A small set of body proportions and joint offsets creates every visible pose.",
      },
    ],
    architecture: [
      "A finite animation state machine selects the pose function for the active action.",
      "Procedural joint transforms calculate body bounce, limb rotation, squash, and anticipation for each frame.",
      "Timeline scrubbing, playback speed, reduced motion, rig randomization, and image export remain client-side.",
    ],
    evidenceMode: "Procedural character-animation workbench",
    capabilities: [
      "Animation state machines",
      "Procedural posing",
      "Timeline interaction",
      "Sprite-style art direction",
    ],
    decisions: [
      "Expose named states and discrete frames so the animation logic is readable instead of hidden behind a video.",
      "Use a blocky rig to emphasize motion and silhouette over illustration detail.",
      "Let timing and exaggeration change the same rig so animation trade-offs remain easy to compare.",
    ],
    boundary:
      "Original animation prototype. Export produces a single reference frame rather than a production-ready sprite sheet.",
    boundaryTone: "scope",
    image: null,
    accent: "red",
  },
  {
    slug: "echo-maze",
    number: "21",
    title: "Echo Maze",
    category: "First-person exploration",
    group: "Playable worlds",
    description:
      "Escape a first-person maze: collect glowing echo cores, stun patrol drones with a pulse, and find the exit gate.",
    interaction:
      "Move with the keyboard or touch controls, fire the stun pulse, toggle the minimap, and generate new mazes.",
    purpose:
      "Show that a convincing 3D world can be built from pure mathematics — one ray of trigonometry per screen column — with no 3D engine, no textures, and no external libraries.",
    steps: [
      "Click the view to focus it, then move with WASD or the arrow keys.",
      "Collect all five blue echo cores while avoiding the red patrol drones, or stun them with the Space-bar pulse.",
      "Find the white gate to finish the run, then try a larger maze or a new seed.",
    ],
    reading: [
      {
        label: "Raycast walls",
        detail:
          "Every vertical strip of wall is one ray traced through the maze grid; distance sets its height and light falloff.",
      },
      {
        label: "Echo cores and drones",
        detail:
          "Sprites are projected into the same perspective and hidden correctly behind walls using a per-column depth buffer.",
      },
      {
        label: "Minimap",
        detail:
          "A live top-down view of the same world state, drawn into a corner of the canvas for orientation.",
      },
    ],
    architecture: [
      "A seeded recursive-backtracker generates each maze, ranks dead-ends by breadth-first distance, and places the exit, echoes, and patrols deterministically.",
      "A DDA raycaster renders walls column by column with a depth buffer that also occludes billboard sprites.",
      "Keyboard input is scoped to the focused stage, touch controls mirror it, and reduced motion switches the whole game to turn-based stepping.",
    ],
    evidenceMode: "Seeded first-person raycasting engine",
    capabilities: [
      "Raycasting mathematics",
      "Game-loop architecture",
      "Procedural level generation",
      "Accessible game input",
    ],
    decisions: [
      "Render with grid raycasting instead of WebGL so the entire 3D illusion stays readable in a few hundred lines of plain TypeScript.",
      "Make reduced motion a turn-based mode — every press moves the world one beat — rather than disabling the game.",
      "Score runs in moves, not seconds, so keyboard, touch, and turn-based players compete on the same measure.",
    ],
    boundary:
      "Original game prototype. The renderer favors clarity over texture detail, and progress resets with each new maze seed.",
    boundaryTone: "scope",
    image: null,
    accent: "blue",
  },
];
