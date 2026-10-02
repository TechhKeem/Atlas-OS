import "server-only";
import { computeDime, money } from "./dime";
import { headlineFor, runRules } from "./rules";
import type { Analysis, Answers, ExtractedPolicy, Path } from "./types";

export function buildAnalysis(path: Path, answers: Answers, policy: ExtractedPolicy | null): Analysis {
  if (path === "A") {
    if (!policy) throw new Error("Missing policy for path A");
    const findings = runRules(policy, { income: answers.income });
    return { path, findings, headline: headlineFor(findings) };
  }
  const dime = computeDime(answers);
  return { path, dime, headline: `Suggested coverage range: ${money(dime.low)} to ${money(dime.high)}` };
}
