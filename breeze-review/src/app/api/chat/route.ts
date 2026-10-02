import { NextResponse } from "next/server";
import { z } from "zod";
import { limits } from "@/config/site";
import { chatReply } from "@/lib/chat";
import { scoreLead } from "@/lib/score";
import { allow, authLead, bad, clientIp, db, logError, tooMany } from "@/lib/server";
import type { Answers } from "@/lib/types";

export const maxDuration = 30;

const schema = z.object({ leadId: z.string(), token: z.string(), message: z.string().trim().min(1) });

export async function POST(req: Request) {
  try {
    if (!(await allow(`chat:${clientIp(req)}`, 600, 20))) return tooMany();
    const p = schema.safeParse(await req.json());
    if (!p.success) return bad("Please type a question.");
    if (p.data.message.length > limits.chatMaxMessageChars)
      return bad(`Please keep questions under ${limits.chatMaxMessageChars} characters.`);
    const lead = await authLead(p.data.leadId, p.data.token);
    if (!lead || lead.status !== "completed") return bad("Session expired. Please start again.", 401);

    const { data: msgs } = await db()
      .from("chat_messages")
      .select("role, content")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: true });
    const history = (msgs ?? []) as { role: "user" | "assistant"; content: string }[];
    const userTurns = history.filter((m) => m.role === "user").length;
    if (userTurns >= limits.chatMaxTurns)
      return NextResponse.json({ limitReached: true, reply: "We've covered a lot! The best next step is a quick call with a BFG agent who can answer the rest." });

    const { data: analysis } = await db()
      .from("analyses")
      .select("result")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reply = await chatReply({
      sessionData: {
        firstName: lead.full_name?.split(" ")[0] ?? null,
        state: lead.state,
        path: lead.path,
        depth: lead.depth,
        answers: lead.answers,
        results: analysis?.result ?? null,
      },
      history: [...history.slice(-16), { role: "user", content: p.data.message }],
      userTurns: userTurns + 1,
    });

    await db().from("chat_messages").insert([
      { lead_id: lead.id, role: "user", content: p.data.message },
      { lead_id: lead.id, role: "assistant", content: reply },
    ]);

    const { data: ext } = await db().from("policy_extractions").select("id").eq("lead_id", lead.id).limit(1);
    const score = scoreLead({
      depth: lead.depth,
      documentUploaded: !!ext?.length,
      answers: (lead.answers ?? {}) as Answers,
      chatTurns: userTurns + 1,
      booked: lead.booking_status === "scheduled",
    });
    await db().from("leads").update({ lead_score: score.total, score_components: score.components }).eq("id", lead.id);

    return NextResponse.json({ reply, turns: userTurns + 1, nudge: userTurns + 1 >= limits.chatNudgeAfterTurns });
  } catch (e) {
    logError("chat", e);
    return bad("I couldn't answer just now. Please try again in a moment.", 500);
  }
}
