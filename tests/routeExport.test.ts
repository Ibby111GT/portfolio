import { describe, expect, it } from "vitest";
import type { Coordinate } from "../components/creative/wildlands/parkData";
import {
  appleMapsUrl,
  generateGpx,
  generateKml,
  googleMapsUrl,
} from "../components/creative/wildlands/routeExport";

const TWENTY_POINTS: Coordinate[] = Array.from({ length: 20 }, (_, index) => [
  -110.5 + index * 0.01,
  44.4 + index * 0.005,
]);

describe("generateGpx", () => {
  it("contains every waypoint as a track point", () => {
    const gpx = generateGpx("Test Trail", TWENTY_POINTS);
    expect(gpx.match(/<trkpt /g)?.length).toBe(20);
  });

  it("writes lat/lon attributes in GPX orientation", () => {
    const gpx = generateGpx("Test Trail", [[-110.5, 44.4]]);
    expect(gpx).toContain('lat="44.400000"');
    expect(gpx).toContain('lon="-110.500000"');
  });

  it("escapes XML in the route name", () => {
    const gpx = generateGpx('A & B <"trail">', TWENTY_POINTS.slice(0, 2));
    expect(gpx).toContain("A &amp; B &lt;&quot;trail&quot;&gt;");
  });
});

describe("generateKml", () => {
  it("contains every waypoint in the line string", () => {
    const kml = generateKml("Test Trail", TWENTY_POINTS);
    const coordinates = kml.match(/-110\.\d+,44\.\d+,0/g);
    expect(coordinates?.length).toBe(20);
  });
});

describe("map link builders", () => {
  it("google url carries at most 8 intermediate waypoints", () => {
    const url = new URL(googleMapsUrl(TWENTY_POINTS, "hike"));
    const waypoints = url.searchParams.get("waypoints") ?? "";
    expect(waypoints.split("|").length).toBeLessThanOrEqual(8);
    expect(url.searchParams.get("origin")).toBeTruthy();
    expect(url.searchParams.get("destination")).toBeTruthy();
  });

  it("apple url carries exactly the start and end", () => {
    const url = new URL(appleMapsUrl(TWENTY_POINTS, "hike"));
    expect(url.searchParams.get("saddr")).toBe("44.400000,-110.500000");
    expect(url.searchParams.get("daddr")).toBe("44.495000,-110.310000");
    expect([...url.searchParams.keys()].sort()).toEqual([
      "daddr",
      "dirflg",
      "saddr",
    ]);
  });
});
