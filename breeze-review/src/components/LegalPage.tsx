import type { ReactNode } from "react";
import { site } from "@/config/site";

export const EFFECTIVE = "[Effective date: to be set at launch]";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <p className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
        DRAFT for review by {site.parentBrand} compliance and legal counsel. Items in [brackets] must be completed, and the whole
        document confirmed against current law, before public launch.
      </p>
      <h1 className="mt-6 text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-breeze-navy-text">{EFFECTIVE}</p>
      <div className="mt-8 space-y-5 leading-relaxed [&_h2]:mt-10 [&_h2]:text-2xl [&_li]:ml-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </article>
  );
}
