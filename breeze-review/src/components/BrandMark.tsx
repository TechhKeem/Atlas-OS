"use client";
import { useState } from "react";
import { site } from "@/config/site";

/** BFG monogram from /public/brand/, falling back to a text mark until real assets are added. */
export default function BrandMark() {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex items-center gap-2.5">
      {failed ? (
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient font-display text-sm text-white">
          {site.parentShort}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/brand/bfg-monogram.png" alt="" className="h-9 w-auto" onError={() => setFailed(true)} />
      )}
      <span className="leading-tight">
        <span className="block font-display text-base font-extrabold tracking-tight text-breeze-navy">{site.productName}</span>
        <span className="eyebrow block !text-[10px]">{site.parentBrand}</span>
      </span>
    </span>
  );
}
