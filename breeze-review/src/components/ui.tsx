"use client";
import type { ReactNode } from "react";

export function Progress({ value }: { value: number }) {
  const pct = Math.max(4, Math.min(100, Math.round(value * 100)));
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress" className="h-2.5 w-full overflow-hidden rounded-pill bg-slate-100">
      <div className="h-full rounded-pill bg-brand-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Shell({ progress, onBack, children }: { progress?: number; onBack?: () => void; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-12">
      {progress !== undefined && (
        <div className="mb-6 space-y-3">
          <Progress value={progress} />
          {onBack && (
            <button type="button" onClick={onBack} className="btn-ghost -ml-3">
              <span aria-hidden>&larr;</span> Back
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function Micro({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 rounded-2xl bg-soft p-4 text-sm leading-relaxed text-breeze-navy-text">
      <span className="eyebrow mr-2 !text-[10px]">Good to know</span>
      {children}
    </p>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="mt-4 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900">{children}</p>;
}

export function Skeleton({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card text-center" role="status" aria-live="polite">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-breeze-mid" aria-hidden />
      <h2 className="mt-6 text-2xl">{title}</h2>
      <p className="mt-2 text-breeze-navy-text">{sub}</p>
      <div className="mt-6 space-y-3" aria-hidden>
        <div className="h-3 animate-pulse rounded-pill bg-slate-100" />
        <div className="mx-auto h-3 w-4/5 animate-pulse rounded-pill bg-slate-100" />
        <div className="mx-auto h-3 w-3/5 animate-pulse rounded-pill bg-slate-100" />
      </div>
    </div>
  );
}
