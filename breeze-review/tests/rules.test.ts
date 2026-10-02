import { describe, expect, it } from "vitest";
import { coverageBreakdown, runRules } from "@/lib/rules";
import { scoreLead } from "@/lib/score";
import type { ExtractedPolicy } from "@/lib/types";

const f = <T,>(value: T | null, confidence: "high" | "low" | "not_found" = "high") => ({ value, confidence });
const today = new Date("2026-10-01");

function policy(over: Partial<ExtractedPolicy> = {}): ExtractedPolicy {
  return {
    legible: true, unreadable_reason: null,
    carrier: f("Acme Life"), policy_type: f("whole"), face_amount: f(10_000),
    term_years: f(null, "not_found"), expiration_date: f(null, "not_found"),
    premium_amount: f(100), premium_frequency: f("monthly"), cash_value: f(null, "not_found"),
    conversion_available: f(null, "not_found"), conversion_deadline: f(null, "not_found"),
    effective_date: f("2020-01-01"), insured_name: f("Pat Doe"), owner_name: f("Pat Doe"),
    policy_status: f("in_force"), riders: [],
    ...over,
  };
}

const ids = (fs: ReturnType<typeof runRules>) => fs.map((x) => x.id);
const find = (fs: ReturnType<typeof runRules>, id: string) => fs.find((x) => x.id === id);

describe("coverageBreakdown", () => {
  it("splits permanent base from term rider", () => {
    const c = coverageBreakdown(policy({ riders: [{ type: "term", name: "Term rider", face_amount: 90_000, expires_on: "2031-10-01", confidence: "high" }] }));
    expect(c.permanent).toBe(10_000);
    expect(c.term).toBe(90_000);
    expect(c.total).toBe(100_000);
  });
});

describe("runRules", () => {
  const riderPolicy = policy({ riders: [{ type: "term", name: "Term rider", face_amount: 90_000, expires_on: "2031-10-01", confidence: "high" }] });

  it("flags the $10k permanent / $90k term-rider example as important", () => {
    const fs = runRules(riderPolicy, { today });
    expect(find(fs, "small-permanent")?.severity).toBe("important");
    expect(find(fs, "small-permanent")?.body).toContain("$100,000");
    expect(find(fs, "small-permanent")?.body).toContain("$10,000");
    expect(find(fs, "term-expiring")?.severity).toBe("important"); // ~5.0 years
  });

  it("marks term ending within 5 years important", () => {
    const fs = runRules(policy({ policy_type: f("term"), face_amount: f(500_000), expiration_date: f("2028-06-01") }), { today });
    expect(find(fs, "term-expiring")?.severity).toBe("important");
  });

  it("marks a long-dated term as looks_good", () => {
    const fs = runRules(policy({ policy_type: f("term"), face_amount: f(500_000), expiration_date: f("2045-06-01") }), { today });
    expect(find(fs, "term-expiring")?.severity).toBe("looks_good");
  });

  it("detects an expired term", () => {
    const fs = runRules(policy({ policy_type: f("term"), face_amount: f(500_000), expiration_date: f("2025-01-01") }), { today });
    expect(find(fs, "term-expired")?.severity).toBe("important");
  });

  it("derives term end from effective date + term years", () => {
    const fs = runRules(policy({ policy_type: f("term"), face_amount: f(250_000), effective_date: f("2017-01-01"), term_years: f(10) }), { today });
    expect(find(fs, "term-expired")).toBeUndefined();
    expect(find(fs, "term-expiring")?.severity).toBe("important");
  });

  it("flags an approaching conversion deadline", () => {
    const base = policy({ policy_type: f("term"), face_amount: f(500_000), expiration_date: f("2040-01-01") });
    expect(find(runRules({ ...base, conversion_deadline: f("2027-03-01") }, { today }), "conversion")?.severity).toBe("important");
    expect(find(runRules({ ...base, conversion_deadline: f("2030-01-01") }, { today }), "conversion")?.severity).toBe("worth_a_look");
    expect(find(runRules({ ...base, conversion_deadline: f("2035-01-01") }, { today }), "conversion")?.severity).toBe("looks_good");
  });

  it("asks about conversion when details are missing for term", () => {
    const fs = runRules(policy({ policy_type: f("term"), face_amount: f(500_000), expiration_date: f("2040-01-01") }), { today });
    expect(find(fs, "conversion")?.severity).toBe("worth_a_look");
  });

  it("checks coverage against income", () => {
    expect(find(runRules(policy({ face_amount: f(100_000) }), { today, income: 100_000 }), "income")?.severity).toBe("important");
    expect(find(runRules(policy({ face_amount: f(700_000) }), { today, income: 100_000 }), "income")?.severity).toBe("worth_a_look");
    expect(find(runRules(policy({ face_amount: f(1_200_000) }), { today, income: 100_000 }), "income")?.severity).toBe("looks_good");
  });

  it("skips the income check when income is unknown", () => {
    expect(ids(runRules(policy(), { today }))).not.toContain("income");
  });

  it("flags lapse and low universal cash value", () => {
    expect(find(runRules(policy({ policy_status: f("grace") }), { today }), "lapse")?.severity).toBe("important");
    const ul = policy({ policy_type: f("universal"), cash_value: f(500), premium_amount: f(300), premium_frequency: f("monthly") });
    expect(find(runRules(ul, { today }), "lapse-risk")?.severity).toBe("worth_a_look");
  });

  it("notes low-confidence key fields", () => {
    const fs = runRules(policy({ face_amount: f(10_000, "low") }), { today });
    expect(find(fs, "low-confidence")).toBeDefined();
  });

  it("sorts important findings first", () => {
    const fs = runRules(riderPolicy, { today });
    expect(fs[0].severity).toBe("important");
  });
});

describe("scoreLead", () => {
  it("adds up transparent components", () => {
    const s = scoreLead({ depth: "detailed", documentUploaded: true, answers: { kids: 2, ownsHome: true, mortgage: 1 }, chatTurns: 6, booked: true });
    expect(s.components).toEqual({ detailed_depth: 20, document_uploaded: 20, dependents: 10, mortgage: 10, chat_turns: 20, booking_made: 30 });
    expect(s.total).toBe(110);
  });
});
