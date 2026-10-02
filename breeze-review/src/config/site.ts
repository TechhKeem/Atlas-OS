// Agency-specific copy and settings live here (and in env) so Phase 2
// white-labeling is a config change, not a code change.

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

// Comma-separated state codes BFG is licensed in. Empty = all states.
// Compliance must set this before launch.
const servedEnv = (process.env.NEXT_PUBLIC_SERVED_STATES ?? "").trim();
export const SERVED_STATES: string[] = servedEnv
  ? servedEnv.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
  : Object.keys(US_STATES);

export const site = {
  productName: "Breeze Review",
  parentBrand: "Breeze Financial Group",
  parentShort: "BFG",
  tagline: "Honest. Knowledgeable. Loyal to you.",
  heroHeadline: "Find out if your family is actually protected.",
  heroSub:
    "A free, plain-English review of your life insurance, or a quick look at what you might need. No pressure, no jargon.",
  bookingCta: "Book a call with a Breeze Financial Group agent",
  calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL ?? "https://calendly.com/your-team/breeze-review",
  licensingDisclosure:
    process.env.NEXT_PUBLIC_LICENSING_DISCLOSURE ??
    "[Placeholder: state licensing disclosure — to be supplied by BFG compliance.]",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "privacy@example.com",
  privacyNote:
    "Your document is sent over an encrypted connection, read by our AI, stored privately, and automatically deleted after 30 days.",
} as const;

export const DISCLAIMER =
  "Product availability, terms, coverage amounts and eligibility vary by carrier and individual circumstances. See policy/contract for complete details. Breeze Review provides general education, not personalized insurance, legal or tax advice. A licensed agent is required to finalize any recommendation.";

// Shown next to the unchecked consent box. The server stores this exact text
// (and its version) with every consent record.
export const CONSENT_VERSION = "2026-10-v1";
export const CONSENT_TEXT =
  "I agree to the Privacy Policy and Terms, and I consent to be contacted by Breeze Financial Group by phone, text, or email about my results, including by autodialed or prerecorded methods. Consent is not a condition of purchase. Msg and data rates may apply.";

export const limits = {
  maxUploadBytes: 20 * 1024 * 1024,
  allowedUploadTypes: {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
  } as Record<string, string>,
  chatMaxMessageChars: 600,
  chatMaxTurns: 12,
  chatNudgeAfterTurns: 2,
  extractionsPerLead: 3,
};

export const retention = {
  documentDays: Number(process.env.DOCUMENT_RETENTION_DAYS ?? 30),
  // 0 = keep structured data until deleted on request. Compliance may change.
  structuredDays: Number(process.env.STRUCTURED_RETENTION_DAYS ?? 0),
};

export const anthropicModel = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";
