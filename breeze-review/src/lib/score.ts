import type { Answers, Depth, ScoreResult } from "./types";

export interface ScoreInput {
  depth: Depth | null;
  documentUploaded: boolean;
  answers: Answers;
  chatTurns: number;
  booked: boolean;
}

// Simple and transparent: each signal and its points are stored with the lead.
export function scoreLead(i: ScoreInput): ScoreResult {
  const c: Record<string, number> = {};
  if (i.depth === "detailed") c.detailed_depth = 20;
  if (i.documentUploaded) c.document_uploaded = 20;
  if ((i.answers.kids ?? 0) > 0 || i.answers.spouse) c.dependents = 10;
  if (i.answers.ownsHome && (i.answers.mortgage ?? 0) > 0) c.mortgage = 10;
  if (i.chatTurns > 0) c.chat_turns = Math.min(i.chatTurns, 4) * 5;
  if (i.booked) c.booking_made = 30;
  return { total: Object.values(c).reduce((a, b) => a + b, 0), components: c };
}
