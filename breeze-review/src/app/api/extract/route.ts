import { NextResponse } from "next/server";
import { z } from "zod";
import { limits } from "@/config/site";
import { extractPolicy, sniffMime } from "@/lib/extraction";
import { allow, authLead, BUCKET, bad, clientIp, db, logError, tooMany } from "@/lib/server";

export const maxDuration = 60;

const schema = z.object({ leadId: z.string(), token: z.string(), extractionId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    if (!(await allow(`extract:${clientIp(req)}`, 3600, 10))) return tooMany();
    const p = schema.safeParse(await req.json());
    if (!p.success) return bad("Invalid request");
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead) return bad("Session expired. Please start again.", 401);

    const { data: row } = await db()
      .from("policy_extractions")
      .select("*")
      .eq("id", p.data.extractionId)
      .eq("lead_id", lead.id)
      .maybeSingle();
    if (!row) return bad("We couldn't find that upload.", 404);
    if (row.status === "extracted") return NextResponse.json({ status: "extracted", policy: row.extracted });

    const { data: file, error } = await db().storage.from(BUCKET).download(row.storage_path);
    if (error || !file) return bad("We didn't receive your file. Please try uploading again.");
    const bytes = Buffer.from(await file.arrayBuffer());

    const mime = sniffMime(bytes);
    if (!mime || bytes.length > limits.maxUploadBytes) {
      // Unexpected content: delete it immediately and reject.
      await db().storage.from(BUCKET).remove([row.storage_path]);
      await db().from("policy_extractions").update({ status: "failed", document_deleted_at: new Date().toISOString() }).eq("id", row.id);
      return bad("That file doesn't look like a PDF, JPG or PNG. Please try another file.");
    }

    let policy;
    try {
      policy = await extractPolicy(bytes, mime);
    } catch (e) {
      logError("extract.claude", e);
      await db().from("policy_extractions").update({ status: "failed" }).eq("id", row.id);
      return bad("We had trouble reading that document. Please try again, or upload a clearer copy.", 502);
    }

    if (!policy.legible) {
      await db().from("policy_extractions").update({ status: "unreadable", extracted: policy }).eq("id", row.id);
      return NextResponse.json({
        status: "unreadable",
        message: policy.unreadable_reason ?? "We couldn't read that clearly. A sharper photo or the PDF usually does the trick.",
      });
    }

    await db().from("policy_extractions").update({ status: "extracted", extracted: policy }).eq("id", row.id);
    return NextResponse.json({
      status: "extracted",
      // Light summary only; full findings come after the contact gate.
      summary: {
        carrier: policy.carrier.value,
        policy_type: policy.policy_type.value,
        face_amount: policy.face_amount.value,
      },
    });
  } catch (e) {
    logError("extract", e);
    return bad("Something went wrong on our end. Please try again.", 500);
  }
}
