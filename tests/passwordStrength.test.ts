import { describe, expect, it } from "vitest";
import { analyzePassword } from "../lib/passwordStrength";

describe("analyzePassword", () => {
  it("returns an empty/critical result for an empty string", () => {
    const result = analyzePassword("");
    expect(result.entropyBits).toBe(0);
    expect(result.verdict).toBe("critical");
    expect(result.findings).toHaveLength(0);
  });

  it("flags a block-listed password as critical and instantly cracked", () => {
    const result = analyzePassword("password");
    expect(result.verdict).toBe("critical");
    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.crackTime).toContain("instantly");
    expect(result.findings.some((f) => f.kind === "blocker")).toBe(true);
  });

  it("catches a common base with trailing padding (password1, monkey!)", () => {
    for (const value of ["password1", "monkey!", "P@ssw0rd"]) {
      const result = analyzePassword(value);
      expect(
        result.findings.some((f) => f.kind === "blocker"),
        `${value} should be block-listed`,
      ).toBe(true);
    }
  });

  it("rewards a long passphrase over a short symbol-heavy string", () => {
    const passphrase = analyzePassword("correct-horse-battery-staple");
    const shortComplex = analyzePassword("Tr0ub4!");
    expect(passphrase.score).toBeGreaterThan(shortComplex.score);
    expect(passphrase.entropyBits).toBeGreaterThan(shortComplex.entropyBits);
  });

  it("detects sequences, keyboard walks, repeats, and years", () => {
    expect(analyzePassword("abcd1234xyz").findings.some((f) => /run like/.test(f.message))).toBe(true);
    expect(analyzePassword("qwertyzzz9").findings.some((f) => /keyboard pattern/.test(f.message))).toBe(true);
    expect(analyzePassword("aaa9kLmZ").findings.some((f) => /repeated three/.test(f.message))).toBe(true);
    expect(analyzePassword("bluesky2024wolf").findings.some((f) => /4-digit year/.test(f.message))).toBe(true);
  });

  it("scales entropy with the character pool", () => {
    const lower = analyzePassword("abcdefghijkl");
    const mixed = analyzePassword("aB3!xY9$mN2#");
    expect(mixed.poolSize).toBeGreaterThan(lower.poolSize);
    expect(mixed.entropyBits).toBeGreaterThan(lower.entropyBits);
  });

  it("is deterministic — same input yields the same verdict", () => {
    const a = analyzePassword("Sunrise-Meadow-42-Falcon");
    const b = analyzePassword("Sunrise-Meadow-42-Falcon");
    expect(a).toEqual(b);
    expect(["strong", "excellent"]).toContain(a.verdict);
  });
});
