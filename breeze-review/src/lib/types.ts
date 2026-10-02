export type Path = "A" | "B";
export type Depth = "general" | "detailed";
export type Confidence = "high" | "medium" | "low" | "not_found";
export type Severity = "important" | "worth_a_look" | "looks_good";

export interface Field<T> {
  value: T | null;
  confidence: Confidence;
}

export type PolicyType = "term" | "whole" | "universal" | "iul" | "other";

export interface Rider {
  type: "term" | "waiver" | "accidental_death" | "child" | "other";
  name: string | null;
  face_amount: number | null;
  expires_on: string | null; // ISO date
  confidence: Confidence;
}

/** face_amount is the BASE policy only; riders are listed separately. */
export interface ExtractedPolicy {
  legible: boolean;
  unreadable_reason: string | null;
  carrier: Field<string>;
  policy_type: Field<PolicyType>;
  face_amount: Field<number>;
  term_years: Field<number>;
  expiration_date: Field<string>;
  premium_amount: Field<number>;
  premium_frequency: Field<"monthly" | "quarterly" | "semiannual" | "annual">;
  cash_value: Field<number>;
  conversion_available: Field<boolean>;
  conversion_deadline: Field<string>;
  effective_date: Field<string>;
  insured_name: Field<string>;
  owner_name: Field<string>;
  policy_status: Field<"in_force" | "grace" | "lapsed" | "unknown">;
  riders: Rider[];
}

export interface Answers {
  income?: number;
  yearsReplace?: number;
  spouse?: boolean;
  ownsHome?: boolean;
  mortgage?: number;
  debt?: number;
  kids?: number;
  kidAges?: string; // free text, e.g. "3, 6"
  eduGoal?: "none" | "trade" | "public" | "private";
  existingCoverage?: number;
  preference?: "cost" | "lifetime";
}

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  body: string;
}

export interface DimeResult {
  debt: number;
  income: number;
  mortgage: number;
  education: number;
  subtotal: number;
  low: number;
  high: number;
  existingCoverage: number;
  gapLow: number;
  gapHigh: number;
  assumptions: string[];
}

export interface Analysis {
  path: Path;
  headline: string;
  findings?: Finding[];
  dime?: DimeResult;
}

export interface ScoreResult {
  total: number;
  components: Record<string, number>;
}
