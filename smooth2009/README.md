# Smooth2009.org — launch checklist

## Files
- `index.html` — the whole website (one page). Upload this plus the `images/` folder to your host.
- `Code.gs` — the script that saves form submissions into a Google Sheet.
- `images/` — photos with these exact names:
  - Included: crests (4), `founder-*.jpg` (4), `hero.jpg`, `section-*.jpg` (3), `program-*.jpg` (5), `donate.jpg`, `gallery-*.jpg` (6)
  Any photo that's missing shows a styled placeholder instead.

## 1. Connect the newsletter form to Google Sheets (10 minutes)
1. Create a Google Sheet named "SMOOTH Website Submissions" (use The Inc.'s shared Google account).
2. Extensions → Apps Script. Delete what's there, paste in `Code.gs`, save.
3. Deploy → New deployment → type "Web app". Execute as: **Me**. Who has access: **Anyone**. Deploy and approve permissions.
4. Copy the web app URL (ends in `/exec`).
5. In `index.html`, find `const FORM_ENDPOINT = "";` and paste the URL between the quotes.

Sign-ups land in a "Newsletter" tab automatically, with a `status` column for The Inc. A notification email goes to Info@smooth2009.org on every submission (change `NOTIFY_EMAIL` in `Code.gs` to turn it off).

## 2. PayPal
Paste the PayPal embed code inside `<div id="paypal-slot"></div>` in `index.html`. The temporary "Donate with PayPal" button removes itself once the embed is there.

## 3. Put it on smooth2009.org
Free options: Netlify, Cloudflare Pages, or GitHub Pages. Drag the folder in, then add `smooth2009.org` as a custom domain and update the DNS records at your domain registrar as the host instructs.

## 4. Fill in
- EIN in the donate box (search `[EIN]`).
