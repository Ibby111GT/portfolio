"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Circle,
  LayerGroup,
  Map as LeafletMap,
  Polyline,
} from "leaflet";
import {
  PARKS,
  ROUTE_COLORS,
  type Coordinate,
  type ParkPreset,
  type RouteKind,
} from "./parkData";

interface LayerVisibility {
  drive: boolean;
  hike: boolean;
  water: boolean;
  stations: boolean;
}

interface LeafletExpeditionMapProps {
  park: ParkPreset;
  layers: LayerVisibility;
  selectedRouteId: string;
  routePoints: Coordinate[];
  buildMode: boolean;
  highlightedZone: string | null;
  onRouteSelect: (routeId: string) => void;
  onWaypointAdd: (coordinate: Coordinate) => void;
}

type LeafletModule = typeof import("leaflet");

function nearestRoutePoint(
  coordinate: Coordinate,
  park: ParkPreset,
  layers: LayerVisibility,
) {
  const candidates = park.routes
    .filter((candidate) => layers[candidate.properties.kind])
    .flatMap((candidate) => candidate.geometry.coordinates);
  if (!candidates.length) return coordinate;

  return candidates.reduce((nearest, candidate) => {
    const nearestDelta =
      (nearest[0] - coordinate[0]) ** 2 + (nearest[1] - coordinate[1]) ** 2;
    const candidateDelta =
      (candidate[0] - coordinate[0]) ** 2 +
      (candidate[1] - coordinate[1]) ** 2;
    return candidateDelta < nearestDelta ? candidate : nearest;
  });
}

export default function LeafletExpeditionMap({
  park,
  layers,
  selectedRouteId,
  routePoints,
  buildMode,
  highlightedZone,
  onRouteSelect,
  onWaypointAdd,
}: LeafletExpeditionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const dataLayerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const habitatLayerRef = useRef<Circle | null>(null);
  const selectedLineRef = useRef<Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        attributionControl: true,
        zoomControl: false,
        minZoom: 5,
        maxZoom: 17,
      }).setView(park.center, park.zoom);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        },
      ).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    }

    void initialize();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
    // The park-specific view is updated in a dedicated effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    mapRef.current.setView(park.center, park.zoom, { animate: true });
  }, [mapReady, park]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    dataLayerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    dataLayerRef.current = group;

    park.routes.forEach((feature) => {
      const { id, kind, name } = feature.properties;
      if (!layers[kind]) return;
      const selected = id === selectedRouteId;
      const latLngs = feature.geometry.coordinates.map(
        ([longitude, latitude]) => [latitude, longitude] as [number, number],
      );
      const line = L.polyline(latLngs, {
        color: ROUTE_COLORS[kind],
        weight: selected ? 6 : 3,
        opacity: selected ? 1 : 0.66,
        dashArray: kind === "hike" ? "9 8" : undefined,
        lineCap: "round",
      }).addTo(group);
      line.bindTooltip(name, {
        direction: "top",
        className: "expedition-map-tooltip",
      });
      line.on("click", () => {
        if (!buildMode) onRouteSelect(id);
      });
    });

    if (layers.stations) {
      park.stations.forEach((feature) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const marker = L.circleMarker([latitude, longitude], {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor:
            feature.properties.kind === "Emergency shelter"
              ? "#ef4444"
              : "#60a5fa",
          fillOpacity: 1,
        }).addTo(group);
        marker.bindTooltip(
          `<strong>${feature.properties.name}</strong><br>${feature.properties.kind}`,
          { direction: "top", className: "expedition-map-tooltip" },
        );
      });
    }
  }, [buildMode, layers, mapReady, onRouteSelect, park, selectedRouteId]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    routeLayerRef.current?.remove();
    selectedLineRef.current = null;
    const group = L.layerGroup().addTo(map);
    routeLayerRef.current = group;

    if (routePoints.length >= 2) {
      const latLngs = routePoints.map(
        ([longitude, latitude]) => [latitude, longitude] as [number, number],
      );
      selectedLineRef.current = L.polyline(latLngs, {
        color: "#ffffff",
        weight: 3,
        opacity: 0.92,
        dashArray: "3 8",
        lineCap: "round",
      }).addTo(group);
    }

    routePoints.forEach(([longitude, latitude], index) => {
      L.circleMarker([latitude, longitude], {
        radius: index === 0 || index === routePoints.length - 1 ? 6 : 4,
        color: "#0f172a",
        weight: 2,
        fillColor:
          index === 0 ? "#10b981" : index === routePoints.length - 1 ? "#ef4444" : "#ffffff",
        fillOpacity: 1,
      })
        .addTo(group)
        .bindTooltip(
          index === 0
            ? "Expedition start"
            : index === routePoints.length - 1
              ? "Expedition finish"
              : `Waypoint ${index + 1}`,
          { direction: "top", className: "expedition-map-tooltip" },
        );
    });
  }, [mapReady, routePoints]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!mapReady || !L || !map) return;

    habitatLayerRef.current?.remove();
    habitatLayerRef.current = null;
    if (!highlightedZone) return;

    const zone = park.zones.find((candidate) => candidate.id === highlightedZone);
    if (!zone) return;
    const [longitude, latitude] = zone.center;
    habitatLayerRef.current = L.circle([latitude, longitude], {
      radius: zone.radiusMeters,
      color: "#f59e0b",
      fillColor: "#f59e0b",
      fillOpacity: 0.12,
      weight: 2,
      dashArray: "6 6",
    })
      .addTo(map)
      .bindTooltip(zone.label, {
        permanent: true,
        direction: "center",
        className: "expedition-zone-tooltip",
      });
  }, [highlightedZone, mapReady, park]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !buildMode) {
      if (map) map.getContainer().style.cursor = "";
      return;
    }

    map.getContainer().style.cursor = "crosshair";
    const handleMapClick = (event: { latlng: { lat: number; lng: number } }) => {
      const clicked: Coordinate = [event.latlng.lng, event.latlng.lat];
      onWaypointAdd(nearestRoutePoint(clicked, park, layers));
    };
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
      map.getContainer().style.cursor = "";
    };
  }, [buildMode, layers, mapReady, onWaypointAdd, park]);

  return (
    <div className="relative h-full min-h-[560px] overflow-hidden bg-[#101722]">
      <div ref={containerRef} className="h-full min-h-[560px] w-full" />
      {!mapReady ? (
        <div className="absolute inset-0 grid place-items-center bg-[#101722]">
          <div className="text-center">
            <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-amber-400" />
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Loading spatial layers
            </p>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] max-w-[220px] rounded-lg border border-white/10 bg-[#071019]/85 px-3 py-2 backdrop-blur">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
          {buildMode ? "Route build active" : "Spatial planning mode"}
        </p>
        <p className="mt-1 text-[11px] leading-4 text-white/70">
          {buildMode
            ? "Click near a visible path to snap the next waypoint."
            : "Select a colored route to inspect it."}
        </p>
      </div>
      <span className="sr-only">
        Interactive map for {park.name}. Available presets:{" "}
        {PARKS.map((candidate) => candidate.name).join(", ")}.
      </span>
    </div>
  );
}
