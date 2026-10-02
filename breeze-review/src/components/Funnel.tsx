"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { US_STATES } from "@/config/site";
import { api, captureUtm, STORE_KEY, track } from "@/lib/client";
import { questionsFor } from "@/lib/questions";
import type { Analysis, Answers, Depth, Path } from "@/lib/types";
import type { ChatMsg } from "./ChatPanel";
import GateScreen, { type Contact } from "./GateScreen";
import QuestionScreen from "./QuestionScreen";
import ResultsScreen from "./ResultsScreen";
import UploadScreen from "./UploadScreen";
import { ErrorNote, Shell } from "./ui";

interface Saved {
  leadId?: string; token?: string; state?: string; supported?: boolean;
  path?: Path; depth?: Depth; answers: Answers; step: string;
  analysis?: Analysis; contact?: Contact; chat?: ChatMsg[];
}

const FIXED_BEFORE = ["state", "fork", "depth"];

export default function Funnel() {
  const [s, setS] = useState<Saved>({ answers: {}, step: "state" });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Restore autosaved progress (contact details are only kept once results exist).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        // A saved step with no session can't continue; start fresh.
        setS(saved.step !== "state" && !(saved.leadId && saved.token) ? { answers: {}, step: "state" } : saved);
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, [s, ready]);

  const session = useMemo(() => (s.leadId && s.token ? { leadId: s.leadId, token: s.token } : null), [s.leadId, s.token]);

  const steps = useMemo(() => {
    if (!s.path || !s.depth) return [...FIXED_BEFORE];
    const qs = questionsFor(s.path, s.depth, s.answers).map((q) => `q:${q.id}`);
    return [...FIXED_BEFORE, ...(s.path === "A" ? ["upload"] : []), ...qs, "gate"];
  }, [s.path, s.depth, s.answers]);

  const idx = steps.indexOf(s.step);
  const progress = idx < 0 ? 0 : (idx + 1) / (steps.length + (s.path ? 0 : 5));
  const go = (step: string) => { setError(""); setS((p) => ({ ...p, step })); window.scrollTo({ top: 0 }); };
  const back = () => idx > 0 && go(steps[idx - 1]);
  const next = () => go(steps[idx + 1]);

  const save = useCallback(async (patch: { path?: Path; depth?: Depth; answers?: Answers }) => {
    if (!session) return;
    await api("/api/session", "PATCH", { ...session, ...patch });
  }, [session]);

  async function chooseState(code: string) {
    setError(""); setBusy(true);
    const res = await api<{ leadId: string; token: string; supported: boolean }>("/api/session", "POST", {
      state: code, utm: captureUtm(), referrer: document.referrer.slice(0, 500),
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    track("state_selected", { leadId: res.data.leadId, token: res.data.token }, { state: code });
    setS((p) => ({ ...p, ...res.data, state: code, step: res.data.supported ? "fork" : "unsupported" }));
  }

  function restart() {
    try { localStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    setS({ answers: {}, step: "state" });
  }

  if (!ready) return null;

  // ----- Results -----
  if (s.step === "results" && s.analysis && s.contact && session) {
    return (
      <ResultsScreen
        analysis={s.analysis} session={session} contact={s.contact} chat={s.chat ?? []}
        setChat={(chat) => setS((p) => ({ ...p, chat }))}
      />
    );
  }

  // ----- Pre-results wizard -----
  const showBack = idx > 0 && s.step !== "state";
  return (
    <Shell progress={progress} onBack={showBack ? back : undefined}>
      {s.step === "state" && (
        <div className="card">
          <p className="eyebrow">Let's start</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">Which state do you live in?</h1>
          <p className="mt-2 text-breeze-navy-text">Insurance is licensed state by state, so this helps us point you to the right agent.</p>
          <StatePicker busy={busy} onPick={chooseState} />
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {s.step === "unsupported" && session && (
        <Unsupported session={session} stateName={US_STATES[s.state ?? ""] ?? "your state"} onRestart={restart} />
      )}

      {s.step === "fork" && (
        <div className="card">
          <p className="eyebrow">Where do you stand?</p>
          <h2 className="mt-3 text-3xl">What best describes you?</h2>
          <div className="mt-6 space-y-3">
            <button className="choice" onClick={() => { setS((p) => ({ ...p, path: "A" })); void save({ path: "A" }); track("fork_chosen", session ?? undefined, { path: "A" }); go("depth"); }}>
              I have a life insurance policy and want it reviewed
            </button>
            <button className="choice" onClick={() => { setS((p) => ({ ...p, path: "B" })); void save({ path: "B" }); track("fork_chosen", session ?? undefined, { path: "B" }); go("depth"); }}>
              I don't have coverage (or I'm not sure) and want to know what I need
            </button>
          </div>
        </div>
      )}

      {s.step === "depth" && (
        <div className="card">
          <p className="eyebrow">How deep?</p>
          <h2 className="mt-3 text-3xl">Quick overview, or a detailed personalized analysis?</h2>
          <div className="mt-6 space-y-3">
            {([["general", "Quick overview", "A few questions, about 2 minutes."], ["detailed", "Detailed analysis", "A few more questions for a sharper, more personal result."]] as const).map(([d, label, sub]) => (
              <button key={d} className="choice" onClick={async () => {
                setS((p) => ({ ...p, depth: d }));
                await save({ depth: d });
                track("depth_chosen", session ?? undefined, { depth: d });
                // steps recompute after depth is set; jump to the first step after "depth"
                const first = s.path === "A" ? "upload" : `q:${questionsFor("B", d, s.answers)[0].id}`;
                go(first);
              }}>
                <span>{label}<span className="block text-sm font-normal text-breeze-navy-text">{sub}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {s.step === "upload" && session && <UploadScreen session={session} onDone={() => (s.depth === "detailed" ? next() : go("gate"))} />}

      {s.step.startsWith("q:") && s.path && s.depth && (() => {
        const q = questionsFor(s.path, s.depth, s.answers).find((x) => `q:${x.id}` === s.step);
        if (!q) { go("gate"); return null; }
        return (
          <QuestionScreen
            key={q.id} q={q} answers={s.answers}
            onNext={(v) => {
              const answers = { ...s.answers, [q.id]: v } as Answers;
              if (v === undefined) delete answers[q.id];
              // Recompute the path with the new answers (conditional questions).
              const list = ["fixed", ...questionsFor(s.path!, s.depth!, answers).map((x) => `q:${x.id}`)];
              const at = list.indexOf(s.step);
              const after = at >= 0 ? list[at + 1] : undefined;
              setS((p) => ({ ...p, answers }));
              void save({ answers });
              go(after ?? "gate");
            }}
          />
        );
      })()}

      {s.step === "gate" && session && (
        <GateScreen
          session={session} defaultState={s.state ?? "FL"}
          onDone={(analysis, contact, state) => {
            setS((p) => ({ ...p, analysis, contact, state, step: "results" }));
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </Shell>
  );
}

function StatePicker({ onPick, busy }: { onPick: (code: string) => void; busy: boolean }) {
  const [v, setV] = useState("");
  return (
    <form className="mt-6" onSubmit={(e) => { e.preventDefault(); if (v) onPick(v); }}>
      <label htmlFor="state" className="sr-only">State</label>
      <select id="state" className="input" value={v} onChange={(e) => setV(e.target.value)}>
        <option value="">Select your state</option>
        {Object.entries(US_STATES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
      </select>
      <button className="btn-primary mt-6" disabled={!v || busy}>{busy ? "One moment..." : <>Continue <span aria-hidden>&rarr;</span></>}</button>
    </form>
  );
}

function Unsupported({ session, stateName, onRestart }: { session: { leadId: string; token: string }; stateName: string; onRestart: () => void }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await api("/api/lead/waitlist", "POST", { ...session, email });
    if (res.ok) setDone(true); else setError(res.error);
  }
  return (
    <div className="card">
      <p className="eyebrow">Not available yet</p>
      <h2 className="mt-3 text-3xl">We're not able to help in {stateName} just yet.</h2>
      <p className="mt-3 text-breeze-navy-text">Breeze Financial Group agents aren't licensed there right now. Leave your email and we'll let you know if that changes. You can also use the general education on our site in the meantime.</p>
      {done ? (
        <p className="mt-6 rounded-2xl bg-soft p-4 font-semibold">Thanks! We'll be in touch if we expand to {stateName}.</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
          <label htmlFor="wl-email" className="sr-only">Email</label>
          <input id="wl-email" type="email" inputMode="email" autoComplete="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <ErrorNote>{error}</ErrorNote>
          <button className="btn-primary">Notify me</button>
        </form>
      )}
      <button className="btn-ghost mt-4" onClick={onRestart}>Chose the wrong state? Start over</button>
    </div>
  );
}
