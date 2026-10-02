"use client";
import { useState } from "react";
import type { Answers } from "@/lib/types";
import type { Question } from "@/lib/questions";
import { ErrorNote, Micro } from "./ui";

const fmt = (n: number | undefined) => (n == null ? "" : n.toLocaleString("en-US"));

export default function QuestionScreen({
  q, answers, onNext,
}: { q: Question; answers: Answers; onNext: (value: Answers[keyof Answers] | undefined) => void }) {
  const current = answers[q.id];
  const [text, setText] = useState(
    q.type === "currency" || q.type === "integer" ? fmt(current as number | undefined) : ((current as string | undefined) ?? ""),
  );
  const [choice, setChoice] = useState<string | boolean | number | undefined>(q.type === "choice" ? (current as never) : undefined);
  const [error, setError] = useState("");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (q.type === "choice") {
      if (choice === undefined) return setError("Please choose one to continue.");
      return onNext(choice as never);
    }
    if (q.type === "text") {
      if (!text.trim() && !q.optional) return setError("Please enter an answer to continue.");
      return onNext(text.trim() || undefined);
    }
    const n = Number(text.replace(/[^0-9.]/g, ""));
    if (!text.trim()) return q.optional ? onNext(undefined) : setError("Please enter a number, or your best estimate.");
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) return setError("Please enter a valid number.");
    if (q.type === "integer" && n > 20) return setError("Please enter a number up to 20.");
    onNext(q.type === "integer" ? Math.floor(n) : n);
  }

  const id = `q-${q.id}`;
  return (
    <form onSubmit={submit} noValidate className="card">
      <p className="eyebrow">{q.eyebrow}</p>
      <h2 className="mt-3 text-2xl sm:text-3xl" id={`${id}-label`}>{q.title}</h2>
      {q.help && <p id={`${id}-help`} className="mt-2 text-breeze-navy-text">{q.help}</p>}

      <div className="mt-6">
        {q.type === "choice" ? (
          <div role="radiogroup" aria-labelledby={`${id}-label`} className="space-y-3">
            {q.options!.map((o) => (
              <button
                key={String(o.value)} type="button" role="radio" aria-checked={choice === o.value}
                className="choice" onClick={() => setChoice(o.value)}
              >
                <span>
                  {o.label}
                  {o.sub && <span className="block text-sm font-normal text-breeze-navy-text">{o.sub}</span>}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="relative">
            {q.type === "currency" && <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">$</span>}
            <input
              id={id} aria-labelledby={`${id}-label`} aria-describedby={q.help ? `${id}-help` : undefined}
              className={`input ${q.type === "currency" ? "pl-9" : ""}`}
              inputMode={q.type === "text" ? "text" : "numeric"} autoComplete="off" placeholder={q.placeholder}
              value={text}
              onChange={(e) => {
                const v = e.target.value;
                setText(q.type === "currency" ? (v.replace(/[^0-9]/g, "") ? Number(v.replace(/[^0-9]/g, "")).toLocaleString("en-US") : "") : v);
              }}
              autoFocus
            />
          </div>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>
      {q.micro && <Micro>{q.micro}</Micro>}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-primary">Continue <span aria-hidden>&rarr;</span></button>
        {q.optional && <button type="button" className="btn-ghost" onClick={() => onNext(undefined)}>Skip</button>}
      </div>
    </form>
  );
}
