"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import {
  Box,
  Boxes,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Layers3,
  MousePointer2,
  Pause,
  Play,
  ScanLine,
} from "lucide-react";
import {
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import {
  type MutableRefObject,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type BlueprintSystemId =
  | "cabinetry"
  | "wall-panels"
  | "wardrobe"
  | "wood-object"
  | "automotive";

type Vec3 = [number, number, number];
type CameraView = "perspective" | "front" | "top" | "section";
type Shape =
  | {
      kind: "box";
      args: [number, number, number];
      position: Vec3;
      rotation?: Vec3;
      scale?: Vec3;
    }
  | {
      kind: "cylinder";
      args: [number, number, number, number];
      position: Vec3;
      rotation?: Vec3;
      scale?: Vec3;
    }
  | {
      kind: "sphere";
      args: [number, number, number];
      position: Vec3;
      rotation?: Vec3;
      scale?: Vec3;
    }
  | {
      kind: "torus";
      args: [number, number, number, number];
      position: Vec3;
      rotation?: Vec3;
      scale?: Vec3;
    };

interface BlueprintPart {
  id: string;
  number: string;
  name: string;
  shortName: string;
  purpose: string;
  plainLanguage: string;
  material: string;
  connection: string;
  tolerance: string;
  install: string;
  check: string;
  value: string;
  gate: string;
  holdToSize?: boolean;
  accent: "cyan" | "amber";
  explode: Vec3;
  callout: Vec3;
  shapes: Shape[];
}

interface BlueprintSystem {
  id: BlueprintSystemId;
  code: string;
  title: string;
  subtitle: string;
  dimensions: string;
  discipline: string;
  plainOverview: string;
  parts: BlueprintPart[];
}

const box = (
  args: [number, number, number],
  position: Vec3,
  rotation?: Vec3,
  scale?: Vec3,
): Shape => ({ kind: "box", args, position, rotation, scale });
const cylinder = (
  args: [number, number, number, number],
  position: Vec3,
  rotation?: Vec3,
): Shape => ({ kind: "cylinder", args, position, rotation });
const sphere = (
  args: [number, number, number],
  position: Vec3,
  scale?: Vec3,
): Shape => ({ kind: "sphere", args, position, scale });
const SYSTEMS: Record<BlueprintSystemId, BlueprintSystem> = {
  cabinetry: {
    id: "cabinetry",
    code: "DIV 06 · CAB-B36",
    title: "Base Cabinet Construction Review",
    subtitle: "Division 6 architectural millwork",
    dimensions: '36″ W × 34½″ H × 24″ D',
    discipline: "AWI custom grade · frameless casework",
    plainOverview:
      "A cabinet is not one box. It is a controlled assembly of case panels, finished fronts, storage hardware, service clearances, and field-fit pieces.",
    parts: [
      {
        id: "cab-case",
        number: "01",
        name: "Carcass & Structural Panels",
        shortName: "Carcass",
        purpose: "Carries the countertop and transfers load to the floor.",
        plainLanguage:
          "This is the cabinet skeleton: two sides, a base, stretchers, and the fixed divider.",
        material: "¾″ particle-core melamine",
        connection: "Dowel + confirmat assembly",
        tolerance: "Case square within 1/32″",
        install: "Level, gang, then anchor",
        check: "Case squareness",
        value: "0.02″ delta",
        gate: "Certified for Production",
        accent: "cyan",
        explode: [-2.4, 0, 0],
        callout: [-2.4, 2.7, 0],
        shapes: [
          box([0.18, 4.4, 2.5], [-2.05, 0, 0]),
          box([0.18, 4.4, 2.5], [2.05, 0, 0]),
          box([4.28, 0.18, 2.5], [0, -2.1, 0]),
          box([4.28, 0.14, 2.5], [0, 2.1, 0]),
          box([0.16, 4.1, 2.2], [0, 0, -1.18]),
        ],
      },
      {
        id: "cab-fronts",
        number: "02",
        name: "Sequence-Matched Fronts",
        shortName: "Door fronts",
        purpose: "Creates the finished elevation and controls the reveal grid.",
        plainLanguage:
          "These are the visible faces. The grain must continue across both doors and every gap must read evenly.",
        material: "Rift walnut veneer / MDF core",
        connection: "Concealed soft-close hinges",
        tolerance: "3 mm reveal ±0.5 mm",
        install: "Hang after case alignment",
        check: "Reveal alignment",
        value: "3.0 mm",
        gate: "Approved submittal",
        accent: "amber",
        explode: [0, 0, 2.8],
        callout: [2.1, 1.9, 1.7],
        shapes: [
          box([1.93, 3.25, 0.16], [-1.02, 0.38, 1.34]),
          box([1.93, 3.25, 0.16], [1.02, 0.38, 1.34]),
        ],
      },
      {
        id: "cab-drawer",
        number: "03",
        name: "Drawer Box & Slides",
        shortName: "Drawer",
        purpose: "Provides accessible storage without loading the door hinges.",
        plainLanguage:
          "The drawer is a separate moving box riding on concealed slides. It must clear the doors and plumbing.",
        material: "½″ prefinished maple",
        connection: "Undermount full-extension slides",
        tolerance: "Slide spacing ±1/32″",
        install: "Set after case is fixed",
        check: "Slide synchronization",
        value: "100%",
        gate: "Hardware release",
        accent: "cyan",
        explode: [2.8, 0.3, 1.2],
        callout: [2.0, -0.7, 1.0],
        shapes: [
          box([1.7, 0.12, 1.8], [0, -0.45, 0.25]),
          box([0.12, 0.85, 1.8], [-0.8, -0.02, 0.25]),
          box([0.12, 0.85, 1.8], [0.8, -0.02, 0.25]),
          box([1.7, 0.85, 0.12], [0, -0.02, -0.6]),
        ],
      },
      {
        id: "cab-service",
        number: "04",
        name: "Service Chase & Back",
        shortName: "Service chase",
        purpose: "Keeps utilities accessible without cutting structural panels.",
        plainLanguage:
          "This rear zone reserves space for plumbing, power, and wall irregularities before the cabinet reaches site.",
        material: "¼″ back / reinforced rails",
        connection: "Recessed groove + screw rails",
        tolerance: "4″ clear service zone",
        install: "Coordinate before CFP",
        check: "Utility clearance",
        value: "Clear",
        gate: "MEP coordination",
        accent: "cyan",
        explode: [0, 0, -3],
        callout: [-1.8, 0.1, -1.5],
        shapes: [
          box([3.7, 0.18, 0.22], [0, 1.65, -1.05]),
          box([3.7, 0.18, 0.22], [0, -1.65, -1.05]),
        ],
      },
      {
        id: "cab-field-fit",
        number: "05",
        name: "Toe Kick, Scribe & Field Fit",
        shortName: "Field fit",
        purpose: "Reconciles the manufactured cabinet with the actual room.",
        plainLanguage:
          "These pieces absorb uneven floors and walls. Their final size comes from verified field measurements.",
        material: "Finished plywood / matching veneer",
        connection: "Clip-on toe + site-scribed filler",
        tolerance: "Hold to verified opening",
        install: "Cut only from certified size",
        check: "Field dimension",
        value: "HTS required",
        gate: "Hold-to-size",
        holdToSize: true,
        accent: "amber",
        explode: [0, -2.4, 0.6],
        callout: [-2.3, -2.6, 0.8],
        shapes: [
          box([4.1, 0.72, 0.16], [0, -2.0, 1.05]),
          box([0.2, 4.35, 2.45], [2.28, 0, 0]),
        ],
      },
    ],
  },
  "wall-panels": {
    id: "wall-panels",
    code: "DIV 06 · WP-L30",
    title: "Architectural Wall Panel Review",
    subtitle: "Linear timber / acoustic wall system",
    dimensions: "12′ W × 9′ H · 24″ modules",
    discipline: "Concealed rail · 12 mm reveal",
    plainOverview:
      "The finish wall is a layered system: building substrate, leveling rails, acoustic backing, timber modules, and serviceable lighting.",
    parts: [
      {
        id: "panel-substrate",
        number: "01",
        name: "Wall Substrate",
        shortName: "Substrate",
        purpose: "Provides the structural plane receiving the panel system.",
        plainLanguage:
          "This is the existing wall. Every later layer depends on it being surveyed for flatness and fixing locations.",
        material: "GWB over metal stud framing",
        connection: "Fasteners into verified studs",
        tolerance: "Plane within ⅛″ over 10′",
        install: "Survey before layout",
        check: "Wall flatness",
        value: "0.09″",
        gate: "Field survey",
        accent: "cyan",
        explode: [0, 0, -2.8],
        callout: [-3.3, 2.7, -0.5],
        shapes: [box([7.2, 5, 0.16], [0, 0, -1.25])],
      },
      {
        id: "panel-rails",
        number: "02",
        name: "Concealed Mounting Rails",
        shortName: "Mounting rails",
        purpose: "Levels the system and transfers panel weight to structure.",
        plainLanguage:
          "The rails create a straight reference plane even when the building wall is not perfectly straight.",
        material: "Black anodized aluminum",
        connection: "Shimmed structural anchors",
        tolerance: "Rail plane ±1 mm",
        install: "Set from laser datum",
        check: "Rail alignment",
        value: "±0.6 mm",
        gate: "Backing verified",
        accent: "cyan",
        explode: [-2.5, 0, -1.2],
        callout: [-3.1, 1.4, -0.4],
        shapes: [-2, -0.7, 0.7, 2].map((y) =>
          box([6.8, 0.08, 0.12], [0, y, -1.05]),
        ),
      },
      {
        id: "panel-acoustic",
        number: "03",
        name: "Acoustic Backing",
        shortName: "Acoustic felt",
        purpose: "Absorbs reflected sound behind the open slat pattern.",
        plainLanguage:
          "The black felt is both the visual shadow behind the timber and the sound-absorbing layer.",
        material: "12 mm recycled PET felt",
        connection: "Pressure adhesive + rail capture",
        tolerance: "Seams hidden behind slats",
        install: "After rail inspection",
        check: "Acoustic NRC",
        value: "0.81",
        gate: "Material approval",
        accent: "amber",
        explode: [0, 0, -1.8],
        callout: [2.8, 2.3, -0.2],
        shapes: [box([7, 4.8, 0.09], [0, 0, -0.88])],
      },
      {
        id: "panel-slats",
        number: "04",
        name: "Timber Slat Modules",
        shortName: "Slat modules",
        purpose: "Creates the visible rhythm and protects the acoustic layer.",
        plainLanguage:
          "These repeatable timber strips form the finished elevation. Module joints are aligned to look intentional.",
        material: "White oak veneer / MDF",
        connection: "Concealed clip to rail",
        tolerance: "12 mm reveal ±0.5 mm",
        install: "Centerline-out sequence",
        check: "Module rhythm",
        value: "24″ repeat",
        gate: "Finish sample approved",
        accent: "amber",
        explode: [0, 0, 2.6],
        callout: [3.4, 1.0, 0.6],
        shapes: Array.from({ length: 15 }, (_, index) =>
          box([0.27, 4.65, 0.2], [-3.25 + index * 0.465, 0, -0.68]),
        ),
      },
      {
        id: "panel-light",
        number: "05",
        name: "LED Reveal & Access",
        shortName: "LED reveal",
        purpose: "Provides integrated light while remaining replaceable.",
        plainLanguage:
          "The light channel is detailed as a serviceable part, not permanently buried behind the finish.",
        material: "Aluminum profile / opal lens",
        connection: "Magnetic access trim",
        tolerance: "Continuous 12 mm light line",
        install: "Test before closure",
        check: "Driver access",
        value: "Serviceable",
        gate: "Electrical test",
        accent: "cyan",
        explode: [2.8, 0, 1],
        callout: [2.1, -2.5, 0.4],
        shapes: [
          box([0.08, 4.7, 0.1], [-1.4, 0, -0.48]),
          box([0.08, 4.7, 0.1], [1.4, 0, -0.48]),
        ],
      },
    ],
  },
  wardrobe: {
    id: "wardrobe",
    code: "DIV 06 · WR-144",
    title: "Wardrobe Assembly Review",
    subtitle: "Modular architectural storage",
    dimensions: '144″ W × 96″ H × 24″ D',
    discipline: "32 mm system · door-switched lighting",
    plainOverview:
      "The wardrobe is divided into fixed casework, adjustable storage, moving drawers, hanging hardware, and low-voltage lighting.",
    parts: [
      {
        id: "wardrobe-case",
        number: "01",
        name: "Wardrobe Carcass",
        shortName: "Carcass",
        purpose: "Defines the structural bays and carries all storage loads.",
        plainLanguage:
          "These vertical divisions turn one long wall into stable modules that can be leveled and installed independently.",
        material: "¾″ prefinished plywood",
        connection: "Dowel + confirmat",
        tolerance: "Bay width ±1/32″",
        install: "Level from highest floor point",
        check: "Case plumb",
        value: "0.04°",
        gate: "Certified for Production",
        accent: "cyan",
        explode: [-2.4, 0, 0],
        callout: [-3.0, 2.9, 0],
        shapes: [
          ...[-3, -1, 1, 3].map((x) => box([0.14, 5.2, 2.2], [x, 0, 0])),
          box([6.15, 0.14, 2.2], [0, 2.55, 0]),
          box([6.15, 0.14, 2.2], [0, -2.55, 0]),
          box([6.1, 5.0, 0.1], [0, 0, -1.05]),
        ],
      },
      {
        id: "wardrobe-hang",
        number: "02",
        name: "Hanging Hardware",
        shortName: "Hanging rails",
        purpose: "Supports short- and long-hang clothing loads.",
        plainLanguage:
          "The rails are positioned around real garment clearances so clothes do not drag on drawers or shelves.",
        material: "Polished aluminum oval tube",
        connection: "Side-mounted sockets",
        tolerance: "Rail level ±1 mm",
        install: "After cases are ganged",
        check: "Design load",
        value: "75 lb / rail",
        gate: "Hardware release",
        accent: "amber",
        explode: [0, 0, 2.4],
        callout: [-2.4, 1.8, 1.2],
        shapes: [
          cylinder([0.06, 0.06, 1.7, 16], [-2, 1.1, 0.7], [0, 0, Math.PI / 2]),
          cylinder([0.06, 0.06, 1.7, 16], [0, 1.1, 0.7], [0, 0, Math.PI / 2]),
        ],
      },
      {
        id: "wardrobe-drawers",
        number: "03",
        name: "Drawer Stack",
        shortName: "Drawers",
        purpose: "Organizes folded clothing and small accessories.",
        plainLanguage:
          "Four independent drawer boxes ride on concealed slides and maintain the same reveal from top to bottom.",
        material: "½″ maple box / veneer front",
        connection: "Undermount soft-close slides",
        tolerance: "2 mm front reveal",
        install: "Tune after cabinet anchorage",
        check: "Running clearance",
        value: "1.5 mm / side",
        gate: "Hardware release",
        accent: "cyan",
        explode: [2.7, -0.3, 1.5],
        callout: [2.4, -0.8, 1.1],
        shapes: [-1.4, -0.65, 0.1, 0.85].map((y) =>
          box([1.72, 0.62, 0.92], [0, y, 0.55]),
        ),
      },
      {
        id: "wardrobe-shelves",
        number: "04",
        name: "Adjustable Shelving",
        shortName: "Shelves",
        purpose: "Allows the storage layout to change after installation.",
        plainLanguage:
          "The shelves use a 32 mm hole grid, so their positions can change without drilling new holes.",
        material: "¾″ veneer panel",
        connection: "5 mm locking shelf pins",
        tolerance: "32 mm system grid",
        install: "Set from storage schedule",
        check: "Shelf deflection",
        value: "< 1/8″",
        gate: "Interior schedule",
        accent: "amber",
        explode: [0, 2.4, 0.8],
        callout: [2.8, 2.1, 0.8],
        shapes: [1.5, 0.35, -0.8].map((y) =>
          box([1.72, 0.1, 2.0], [2, y, 0]),
        ),
      },
      {
        id: "wardrobe-light",
        number: "05",
        name: "Integrated Lighting",
        shortName: "Lighting",
        purpose: "Illuminates each bay without visible wiring.",
        plainLanguage:
          "Vertical LED channels switch on with the door and remain accessible from the top service zone.",
        material: "24 V LED / aluminum channel",
        connection: "Door switch + remote driver",
        tolerance: "2700 K color match",
        install: "Test before fronts",
        check: "Light output",
        value: "420 lm / bay",
        gate: "Electrical test",
        accent: "cyan",
        explode: [2.6, 0, 1.8],
        callout: [3.25, 2.7, 1.1],
        shapes: [-2.82, -0.82, 1.18, 2.82].map((x) =>
          box([0.04, 4.6, 0.05], [x, 0, 1.12]),
        ),
      },
    ],
  },
  "wood-object": {
    id: "wood-object",
    code: "OBJ 04 · CANTILEVER CONSOLE",
    title: "Wood Object Joinery Review",
    subtitle: "Furniture-scale fabrication study",
    dimensions: '60″ W × 30″ H × 16″ D',
    discipline: "Solid timber · concealed joinery",
    plainOverview:
      "The console is separated into its load-bearing top, leg frames, anti-racking structure, drawer, and removable hardware.",
    parts: [
      {
        id: "object-top",
        number: "01",
        name: "Sequence-Matched Top",
        shortName: "Top slab",
        purpose: "Provides the primary work surface and bridges both leg frames.",
        plainLanguage:
          "The top is built from matched boards so the grain reads as one continuous surface.",
        material: "1¼″ solid white oak",
        connection: "Slotted figure-eight fasteners",
        tolerance: "Flat within 1/16″",
        install: "Allow seasonal movement",
        check: "Moisture content",
        value: "7.2%",
        gate: "Lumber conditioning",
        accent: "amber",
        explode: [0, 2.6, 0],
        callout: [-2.8, 1.8, 0.3],
        shapes: [box([6.2, 0.24, 2.1], [0, 1.7, 0])],
      },
      {
        id: "object-legs",
        number: "02",
        name: "Leg Frames",
        shortName: "Leg frames",
        purpose: "Transfers the top load to the floor.",
        plainLanguage:
          "Two rigid frames carry the console. Their slight angle makes the object stable without looking heavy.",
        material: "Laminated white oak",
        connection: "Loose tenon joinery",
        tolerance: "Leg pair within 0.25°",
        install: "Dry-fit before glue",
        check: "Frame square",
        value: "0.03″ delta",
        gate: "Bench assembly",
        accent: "cyan",
        explode: [-2.7, -0.2, 0],
        callout: [-3.0, -0.8, 0],
        shapes: [
          box([0.28, 3.2, 0.35], [-2.55, 0, -0.72], [0, 0, -0.08]),
          box([0.28, 3.2, 0.35], [-2.55, 0, 0.72], [0, 0, 0.08]),
          box([0.28, 3.2, 0.35], [2.55, 0, -0.72], [0, 0, 0.08]),
          box([0.28, 3.2, 0.35], [2.55, 0, 0.72], [0, 0, -0.08]),
        ],
      },
      {
        id: "object-stretcher",
        number: "03",
        name: "Anti-Racking Stretcher",
        shortName: "Stretcher",
        purpose: "Prevents the long console from swaying sideways.",
        plainLanguage:
          "This hidden rail ties both leg frames together and keeps them parallel under side loads.",
        material: "Solid oak",
        connection: "Wedged through-tenon",
        tolerance: "Shoulder gap < 0.2 mm",
        install: "Glue during frame assembly",
        check: "Racking movement",
        value: "< 0.5 mm",
        gate: "Dry-fit inspection",
        accent: "cyan",
        explode: [0, 0, -2.3],
        callout: [0, -0.8, -1.2],
        shapes: [box([5.1, 0.26, 0.28], [0, -0.3, -0.4])],
      },
      {
        id: "object-drawer",
        number: "04",
        name: "Floating Drawer",
        shortName: "Drawer",
        purpose: "Adds concealed storage without thickening the entire top.",
        plainLanguage:
          "A shallow drawer hangs below the top and appears independent from the leg frames.",
        material: "Maple dovetail box / oak front",
        connection: "Wood runners + stop",
        tolerance: "0.8 mm running clearance",
        install: "Wax and tune after finish",
        check: "Drawer travel",
        value: "Smooth",
        gate: "Final assembly",
        accent: "amber",
        explode: [0, -1.2, 2.7],
        callout: [1.7, 0.8, 1.2],
        shapes: [
          box([2.7, 0.52, 1.5], [1.2, 1.25, 0.15]),
          box([2.85, 0.64, 0.12], [1.2, 1.25, 0.95]),
        ],
      },
      {
        id: "object-hardware",
        number: "05",
        name: "Levelers & Hardware",
        shortName: "Hardware",
        purpose: "Protects the floor and stabilizes the object on uneven surfaces.",
        plainLanguage:
          "Small threaded feet provide the final adjustment after the wood structure is complete.",
        material: "Blackened brass / felt",
        connection: "Threaded insert",
        tolerance: "6 mm adjustment range",
        install: "Level at final placement",
        check: "Four-point bearing",
        value: "Stable",
        gate: "Final QC",
        accent: "cyan",
        explode: [2.8, -1.8, 0],
        callout: [3.0, -1.8, 0.7],
        shapes: [
          cylinder([0.13, 0.13, 0.18, 16], [-2.55, -1.67, -0.72]),
          cylinder([0.13, 0.13, 0.18, 16], [-2.55, -1.67, 0.72]),
          cylinder([0.13, 0.13, 0.18, 16], [2.55, -1.67, -0.72]),
          cylinder([0.13, 0.13, 0.18, 16], [2.55, -1.67, 0.72]),
        ],
      },
    ],
  },
  automotive: {
    id: "automotive",
    code: "APX-01 · VEHICLE PACKAGE",
    title: "Hypercar Systems Review",
    subtitle: "Carbon monocoque / active aero",
    dimensions: "4.72 m L × 2.02 m W × 1.12 m H",
    discipline: "Mid-engine vehicle architecture",
    plainOverview:
      "The vehicle is organized into its safety cell, body and aero surfaces, rolling assemblies, powertrain, and thermal system.",
    parts: [
      {
        id: "car-monocoque",
        number: "01",
        name: "Carbon Safety Cell",
        shortName: "Monocoque",
        purpose: "Protects the occupants and carries suspension loads.",
        plainLanguage:
          "This rigid center tub is the car's backbone. Every major system attaches to it.",
        material: "Prepreg carbon / aluminum cores",
        connection: "Bonded + titanium hardpoints",
        tolerance: "Hardpoints ±0.15 mm",
        install: "Primary datum assembly",
        check: "Torsional stiffness",
        value: "42 kNm/deg",
        gate: "Structural sign-off",
        accent: "cyan",
        explode: [-2.6, 0, 0],
        callout: [-2.6, 1.6, 0],
        shapes: [
          box([3.3, 0.65, 1.65], [-0.3, 0, 0]),
          box([1.7, 0.8, 1.45], [1.7, 0.1, 0]),
          box([1.1, 0.45, 1.35], [-2.25, -0.05, 0]),
        ],
      },
      {
        id: "car-body",
        number: "02",
        name: "Aero Body Surfaces",
        shortName: "Body surfaces",
        purpose: "Shapes airflow while enclosing the vehicle package.",
        plainLanguage:
          "The outer skin turns incoming air into cooling flow and downforce instead of drag.",
        material: "Thin-wall carbon composite",
        connection: "Quarter-turn service fasteners",
        tolerance: "Flushness ±0.4 mm",
        install: "Gap-and-flush station",
        check: "Surface continuity",
        value: "Class A",
        gate: "Aero correlation",
        accent: "amber",
        explode: [0, 2.5, 0],
        callout: [0.7, 1.8, 1.2],
        shapes: [
          sphere([1, 32, 20], [-0.3, 0.35, 0], [2.8, 0.75, 1.55]),
          sphere([1, 24, 16], [2.15, 0.35, 0], [1.55, 0.58, 1.38]),
          sphere([1, 24, 16], [-2.5, 0.1, 0], [1.25, 0.42, 1.25]),
        ],
      },
      {
        id: "car-wheels",
        number: "03",
        name: "Wheel & Brake Assemblies",
        shortName: "Wheel assemblies",
        purpose: "Transfers drive, braking, and cornering loads to the road.",
        plainLanguage:
          "Four wheel modules combine tire, rim, brake disc, and suspension upright.",
        material: "Forged magnesium / carbon ceramic",
        connection: "Center-lock hub",
        tolerance: "Runout < 0.08 mm",
        install: "Corner-weight calibration",
        check: "Brake temperature",
        value: "410°C",
        gate: "Chassis setup",
        accent: "cyan",
        explode: [0, -0.4, 3],
        callout: [-2.2, -1.2, 1.8],
        shapes: [
          ...[-2.15, 2.0].flatMap((x) =>
            [-1.35, 1.35].map((z) =>
              cylinder([0.72, 0.72, 0.34, 32], [x, -0.48, z], [
                Math.PI / 2,
                0,
                0,
              ]),
            ),
          ),
        ],
      },
      {
        id: "car-powertrain",
        number: "04",
        name: "Hybrid Power Unit",
        shortName: "Power unit",
        purpose: "Generates propulsion and stores recovered braking energy.",
        plainLanguage:
          "The engine and electric motor share one rear module so torque can be blended instantly.",
        material: "Aluminum block / copper windings",
        connection: "Rear cradle + HV bus",
        tolerance: "Shaft alignment < 0.05 mm",
        install: "Install as tested module",
        check: "System output",
        value: "1,180 hp",
        gate: "Dyno acceptance",
        accent: "amber",
        explode: [2.7, 0.2, -0.4],
        callout: [2.8, 0.8, -0.7],
        shapes: [
          box([1.4, 0.85, 1.3], [1.65, 0.1, 0]),
          cylinder([0.5, 0.5, 0.8, 24], [2.45, 0.1, 0], [
            Math.PI / 2,
            0,
            0,
          ]),
        ],
      },
      {
        id: "car-aero",
        number: "05",
        name: "Active Aero & Cooling",
        shortName: "Aero / cooling",
        purpose: "Balances downforce, drag, and thermal rejection.",
        plainLanguage:
          "Movable wings and cooling doors change position based on speed, braking, and temperature.",
        material: "Carbon aerofoils / aluminum cores",
        connection: "Electromechanical actuators",
        tolerance: "Position feedback ±0.2°",
        install: "Calibrate in aero map",
        check: "Track downforce",
        value: "860 kg",
        gate: "Control calibration",
        accent: "cyan",
        explode: [0, 0, -3],
        callout: [2.6, 1.5, -1.4],
        shapes: [
          box([1.8, 0.08, 2.25], [3.1, 0.85, 0], [0, 0, -0.08]),
          box([0.5, 0.12, 2.5], [-3.1, -0.45, 0]),
          box([4.8, 0.12, 0.25], [0, -0.65, -1.05]),
        ],
      },
    ],
  },
};

const VIEW_POSITIONS: Record<CameraView, Vec3> = {
  perspective: [8.5, 5.5, 10],
  front: [0, 0.2, 12],
  top: [0, 12, 0.01],
  section: [12, 0.5, 0.1],
};

function WireMaterial({
  color,
  opacity,
  wireframe,
  scanning,
}: {
  color: string;
  opacity: number;
  wireframe: boolean;
  scanning: boolean;
}) {
  const ref = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity },
      uScan: { value: scanning ? 1 : 0.18 },
    }),
    [color, opacity, scanning],
  );
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value += delta;
    ref.current.uniforms.uOpacity.value = MathUtils.damp(
      ref.current.uniforms.uOpacity.value,
      opacity,
      8,
      delta,
    );
    ref.current.uniforms.uScan.value = MathUtils.damp(
      ref.current.uniforms.uScan.value,
      scanning ? 1 : 0.18,
      6,
      delta,
    );
  });
  return (
    <shaderMaterial
      ref={ref}
      uniforms={uniforms}
      wireframe={wireframe}
      transparent
      depthWrite={false}
      blending={AdditiveBlending}
      vertexShader={`
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `}
      fragmentShader={`
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uScan;
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          float pulse = 0.82 + 0.18 * sin(uTime * 2.2);
          float stripe = pow(max(0.0, sin((vPosition.y - uTime * 0.65) * 20.0)), 18.0) * uScan;
          float facing = 0.62 + 0.38 * abs(vNormal.z);
          gl_FragColor = vec4(uColor * (pulse * facing + stripe * 1.8), uOpacity * facing + stripe * 0.25);
        }
      `}
    />
  );
}

function ShapeMesh({
  shape,
  color,
  opacity,
  wireframe,
  scanning,
}: {
  shape: Shape;
  color: string;
  opacity: number;
  wireframe: boolean;
  scanning: boolean;
}) {
  return (
    <mesh
      position={shape.position}
      rotation={shape.rotation ?? [0, 0, 0]}
      scale={shape.scale ?? [1, 1, 1]}
    >
      {shape.kind === "box" ? <boxGeometry args={shape.args} /> : null}
      {shape.kind === "cylinder" ? (
        <cylinderGeometry args={shape.args} />
      ) : null}
      {shape.kind === "sphere" ? <sphereGeometry args={shape.args} /> : null}
      {shape.kind === "torus" ? <torusGeometry args={shape.args} /> : null}
      <WireMaterial
        color={color}
        opacity={opacity}
        wireframe={wireframe}
        scanning={scanning}
      />
    </mesh>
  );
}

function PartGroup({
  part,
  explode,
  selected,
  isolated,
  wireframe,
  scanning,
  onSelect,
}: {
  part: BlueprintPart;
  explode: number;
  selected: boolean;
  isolated: boolean;
  wireframe: boolean;
  scanning: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<Group>(null);
  const opacity = isolated && !selected ? 0.06 : selected ? 0.98 : 0.5;
  const color = part.accent === "amber" ? "#ff9900" : "#00f3ff";
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.x = MathUtils.damp(
      ref.current.position.x,
      part.explode[0] * explode,
      5,
      delta,
    );
    ref.current.position.y = MathUtils.damp(
      ref.current.position.y,
      part.explode[1] * explode,
      5,
      delta,
    );
    ref.current.position.z = MathUtils.damp(
      ref.current.position.z,
      part.explode[2] * explode,
      5,
      delta,
    );
  });
  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(part.id);
  }
  return (
    <group ref={ref} onClick={select}>
      {part.shapes.map((shape, index) => (
        <ShapeMesh
          key={`${part.id}-${index}`}
          shape={shape}
          color={color}
          opacity={opacity}
          wireframe={wireframe}
          scanning={scanning}
        />
      ))}
      <Html position={part.callout} center distanceFactor={9} zIndexRange={[20, 0]}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(part.id);
          }}
          className={`flex min-w-max items-center gap-2 rounded-full border px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] backdrop-blur-md transition-colors ${
            selected
              ? "border-[#00f3ff]/70 bg-[#001b22]/90 text-white"
              : "border-white/15 bg-black/70 text-white/55 hover:border-[#00f3ff]/50 hover:text-white"
          }`}
        >
          <span
            className={`grid h-4 w-4 place-items-center rounded-full ${
              part.accent === "amber"
                ? "bg-[#ff9900] text-black"
                : "bg-[#00f3ff] text-black"
            }`}
          >
            {part.number}
          </span>
          {part.shortName}
        </button>
      </Html>
    </group>
  );
}

function Dust() {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(450 * 3);
    for (let index = 0; index < 450; index += 1) {
      const seed = index * 12.9898;
      values[index * 3] = Math.sin(seed) * 10;
      values[index * 3 + 1] = Math.sin(seed * 1.41) * 7;
      values[index * 3 + 2] = Math.cos(seed * 0.77) * 9;
    }
    return values;
  }, []);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.006;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#00f3ff"
        size={0.016}
        transparent
        opacity={0.25}
        depthWrite={false}
      />
    </points>
  );
}

function CameraRig({ view }: { view: CameraView }) {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(...VIEW_POSITIONS[view]), [view]);
  const moving = useRef(true);
  useEffect(() => {
    moving.current = true;
  }, [view]);
  useFrame((_, delta) => {
    if (!moving.current) return;
    camera.position.lerp(target, 1 - Math.exp(-delta * 5));
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(target) < 0.03) moving.current = false;
  });
  return null;
}

function Model({
  system,
  selectedId,
  explode,
  isolated,
  wireframe,
  scanning,
  autoRotate,
  view,
  onSelect,
  modelRef,
}: {
  system: BlueprintSystem;
  selectedId: string;
  explode: number;
  isolated: boolean;
  wireframe: boolean;
  scanning: boolean;
  autoRotate: boolean;
  view: CameraView;
  onSelect: (id: string) => void;
  modelRef: MutableRefObject<Group | null>;
}) {
  const root = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!root.current) return;
    root.current.rotation.y = MathUtils.damp(
      root.current.rotation.y,
      state.pointer.x * 0.06,
      4,
      delta,
    );
    root.current.rotation.x = MathUtils.damp(
      root.current.rotation.x,
      state.pointer.y * 0.04,
      4,
      delta,
    );
  });
  return (
    <>
      <CameraRig view={view} />
      <Dust />
      <group ref={root}>
        <group ref={modelRef}>
          {system.parts.map((part) => (
            <PartGroup
              key={part.id}
              part={part}
              explode={explode}
              selected={selectedId === part.id}
              isolated={isolated}
              wireframe={wireframe}
              scanning={scanning}
              onSelect={onSelect}
            />
          ))}
        </group>
      </group>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={17}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
      />
    </>
  );
}

function ControlButton({
  active,
  label,
  icon,
  onClick,
  disabled,
}: {
  active?: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[11px] transition-colors disabled:cursor-wait disabled:opacity-40 ${
        active
          ? "border-[#00f3ff]/45 bg-[#00f3ff]/10 text-white"
          : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function BlueprintSpatialViewer({
  system: systemId,
}: {
  system: BlueprintSystemId;
}) {
  const system = SYSTEMS[systemId];
  const [selectedId, setSelectedId] = useState(system.parts[0].id);
  const [explode, setExplode] = useState(0);
  const [isolated, setIsolated] = useState(false);
  const [wireframe, setWireframe] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [view, setView] = useState<CameraView>("perspective");
  const [scan, setScan] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const modelRef = useRef<Group | null>(null);
  const selected =
    system.parts.find((part) => part.id === selectedId) ?? system.parts[0];

  useEffect(() => {
    setSelectedId(system.parts[0].id);
    setExplode(0);
    setIsolated(false);
  }, [system]);

  useEffect(() => {
    if (!scan) return;
    setScanProgress(0);
    const timer = window.setInterval(() => {
      setScanProgress((previous) => {
        const next = previous + 2;
        if (next >= 100) {
          window.clearInterval(timer);
          setScan(false);
          return 100;
        }
        return next;
      });
    }, 35);
    return () => window.clearInterval(timer);
  }, [scan]);

  async function exportModel() {
    if (!modelRef.current || exporting) return;
    setExporting(true);
    try {
      const { OBJExporter } = await import(
        "three/examples/jsm/exporters/OBJExporter.js"
      );
      modelRef.current.updateWorldMatrix(true, true);
      const output = new OBJExporter().parse(modelRef.current);
      const url = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${system.id}-assembly.obj`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#04090c]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 bg-[#071015] px-5 py-5 md:px-7">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#00f3ff]/55">
            3D construction review · {system.code}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {system.title}
          </h2>
          <p className="mt-1 text-xs text-white/40">{system.subtitle}</p>
        </div>
        <div className="text-right font-mono text-[9px] uppercase tracking-[0.13em] text-white/30">
          <p>{system.dimensions}</p>
          <p className="mt-1 text-[#00f3ff]/50">{system.discipline}</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.65fr)_420px]">
        <div className="relative min-h-[600px] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_48%,rgba(0,243,255,0.08),transparent_34%),linear-gradient(rgba(0,243,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.025)_1px,transparent_1px)] bg-[size:auto,36px_36px,36px_36px] md:min-h-[720px] xl:border-b-0 xl:border-r">
          <Canvas
            camera={{ position: VIEW_POSITIONS.perspective, fov: 43 }}
            dpr={[1, 1.7]}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.14} />
            <pointLight position={[5, 6, 6]} color="#00f3ff" intensity={1.1} />
            <pointLight position={[-4, -3, 4]} color="#ff9900" intensity={0.65} />
            <Model
              system={system}
              selectedId={selectedId}
              explode={explode}
              isolated={isolated}
              wireframe={wireframe}
              scanning={scan}
              autoRotate={autoRotate}
              view={view}
              onSelect={setSelectedId}
              modelRef={modelRef}
            />
          </Canvas>

          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 aspect-square w-[38%] max-w-[340px] -translate-x-1/2 -translate-y-1/2">
              <div className="h-full w-full rounded-full border border-dashed border-[#00f3ff]/10 animate-[hudSpin_22s_linear_infinite]" />
            </div>
            <span className="absolute left-1/2 top-1/2 h-24 w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-[#00f3ff]/35 to-transparent" />
            <span className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#00f3ff]/35 to-transparent" />
            {scan ? (
              <span
                className="absolute inset-x-0 h-px bg-[#00f3ff] shadow-[0_0_18px_3px_rgba(0,243,255,0.7)] transition-[top] duration-75"
                style={{ top: `${scanProgress}%` }}
              />
            ) : null}
          </div>

          <div className="absolute left-4 top-4 z-10 max-w-[270px] rounded-xl border border-[#00f3ff]/15 bg-[#001017]/75 p-3 backdrop-blur-md md:left-6 md:top-6">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#00f3ff]/60">
              What you are looking at
            </p>
            <p className="mt-2 text-[11px] leading-5 text-white/55">
              {system.plainOverview}
            </p>
          </div>

          <div className="absolute bottom-5 left-5 z-10 max-w-xs rounded-xl border border-white/10 bg-black/65 p-3 backdrop-blur-md md:bottom-6 md:left-6">
            <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/35">
              <MousePointer2 size={10} /> Drag to orbit · scroll to zoom
            </p>
          </div>

          <div className="absolute bottom-5 right-5 z-10 flex gap-1 rounded-xl border border-white/10 bg-black/70 p-1 backdrop-blur-md md:bottom-6 md:right-6">
            {(["perspective", "front", "top", "section"] as CameraView[]).map(
              (cameraView) => (
                <button
                  key={cameraView}
                  type="button"
                  onClick={() => setView(cameraView)}
                  aria-pressed={view === cameraView}
                  className={`rounded-lg px-2.5 py-2 font-mono text-[8px] uppercase tracking-[0.1em] ${
                    view === cameraView
                      ? "bg-[#00f3ff]/12 text-[#00f3ff]"
                      : "text-white/35 hover:text-white"
                  }`}
                >
                  {cameraView}
                </button>
              ),
            )}
          </div>
        </div>

        <aside className="bg-[#070c10]">
          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Assembly index
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Numbers match the 3D callouts
                </p>
              </div>
              <Boxes size={17} className="text-[#00f3ff]/55" />
            </div>
            <div className="mt-4 space-y-1.5">
              {system.parts.map((part) => (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => setSelectedId(part.id)}
                  aria-pressed={selectedId === part.id}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    selectedId === part.id
                      ? "border-[#00f3ff]/35 bg-[#00f3ff]/[0.07]"
                      : "border-white/[0.06] hover:border-white/15"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-[10px] font-bold ${
                      part.accent === "amber"
                        ? "bg-[#ff9900]/12 text-[#ffb23e]"
                        : "bg-[#00f3ff]/10 text-[#00f3ff]"
                    }`}
                  >
                    {part.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-white/70">
                      {part.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/30">
                      {part.check} · {part.value}
                    </span>
                  </span>
                  <ChevronRight
                    size={13}
                    className={
                      selectedId === part.id
                        ? "text-[#00f3ff]"
                        : "text-white/15"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.17em] text-[#00f3ff]/55">
                  Selected · {selected.number}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {selected.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsolated((value) => !value)}
                aria-pressed={isolated}
                aria-label={isolated ? "Show full assembly" : "Isolate selected part"}
                className={`rounded-lg border p-2 ${
                  isolated
                    ? "border-[#00f3ff]/40 bg-[#00f3ff]/10 text-[#00f3ff]"
                    : "border-white/10 text-white/35 hover:text-white"
                }`}
              >
                {isolated ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>

            {selected.holdToSize ? (
              <span className="mt-3 inline-flex rounded bg-red-500/15 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.13em] text-red-300">
                Hold-to-size · field verification required
              </span>
            ) : null}

            <div className="mt-4 rounded-xl border border-[#ff9900]/15 bg-[#ff9900]/[0.035] p-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#ffb23e]/60">
                In plain language
              </p>
              <p className="mt-2 text-xs leading-5 text-white/60">
                {selected.plainLanguage}
              </p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
              {[
                ["Purpose", selected.purpose],
                ["Material", selected.material],
                ["Connection", selected.connection],
                ["Tolerance", selected.tolerance],
                ["Install sequence", selected.install],
                ["Release gate", selected.gate],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/25">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[11px] leading-4 text-white/55">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 px-4 py-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/30">
                {selected.check}
              </span>
              <span className="font-mono text-sm text-[#00f3ff]">
                {selected.value}
              </span>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <label className="block">
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-white/35">
                  <Layers3 size={12} /> Exploded assembly
                </span>
                <span className="font-mono text-[10px] text-[#00f3ff]">
                  {Math.round(explode * 100)}%
                </span>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={explode * 100}
                onChange={(event) =>
                  setExplode(Number(event.target.value) / 100)
                }
                className="mt-3 w-full accent-cyan-400"
              />
              <span className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">
                <span>Assembled</span>
                <span>Service spacing</span>
              </span>
            </label>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <ControlButton
                active={wireframe}
                label="Wireframe"
                icon={<Box size={14} />}
                onClick={() => setWireframe((value) => !value)}
              />
              <ControlButton
                active={autoRotate}
                label={autoRotate ? "Pause orbit" : "Auto orbit"}
                icon={autoRotate ? <Pause size={14} /> : <Play size={14} />}
                onClick={() => setAutoRotate((value) => !value)}
              />
              <ControlButton
                active={scan}
                label={scan ? `Scanning ${scanProgress}%` : "Scan model"}
                icon={<ScanLine size={14} />}
                onClick={() => {
                  if (!scan) setScan(true);
                }}
                disabled={scan}
              />
              <ControlButton
                label={exporting ? "Preparing…" : "Export OBJ"}
                icon={<Download size={14} />}
                onClick={() => void exportModel()}
                disabled={exporting}
              />
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-4">
        {[
          ["01 · SELECT", "Choose a numbered assembly."],
          ["02 · UNDERSTAND", "Read the plain-language purpose first."],
          ["03 · INSPECT", "Isolate, orbit, section, or explode."],
          ["04 · RELEASE", "Confirm tolerance and workflow gate."],
        ].map(([label, copy]) => (
          <div key={label} className="bg-[#050a0d] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#00f3ff]/55">
              {label}
            </p>
            <p className="mt-2 text-[10px] leading-4 text-white/35">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
