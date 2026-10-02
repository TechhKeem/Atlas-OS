import { NextResponse } from "next/server";
import { z } from "zod";
import { authLead, bad, db, logError } from "@/lib/server";

const schema = z.object({ leadId: z.string(), token: z.string(), status: z.enum(["clicked", "scheduled"]) });

/** Client-reported booking state; the Calendly webhook is authoritative. */
export async function POST(req: Request) {
  try {
    const p = schema.safeParse(await req.json());
    if (!p.success) return bad("Invalid request");
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead) return bad("Session expired.", 401);
    // Never downgrade a confirmed booking.
    if (lead.booking_status === "scheduled" && p.data.status === "clicked") return NextResponse.json({ ok: true });
    await db().from("leads").update({ booking_status: p.data.status }).eq("id", lead.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("booking", e);
    return bad("Something went wrong.", 500);
  }
}
