import type { Coordinate, RouteKind } from "./parkData";

const EARTH_RADIUS_MILES = 3958.8;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function segmentDistanceMiles(a: Coordinate, b: Coordinate) {
  const deltaLat = radians(b[1] - a[1]);
  const deltaLng = radians(b[0] - a[0]);
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return (
    2 *
    EARTH_RADIUS_MILES *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function routeDistanceMiles(points: Coordinate[]) {
  return points.slice(1).reduce((total, point, index) => {
    return total + segmentDistanceMiles(points[index], point);
  }, 0);
}

export function elevationDelta(elevations: number[]) {
  return elevations.slice(1).reduce(
    (totals, elevation, index) => {
      const delta = elevation - elevations[index];
      if (delta >= 0) totals.gain += delta;
      else totals.loss += Math.abs(delta);
      return totals;
    },
    { gain: 0, loss: 0 },
  );
}

export function estimatedHours(distanceMiles: number, mode: RouteKind) {
  const speeds: Record<RouteKind, number> = {
    hike: 2.2,
    drive: 22,
    water: 3.2,
  };
  return distanceMiles / speeds[mode];
}

export function formatDuration(hours: number) {
  const minutes = Math.max(1, Math.round(hours * 60));
  if (minutes < 60) return `${minutes} min`;
  const wholeHours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${wholeHours} hr ${remaining} min` : `${wholeHours} hr`;
}

function coordinateString(point: Coordinate) {
  return `${point[1].toFixed(6)},${point[0].toFixed(6)}`;
}

export function googleMapsUrl(points: Coordinate[], mode: RouteKind) {
  if (points.length < 2) return "https://www.google.com/maps";
  const origin = coordinateString(points[0]);
  const destination = coordinateString(points[points.length - 1]);
  const waypoints = points
    .slice(1, -1)
    .slice(0, 8)
    .map(coordinateString)
    .join("|");
  // Consumer map apps do not expose a kayak directions mode. Water routes
  // therefore preserve their GPS waypoints and use walking as the least
  // destructive routing fallback.
  const travelmode = mode === "drive" ? "driving" : "walking";
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode,
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleMapsUrl(points: Coordinate[], mode: RouteKind) {
  if (points.length < 2) return "https://maps.apple.com";
  const params = new URLSearchParams({
    saddr: coordinateString(points[0]),
    daddr: coordinateString(points[points.length - 1]),
    dirflg: mode === "hike" ? "w" : mode === "drive" ? "d" : "w",
  });
  return `https://maps.apple.com/?${params.toString()}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function generateGpx(name: string, points: Coordinate[]) {
  const trackPoints = points
    .map(
      ([longitude, latitude]) =>
        `      <trkpt lat="${latitude.toFixed(6)}" lon="${longitude.toFixed(6)}"></trkpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Portfolio Expedition Mapper" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(name)}</name></metadata>
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}

export function generateKml(name: string, points: Coordinate[]) {
  const coordinates = points
    .map(([longitude, latitude]) => `${longitude.toFixed(6)},${latitude.toFixed(6)},0`)
    .join(" ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(name)}</name>
    <Placemark>
      <name>${escapeXml(name)}</name>
      <LineString><tessellate>1</tessellate><coordinates>${coordinates}</coordinates></LineString>
    </Placemark>
  </Document>
</kml>`;
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
