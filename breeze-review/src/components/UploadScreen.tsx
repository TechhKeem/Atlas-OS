"use client";
import { useRef, useState } from "react";
import { site } from "@/config/site";
import { api, track } from "@/lib/client";
import { ErrorNote, Skeleton } from "./ui";

interface Session { leadId: string; token: string }
type Phase = "idle" | "uploading" | "reading" | "done";

const isHeic = (f: File) => /heic|heif/i.test(f.type) || /\.(heic|heif)$/i.test(f.name);
const MAX = 20 * 1024 * 1024;

export default function UploadScreen({ session, onDone }: { session: Session; onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [summary, setSummary] = useState<{ carrier: string | null; policy_type: string | null; face_amount: number | null } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setError("");
    try {
      let f = file;
      if (isHeic(file)) {
        const heic2any = (await import("heic2any")).default;
        const blob = (await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })) as Blob;
        f = new File([blob], "photo.jpg", { type: "image/jpeg" });
      }
      if (!["application/pdf", "image/jpeg", "image/png"].includes(f.type)) return setError("Please upload a PDF, JPG, PNG or HEIC file.");
      if (f.size > MAX) return setError("That file is over 20 MB. Please upload a smaller file or take a photo.");

      track("upload_started", session);
      setPhase("uploading");
      const init = await api<{ extractionId: string; signedUrl: string }>("/api/upload", "POST", { ...session, contentType: f.type, size: f.size });
      if (!init.ok) { setPhase("idle"); return setError(init.error); }

      const fd = new FormData();
      fd.append("cacheControl", "3600");
      fd.append("", f);
      const put = await fetch(init.data.signedUrl, { method: "PUT", body: fd });
      if (!put.ok) { setPhase("idle"); return setError("The upload didn't go through. Please check your connection and try again."); }

      setPhase("reading");
      const ext = await api<{ status: string; message?: string; summary?: typeof summary }>("/api/extract", "POST", { ...session, extractionId: init.data.extractionId });
      if (!ext.ok) { setPhase("idle"); return setError(ext.error); }
      if (ext.data.status === "unreadable") { setPhase("idle"); return setError(ext.data.message ?? "We couldn't read that clearly. Please try a sharper photo or the PDF."); }

      track("extraction_done", session);
      setSummary(ext.data.summary ?? null);
      setPhase("done");
    } catch {
      setPhase("idle");
      setError("We couldn't process that file. Please try a different photo or the PDF.");
    }
  }

  if (phase === "uploading") return <Skeleton title="Uploading securely..." sub="Hang tight, this only takes a moment." />;
  if (phase === "reading") return <Skeleton title="Reading your policy..." sub="Longer policies can take up to a minute. We're checking the details so you don't have to." />;

  if (phase === "done") {
    return (
      <div className="card">
        <p className="eyebrow">Got it</p>
        <h2 className="mt-3 text-3xl">We've read your policy.</h2>
        <p className="mt-3 text-breeze-navy-text">
          {summary?.carrier ? `We found a ${summary.carrier} policy` : "We found your policy"}
          {summary?.face_amount ? ` with a face amount of about $${summary.face_amount.toLocaleString("en-US")}` : ""}. Next, a few quick details so your review is as accurate as possible.
        </p>
        <button className="btn-primary mt-8" onClick={onDone}>Continue <span aria-hidden>&rarr;</span></button>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="eyebrow">Your policy</p>
      <h2 className="mt-3 text-2xl sm:text-3xl">Upload your life insurance policy</h2>
      <p className="mt-2 text-breeze-navy-text">A PDF or a clear photo of the policy pages works. The page with your coverage amount and dates matters most.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) void handle(f); }}
        className={`mt-6 rounded-3xl border-2 border-dashed p-6 text-center transition ${drag ? "border-breeze-deep bg-soft" : "border-slate-300"}`}
      >
        <p className="hidden font-semibold sm:block">Drag and drop your file here</p>
        <p className="hidden text-sm text-breeze-navy-text sm:block">or</p>
        <div className="flex flex-col items-stretch gap-3 sm:mt-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()}>Choose a file</button>
          <button type="button" className="btn-secondary sm:hidden" onClick={() => camRef.current?.click()}>Take a photo</button>
        </div>
        <p className="mt-4 text-xs text-breeze-navy-text">PDF, JPG, PNG or HEIC, up to 20 MB</p>
        <input ref={fileRef} type="file" className="sr-only" aria-label="Choose a policy file" accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,.heic,.heif" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
        <input ref={camRef} type="file" className="sr-only" aria-label="Take a photo of your policy" accept="image/*" capture="environment" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
      </div>

      <ErrorNote>{error}</ErrorNote>
      <p className="mt-4 text-sm text-breeze-navy-text"><span aria-hidden>🔒 </span>{site.privacyNote}</p>
    </div>
  );
}
