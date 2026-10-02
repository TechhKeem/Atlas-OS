"use client";

export const STORE_KEY = "breeze-review:v1";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function api<T = unknown>(url: string, method: "POST" | "PATCH", body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json.error ?? "Something went wrong. Please try again." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "We couldn't reach the server. Check your connection and try again." };
  }
}

export function track(name: string, session?: { leadId?: string; token?: string }, props?: Record<string, string | number | boolean>) {
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer?.push({ event: `breeze_${name}`, ...props });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, leadId: session?.leadId, token: session?.token, props }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never break the UI */
  }
}

export function captureUtm(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "ttclid", "gclid"]) {
      const v = q.get(k);
      if (v) out[k] = v.slice(0, 200);
    }
    if (Object.keys(out).length) sessionStorage.setItem("breeze-utm", JSON.stringify(out));
    else return JSON.parse(sessionStorage.getItem("breeze-utm") ?? "{}");
  } catch {
    /* ignore */
  }
  return out;
}
