import type { Answers, DimeResult } from "./types";

// Planning assumptions. Surfaced to the user so every number has a visible "why".
export const DIME_ASSUMPTIONS = {
  defaultYearsReplace: 10,
  finalExpenses: 15_000,
  cushionPct: 0.1,
  educationPerChild: { none: 0, trade: 40_000, public: 110_000, private: 230_000 },
  defaultEduGoal: "public" as const,
  collegeAgeCutoff: 18, // children this age or older are assumed past education funding
};

export function parseKidAges(text: string | undefined): number[] {
  if (!text) return [];
  return text
    .split(/[,\s]+/)
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n) && n >= 0 && n < 40);
}

/** Number of children still to fund education for. */
export function educationChildCount(a: Answers): number {
  const kids = Math.max(0, Math.floor(a.kids ?? 0));
  const ages = parseKidAges(a.kidAges);
  if (ages.length === 0) return kids;
  const young = ages.filter((age) => age < DIME_ASSUMPTIONS.collegeAgeCutoff).length;
  // If the user listed fewer ages than kids, assume the unlisted ones still need funding.
  return young + Math.max(0, kids - ages.length);
}

export function computeDime(a: Answers): DimeResult {
  const d = DIME_ASSUMPTIONS;
  const income = Math.max(0, a.income ?? 0);
  const years = Math.max(1, a.yearsReplace ?? d.defaultYearsReplace);
  const debt = Math.max(0, a.debt ?? 0);
  const mortgage = a.ownsHome === false ? 0 : Math.max(0, a.mortgage ?? 0);
  const eduGoal = a.eduGoal ?? d.defaultEduGoal;
  const education = educationChildCount(a) * d.educationPerChild[eduGoal];
  const incomeNeed = income * years;

  const subtotal = debt + incomeNeed + mortgage + education;
  const low = round(subtotal);
  const high = round(subtotal * (1 + d.cushionPct) + d.finalExpenses);
  const existingCoverage = Math.max(0, a.existingCoverage ?? 0);

  return {
    debt,
    income: incomeNeed,
    mortgage,
    education,
    subtotal,
    low,
    high,
    existingCoverage,
    gapLow: Math.max(0, low - existingCoverage),
    gapHigh: Math.max(0, high - existingCoverage),
    assumptions: [
      `Income replacement covers ${years} years of your income.`,
      `Education assumes about $${d.educationPerChild[eduGoal].toLocaleString("en-US")} per child still to fund (${eduGoal === "none" ? "no education goal" : eduGoal + " path"}).`,
      `The top of the range adds a ${Math.round(d.cushionPct * 100)}% planning cushion and about $${d.finalExpenses.toLocaleString("en-US")} for final expenses.`,
    ],
  };
}

// Round to the nearest $5,000 so the range doesn't imply false precision.
function round(n: number): number {
  return Math.round(n / 5000) * 5000;
}

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
