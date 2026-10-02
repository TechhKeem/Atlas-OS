import { NextResponse } from "next/server";
import { z } from "zod";
import { allow, authLead, bad, clientIp, db, logError, tooMany } from "@/lib/server";

const schema = z.object({ leadId: z.string(), token: z.string(), email: z.string().email().max(200) });

/** Graceful path for unsupported states: keep the email, never dead-end. */
export async function POST(req: Request) {
  try {
    if (!(await allow(`waitlist:${clientIp(req)}`, 3600, 10))) return tooMany();
    const p = schema.safeParse(await req.json());
    if (!p.success) return bad("Please enter a valid email.");
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead) return bad("Session expired. Please start again.", 401);
    await db().from("leads").update({ email: p.data.email.toLowerCase(), status: "waitlist" }).eq("id", lead.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("waitlist", e);
    return bad("Something went wrong on our end.", 500);
  }
}
