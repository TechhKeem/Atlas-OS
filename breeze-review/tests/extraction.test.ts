import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { readFileSync } from "node:fs";
import { parsePolicy, sniffMime } from "@/lib/extraction";

describe("fixtures", () => {
  it("sample PDFs are valid PDFs by file signature", () => {
    for (const n of ["term-20-expiring", "whole-with-term-rider", "iul-grace-notice"]) {
      expect(sniffMime(readFileSync(`fixtures/policies/${n}.pdf`))).toBe("application/pdf");
    }
  });
});

describe("sniffMime", () => {
  it("rejects unexpected content and spoofed types", () => {
    expect(sniffMime(Buffer.from("MZ\x90\x00"))).toBeNull();
    expect(sniffMime(Buffer.from("<html>"))).toBeNull();
    expect(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });
});

describe("parsePolicy", () => {
  it("tolerates a sloppy model response and never throws on bad fields", () => {
    const p = parsePolicy({ legible: true, face_amount: { value: "oops", confidence: "wat" }, riders: "nope" });
    expect(p.face_amount).toEqual({ value: null, confidence: "not_found" });
    expect(p.riders).toEqual([]);
    expect(p.legible).toBe(true);
  });
  it("keeps valid data", () => {
    const p = parsePolicy({ legible: true, face_amount: { value: 250000, confidence: "high" }, riders: [{ type: "term", name: "x", face_amount: 5, expires_on: "2030-01-01", confidence: "high" }] });
    expect(p.face_amount.value).toBe(250000);
    expect(p.riders[0].type).toBe("term");
  });
});
