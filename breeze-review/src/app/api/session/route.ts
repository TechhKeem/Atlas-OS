import { NextResponse } from "next/server";
import { z } from "zod";
import { SERVED_STATES } from "@/config/site";
import { allow, authLead, bad, clientIp, db, logError, newToken, sha256, tooMany } from "@/lib/server";

const createSchema = z.object({
  state: z.string().length(2).transform((s) => s.toUpperCase()),
  utm: z.record(z.string().max(200)).optional(),
  referrer: z.string().max(500).optional(),
});

/** Create an anonymous lead row (no PII yet) and a session token. */
export async function POST(req: Request) {
  try {
    if (!(await allow(`session:${clientIp(req)}`, 3600, 30))) return tooMany();
    const p = createSchema.safeParse(await req.json());
    if (!p.success) return bad("Please choose your state.");
    const token = newToken();
    const supported = SERVED_STATES.includes(p.data.state);
    const { data, error } = await db()
      .from("leads")
      .insert({
        session_token_hash: sha256(token),
        state: p.data.state,
        unsupported_state: !supported,
        utm: p.data.utm ?? {},
        referrer: p.data.referrer ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ leadId: data.id, token, supported });
  } catch (e) {
    logError("session.create", e);
    return bad("Something went wrong on our end. Please try again.", 500);
  }
}

const updateSchema = z.object({
  leadId: z.string(),
  token: z.string(),
  path: z.enum(["A", "B"]).optional(),
  depth: z.enum(["general", "detailed"]).optional(),
  answers: z.record(z.union([z.string().max(100), z.number(), z.boolean()])).optional(),
});

/** Save fork choices and wizard answers (autosave). */
export async function PATCH(req: Request) {
  try {
    const p = updateSchema.safeParse(await req.json());
    if (!p.success) return bad("Invalid request");
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead) return bad("Session expired. Please start again.", 401);
    const patch: Record<string, unknown> = {};
    if (p.data.path) patch.path = p.data.path;
    if (p.data.depth) patch.depth = p.data.depth;
    if (p.data.answers) {
      patch.answers = p.data.answers;
    }
    if (Object.keys(patch).length) await db().from("leads").update(patch).eq("id", lead.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("session.update", e);
    return bad("Something went wrong on our end.", 500);
  }
}
