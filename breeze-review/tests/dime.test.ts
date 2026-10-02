import { describe, expect, it } from "vitest";
import { computeDime, educationChildCount, parseKidAges } from "@/lib/dime";

describe("computeDime", () => {
  it("sums debt, income replacement, mortgage and education", () => {
    const r = computeDime({ income: 80_000, yearsReplace: 10, debt: 20_000, ownsHome: true, mortgage: 250_000, kids: 2, eduGoal: "public" });
    expect(r.debt).toBe(20_000);
    expect(r.income).toBe(800_000);
    expect(r.mortgage).toBe(250_000);
    expect(r.education).toBe(220_000);
    expect(r.subtotal).toBe(1_290_000);
    expect(r.low).toBe(1_290_000);
    // 10% cushion + $15k final expenses, rounded to $5k
    expect(r.high).toBe(1_435_000);
  });

  it("ignores mortgage when the user does not own a home", () => {
    expect(computeDime({ income: 50_000, ownsHome: false, mortgage: 999_999 }).mortgage).toBe(0);
  });

  it("defaults to 10 years and public education", () => {
    const r = computeDime({ income: 100_000, kids: 1 });
    expect(r.income).toBe(1_000_000);
    expect(r.education).toBe(110_000);
  });

  it("subtracts existing coverage to show the gap, never below zero", () => {
    const r = computeDime({ income: 50_000, yearsReplace: 10, existingCoverage: 2_000_000 });
    expect(r.gapLow).toBe(0);
    expect(r.gapHigh).toBe(0);
    const r2 = computeDime({ income: 50_000, yearsReplace: 10, existingCoverage: 100_000 });
    expect(r2.gapLow).toBe(400_000);
  });

  it("handles empty answers", () => {
    const r = computeDime({});
    expect(r.low).toBe(0);
    expect(r.high).toBe(15_000);
  });
});

describe("education child count", () => {
  it("parses ages from free text", () => {
    expect(parseKidAges("3, 6 and 19")).toEqual([3, 6, 19]);
    expect(parseKidAges("")).toEqual([]);
  });
  it("excludes children 18 and older", () => {
    expect(educationChildCount({ kids: 3, kidAges: "4, 17, 20" })).toBe(2);
  });
  it("assumes unlisted children still need funding", () => {
    expect(educationChildCount({ kids: 3, kidAges: "4" })).toBe(3);
  });
});
