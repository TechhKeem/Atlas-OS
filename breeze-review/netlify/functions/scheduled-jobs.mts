import type { Config } from "@netlify/functions";

// Calls the protected cron routes. Set URL (provided by Netlify) and CRON_SECRET.
export default async () => {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  const headers = { Authorization: `Bearer ${process.env.CRON_SECRET}` };
  for (const path of ["/api/cron/retention", "/api/cron/sheets"]) {
    const res = await fetch(`${base}${path}`, { headers });
    console.log(path, res.status);
  }
};

export const config: Config = { schedule: "0 */6 * * *" };
