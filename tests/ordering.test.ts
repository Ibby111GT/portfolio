import { describe, expect, it } from "vitest";
import { CASE_STUDIES } from "../lib/caseStudies";
import {
  ALL_CATALOG_ENTRIES,
  LAB_PROJECTS,
  TOOL_PROJECTS,
  TOTAL_TOOL_TESTS,
  WORK_PROJECTS,
} from "../lib/projects";
import { TOOL_DOCS, TOOL_SLUGS } from "../lib/toolProjects";

describe("cross-surface ordering", () => {
  it("catalog case studies walk the same sequence as the homepage grid", () => {
    expect(WORK_PROJECTS.map((p) => p.slug)).toEqual(
      CASE_STUDIES.map((s) => s.slug),
    );
  });

  it("catalog tools walk the same sequence as the tool detail docs", () => {
    expect(TOOL_PROJECTS.map((p) => p.slug)).toEqual(TOOL_SLUGS);
  });

  it("the ordered tool slug list covers exactly the documented tools", () => {
    expect([...TOOL_SLUGS].sort()).toEqual(Object.keys(TOOL_DOCS).sort());
  });
});

describe("derived counts", () => {
  it("every tool declares an explicit test count that matches its prose signal", () => {
    for (const tool of TOOL_PROJECTS) {
      expect(tool.testCount, `${tool.slug} is missing testCount`).toBeTypeOf(
        "number",
      );
      expect(
        tool.signal.includes(String(tool.testCount)),
        `${tool.slug}: signal "${tool.signal}" does not mention testCount ${tool.testCount}`,
      ).toBe(true);
    }
  });

  it("the headline totals derive from the data", () => {
    expect(TOTAL_TOOL_TESTS).toBe(
      TOOL_PROJECTS.reduce((sum, tool) => sum + (tool.testCount ?? 0), 0),
    );
    expect(ALL_CATALOG_ENTRIES.length).toBe(
      LAB_PROJECTS.length + TOOL_PROJECTS.length + WORK_PROJECTS.length,
    );
  });
});
