import { describe, expect, it } from "vitest";
import { STATIC_ROUTES } from "../app/sitemap";
import { CASE_STUDIES } from "../lib/caseStudies";
import { CREATIVE_PROJECTS } from "../lib/creativeProjects";
import { ALL_CATALOG_ENTRIES } from "../lib/projects";
import { TOOL_SLUGS } from "../lib/toolProjects";

// The full set of page routes the app can actually build, derived from the
// same data generateStaticParams and sitemap.ts use.
const REAL_ROUTES = new Set<string>([
  ...STATIC_ROUTES,
  ...CASE_STUDIES.map((study) => `/work/${study.slug}`),
  ...TOOL_SLUGS.map((slug) => `/projects/${slug}`),
  ...CREATIVE_PROJECTS.map((project) => `/creative/${project.slug}`),
]);

describe("catalog route integrity", () => {
  it("every catalog href resolves to a real app route", () => {
    for (const entry of ALL_CATALOG_ENTRIES) {
      expect(
        REAL_ROUTES.has(entry.href),
        `${entry.slug}: href ${entry.href} does not match any buildable route`,
      ).toBe(true);
    }
  });

  it("every case study and creative project is reachable from the sitemap set", () => {
    for (const study of CASE_STUDIES) {
      expect(REAL_ROUTES.has(`/work/${study.slug}`)).toBe(true);
    }
    for (const project of CREATIVE_PROJECTS) {
      expect(REAL_ROUTES.has(`/creative/${project.slug}`)).toBe(true);
    }
  });
});
