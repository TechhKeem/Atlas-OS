import "server-only";
import { JWT } from "google-auth-library";
import { db, logError } from "./server";

// One-way mirror for the team. Postgres stays the source of truth, and no
// document contents or sensitive details are written here.
export function sheetsConfigured() {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEET_ID);
}

export async function appendLeadRow(lead: Record<string, unknown>): Promise<void> {
  const jwt = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const { token } = await jwt.getAccessToken();
  const range = process.env.GOOGLE_SHEET_RANGE ?? "Leads!A:N";
  const row = [
    lead.created_at, lead.full_name, lead.phone, lead.email, lead.state, lead.path, lead.depth,
    lead.headline, lead.lead_score, (lead.utm as Record<string, string> | null)?.utm_source ?? "",
    lead.booking_status, lead.id,
  ];
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row.map((v) => (v == null ? "" : String(v)))] }),
    },
  );
  if (!res.ok) throw new Error(`Sheets API ${res.status}`);
}

/** Try to mirror one lead. Never throws; failures are retried by the cron route. */
export async function mirrorLead(leadId: string): Promise<boolean> {
  if (!sheetsConfigured()) return false;
  try {
    const { data: lead } = await db().from("leads").select("*").eq("id", leadId).maybeSingle();
    if (!lead || lead.sheet_synced_at) return true;
    await appendLeadRow(lead);
    await db().from("leads").update({ sheet_synced_at: new Date().toISOString() }).eq("id", leadId);
    return true;
  } catch (e) {
    logError("sheets", e);
    const { data } = await db().from("leads").select("sheet_attempts").eq("id", leadId).maybeSingle();
    await db().from("leads").update({ sheet_attempts: (data?.sheet_attempts ?? 0) + 1 }).eq("id", leadId);
    return false;
  }
}
