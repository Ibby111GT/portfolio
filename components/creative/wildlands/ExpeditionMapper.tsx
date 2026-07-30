"use client";

import {
  Bug,
  Car,
  Download,
  ExternalLink,
  Footprints,
  Leaf,
  MapPin,
  Mountain,
  MousePointer2,
  Navigation,
  PawPrint,
  RadioTower,
  RotateCcw,
  Route,
  Ruler,
  ShieldAlert,
  Timer,
  Trees,
  Waves,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LeafletExpeditionMap from "./LeafletExpeditionMap";
import {
  PARKS,
  ROUTE_COLORS,
  ROUTE_LABELS,
  type Coordinate,
  type RouteKind,
  type SpeciesCategory,
} from "./parkData";
import {
  appleMapsUrl,
  downloadTextFile,
  elevationDelta,
  estimatedHours,
  formatDuration,
  generateGpx,
  generateKml,
  googleMapsUrl,
  routeDistanceMiles,
  slugify,
} from "./routeExport";

const SPECIES_FILTERS: Array<{
  id: "all" | SpeciesCategory;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "wildlife", label: "Wildlife" },
  { id: "plants", label: "Plants" },
  { id: "bugs", label: "Bugs" },
];

const ROUTE_ICONS: Record<RouteKind, typeof Car> = {
  drive: Car,
  hike: Footprints,
  water: Waves,
};

/**
 * Elevation for one coordinate, taken from the nearest vertex across ALL of
 * the park's routes. Custom-built routes snap their waypoints to any visible
 * trail, so sampling only the selected route's profile (the old approach)
 * reported terrain from a trail the route never touched.
 */
function elevationForPoint(
  park: (typeof PARKS)[number],
  point: Coordinate,
): number {
  let best = 0;
  let bestDistance = Infinity;
  for (const route of park.routes) {
    const coords = route.geometry.coordinates;
    const profile = route.properties.elevations;
    if (!coords.length || !profile.length) continue;
    for (let index = 0; index < coords.length; index += 1) {
      const deltaLng = coords[index][0] - point[0];
      const deltaLat = coords[index][1] - point[1];
      const distance = deltaLng * deltaLng + deltaLat * deltaLat;
      if (distance < bestDistance) {
        bestDistance = distance;
        const profileIndex =
          coords.length === 1
            ? 0
            : Math.round((index / (coords.length - 1)) * (profile.length - 1));
        best = profile[profileIndex] ?? 0;
      }
    }
  }
  return best;
}

function ElevationProfile({ elevations }: { elevations: number[] }) {
  if (elevations.length < 2) {
    return (
      <div className="grid h-28 place-items-center rounded-xl border border-dashed border-white/15 text-center text-xs text-white/35">
        Add two route points to calculate terrain.
      </div>
    );
  }
  const minimum = Math.min(...elevations);
  const maximum = Math.max(...elevations);
  const range = Math.max(1, maximum - minimum);

  return (
    <div
      className="relative flex h-28 items-end gap-1 overflow-hidden rounded-xl border border-white/10 bg-[#091019] px-3 pb-6 pt-3"
      aria-label={`Elevation profile from ${minimum} to ${maximum} meters`}
    >
      <div className="absolute inset-x-3 top-3 border-t border-dashed border-white/10" />
      <div className="absolute inset-x-3 top-1/2 border-t border-dashed border-white/10" />
      {elevations.map((elevation, index) => (
        <span
          key={`${elevation}-${index}`}
          className="relative z-10 min-w-1 flex-1 rounded-t-sm bg-gradient-to-t from-blue-500/35 to-blue-300"
          style={{ height: `${20 + ((elevation - minimum) / range) * 62}%` }}
          title={`${elevation} m`}
        />
      ))}
      <span className="absolute bottom-1.5 left-3 font-mono text-[8px] text-white/35">
        START · {minimum} M
      </span>
      <span className="absolute bottom-1.5 right-3 font-mono text-[8px] text-white/35">
        PEAK · {maximum} M
      </span>
    </div>
  );
}

function ExportModal({
  name,
  points,
  mode,
  onClose,
}: {
  name: string;
  points: Coordinate[];
  mode: RouteKind;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const filename = slugify(name);
  const googleUrl = googleMapsUrl(points, mode);
  const appleUrl = appleMapsUrl(points, mode);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter(
        (element) =>
          element.getAttribute("aria-disabled") !== "true" &&
          !element.hasAttribute("hidden"),
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !dialogRef.current?.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-black/80 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1118] p-6 shadow-2xl shadow-black md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        aria-describedby="export-description"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-blue-300">
              Route export engine
            </p>
            <h3 id="export-title" className="mt-2 text-2xl font-semibold text-white">
              Export expedition
            </h3>
            <p
              id="export-description"
              className="mt-2 text-sm leading-6 text-white/50"
            >
              The GPX and KML downloads carry every waypoint. Map links are
              approximations: Google Maps accepts the first 8 waypoints, Apple
              Maps only the start and end.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Close export dialog"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 p-4 text-white transition-colors hover:border-blue-400/50 hover:bg-blue-400/5"
          >
            <Navigation size={20} />
            <span className="mt-3 flex items-center justify-between text-sm font-medium">
              Google Maps <ExternalLink size={14} />
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-wide text-white/35">
              First 8 waypoints
            </span>
          </a>
          <a
            href={appleUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/10 p-4 text-white transition-colors hover:border-blue-400/50 hover:bg-blue-400/5"
          >
            <MapPin size={20} />
            <span className="mt-3 flex items-center justify-between text-sm font-medium">
              Apple Maps <ExternalLink size={14} />
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-wide text-white/35">
              Start &amp; end only
            </span>
          </a>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `${filename}.gpx`,
                generateGpx(name, points),
                "application/gpx+xml",
              )
            }
            className="rounded-xl border border-white/10 p-4 text-left text-white transition-colors hover:border-blue-400/50 hover:bg-blue-400/5"
          >
            <Download size={20} />
            <span className="mt-3 flex items-center justify-between text-sm font-medium">
              Download GPX <span className="font-mono text-[9px] text-white/35">GARMIN</span>
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-wide text-white/35">
              Every waypoint
            </span>
          </button>
          <button
            type="button"
            onClick={() =>
              downloadTextFile(
                `${filename}.kml`,
                generateKml(name, points),
                "application/vnd.google-earth.kml+xml",
              )
            }
            className="rounded-xl border border-white/10 p-4 text-left text-white transition-colors hover:border-blue-400/50 hover:bg-blue-400/5"
          >
            <Download size={20} />
            <span className="mt-3 flex items-center justify-between text-sm font-medium">
              Download KML <span className="font-mono text-[9px] text-white/35">EARTH</span>
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-wide text-white/35">
              Every waypoint
            </span>
          </button>
        </div>
        <p className="mt-5 text-[11px] leading-5 text-white/35">
          Portfolio demonstration data only. Confirm official trail conditions
          and closures before real-world travel. Kayak tracks retain their
          coordinates, while consumer map links fall back to walking mode.
        </p>
      </div>
    </div>
  );
}

export default function ExpeditionMapper() {
  const [parkId, setParkId] = useState(PARKS[0].id);
  const park = PARKS.find((candidate) => candidate.id === parkId) ?? PARKS[0];
  const initialRoute =
    park.routes.find((candidate) => candidate.properties.kind === "hike") ??
    park.routes[0];
  const [selectedRouteId, setSelectedRouteId] = useState(initialRoute.properties.id);
  const selectedRoute =
    park.routes.find((candidate) => candidate.properties.id === selectedRouteId) ??
    initialRoute;
  const [routePoints, setRoutePoints] = useState<Coordinate[]>(
    initialRoute.geometry.coordinates,
  );
  const [movement, setMovement] = useState<RouteKind>(
    initialRoute.properties.kind,
  );
  const [layers, setLayers] = useState({
    drive: true,
    hike: true,
    water: true,
    stations: true,
  });
  const [buildMode, setBuildMode] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState<
    "all" | SpeciesCategory
  >("all");
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  // Species interaction is layered: a click pins one species' habitat zone
  // (tracked by species id, since zones are shared between species), a hover
  // or focus previews without disturbing the pin, and the route-driven zone
  // underneath remains the fallback.
  const [pinnedSpecies, setPinnedSpecies] = useState<{
    id: string;
    zone: string;
  } | null>(null);
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const closeExport = useCallback(() => setExportOpen(false), []);

  function handleParkChange(nextParkId: string) {
    const nextPark =
      PARKS.find((candidate) => candidate.id === nextParkId) ?? PARKS[0];
    const nextRoute =
      nextPark.routes.find((candidate) => candidate.properties.kind === "hike") ??
      nextPark.routes[0];
    setParkId(nextPark.id);
    setSelectedRouteId(nextRoute.properties.id);
    setRoutePoints(nextRoute.geometry.coordinates);
    setMovement(nextRoute.properties.kind);
    setBuildMode(false);
    setHighlightedZone(null);
    setPinnedSpecies(null);
    setHoverZone(null);
  }

  function handleRouteSelect(routeId: string) {
    const nextRoute = park.routes.find(
      (candidate) => candidate.properties.id === routeId,
    );
    if (!nextRoute) return;
    setSelectedRouteId(nextRoute.properties.id);
    setRoutePoints(nextRoute.geometry.coordinates);
    setMovement(nextRoute.properties.kind);
    setBuildMode(false);
    setHighlightedZone(nextRoute.properties.zone);
  }

  const handleWaypointAdd = useCallback((coordinate: Coordinate) => {
    setRoutePoints((previous) => {
      const last = previous[previous.length - 1];
      if (
        last &&
        Math.abs(last[0] - coordinate[0]) < 0.000001 &&
        Math.abs(last[1] - coordinate[1]) < 0.000001
      ) {
        return previous;
      }
      return [...previous, coordinate];
    });
  }, []);

  const telemetry = useMemo(() => {
    const distance = routeDistanceMiles(routePoints);
    const elevations = routePoints.map((point) =>
      elevationForPoint(park, point),
    );
    const delta = elevationDelta(elevations);
    return {
      distance,
      elevations,
      ...delta,
      duration: formatDuration(estimatedHours(distance, movement)),
    };
  }, [movement, routePoints, park]);

  const filteredSpecies = park.species.filter(
    (species) => speciesFilter === "all" || species.category === speciesFilter,
  );
  const displayedZone = hoverZone ?? pinnedSpecies?.zone ?? highlightedZone;
  const exportName = `${park.name} — ${selectedRoute.properties.name}`;

  return (
    <section
      id="expedition-mapper"
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#070b10] text-white"
    >
      <div className="border-b border-white/10 px-5 py-5 md:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-blue-300">
              Spatial intelligence system · GIS-06
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-4xl">
              National Park Expedition Mapper
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
              Explore a park, inspect route layers, build a snapped expedition,
              read its terrain, then export it to the field.
            </p>
          </div>
          <label className="block min-w-[250px]">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
              Active park
            </span>
            <select
              value={parkId}
              onChange={(event) => handleParkChange(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60"
            >
              {PARKS.map((candidate) => (
                <option key={candidate.id} value={candidate.id} className="bg-[#111827]">
                  {candidate.name} · {candidate.state}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.06] px-4 py-3"
          role="note"
        >
          <ShieldAlert
            size={16}
            className="mt-0.5 shrink-0 text-red-300"
            aria-hidden="true"
          />
          <p className="text-[11px] leading-5 text-white/60">
            Planning demonstration — not an official National Park Service map.
            Verify current alerts, closures, permits, weather, and emergency
            guidance before travel.{" "}
            <a
              href="https://www.nps.gov/findapark/index.htm"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-red-200 underline decoration-red-300/40 underline-offset-2 hover:text-white"
            >
              Check official NPS park information ↗
            </a>
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.85fr)_minmax(360px,1fr)]">
        <div className="relative min-h-[620px] border-b border-white/10 xl:border-b-0 xl:border-r">
          <LeafletExpeditionMap
            park={park}
            layers={layers}
            selectedRouteId={selectedRouteId}
            routePoints={routePoints}
            buildMode={buildMode}
            highlightedZone={displayedZone}
            onRouteSelect={handleRouteSelect}
            onWaypointAdd={handleWaypointAdd}
          />

          <div className="absolute left-4 right-4 top-4 z-[500] flex flex-wrap gap-2">
            {(["drive", "hike", "water"] as RouteKind[]).map((kind) => {
              const Icon = ROUTE_ICONS[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={layers[kind]}
                  onClick={() =>
                    setLayers((previous) => ({
                      ...previous,
                      [kind]: !previous[kind],
                    }))
                  }
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium backdrop-blur transition-colors ${
                    layers[kind]
                      ? "border-white/20 bg-[#071019]/90 text-white"
                      : "border-white/10 bg-[#071019]/75 text-white/35"
                  }`}
                >
                  <Icon size={13} style={{ color: ROUTE_COLORS[kind] }} />
                  {ROUTE_LABELS[kind]}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={layers.stations}
              onClick={() =>
                setLayers((previous) => ({
                  ...previous,
                  stations: !previous.stations,
                }))
              }
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium backdrop-blur transition-colors ${
                layers.stations
                  ? "border-white/20 bg-[#071019]/90 text-white"
                  : "border-white/10 bg-[#071019]/75 text-white/35"
              }`}
            >
              <RadioTower size={13} className="text-blue-300" />
              Ranger & emergency
            </button>
          </div>
        </div>

        <aside className="max-h-none overflow-y-auto bg-[#0a0f16] xl:max-h-[780px]">
          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Active route
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  {selectedRoute.properties.name}
                </h3>
              </div>
              <span
                className="rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase"
                style={{
                  borderColor: `${ROUTE_COLORS[selectedRoute.properties.kind]}70`,
                  color: ROUTE_COLORS[selectedRoute.properties.kind],
                }}
              >
                {selectedRoute.properties.kind}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {park.routes.map((candidate) => {
                const Icon = ROUTE_ICONS[candidate.properties.kind];
                const active =
                  candidate.properties.id === selectedRoute.properties.id;
                return (
                  <button
                    key={candidate.properties.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleRouteSelect(candidate.properties.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active
                        ? "border-white/20 bg-white/[0.08]"
                        : "border-white/[0.07] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{
                        backgroundColor: `${ROUTE_COLORS[candidate.properties.kind]}18`,
                        color: ROUTE_COLORS[candidate.properties.kind],
                      }}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">
                        {candidate.properties.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-white/35">
                        {candidate.properties.difficulty} ·{" "}
                        {candidate.geometry.coordinates.length} survey points
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBuildMode((previous) => !previous);
                  if (!buildMode) setRoutePoints([]);
                }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
                  buildMode
                    ? "border-blue-400/60 bg-blue-400/10 text-blue-200"
                    : "border-white/10 text-white/60 hover:bg-white/[0.05]"
                }`}
              >
                <MousePointer2 size={14} />
                {buildMode ? "Finish route" : "Build route"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoutePoints(selectedRoute.geometry.coordinates);
                  setBuildMode(false);
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.05]"
              >
                <RotateCcw size={14} />
                Reset path
              </button>
            </div>
          </div>

          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                Expedition telemetry
              </p>
              <div className="flex rounded-lg border border-white/10 p-0.5">
                {(["hike", "drive", "water"] as RouteKind[]).map((mode) => {
                  const Icon = ROUTE_ICONS[mode];
                  return (
                    <button
                      key={mode}
                      type="button"
                      aria-label={`Estimate route by ${mode}`}
                      aria-pressed={movement === mode}
                      onClick={() => setMovement(mode)}
                      className={`rounded-md p-1.5 ${
                        movement === mode
                          ? "bg-white/10 text-white"
                          : "text-white/30 hover:text-white/60"
                      }`}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2">
              {[
                {
                  label: "Distance",
                  value: `${telemetry.distance.toFixed(1)} mi`,
                  Icon: Ruler,
                },
                { label: "Est. time", value: telemetry.duration, Icon: Timer },
                {
                  label: "Elevation",
                  value: `+${telemetry.gain} / −${telemetry.loss} m`,
                  Icon: Mountain,
                },
                {
                  label: "Difficulty",
                  value: selectedRoute.properties.difficulty,
                  Icon: ShieldAlert,
                },
              ].map(({ label, value, Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3"
                >
                  <dt className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-white/30">
                    <Icon size={11} /> {label}
                  </dt>
                  <dd className="mt-2 text-sm font-medium text-white/80">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3">
              <ElevationProfile elevations={telemetry.elevations} />
            </div>
          </div>

          <div className="border-b border-white/10 p-5 md:p-6">
            <div className="flex items-center gap-2">
              <Trees size={15} className="text-blue-300" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Ecosystem intelligence
                </p>
                <p className="mt-1 text-xs text-white/55">
                  Hover a species to preview its habitat zone — click to pin
                  it, click again to release.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {SPECIES_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={speciesFilter === filter.id}
                  onClick={() => setSpeciesFilter(filter.id)}
                  className={`rounded-full border px-2.5 py-1.5 text-[10px] transition-colors ${
                    speciesFilter === filter.id
                      ? "border-blue-400/40 bg-blue-400/10 text-blue-200"
                      : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div
              className="mt-4 space-y-2"
              onBlur={(event) => {
                // Clear the hover preview only when focus actually leaves the
                // species list — focus moves between rows keep the preview.
                if (
                  !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                  setHoverZone(null);
                }
              }}
            >
              {filteredSpecies.map((species) => {
                const Icon =
                  species.category === "plants"
                    ? Leaf
                    : species.category === "bugs"
                      ? Bug
                      : PawPrint;
                const pinned = pinnedSpecies?.id === species.id;
                return (
                  <button
                    key={species.id}
                    type="button"
                    aria-pressed={pinned}
                    onClick={() =>
                      setPinnedSpecies((current) =>
                        current?.id === species.id
                          ? null
                          : { id: species.id, zone: species.zone },
                      )
                    }
                    onMouseEnter={() => setHoverZone(species.zone)}
                    onMouseLeave={() => setHoverZone(null)}
                    onFocus={() => setHoverZone(species.zone)}
                    className={`group w-full rounded-xl border p-3 text-left transition-colors hover:border-blue-400/30 hover:bg-blue-400/[0.04] ${
                      pinned
                        ? "border-blue-400/40 bg-blue-400/[0.06]"
                        : "border-white/[0.07]"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-white/50 group-hover:text-blue-200">
                        <Icon size={13} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-medium">{species.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono text-[8px] uppercase ${
                              species.risk === "Caution"
                                ? "bg-red-400/10 text-red-300"
                                : species.risk === "Seasonal"
                                  ? "bg-blue-400/10 text-blue-200"
                                  : "bg-white/10 text-white/60"
                            }`}
                          >
                            {species.risk}
                          </span>
                        </span>
                        <span className="mt-1 block text-[10px] leading-4 text-white/35">
                          {species.status} · {species.detail}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 md:p-6">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              disabled={routePoints.length < 2}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Route size={16} />
              Export expedition
            </button>
            <p className="mt-3 text-center font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">
              {routePoints.length} route point{routePoints.length === 1 ? "" : "s"} ·
              GPX / KML / deep link
            </p>
          </div>
        </aside>
      </div>

      {exportOpen ? (
        <ExportModal
          name={exportName}
          points={routePoints}
          mode={movement}
          onClose={closeExport}
        />
      ) : null}
    </section>
  );
}
