import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { limits } from "@/config/site";
import { allow, authLead, BUCKET, bad, clientIp, db, logError, tooMany } from "@/lib/server";

const schema = z.object({
  leadId: z.string(),
  token: z.string(),
  contentType: z.string(),
  size: z.number().int().positive(),
});

/**
 * Step 1 of upload: validate declared type/size, then hand back a short-lived
 * signed upload URL with a randomized object name. The file goes straight to
 * private storage (avoids serverless body limits). The real type is verified
 * again from the file's bytes before extraction.
 */
export async function POST(req: Request) {
  try {
    if (!(await allow(`upload:${clientIp(req)}`, 3600, 15))) return tooMany();
    const p = schema.safeParse(await req.json());
    if (!p.success) return bad("Invalid request");
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead) return bad("Session expired. Please start again.", 401);

    const ext = limits.allowedUploadTypes[p.data.contentType];
    if (!ext) return bad("Please upload a PDF, JPG or PNG. (iPhone HEIC photos are converted automatically.)");
    if (p.data.size > limits.maxUploadBytes) return bad("That file is over 20 MB. Please upload a smaller file or a photo.");

    const { count } = await db().from("policy_extractions").select("id", { count: "exact", head: true }).eq("lead_id", lead.id);
    if ((count ?? 0) >= limits.extractionsPerLead) return bad("You've reached the upload limit for this session.", 429);

    const path = `${lead.id}/${crypto.randomUUID()}.${ext}`;
    const { data, error } = await db().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;

    const { data: row, error: e2 } = await db()
      .from("policy_extractions")
      .insert({ lead_id: lead.id, storage_path: path, original_type: p.data.contentType, size_bytes: p.data.size })
      .select("id")
      .single();
    if (e2) throw e2;

    return NextResponse.json({ extractionId: row.id, signedUrl: data.signedUrl });
  } catch (e) {
    logError("upload", e);
    return bad("We couldn't start your upload. Please try again.", 500);
  }
}
