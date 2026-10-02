import "server-only";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

let client: SupabaseClient | null = null;

/** Service-role client. Server code only; bypasses RLS. */
export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Supabase env vars are not configured");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export const BUCKET = "policy-docs";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const newToken = () => crypto.randomBytes(32).toString("base64url");

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export interface LeadRow {
  id: string;
  state: string | null;
  path: "A" | "B" | null;
  depth: "general" | "detailed" | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, unknown>;
  status: string;
  booking_status: string;
  session_token_hash: string;
  [k: string]: unknown;
}

/** Look up a lead and verify its session token (constant-time). */
export async function authLead(leadId: unknown, token: unknown): Promise<LeadRow | null> {
  if (typeof leadId !== "string" || typeof token !== "string") return null;
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return null;
  const { data } = await db().from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!data) return null;
  const a = Buffer.from(data.session_token_hash);
  const b = Buffer.from(sha256(token));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return data as LeadRow;
}

/** Returns true when the call is allowed. Fails open if the limiter itself errors. */
export async function allow(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const { data, error } = await db().rpc("hit_rate_limit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
  if (error) return true;
  return data === true;
}

export const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const tooMany = () => bad("You're going a little fast. Please wait a moment and try again.", 429);

/** Log without PII or document contents. */
export function logError(scope: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[${scope}] ${msg.slice(0, 200)}`);
}

export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
