import { after, NextResponse } from "next/server";
import { z } from "zod";
import { CONSENT_TEXT, CONSENT_VERSION, US_STATES } from "@/config/site";
import { buildAnalysis } from "@/lib/analysis";
import { scoreLead } from "@/lib/score";
import { mirrorLead } from "@/lib/sheets";
import { allow, authLead, bad, clientIp, db, logError, tooMany } from "@/lib/server";
import type { Answers, ExtractedPolicy } from "@/lib/types";

const schema = z.object({
  leadId: z.string(),
  token: z.string(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().transform((s) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")).refine((s) => s.length === 10, "phone"),
  state: z.string().length(2).refine((s) => s.toUpperCase() in US_STATES),
  consent: z.literal(true),
});

/** Contact gate: store contact + consent, then compute and return results. */
export async function POST(req: Request) {
  try {
    if (!(await allow(`complete:${clientIp(req)}`, 3600, 20))) return tooMany();
    const p = schema.safeParse(await req.json());
    if (!p.success) {
      const missing = p.error.issues[0]?.path[0];
      if (missing === "consent") return bad("Please check the box to continue.");
      if (missing === "phone") return bad("Please enter a 10-digit phone number.");
      if (missing === "email") return bad("Please enter a valid email address.");
      return bad("Please check your details and try again.");
    }
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead) return bad("Session expired. Please start again.", 401);
    if (!lead.path) return bad("Please complete the earlier steps first.");

    const answers = (lead.answers ?? {}) as Answers;
    let policy: ExtractedPolicy | null = null;
    let documentUploaded = false;
    if (lead.path === "A") {
      const { data } = await db()
        .from("policy_extractions")
        .select("extracted")
        .eq("lead_id", lead.id)
        .eq("status", "extracted")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data?.extracted) return bad("Please upload your policy first.");
      policy = data.extracted as ExtractedPolicy;
      documentUploaded = true;
    }

    const analysis = buildAnalysis(lead.path, answers, policy);
    const score = scoreLead({ depth: lead.depth, documentUploaded, answers, chatTurns: 0, booked: false });

    await db().from("consents").insert({
      lead_id: lead.id,
      consent_text: CONSENT_TEXT,
      consent_version: CONSENT_VERSION,
      ip: clientIp(req),
      user_agent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
    });
    await db().from("dime_inputs").insert({ lead_id: lead.id, inputs: answers });
    await db().from("analyses").insert({ lead_id: lead.id, path: lead.path, headline: analysis.headline, result: analysis });
    await db()
      .from("leads")
      .update({
        full_name: p.data.fullName,
        email: p.data.email.toLowerCase(),
        phone: p.data.phone,
        state: p.data.state.toUpperCase(),
        headline: analysis.headline,
        lead_score: score.total,
        score_components: score.components,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", lead.id);

    // Mirror to Sheets after the response; failures are retried by cron.
    after(() => mirrorLead(lead.id));

    return NextResponse.json({ analysis });
  } catch (e) {
    logError("lead.complete", e);
    return bad("Something went wrong on our end. Please try again.", 500);
  }
}
