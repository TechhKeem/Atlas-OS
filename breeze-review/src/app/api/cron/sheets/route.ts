import { NextResponse } from "next/server";
import { mirrorLead } from "@/lib/sheets";
import { bad, cronAuthorized, db } from "@/lib/server";

/** Retries Sheets mirroring for completed leads that haven't synced yet. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return bad("Unauthorized", 401);
  const { data } = await db()
    .from("leads")
    .select("id")
    .eq("status", "completed")
    .is("sheet_synced_at", null)
    .lt("sheet_attempts", 10)
    .order("completed_at", { ascending: true })
    .limit(50);
  let ok = 0;
  for (const l of data ?? []) if (await mirrorLead(l.id)) ok++;
  return NextResponse.json({ attempted: data?.length ?? 0, synced: ok });
}
