import { describe, expect, it } from "vitest";
import { CREATIVE_PROJECTS } from "../lib/creativeProjects";
import { ALL_CATALOG_ENTRIES, PROJECTS, WORK_PROJECTS } from "../lib/projects";

describe("creative projects catalog", () => {
  it("has unique slugs and numbers", () => {
    const slugs = CREATIVE_PROJECTS.map((p) => p.slug);
    const numbers = CREATIVE_PROJECTS.map((p) => p.number);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("gives every entry the required display fields and a valid accent", () => {
    for (const project of CREATIVE_PROJECTS) {
      expect(project.title.length).toBeGreaterThan(0);
      expect(project.description.length).toBeGreaterThan(0);
      expect(project.interaction.length).toBeGreaterThan(0);
      expect(project.purpose.length).toBeGreaterThan(0);
      expect(project.capabilities.length).toBeGreaterThanOrEqual(2);
      expect(project.decisions.length).toBeGreaterThanOrEqual(2);
      expect(project.boundary.length).toBeGreaterThan(0);
      expect(["red", "blue"]).toContain(project.accent);
      expect([
        "Spatial & fabrication",
        "Automotive",
        "Simulation & data",
        "Generative art",
      ]).toContain(project.group);
    }
  });

  it("includes the new interactive pieces", () => {
    const slugs = CREATIVE_PROJECTS.map((p) => p.slug);
    expect(slugs).toContain("sentinel-observatory");
    expect(slugs).toContain("verdant");
    expect(slugs).toContain("lumen-city");
  });
});

describe("projects catalog", () => {
  it("has unique slugs across the whole catalog", () => {
    const slugs = ALL_CATALOG_ENTRIES.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("routes every entry either internally or to a source repo", () => {
    for (const project of ALL_CATALOG_ENTRIES) {
      const internal = project.href.startsWith("/");
      const external = project.repo?.startsWith("https://") ?? false;
      expect(
        internal || external,
        `${project.slug} needs a valid href or repo`,
      ).toBe(true);
    }
  });

  it("tags every entry with a known filter", () => {
    for (const project of ALL_CATALOG_ENTRIES) {
      expect(["security", "data", "work"]).toContain(project.filter);
    }
  });

  it("exposes the two new dashboards as internal labs", () => {
    const bySlug = new Map(PROJECTS.map((p) => [p.slug, p]));
    for (const slug of ["soc-command-deck", "security-checkup"]) {
      const entry = bySlug.get(slug);
      expect(entry, `${slug} missing from catalog`).toBeTruthy();
      expect(entry?.href.startsWith("/labs/")).toBe(true);
    }
  });

  it("keeps professional case studies pointing at /work", () => {
    for (const project of WORK_PROJECTS) {
      expect(project.href.startsWith("/work/")).toBe(true);
    }
  });
});
