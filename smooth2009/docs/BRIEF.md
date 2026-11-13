# Project: S.M.O.O.T.H. Inc. website + back office (smooth2009.org)

You are finishing the website and building the back office for **Strong Men Overcoming Obstacles Through Hard-work Inc. (S.M.O.O.T.H. Inc.)**, an all-male 501(c)(3) nonprofit. The website design and all of its assets are done and live in this folder. Read this whole brief and `brand-kit/README.md` before writing code. Ask me before any decision that is expensive to undo (paid services, data migrations, DNS changes).

## About the organization
- Founded **October 28, 2009** at Morgan State University by four co-founders:
  - Dwight D. Flowers
  - DaQuan M. Lawrence
  - Hakeem T. Hooker
  - Frederick D. Watkins Jr.
- Incorporated **August 20, 2014**. It is a **501(c)(3)**.
- Motto: "In every obstacle lies equal opportunity."
- Mission: educate, develop, organize, and empower young men and marginalized youth of color, and improve their graduation and retention rates.
- Chapters are called **sections**. There are three active sections:
  - Morgan State University, Baltimore, MD. Chartered Oct. 28, 2009; the founding section.
  - Temple University, Philadelphia, PA. Chartered Jan. 16, 2016.
  - Coppin State University, Baltimore, MD. Chartered Dec. 12, 2016.
- The national board is **The Inc.** It runs everything day to day and is the only group with admin access.
- About 100 current members. Several hundred alumni since 2009.
- National programs:
  - Service-Based Leadership Development
  - Jr. SMOOTH, where each section adopts a K–12 school
  - The R.U.L.E.S. for Black Men Symposium
  - SMOOTH Week, every October
  - Community service: 400+ hours a year
- Contact: Info@smooth2009.org. We own smooth2009.org; nothing is live on it yet.
- The old Wix site (https://financekeem.wixsite.com/website) is for reference only.

## What's in this folder

| Path | What it is |
| --- | --- |
| `index.html` | The finished single-page website, ready to deploy. |
| `site-body.html` | The same page without `<html>/<head>`, used for previews. Keep it in sync with `index.html`, or replace the pair with a simple build step. |
| `Code.gs` | Google Apps Script web app that saves newsletter sign-ups to a "Newsletter" tab in a Google Sheet. It has a status column, formula-injection protection, a honeypot spam check, and an optional notification email. |
| `brand-kit/README.md` | The brand book: names and voice, logo rules, color, type, layout, photography, and motion. **The source of truth.** |
| `brand-kit/tokens.json` | Design tokens: colors (light and dark), type scale, spacing, and radius. |
| `images/` | Every image the site uses (inventory below). |
| `tools/` | Python scripts that made the images: `crest.py` cuts out crests, `national.py` makes the navy crest, `headshots.py` makes B&W portraits, `photos.py` crops event photos. Reuse them for new photos so everything stays consistent. |
| `README.md` | The launch checklist for non-developers. |

### Website layout (top to bottom)
1. Translucent sticky nav with the national crest
2. Hero with the crest, motto, Donate button, and a large photo
3. Animated stats: years, sections, states, service hours
4. Mission sentence that lights up word by word as you scroll
5. Swipeable program cards
6. Section tiles, each with its crest and group photo
7. History timeline plus an auto-scrolling photo strip
8. Founder portraits
9. **One newsletter form**
10. Donate band
11. Footer

The design uses scroll-driven animations, supports dark mode, works at phone width, and turns motion off when the visitor has reduced motion set.

### Image inventory (`images/`), all final

| File | Used for | Source / notes |
| --- | --- | --- |
| `crest-national.png` | Nav, hero, footer, favicon | Navy and silver crest made from the section crest design for organization-wide use. **Pending The Inc.'s approval.** |
| `crest-csu.png`, `crest-msu.png`, `crest-tu.png` | Section tiles | Each section's own crest, background removed. Coppin: gold and blue. Morgan: blue and orange. Temple: red and white. |
| `founder-flowers.jpg`, `founder-lawrence.jpg`, `founder-hooker.jpg`, `founder-watkins.jpg` | Founder portraits | B&W, 4:5, 800×1000, matched tone. Three come from small screenshots; ask me for the originals if they look soft. Hakeem's is a professional photo by "The Booth" with the watermark cropped out; ask me about photo credit. |
| `hero.jpg` | Hero | Morgan brothers in front of Holmes Hall. 2:1. |
| `section-msu.jpg`, `section-csu.jpg`, `section-tu.jpg` | Section tiles | Group photos for each section. |
| `program-leadership.jpg` | Leadership card | Coppin graduate with leadership sashes and awards. |
| `program-jrsmooth.jpg` | Jr. SMOOTH card | Pumpkin-painting event. |
| `program-rules.jpg` | R.U.L.E.S. card | Two brothers embracing at the symposium. |
| `program-smoothweek.jpg` | SMOOTH Week card | Mister S.M.O.O.T.H., Miss S.M.O.O.T.H., and Miss Empowerment. |
| `program-service.jpg` | Service card | Temple brother leading a community flag football game. |
| `donate.jpg` | Donate band | Morgan graduate at the Jenkins Behavioral Science Center. |
| `gallery-*.jpg` (6) | Scrolling photo strip | Staircase group, certificates, stadium, officers, Temple rooftop, Temple jerseys. Coppin's group photo is in the strip too. |

The original, uncropped photos are not in this folder. If you need a new crop, ask me for the original.

## Branding and design rules
- **Follow `brand-kit/` for every page, email, and document.** Use its tokens and never hard-code colors.
- **Premium, Apple-like feel:** generous spacing, big bold headlines, large photos, very few words, smooth section transitions, and one animated stats widget. Keep this restraint as you add features.
- **Neutral palette:** white and light gray backgrounds, near-black text, and **navy as the only S.M.O.O.T.H. color** (buttons, links, selected states).
- **Section colors appear only on that section's tile, crest, or materials.** They were sampled from the crests and are in `tokens.json` (`csu-*`, `msu-*`, `tu-*`).
- **Crests:**
  - The navy national crest is for anything national.
  - A section crest is used only for that section.
  - Never recolor, redraw, or stretch a crest.
  - The blackletter "SMOOTH" exists only inside the crest artwork.
- **Names:** write "S.M.O.O.T.H." with periods. The full legal name, "Strong Men Overcoming Obstacles Through Hard-work Inc.", goes on receipts and footers.
- **No official university logos** unless The Inc. confirms it has permission.
- **Font:** the system font stack (SF Pro on Apple devices).
- **Tone:** dignified, direct, community-focused. No emoji.
- **Photos:** use only real members. Portraits are B&W at 4:5. Any photo of Jr. SMOOTH youth needs written parent consent before it's published.

## Out of scope for now
- The online shop and merchandise. Do not build or link it.
- Any public form other than the newsletter. Do not add join, contact, or member-update forms unless I ask.

## What to build, in phases
Finish each phase and check it with me before starting the next one.

### Phase 1: Launch the public site
1. Review `index.html` against this brief and the brand kit, and list anything broken or inconsistent.
2. Add the PayPal donation embed I provide inside `#paypal-slot`. The temporary fallback button removes itself once the embed is there.
   - **Confirm the receiving PayPal account with me first.** The current fallback link pays Info@smoothmen.org, not smooth2009.org.
3. Replace `[EIN]` in the Donate band with the EIN I provide.
4. Add the social media links I provide to the footer.
5. Deploy `Code.gs` with me, set `FORM_ENDPOINT` in `index.html`, and test the newsletter form end to end.
6. Compress the images for the web (WebP with JPEG fallback, or optimized JPEG) without visibly losing quality, and add `width`/`height` attributes so nothing shifts while loading.
7. Deploy to a free static host (Netlify, Cloudflare Pages, or GitHub Pages). Give me the exact DNS records for smooth2009.org.
8. SEO:
   - meta description
   - Open Graph image (use `hero.jpg`)
   - `sitemap.xml` and `robots.txt`
   - Nonprofit / Organization JSON-LD
9. Accessibility check: contrast in both themes, keyboard navigation, focus states, alt text, and reduced motion.

### Phase 2: Member directory and CRM
I will provide several old member lists in different formats. You will:
1. **Merge them into one master directory.**
   - Normalize names, emails, phones, sections, and years.
   - Remove duplicates. Flag uncertain matches for me instead of merging them automatically.
   - Keep a log of every merge and change.
2. Store it in the same Google Sheet as the newsletter, on a **Members** tab, one row per person:
   - member_id
   - first_name, last_name
   - email, phone
   - section (MSU / CSU / TU)
   - city, state
   - status (Active / Alumni / Inactive)
   - year_joined, grad_year
   - roles and offices held
   - occupation, linkedin
   - help_with (mentoring, speaking, jobs, events, fundraising)
   - dues_status, last_dues_paid
   - newsletter_opt_in
   - notes, source, last_updated
3. Build a **private directory app for The Inc. only**. A Google Apps Script web app is preferred: it's free and uses Google sign-in. It needs:
   - A sign-in allowlist of Inc. emails. Member data is never public.
   - Filters by section, state, status, year joined, grad year, and help_with, plus free-text search.
   - A member detail view with edit, and add-member. Members do not update themselves through the public site.
   - A view of newsletter sign-ups with a button to link a sign-up to an existing member.
   - CSV export of any filtered list.
   - A dashboard with counts by section, status, and state.
   - Styling that follows the brand kit.

### Phase 3: Email and newsletter
1. Recommend an email service for several hundred contacts. MailerLite or Mailchimp free tiers are likely; check their current pricing and limits. Never send bulk email from Gmail.
2. Sync opted-in members and newsletter subscribers into it, with groups by section and status (for example, "Temple alumni").
3. Handle unsubscribes and keep opt-in status in sync with the directory.
4. Build a newsletter template that matches the site and brand kit, using the national crest.

### Phase 4: Back office for The Inc.
- **Dues tracking** per member and per semester.
- **Events with RSVPs and attendance** for SMOOTH Week, R.U.L.E.S., and section events.
- **Document vault** folders in Google Drive:
  - Bylaws
  - Articles of incorporation
  - IRS determination letter
  - Board minutes
  - Officer handoff notes for each section
- **Compliance calendar** with reminders:
  - IRS Form 990 (annual)
  - Maryland and Pennsylvania annual reports
  - Charitable solicitation registration in both states
  - Each university's student organization registration
- **Donation log** reconciled with PayPal, plus a branded thank-you and tax receipt template with the EIN and 501(c)(3) language.

## Technical constraints
- **Free or very low-cost.** Volunteers who aren't developers will run it.
- The Inc. manages data in Google Sheets without touching code.
- Write a short, plain-language admin guide for every tool you build.
- **No secrets in the frontend.** Validate on the server and keep the honeypot spam checks.
- **Privacy:**
  - Members' phones, emails, and personal details, especially current students', are never public.
  - The site never lists officers' personal contact info. Officers change every year.

## Still to come from me
- PayPal embed code and the receiving account
- EIN
- Social media links
- Approval of the navy national crest, or changes to it
- Old member directories, for Phase 2
- The list of Inc. members who get admin access

Start by reviewing the files and listing anything in this brief that is unclear or missing. Then begin Phase 1.
