/**
 * Honor a deletion request: removes a lead's stored documents and ALL personal
 * data (cascades to extractions, answers, analyses, chat, consents; bookings are
 * detached and their invitee email removed).
 *
 *   npm run delete-lead -- --email person@example.com
 *   npm run delete-lead -- --id <lead-uuid>
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from "@supabase/supabase-js";

async function main() {
  const args = process.argv.slice(2);
  const get = (flag: string) => args[args.indexOf(flag) + 1];
  const email = args.includes("--email") ? get("--email") : null;
  const id = args.includes("--id") ? get("--id") : null;
  if (!email && !id) throw new Error("Pass --email <address> or --id <lead uuid>");

  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const q = sb.from("leads").select("id");
  const { data: leads, error } = email ? await q.ilike("email", email) : await q.eq("id", id!);
  if (error) throw error;
  if (!leads?.length) return console.log("No matching leads.");

  for (const { id: leadId } of leads) {
    const { data: docs } = await sb.from("policy_extractions").select("storage_path").eq("lead_id", leadId).is("document_deleted_at", null);
    if (docs?.length) await sb.storage.from("policy-docs").remove(docs.map((d) => d.storage_path));
    await sb.from("bookings").update({ invitee_email: null, raw: null }).eq("lead_id", leadId);
    const { error: delErr } = await sb.from("leads").delete().eq("id", leadId);
    if (delErr) throw delErr;
    console.log(`Deleted lead ${leadId} (${docs?.length ?? 0} documents removed).`);
  }
  console.log("Note: the Google Sheet mirror row (if any) must be removed manually.");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
