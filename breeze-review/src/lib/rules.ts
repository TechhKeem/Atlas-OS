import type { ExtractedPolicy, Finding, Severity } from "./types";
import { money } from "./dime";

export interface RuleContext {
  income?: number;
  today?: Date;
}

const MS_YEAR = 365.25 * 24 * 3600 * 1000;
const order: Record<Severity, number> = { important: 0, worth_a_look: 1, looks_good: 2 };

function yearsUntil(iso: string | null | undefined, today: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return (t - today.getTime()) / MS_YEAR;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", timeZone: "UTC" });
}

function fmtYears(y: number): string {
  if (y < 1) return `${Math.max(1, Math.round(y * 12))} months`;
  const r = Math.round(y * 10) / 10;
  return `${r} ${r === 1 ? "year" : "years"}`;
}

/** Break total coverage into permanent vs. term pieces. */
export function coverageBreakdown(p: ExtractedPolicy) {
  const base = p.face_amount.value ?? 0;
  const type = p.policy_type.value;
  const baseIsTerm = type === "term";
  const baseIsPermanent = type === "whole" || type === "universal" || type === "iul";
  const termRiders = p.riders.filter((r) => r.type === "term" && (r.face_amount ?? 0) > 0);
  const termRiderFace = termRiders.reduce((s, r) => s + (r.face_amount ?? 0), 0);
  const permanent = baseIsPermanent ? base : 0;
  const term = (baseIsTerm ? base : 0) + termRiderFace;
  return { base, permanent, term, termRiders, total: base + termRiderFace, baseIsTerm, baseIsPermanent };
}

/** Earliest date any term coverage ends (base term or term rider). */
function earliestTermEnd(p: ExtractedPolicy): { iso: string; source: string } | null {
  const c = coverageBreakdown(p);
  const ends: { iso: string; source: string }[] = [];
  if (c.baseIsTerm) {
    let iso = p.expiration_date.value;
    if (!iso && p.effective_date.value && p.term_years.value) {
      const d = new Date(p.effective_date.value);
      d.setUTCFullYear(d.getUTCFullYear() + p.term_years.value);
      iso = d.toISOString().slice(0, 10);
    }
    if (iso) ends.push({ iso, source: "term policy" });
  }
  for (const r of c.termRiders) if (r.expires_on) ends.push({ iso: r.expires_on, source: "term rider" });
  ends.sort((a, b) => Date.parse(a.iso) - Date.parse(b.iso));
  return ends[0] ?? null;
}

function annualPremium(p: ExtractedPolicy): number | null {
  const amt = p.premium_amount.value;
  if (amt == null) return null;
  const mult = { monthly: 12, quarterly: 4, semiannual: 2, annual: 1 }[p.premium_frequency.value ?? "annual"];
  return amt * mult;
}

export function runRules(p: ExtractedPolicy, ctx: RuleContext = {}): Finding[] {
  const today = ctx.today ?? new Date();
  const out: Finding[] = [];
  const c = coverageBreakdown(p);
  const end = earliestTermEnd(p);
  const yrsToEnd = end ? yearsUntil(end.iso, today) : null;
  const hasTerm = c.term > 0;

  // 1. Term expiring
  if (hasTerm) {
    if (yrsToEnd == null) {
      out.push({
        id: "term-date-unknown",
        severity: "worth_a_look",
        title: "We couldn't find when your term coverage ends",
        body: `Part of your coverage (${money(c.term)}) is term insurance, which expires on a set date. Check the policy's schedule page or ask your carrier, so there are no surprises.`,
      });
    } else if (yrsToEnd <= 0) {
      out.push({
        id: "term-expired",
        severity: "important",
        title: "Your term coverage appears to have ended",
        body: `The ${end!.source} looks like it ended in ${fmtDate(end!.iso)}. If so, that coverage is no longer protecting your family. It's worth confirming with your carrier.`,
      });
    } else if (yrsToEnd <= 5) {
      out.push({
        id: "term-expiring",
        severity: "important",
        title: `Your term coverage ends in about ${fmtYears(yrsToEnd)}`,
        body: `${money(c.term)} of your coverage is term, and the ${end!.source} ends ${fmtDate(end!.iso)}. After that date nothing is paid out, and new coverage usually costs more with age or health changes. That's why it's worth planning ahead.`,
      });
    } else if (yrsToEnd <= 10) {
      out.push({
        id: "term-expiring",
        severity: "worth_a_look",
        title: `Your term coverage ends in about ${fmtYears(yrsToEnd)}`,
        body: `${money(c.term)} of your coverage is term, ending ${fmtDate(end!.iso)}. You have time, but it helps to decide early whether you'll still need protection then.`,
      });
    } else {
      out.push({
        id: "term-expiring",
        severity: "looks_good",
        title: `Your term coverage runs until ${fmtDate(end!.iso)}`,
        body: "That's more than 10 years away, so your current term length looks solid for now.",
      });
    }
  }

  // 2. Permanent vs. term mix
  if (c.total > 0 && hasTerm && c.permanent / c.total < 0.25) {
    const sev: Severity = yrsToEnd == null || yrsToEnd <= 10 ? "important" : "worth_a_look";
    out.push({
      id: "small-permanent",
      severity: sev,
      title: c.permanent > 0 ? "Only a small part of your coverage is permanent" : "None of your coverage is permanent",
      body:
        c.permanent > 0
          ? `You have ${money(c.total)} of total coverage, but only ${money(c.permanent)} is permanent. The other ${money(c.term)} is term${end ? ` and ends ${fmtDate(end.iso)}` : ""}. When term coverage ends, your protection drops to ${money(c.permanent)}.`
          : `All ${money(c.total)} of your coverage is term${end ? ` and ends ${fmtDate(end.iso)}` : ""}. That's a fine choice for covering a set number of years, but nothing stays after the term unless you convert or replace it.`,
    });
  } else if (c.total > 0 && !hasTerm && c.permanent > 0) {
    out.push({
      id: "permanent-only",
      severity: "looks_good",
      title: "Your coverage is permanent",
      body: `Your ${money(c.permanent)} of coverage doesn't expire on a set date, as long as premiums are paid.`,
    });
  }

  // 3. Conversion window
  if (hasTerm) {
    const yrsToConv = yearsUntil(p.conversion_deadline.value, today);
    if (p.conversion_deadline.value && yrsToConv != null) {
      if (yrsToConv <= 0) {
        out.push({
          id: "conversion",
          severity: "important",
          title: "Your conversion window may have closed",
          body: `Conversion lets you switch term coverage to permanent without a new health exam. Your policy shows a deadline of ${fmtDate(p.conversion_deadline.value)}. Ask your carrier whether any option remains.`,
        });
      } else if (yrsToConv <= 2) {
        out.push({
          id: "conversion",
          severity: "important",
          title: `Your conversion deadline is in about ${fmtYears(yrsToConv)}`,
          body: `Conversion lets you switch term coverage to permanent without a new health exam. After ${fmtDate(p.conversion_deadline.value)}, that option goes away.`,
        });
      } else if (yrsToConv <= 5) {
        out.push({
          id: "conversion",
          severity: "worth_a_look",
          title: `Your conversion deadline is ${fmtDate(p.conversion_deadline.value)}`,
          body: "Conversion lets you switch term coverage to permanent without a new health exam. It's worth knowing the date before it gets close.",
        });
      } else {
        out.push({
          id: "conversion",
          severity: "looks_good",
          title: "You have a conversion option",
          body: `You can convert until ${fmtDate(p.conversion_deadline.value)}, which gives you flexibility without a new health exam.`,
        });
      }
    } else if (p.conversion_available.value === false) {
      out.push({
        id: "conversion",
        severity: "worth_a_look",
        title: "Your policy may not offer conversion",
        body: "Without a conversion option, replacing term coverage later would usually mean a new health exam and today's rates.",
      });
    } else {
      out.push({
        id: "conversion",
        severity: "worth_a_look",
        title: "We couldn't find conversion details",
        body: "Many term policies let you convert to permanent coverage without a new health exam, but only until a deadline. It's worth asking your carrier whether yours does.",
      });
    }
  }

  // 4. Coverage vs. income
  if (ctx.income && ctx.income > 0 && c.total > 0) {
    const ratio = c.total / ctx.income;
    const note = "A common rule of thumb is about 10x annual income, and families with young children or a mortgage often need more. It's a starting point, not a calculation of your needs.";
    if (ratio < 5) {
      out.push({ id: "income", severity: "important", title: `Your coverage is about ${ratio.toFixed(1)}x your income`, body: `${money(c.total)} against ${money(ctx.income)} of income may leave your family short. ${note}` });
    } else if (ratio < 10) {
      out.push({ id: "income", severity: "worth_a_look", title: `Your coverage is about ${ratio.toFixed(1)}x your income`, body: `${note}` });
    } else {
      out.push({ id: "income", severity: "looks_good", title: `Your coverage is about ${ratio.toFixed(0)}x your income`, body: "That's in line with or above the common rule of thumb." });
    }
  }

  // 5. Lapse risk
  const status = p.policy_status.value;
  if (status === "grace" || status === "lapsed") {
    out.push({
      id: "lapse",
      severity: "important",
      title: status === "lapsed" ? "This policy shows as lapsed" : "This policy shows a grace period or missed payment",
      body: "A policy that isn't in force doesn't pay out. Contact your carrier soon; reinstatement is often possible within a limited window.",
    });
  } else if ((p.policy_type.value === "universal" || p.policy_type.value === "iul") && p.cash_value.value != null) {
    const annual = annualPremium(p);
    if (annual != null && p.cash_value.value < annual) {
      out.push({
        id: "lapse-risk",
        severity: "worth_a_look",
        title: "Your cash value is low for this type of policy",
        body: `Universal policies can lapse if the cash value can't cover the monthly costs. Yours is ${money(p.cash_value.value)} against about ${money(annual)} a year in premiums, so ask your carrier for an in-force illustration.`,
      });
    }
  }

  // 6. Reading quality
  const unsure: string[] = [];
  if (p.face_amount.confidence === "low" || p.face_amount.confidence === "not_found") unsure.push("the face amount");
  if (hasTerm && (p.expiration_date.confidence === "low" || p.expiration_date.confidence === "not_found") && !p.effective_date.value) unsure.push("the end date");
  if (unsure.length) {
    out.push({
      id: "low-confidence",
      severity: "worth_a_look",
      title: `We weren't fully sure about ${unsure.join(" and ")}`,
      body: "Parts of the document were hard to read. Please double-check these numbers on your policy, or upload a clearer photo.",
    });
  }

  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function headlineFor(findings: Finding[]): string {
  const top = findings[0];
  if (!top) return "No major gaps found";
  return top.severity === "looks_good" ? "Policy looks solid" : top.title;
}
