"use client";
import { useEffect, useRef, useState } from "react";
import { limits } from "@/config/site";
import { api, track } from "@/lib/client";

export interface ChatMsg { role: "user" | "assistant"; content: string }

export default function ChatPanel({
  session, messages, setMessages, onBook,
}: {
  session: { leadId: string; token: string };
  messages: ChatMsg[]; setMessages: (m: ChatMsg[]) => void; onBook: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const turns = messages.filter((m) => m.role === "user").length;

  useEffect(() => endRef.current?.scrollIntoView({ block: "nearest" }), [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || busy) return;
    setError("");
    if (turns === 0) track("chat_started", session);
    const next = [...messages, { role: "user" as const, content: message }];
    setMessages(next); setText(""); setBusy(true);
    const res = await api<{ reply: string; limitReached?: boolean }>("/api/chat", "POST", { ...session, message });
    setBusy(false);
    if (!res.ok) { setError(res.error); setMessages(messages); setText(message); return; }
    setMessages([...next, { role: "assistant", content: res.data.reply }]);
    if (res.data.limitReached) setLimitReached(true);
  }

  return (
    <section className="card" aria-labelledby="chat-h">
      <h2 id="chat-h" className="text-2xl">Questions about your results?</h2>
      <p className="mt-1 text-sm text-breeze-navy-text">Ask in plain English. I can explain your results and general life insurance basics. I can't recommend products or prices; that's what an agent is for.</p>

      <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-soft p-4" aria-live="polite">
        <Bubble role="assistant">Hi! I'm here to help you make sense of your results. What would you like to know?</Bubble>
        {messages.map((m, i) => <Bubble key={i} role={m.role}>{m.content}</Bubble>)}
        {busy && <Bubble role="assistant"><span className="animate-pulse">Thinking...</span></Bubble>}
        <div ref={endRef} />
      </div>

      {(turns >= limits.chatNudgeAfterTurns || limitReached) && (
        <button onClick={() => { track("booking_clicked", session, { from: "chat" }); onBook(); }} className="btn-secondary mt-4">
          Talk it through with an agent <span aria-hidden>&rarr;</span>
        </button>
      )}

      {!limitReached && (
        <form onSubmit={send} className="mt-4 flex gap-2">
          <label htmlFor="chat-input" className="sr-only">Your question</label>
          <input id="chat-input" className="input !py-3 !text-base" value={text} maxLength={limits.chatMaxMessageChars} placeholder="Type your question" onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn-primary !px-5" disabled={busy || !text.trim()}>Send</button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-900">{error}</p>}
    </section>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${mine ? "rounded-br-md bg-breeze-deep text-white" : "rounded-bl-md bg-white text-breeze-navy shadow-sm"}`}>
        {children}
      </div>
    </div>
  );
}
