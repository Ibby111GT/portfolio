import { describe, expect, it } from "vitest";
import { hashSeed, mulberry32 } from "../lib/seededRandom";

describe("seededRandom", () => {
  it("hashSeed is stable and returns an unsigned 32-bit integer", () => {
    const seed = hashSeed("sentinel-observatory");
    expect(seed).toBe(hashSeed("sentinel-observatory"));
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });

  it("hashSeed differentiates distinct inputs", () => {
    expect(hashSeed("verdant")).not.toBe(hashSeed("lumen-city"));
  });

  it("mulberry32 is deterministic for a given seed", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("mulberry32 returns values within [0, 1)", () => {
    const rand = mulberry32(hashSeed("verdant"));
    for (let index = 0; index < 500; index += 1) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("different seeds produce different streams", () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });
});
