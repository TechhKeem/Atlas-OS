# Project: S.M.O.O.T.H. Inc. back office + website (smooth2009.org)

You are building the website and back office for **Strong Men Overcoming Obstacles Through Hard-work Inc. (S.M.O.O.T.H. Inc.)**, an all-male 501(c)(3) nonprofit. Read this whole brief before writing code. Ask me before making any decision that is expensive to undo (paid services, data migrations, DNS changes).

## About the organization
- Founded **October 28, 2009** at Morgan State University by four co-founders: Dwight D. Flowers, DaQuan M. Lawrence, Hakeem T. Hooker, and Frederick D. Watkins Jr.
- Incorporated as a nonprofit on **August 20, 2014**. It is a **501(c)(3)**.
- Motto: "In Every Obstacle Lies Equal Opportunity."
- Mission: educate, develop, organize, and empower young men and marginalized youth of color, and improve their graduation and retention rates.
- The chapters are called **sections**. There are three active sections in two states:
  - Morgan State University, Baltimore, MD, chartered Oct. 28, 2009 (the founding section)
  - Temple University, Philadelphia, PA, chartered Jan. 16, 2016
  - Coppin State University, Baltimore, MD, chartered Dec. 12, 2016
- The national board is called **The Inc.** The Inc. runs everything day to day and is the only group with admin access.
- There are about 100 current members. Several hundred alumni have come through since 2009.
- There are four national programs:
  - Service-Based Leadership Development
  - Jr. SMOOTH, where each section adopts a K–12 school
  - The R.U.L.E.S. for Black Men Symposium
  - SMOOTH Week, held every October
- The organization does 400+ hours of community service each year.
- Contact: Info@smooth2009.org. The domain is smooth2009.org, which we own. No site is live on it yet.
- The old Wix site is at https://financekeem.wixsite.com/website. Use it for reference content only.

## What already exists (in this folder)
- `index.html` is a complete single-page public website. It has a sticky header, a hero that spells out the acronym, About (mission, vision, objectives, and a history timeline), National Programs, Sections, Founders, and Get Involved with four tabbed forms. It also has a Donate block and a footer. The CSS uses design tokens on `:root` with light and dark themes, and the page is responsive down to phone width.
- `site-body.html` is the same page without the `<html>/<head>` wrapper. It is used for previews. Keep it in sync with `index.html`, or replace this two-file setup with a simple build step.
- `Code.gs` is a Google Apps Script web app that receives form posts and writes each form to its own tab in a Google Sheet. It adds new columns automatically, adds a `status` column set to "New", blocks formula injection, and has a honeypot spam check. It can also send a notification email.
- `README.md` is the launch checklist.
- `images/` holds named photo slots: logo.png, section-msu/tu/csu.jpg, and founder-*.jpg. Missing photos fall back to lettered initials.

The four public forms are:
- **Membership Interest**
- **Partner and Volunteer**
- **Member Directory Update**
- **Newsletter**

They post to `FORM_ENDPOINT` in `index.html`. Do not rename these form names without also updating `ALLOWED_FORMS` in `Code.gs`.

## Branding rules
- Use neutral colors: **white and navy blue, with one highlight color.** The highlight is currently gold. It is controlled by the `--accent` and `--band-accent` tokens. **Replace it with the brand color from the logo and brand assets I provide.** Change it in the tokens only and never hard-code colors in components.
- Fonts: Big Shoulders Display for headings, Libre Franklin for body text, and IBM Plex Mono for dates and labels. Keep these unless the brand assets name different fonts.
- Use the logo and photos I provide, with the filenames listed in `README.md`.
- Keep the tone dignified, direct, and community-focused. Do not use emoji.

## Out of scope for now
- The online shop and merchandise. Do not build or link it.

## What to build, in phases
Finish each phase and check it with me before starting the next one.

### Phase 1: Launch the public site
1. Apply the brand assets: the logo, the highlight color, and photos in their slots.
2. Add the PayPal donation embed I provide inside `#paypal-slot`. Remove the temporary fallback button.
   - **Confirm the receiving PayPal account with me.** The old site's link pays Info@smoothmen.org, not smooth2009.org.
3. Add the EIN to the donation block. It is currently `[EIN]`.
4. Help me deploy the Apps Script, set `FORM_ENDPOINT`, and test all four forms end to end.
5. Deploy the site to a free static host (Netlify, Cloudflare Pages, or GitHub Pages) and give me the exact DNS records for smooth2009.org.
6. Basic SEO: meta description, Open Graph image, `sitemap.xml`, `robots.txt`, and Nonprofit / Organization JSON-LD schema.
7. Check accessibility: color contrast, keyboard navigation, form labels, and alt text.

### Phase 2: Member directory and CRM
I will provide several old member lists in different formats. You will:
1. **Merge them into one master directory.**
   - Normalize names, emails, phones, sections, and years.
   - Remove duplicates. Flag uncertain matches for me to review instead of merging them automatically.
   - Keep a log of every merge and change.
2. Store the directory in the same Google Sheet as the forms, on a **Members** tab. Use one row per person with these fields:
   - member_id
   - first_name, last_name
   - email, phone
   - section (MSU / CSU / TU)
   - state, city
   - status (Active / Alumni / Inactive)
   - year_joined, grad_year
   - roles and offices held
   - occupation, linkedin
   - help_with (mentoring, speaking, jobs, events, fundraising)
   - dues_status and last_dues_paid
   - newsletter_opt_in
   - notes, source, last_updated
3. Build a **private directory app for The Inc. only**. A Google Apps Script web app is preferred because it is free and uses Google sign-in; any other approach is fine if it stays private. The app should have:
   - A sign-in allowlist of Inc. emails. Member data must never be public.
   - Filters by section, state, status, year joined, grad year, and help_with, plus a free-text search.
   - A member detail view with edit.
   - A review queue for new "Member Directory Update" and "Membership Interest" submissions. Approving one creates or updates a Members row.
   - CSV export of any filtered list.
   - A simple dashboard with counts by section, status, and state.

### Phase 3: Email and newsletter
1. Recommend an email service for newsletters to several hundred people. MailerLite or Mailchimp free tiers are the likely options; check their current pricing and limits. Do not send bulk email from Gmail.
2. Sync opted-in members and newsletter subscribers to it, with groups by section and by status, such as "Temple alumni."
3. Include unsubscribe handling. Keep the opt-in status in the directory in sync with the email service.
4. Create a branded newsletter template that matches the site.

### Phase 4: Back office for The Inc.
- **Dues tracking** per member and per semester.
- **Events with RSVPs and attendance**, covering SMOOTH Week, R.U.L.E.S., and section events.
- **Document vault structure** in Google Drive:
  - Bylaws
  - Articles of incorporation
  - IRS determination letter
  - Board minutes
  - Officer handoff notes for each section
- **Compliance calendar** with reminders:
  - The annual IRS Form 990 filing
  - Maryland and Pennsylvania annual reports
  - Charitable solicitation registration in both states
  - Each university's student organization registration
- **Donation log** reconciled with PayPal, plus a thank-you and tax receipt template that includes the EIN and 501(c)(3) language.

## Technical constraints
- **Keep it free or very low-cost.** Volunteers who are not developers will run it.
- The Inc. must be able to manage data in Google Sheets without touching code.
- Write a short, plain-language admin guide for every tool you build.
- **No secrets in the frontend.** Validate input on the server side and keep the honeypot spam checks.
- **Privacy:**
  - Phone numbers, emails, and personal details of members, especially current students, are never shown publicly.
  - Section pages link to forms, not to officers' personal emails. Officers change every year.

## What I'll provide
- Brand assets: logo files, colors, and fonts if any.
- Photos.
- PayPal embed code and the receiving account.
- EIN.
- Old member directories.
- The list of Inc. members who should have admin access.

Start by reviewing the existing files and listing anything in this brief that is unclear or missing. Then begin Phase 1.
