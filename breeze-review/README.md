# Breeze Review

AI-powered life insurance policy review and lead-generation funnel for Breeze Financial Group (BFG).
Goal of the app: a booked call with a BFG agent. Next.js (App Router) + TypeScript + Tailwind, Supabase (Postgres + private Storage), Claude API, Calendly, Netlify.

> **Compliance review required before public launch.** TCPA consent language, state insurance advertising rules, privacy law (e.g. CCPA) and the Privacy Policy / Terms (full drafts at `/privacy` and `/terms`, with [bracketed] gaps to fill) must be reviewed by BFG compliance/legal. Set `NEXT_PUBLIC_SERVED_STATES` and `NEXT_PUBLIC_LICENSING_DISCLOSURE`.

## Flow

Landing → state (unsupported states get an email waitlist, never a dead end) → fork (policy review / no coverage) → depth (general / detailed) →
**Path A:** upload → Claude extraction → rules findings · **Path B:** DIME wizard → coverage range →
contact gate + TCPA consent → results (computed server-side only after the gate) → Claude chat → Calendly booking.

## Setup

```bash
cd breeze-review
npm install
cp .env.example .env.local      # fill in every value
npm run dev
npm test                        # DIME, gap rules, scoring, extraction parsing
npm run fixtures                # regenerate synthetic sample policy PDFs in fixtures/policies/
```

1. **Supabase**: create a project, run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`). It creates all tables, enables RLS on every one (no policies, so anon/authenticated get no access), and creates the private `policy-docs` bucket. The app uses only the **service-role key, server-side**.
2. **Anthropic**: set `ANTHROPIC_API_KEY`. Model defaults to `claude-sonnet-5-5` (`ANTHROPIC_MODEL`).
3. **Calendly**: set `NEXT_PUBLIC_CALENDLY_URL` to the round-robin event type. The widget passes the lead id as `utm_content` and prefills name/email. To prefill phone, make **question 1** on the event type a phone field. Create a webhook subscription (`invitee.created`, `invitee.canceled`) pointing to `https://<site>/api/calendly-webhook` and put its signing key in `CALENDLY_WEBHOOK_SIGNING_KEY`.
4. **Google Sheets** (optional mirror): create a service account, share the sheet with its email as Editor, set the three `GOOGLE_*` vars. Columns: created_at, name, phone, email, state, path, depth, headline, score, source, booking status at completion, lead id. Failed writes are retried by the cron route. Booking status in the sheet is a snapshot at completion; Postgres is authoritative.
5. **Brand assets**: in `public/brand/`. `bfg-monogram.png` (BFG initials) is used in the header; the Breeze wordmark and on-blue versions are included for later use. The header falls back to a text mark if the file is missing.

## Deploy on Netlify

1. Connect the GitHub repo; set **base directory** to `breeze-review` (build command `npm run build`; the Next.js runtime plugin is configured in `netlify.toml`).
2. Add all variables from `.env.example` in Site settings → Environment variables (server keys must **not** be prefixed `NEXT_PUBLIC_`).
3. `netlify/functions/scheduled-jobs.mts` runs every 6 hours and calls `/api/cron/retention` and `/api/cron/sheets` with `Authorization: Bearer $CRON_SECRET`. Set `CRON_SECRET` to a long random string.
4. Uploads go straight from the browser to Supabase Storage via a signed upload URL (avoids Netlify's request-size limit).

## Data and privacy

- Uploads: private bucket, randomized object names, server-side type check from file bytes (not the client's claim), 20 MB cap. HEIC is converted to JPEG in the browser. Staff access is meant to be through server-generated short-lived signed URLs only (no staff UI yet; generate with the service key via `createSignedUrl`).
- **Retention:** originals are deleted after `DOCUMENT_RETENTION_DAYS` (default 30) by the retention job, which removes the storage object and sets `policy_extractions.document_deleted_at`. This is a Netlify scheduled function rather than pg_cron because deleting storage objects through SQL leaves orphaned files; the Storage API is the supported path. Structured data is retained unless `STRUCTURED_RETENTION_DAYS` > 0.
- **Deletion request:** `npm run delete-lead -- --email person@example.com` (or `--id <uuid>`) removes documents and cascades all personal data. Remove the Sheet row manually.
- Consent: the exact text, version, timestamp, IP and user agent are stored per lead in `consents` (text comes from `src/config/site.ts`, never from the client).
- Logs never include document contents or PII.
- Chat abuse protection: per-IP rate limit, 600-character messages, 12 turns per lead.
- After results, the user's name/email/phone are kept in their own browser's localStorage so the booking widget can prefill after a refresh.

## Config for Phase 2 (white-label)

Agency-specific copy, Calendly URL, disclaimer, consent text, licensing disclosure and served states live in `src/config/site.ts` and env. Brand colors are CSS variables in `src/app/globals.css` mapped into `tailwind.config.ts`.

## Design notes

- White text on the results hero uses `--gradient-brand-text` (same hues, darker start) so it meets AA. The exact brand gradient is used for the progress bar. Primary buttons use the light end of the gradient with navy label text.
- The landing headline highlight uses `--breeze-deep` rather than `--breeze-cyan`, which is below 3:1 on white.
- The DIME range is the plain DIME total (low) to total + 10% cushion + $15k final expenses (high), rounded to $5k. All assumptions are in `src/lib/dime.ts` and shown to the user.

## Out of scope

White-label SaaS, Go High Level, internal routing/calendar logic, any product/carrier/price recommendation by the app.
