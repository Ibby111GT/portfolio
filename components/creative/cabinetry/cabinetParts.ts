// One frameless Division 6 base cabinet, modeled part by part the way a
// millwork manufacturer breaks it down. Dimensions in inches; y is up and
// positions are part centers relative to the cabinet's floor centerline.
// Spec language follows AWI custom-grade casework and the RGC operations
// workflow (submittal → approval → hold-to-size → CFP → production).

export type LockStage =
  | "Drafting"
  | "Submittal"
  | "Approval"
  | "Hold-to-size"
  | "CFP"
  | "Production";

export interface CabinetPart {
  id: string;
  name: string;
  /** w, h, d in inches. */
  size: [number, number, number];
  /** Center position in inches — x across, y up from floor, z toward viewer. */
  pos: [number, number, number];
  /** Direction the part travels in the exploded view, inches at full explode. */
  explode: [number, number, number];
  material: string;
  joinery: string;
  spec: string;
  workflow: string;
  lockStage: LockStage;
  holdToSize?: boolean;
}

// Unit: 36"W x 34.5"H case (+1.5" top) x 24"D frameless base cabinet.
export const UNIT = {
  tag: "UNIT B-36",
  title: "Base cabinet · frameless casework",
  grade: "AWI Custom Grade",
  section: "06 41 00",
  width: 36,
  height: 36,
  depth: 24,
};

export const CABINET_PARTS: CabinetPart[] = [
  {
    id: "toe-base",
    name: "Toe base",
    size: [33, 4, 20],
    pos: [0, 2, -1.5],
    explode: [0, -9, 0],
    material: "3/4″ exterior-grade plywood ladder frame",
    joinery: "Butt-screwed ladder, shipped loose",
    spec: "4″ high with a 3″ front setback. Ships as a separate ladder so the install crew can level it to the floor plane with shims and a laser before any case is set.",
    workflow: "Set and leveled in the field, then scribed. The bid qualifications require the space enclosed and conditioned before this or any finished part is delivered — that gate lives at Mobilization.",
    lockStage: "Production",
  },
  {
    id: "bottom-deck",
    name: "Bottom deck",
    size: [34.5, 0.75, 23.25],
    pos: [0, 4.375, 0.375],
    explode: [0, -4.5, 0],
    material: "3/4″ 45 lb particleboard core, HPL / PLAM interior",
    joinery: "Dowel + confirmat into both end panels",
    spec: "Captured between the end panels — the deck establishes the case's inside clear width. Edgebanded on the front edge only; interior faces are semi-exposed surfaces under AWI custom grade.",
    workflow: "Machined on the CNC from the certified cut list. Line bores and confirmat pilots come off the same program, which is why nothing is cut until the drawing set is CFP.",
    lockStage: "CFP",
  },
  {
    id: "side-left",
    name: "End panel · left",
    size: [0.75, 30.5, 24],
    pos: [-17.625, 19.25, 0],
    explode: [-11, 0, 0],
    material: "3/4″ particleboard core, HPL / PLAM both faces",
    joinery: "Dowel + confirmat, 32 mm system boring",
    spec: "Line-bored on the 32 mm system: 5 mm shelf-pin holes at 32 mm centers, front and rear rows. The same boring pattern locates hinge base plates, so door hardware lands without a separate setup.",
    workflow: "An exposed end gets a finished face and shows on the elevation; a wall end stays semi-exposed. Which one this is comes from the OA plan — tag consistency between plan, elevation, and finish list is a submittal checklist item.",
    lockStage: "Submittal",
  },
  {
    id: "side-right",
    name: "End panel · right",
    size: [0.75, 30.5, 24],
    pos: [17.625, 19.25, 0],
    explode: [11, 0, 0],
    material: "3/4″ particleboard core, HPL / PLAM both faces",
    joinery: "Dowel + confirmat, 32 mm system boring",
    spec: "Mirror of the left end. Frameless (full-access) construction means the ends, deck, and stretchers are the structure — there is no face frame carrying the doors.",
    workflow: "End panel dimensions ride on the certified case width. If the run terminates at a wall, the scribe filler — not this panel — absorbs the site's out-of-plumb.",
    lockStage: "Submittal",
  },
  {
    id: "back-panel",
    name: "Back panel",
    size: [34.5, 30.5, 0.375],
    pos: [0, 19.25, -11.6],
    explode: [0, 0, -13],
    material: "3/8″ ply, captured in a routed groove",
    joinery: "Dadoed into ends and deck, screwed to the hang rail",
    spec: "The back squares the case — it is what resists racking. A captured back (vs a stapled-on skin) is one of the visible differences between custom grade and economy grade casework.",
    workflow: "The case anchors through the back rail into wall blocking. In-wall blocking is a general exclusion — furnished by others — so its presence is confirmed during field verification, not assumed.",
    lockStage: "Approval",
  },
  {
    id: "stretcher-front",
    name: "Top stretcher · front",
    size: [34.5, 0.75, 4],
    pos: [0, 34.125, 9.6],
    explode: [0, 8, 0],
    material: "3/4″ particleboard core",
    joinery: "Dowel + confirmat into both ends",
    spec: "Front and rear stretchers replace a full top panel on base cabinets — they hold the case square and give the countertop crew something to fasten into from below.",
    workflow: "Stretcher layout is a drafting decision that never reaches the architect — it appears on shop drawings, not the submittal frontend. Internal construction is the fabricator's means and methods.",
    lockStage: "Drafting",
  },
  {
    id: "stretcher-rear",
    name: "Top stretcher · rear",
    size: [34.5, 0.75, 4],
    pos: [0, 34.125, -9.6],
    explode: [0, 8, -3],
    material: "3/4″ particleboard core",
    joinery: "Dowel + confirmat into both ends",
    spec: "Doubles as the upper hang rail: fastener line into the wall blocking runs through here and the back rail below.",
    workflow: "Fastening schedule (screw type, spacing, embedment into blocking) is an engineering call executed at install — documented, not improvised.",
    lockStage: "Drafting",
  },
  {
    id: "shelf",
    name: "Adjustable shelf",
    size: [34.25, 0.75, 21],
    pos: [0, 19.25, 0.5],
    explode: [0, 5.5, 5],
    material: "3/4″ particleboard core, HPL / PLAM both faces",
    joinery: "Loose — carried on four 5 mm shelf pins",
    spec: "Sized 1/8″ clear of the case interior so it drops in after finishing. AWI limits allowable shelf deflection; at a 34″ span a 3/4″ core stays inside the limit, which is why wider cases either thicken the shelf or split the bay.",
    workflow: "Shelf count per unit comes off the unit sheet — scope is what the contract lists, unit by unit. An extra shelf a superintendent asks for in the hallway is a change order, not a favor.",
    lockStage: "Approval",
  },
  {
    id: "door-left",
    name: "Door · left",
    size: [17.8, 30.25, 0.75],
    pos: [-8.975, 19.25, 12.5],
    explode: [-4, 0, 15],
    material: "3/4″ HPL / PLAM on particleboard, edgebanded 4 sides",
    joinery: "Concealed European cup hinges, 3 per door",
    spec: "Frameless doors run edge to edge with a 3 mm reveal on all sides — the shadow gap is the design. Cup hinges bore 35 mm into the door back and clip to plates on the 32 mm system rows; six-way adjustment trues the reveals at install.",
    workflow: "Door faces are what the architect approves: finish, grain direction, and reveal pattern all sit in the submittal volume. Approved-as-noted releases fabrication with compliance to the notes.",
    lockStage: "Approval",
  },
  {
    id: "door-right",
    name: "Door · right",
    size: [17.8, 30.25, 0.75],
    pos: [8.975, 19.25, 12.5],
    explode: [4, 0, 15],
    material: "3/4″ HPL / PLAM on particleboard, edgebanded 4 sides",
    joinery: "Concealed European cup hinges, 3 per door",
    spec: "Pair-matched to the left door so the reveal splits dead center. Plant edgebanding is glued and trimmed under machine pressure — a finish quality a jobsite edge trimmer cannot recreate.",
    workflow: "This is the argument behind the hold-to-size rule: the plant holds tolerances the field cannot. A field-cut door edge destroys the machine edge, so certified sizes are never modified on site without engineering sign-off.",
    lockStage: "Approval",
  },
  {
    id: "countertop",
    name: "Countertop",
    size: [37.5, 1.5, 25],
    pos: [0, 35.25, 0.5],
    explode: [0, 13, 0],
    material: "Solid surface on 3/4″ ply substrate",
    joinery: "Fastened from below through the stretchers",
    spec: "1″ overhang at the front, hard-seamed and polished so joints disappear. Solid surface is repairable by sanding — one reason it is specified over stone in hard-use commercial work.",
    workflow: "Top length is a hold-to-size dimension: it is fabricated to the certified field measurement, not to the contract drawing. Field verification feeds the hold-size sign-off; production cuts only after that gate clears.",
    lockStage: "Hold-to-size",
    holdToSize: true,
  },
  {
    id: "scribe",
    name: "Scribe filler",
    size: [3, 30.5, 0.75],
    pos: [20.15, 19.25, 12.5],
    explode: [10, 0, 8],
    material: "3/4″ HPL / PLAM-faced stock, oversized",
    joinery: "Field-scribed, cleated to the end panel",
    spec: "The sacrificial part. Walls are never plumb and corners are never square — the scribe is shipped fat and hand-fit to the wall profile so the cabinet run reads as a perfect line.",
    workflow: "Scribes exist so certified case dimensions never have to flex to the site. The building's error lands here by design — which is exactly how hold-to-size survives contact with a real jobsite.",
    lockStage: "Hold-to-size",
    holdToSize: true,
  },
];

export const WORKFLOW_STAGES: LockStage[] = [
  "Drafting",
  "Submittal",
  "Approval",
  "Hold-to-size",
  "CFP",
  "Production",
];
