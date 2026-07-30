import { describe, expect, it } from "vitest";
import { computeRiskIndex } from "../components/labs/SocCommandDeck";

describe("computeRiskIndex", () => {
  it("maps zero load to zero risk", () => {
    expect(computeRiskIndex(0)).toBe(0);
  });

  it("puts a fresh six-alert queue in the tense-but-workable band", () => {
    // Initial queue raw weight ≈ 32.
    expect(computeRiskIndex(32)).toBeGreaterThanOrEqual(42);
    expect(computeRiskIndex(32)).toBeLessThanOrEqual(46);
  });

  it("never pins flat at 100, even for an absurd backlog", () => {
    expect(computeRiskIndex(233)).toBeLessThan(100);
    expect(computeRiskIndex(400)).toBeLessThan(100);
    expect(computeRiskIndex(1000)).toBeLessThan(100);
  });

  it("is monotonically non-decreasing", () => {
    let previous = -1;
    for (let raw = 0; raw <= 500; raw += 5) {
      const value = computeRiskIndex(raw);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("keeps triage decisions visible at mid-range load", () => {
    // Resolving one escalated critical (weight ~13.5) at raw 120 must move
    // the index perceptibly — the whole point of the curve change.
    expect(computeRiskIndex(120) - computeRiskIndex(106)).toBeGreaterThanOrEqual(2);
  });
});
