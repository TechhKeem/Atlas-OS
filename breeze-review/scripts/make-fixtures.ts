/**
 * Generates synthetic sample policy PDFs (fake carriers, fake people) used to
 * test extraction. Run: npm run fixtures
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdirSync, writeFileSync } from "node:fs";

const samples: Record<string, string[]> = {
  "term-20-expiring": [
    "NORTHSTAR MUTUAL LIFE (SYNTHETIC SAMPLE)",
    "LEVEL TERM LIFE INSURANCE POLICY - POLICY DATA PAGE",
    "Policy Number: NS-0000123   Status: In Force",
    "Insured: Jordan Sample    Owner: Jordan Sample",
    "Policy Date: June 1, 2008    Term: 20 years    Expiry Date: June 1, 2028",
    "Face Amount: $250,000",
    "Modal Premium: $62.40 monthly",
    "Conversion Privilege: This policy may be converted to a permanent plan without evidence of insurability until June 1, 2026.",
  ],
  "whole-with-term-rider": [
    "HARBORLIGHT LIFE (SYNTHETIC SAMPLE)",
    "WHOLE LIFE POLICY - SCHEDULE OF BENEFITS",
    "Policy Number: HL-77-4410   Status: In Force   Effective: March 15, 2021",
    "Insured: Alex Example   Owner: Alex Example",
    "Base Coverage: Whole Life  Face Amount $10,000   Cash Value: $1,240",
    "Rider: Term Life Insurance Rider   Amount $90,000   Expires: March 15, 2031",
    "Total Premium: $118.00 monthly",
  ],
  "iul-grace-notice": [
    "SUMMIT RIDGE FINANCIAL (SYNTHETIC SAMPLE)",
    "INDEXED UNIVERSAL LIFE - ANNUAL STATEMENT",
    "Policy Number: SR-IUL-9021   Insured: Taylor Demo",
    "Death Benefit: $400,000    Accumulated Cash Value: $312.00",
    "Planned Premium: $250.00 monthly",
    "NOTICE: Your policy is in its grace period. Payment is required by November 30, 2026 to keep coverage in force.",
  ],
};

async function main() {
  mkdirSync("fixtures/policies", { recursive: true });
  for (const [name, lines] of Object.entries(samples)) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([612, 792]);
    lines.forEach((t, i) => page.drawText(t, { x: 50, y: 730 - i * 26, size: i === 0 ? 14 : 11, font, color: rgb(0, 0, 0), maxWidth: 510 }));
    writeFileSync(`fixtures/policies/${name}.pdf`, await doc.save());
  }
  console.log("Wrote", Object.keys(samples).length, "fixtures");
}
main();
