"use client";
import { useEffect } from "react";
import { DISCLAIMER, site } from "@/config/site";
import { money } from "@/lib/dime";
import { track } from "@/lib/client";
import type { Analysis, DimeResult, Finding, Severity } from "@/lib/types";
import ChatPanel, { type ChatMsg } from "./ChatPanel";
import BookingPanel from "./BookingPanel";

const SEV: Record<Severity, { label: string; icon: string; cls: string }> = {
  important: { label: "Important", icon: "!", cls: "bg-red-50 text-red-900 border-red-200" },
  worth_a_look: { label: "Worth a look", icon: "i", cls: "bg-amber-50 text-amber-900 border-amber-200" },
  looks_good: { label: "Looks good", icon: "✓", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
};

function FindingCard({ f }: { f: Finding }) {
  const s = SEV[f.severity];
  return (
    <li className="card !p-5">
      <span className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${s.cls}`}>
        <span aria-hidden className="font-display">{s.icon}</span>{s.label}
      </span>
      <h3 className="mt-3 text-xl">{f.title}</h3>
      <p className="mt-2 leading-relaxed text-breeze-navy-text">{f.body}</p>
    </li>
  );
}

const DIME_PARTS: { key: keyof Pick<DimeResult, "debt" | "income" | "mortgage" | "education">; label: string; why: string; color: string }[] = [
  { key: "debt", label: "Debt", why: "Non-mortgage debts that would otherwise fall on your family.", color: "#62CFEE" },
  { key: "income", label: "Income", why: "Replacing your paycheck for the number of years you chose.", color: "#1EA5CF" },
  { key: "mortgage", label: "Mortgage", why: "Paying off the home so it can stay in the family.", color: "#0E688E" },
  { key: "education", label: "Education", why: "Funding school for children who still have it ahead of them.", color: "#074372" },
];

function DimeView({ d }: { d: DimeResult }) {
  const total = d.subtotal || 1;
  return (
    <div className="card">
      <h2 className="text-2xl">How we got there</h2>
      <div className="mt-5 flex h-5 w-full overflow-hidden rounded-pill bg-slate-100" role="img" aria-label={`Breakdown: ${DIME_PARTS.map((p) => `${p.label} ${money(d[p.key])}`).join(", ")}`}>
        {DIME_PARTS.map((p) => d[p.key] > 0 && <div key={p.key} style={{ width: `${(d[p.key] / total) * 100}%`, background: p.color }} />)}
      </div>
      <ul className="mt-5 space-y-4">
        {DIME_PARTS.map((p) => (
          <li key={p.key} className="flex items-start gap-3">
            <span aria-hidden className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
            <div className="flex-1">
              <div className="flex justify-between gap-3 font-semibold"><span>{p.label}</span><span>{money(d[p.key])}</span></div>
              <p className="text-sm text-breeze-navy-text">{p.why}</p>
            </div>
          </li>
        ))}
      </ul>
      {d.existingCoverage > 0 && (
        <p className="mt-5 rounded-2xl bg-soft p-4 text-sm text-breeze-navy-text">
          You mentioned {money(d.existingCoverage)} of existing coverage, which would leave a possible gap of about {money(d.gapLow)} to {money(d.gapHigh)}.
        </p>
      )}
      <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-breeze-navy-text">
        {d.assumptions.map((a) => <li key={a}>{a}</li>)}
      </ul>
    </div>
  );
}

export default function ResultsScreen({
  analysis, session, contact, chat, setChat,
}: {
  analysis: Analysis;
  session: { leadId: string; token: string };
  contact: { fullName: string; email: string; phone: string };
  chat: ChatMsg[];
  setChat: (m: ChatMsg[]) => void;
}) {
  useEffect(() => track("results_viewed", session), [session]);
  const first = contact.fullName.split(" ")[0];
  const goBook = () => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <section className="bg-brand-gradient-text text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <p className="eyebrow !text-white/80">{analysis.path === "A" ? "Your policy review" : "Your coverage estimate"}</p>
          <h1 className="mt-3 text-3xl sm:text-5xl">{first ? `${first}, ` : ""}{analysis.path === "B" && analysis.dime ? "here's what your family may need." : "here's what we found."}</h1>
          {analysis.path === "B" && analysis.dime ? (
            <p className="mt-6 font-display text-4xl font-extrabold sm:text-5xl">{money(analysis.dime.low)} <span className="text-white/70">to</span> {money(analysis.dime.high)}</p>
          ) : (
            <p className="mt-5 text-lg text-white/90">{analysis.headline}</p>
          )}
          <button onClick={goBook} className="btn-secondary mt-8 !border-white !bg-transparent !text-white hover:!bg-white/10">Talk it through with an agent <span aria-hidden>&rarr;</span></button>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {analysis.findings && <ul className="space-y-4">{analysis.findings.map((f) => <FindingCard key={f.id} f={f} />)}</ul>}
        {analysis.dime && <DimeView d={analysis.dime} />}
        <ChatPanel session={session} messages={chat} setMessages={setChat} onBook={goBook} />
        <BookingPanel session={session} contact={contact} />
      </div>

      <section className="bg-footer-gradient text-slate-200">
        <p className="mx-auto max-w-3xl px-4 py-6 text-xs leading-relaxed">{DISCLAIMER}</p>
        <p className="mx-auto max-w-3xl px-4 pb-6 text-xs text-slate-300">{site.licensingDisclosure}</p>
      </section>
    </>
  );
}
