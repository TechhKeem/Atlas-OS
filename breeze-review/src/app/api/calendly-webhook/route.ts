import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { bad, db, logError } from "@/lib/server";

/**
 * Calendly webhook (invitee.created / invitee.canceled). Verifies the
 * Calendly-Webhook-Signature header ("t=<ts>,v1=<hmac>") and matches the lead
 * by the utm_content we pass into the widget (lead id), falling back to email.
 */
function verify(raw: string, header: string | null, key: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = crypto.createHmac("sha256", key).update(`${parts.t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!key) return bad("Webhook not configured", 503);
  const raw = await req.text();
  if (!verify(raw, req.headers.get("calendly-webhook-signature"), key)) return bad("Invalid signature", 401);

  try {
    const evt = JSON.parse(raw) as {
      event: string;
      payload: { email?: string; uri?: string; scheduled_event?: { uri?: string; start_time?: string }; tracking?: { utm_content?: string | null } };
    };
    if (!["invitee.created", "invitee.canceled"].includes(evt.event)) return NextResponse.json({ ok: true });
    const pl = evt.payload;
    const status = evt.event === "invitee.created" ? "scheduled" : "canceled";

    let leadId: string | null = null;
    const utm = pl.tracking?.utm_content;
    if (utm && /^[0-9a-f-]{36}$/i.test(utm)) {
      const { data } = await db().from("leads").select("id").eq("id", utm).maybeSingle();
      leadId = data?.id ?? null;
    }
    if (!leadId && pl.email) {
      const { data } = await db().from("leads").select("id").ilike("email", pl.email).order("created_at", { ascending: false }).limit(1).maybeSingle();
      leadId = data?.id ?? null;
    }

    await db().from("bookings").upsert(
      {
        lead_id: leadId,
        calendly_event_uri: pl.uri ?? pl.scheduled_event?.uri ?? null,
        invitee_email: pl.email ?? null,
        status,
        scheduled_for: pl.scheduled_event?.start_time ?? null,
        // Store only non-sensitive fields.
        raw: { event: evt.event },
      },
      { onConflict: "calendly_event_uri" },
    );
    if (leadId) {
      await db().from("leads").update({ booking_status: status }).eq("id", leadId);
      await db().from("events").insert({ lead_id: leadId, name: status === "scheduled" ? "booking_completed" : "booking_canceled", props: { source: "webhook" } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("calendly-webhook", e);
    return bad("Error", 500);
  }
}
