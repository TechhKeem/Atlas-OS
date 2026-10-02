import { NextResponse } from "next/server";
import { retention } from "@/config/site";
import { BUCKET, bad, cronAuthorized, db, logError } from "@/lib/server";

/**
 * Daily job: (1) delete original uploads older than DOCUMENT_RETENTION_DAYS
 * (default 30) from storage and stamp document_deleted_at; (2) if
 * STRUCTURED_RETENTION_DAYS > 0, delete leads (and cascaded rows) past that age.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return bad("Unauthorized", 401);
  try {
    const cutoff = new Date(Date.now() - retention.documentDays * 86_400_000).toISOString();
    const { data: due } = await db()
      .from("policy_extractions")
      .select("id, storage_path")
      .is("document_deleted_at", null)
      .lt("uploaded_at", cutoff)
      .limit(500);

    let deleted = 0;
    if (due?.length) {
      const { error } = await db().storage.from(BUCKET).remove(due.map((d) => d.storage_path));
      if (error) throw error;
      await db().from("policy_extractions").update({ document_deleted_at: new Date().toISOString() }).in("id", due.map((d) => d.id));
      deleted = due.length;
    }

    let leadsPurged = 0;
    if (retention.structuredDays > 0) {
      const lc = new Date(Date.now() - retention.structuredDays * 86_400_000).toISOString();
      const { data: old } = await db().from("leads").select("id").lt("created_at", lc).limit(500);
      if (old?.length) {
        const ids = old.map((l) => l.id);
        const { data: docs } = await db().from("policy_extractions").select("storage_path").in("lead_id", ids).is("document_deleted_at", null);
        if (docs?.length) await db().storage.from(BUCKET).remove(docs.map((d) => d.storage_path));
        await db().from("leads").delete().in("id", ids);
        leadsPurged = ids.length;
      }
    }
    return NextResponse.json({ documentsDeleted: deleted, leadsPurged });
  } catch (e) {
    logError("cron.retention", e);
    return bad("Retention job failed", 500);
  }
}
