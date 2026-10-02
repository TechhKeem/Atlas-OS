"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_TEXT, SERVED_STATES, US_STATES } from "@/config/site";
import { api, track } from "@/lib/client";
import type { Analysis } from "@/lib/types";
import { ErrorNote } from "./ui";

export interface Contact { fullName: string; email: string; phone: string }

export default function GateScreen({
  session, defaultState, onDone,
}: {
  session: { leadId: string; token: string }; defaultState: string;
  onDone: (a: Analysis, c: Contact, state: string) => void;
}) {
  const [c, setC] = useState<Contact>({ fullName: "", email: "", phone: "" });
  const [state, setState] = useState(defaultState);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => track("gate_viewed", session), [session]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!consent) return setError("Please check the box to continue.");
    setBusy(true);
    const res = await api<{ analysis: Analysis }>("/api/lead/complete", "POST", { ...session, ...c, state, consent: true });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    track("gate_submitted", session);
    onDone(res.data.analysis, c, state);
  }

  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });

  return (
    <form onSubmit={submit} noValidate className="card">
      <p className="eyebrow">Almost there</p>
      <h2 className="mt-3 text-2xl sm:text-3xl">Enter your info to see your personalized results.</h2>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Full name</span>
          <input className="input" autoComplete="name" value={c.fullName} onChange={set("fullName")} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Email</span>
          <input className="input" type="email" autoComplete="email" inputMode="email" value={c.email} onChange={set("email")} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Mobile phone</span>
          <input className="input" type="tel" autoComplete="tel" inputMode="tel" value={c.phone} onChange={set("phone")} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">State</span>
          <select className="input" value={state} onChange={(e) => setState(e.target.value)} required>
            {Object.entries(US_STATES).filter(([k]) => SERVED_STATES.includes(k)).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-soft p-4">
          <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#0E688E]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span className="text-sm leading-relaxed text-breeze-navy">
            {renderConsent(CONSENT_TEXT)}
          </span>
        </label>
      </div>

      <ErrorNote>{error}</ErrorNote>
      <button type="submit" className="btn-primary mt-6 w-full sm:w-auto" disabled={busy}>
        {busy ? "Preparing your results..." : <>See my results <span aria-hidden>&rarr;</span></>}
      </button>
    </form>
  );
}

/** Same exact text as stored server-side, with the legal terms linked. */
function renderConsent(text: string) {
  const [before, rest] = text.split("Privacy Policy and Terms");
  return (
    <>
      {before}
      <Link href="/privacy" target="_blank" className="font-semibold underline">Privacy Policy</Link> and{" "}
      <Link href="/terms" target="_blank" className="font-semibold underline">Terms</Link>
      {rest}
    </>
  );
}
