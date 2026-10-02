import { NextResponse } from "next/server";
import { z } from "zod";
import { allow, authLead, clientIp, db } from "@/lib/server";

const EVENTS = [
  "landing_viewed", "state_selected", "fork_chosen", "depth_chosen", "upload_started", "extraction_done",
  "gate_viewed", "gate_submitted", "results_viewed", "chat_started", "booking_clicked", "booking_completed",
] as const;

const schema = z.object({
  name: z.enum(EVENTS),
  leadId: z.string().optional(),
  token: z.string().optional(),
  props: z.record(z.union([z.string().max(100), z.number(), z.boolean()])).optional(),
});

/** Funnel analytics. Always 204; analytics must never block or error the user. */
export async function POST(req: Request) {
  try {
    const p = schema.safeParse(await req.json());
    if (!p.success) return new NextResponse(null, { status: 204 });
    if (!(await allow(`track:${clientIp(req)}`, 60, 60))) return new NextResponse(null, { status: 204 });
    const lead = p.data.leadId ? await authLead(p.data.leadId, p.data.token) : null;
    await db().from("events").insert({ lead_id: lead?.id ?? null, name: p.data.name, props: p.data.props ?? {} });
  } catch {
    /* swallow */
  }
  return new NextResponse(null, { status: 204 });
}
