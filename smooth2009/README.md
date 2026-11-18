# smooth2009.org: website and back office for S.M.O.O.T.H. Inc.

| Folder | What it is | Public? |
|---|---|---|
| `site/` | The website. This is the only folder the web host publishes. | Yes |
| `site/index.html` | The whole one-page site. The one file to edit for site content. | Yes |
| `site/images/` | Every image the site uses, each as `.jpg`/`.png` plus a smaller `.webp`. | Yes |
| `brand-kit/` | The brand book (`README.md`) and design tokens (`tokens.json`). The source of truth. | No |
| `apps-script/` | The back office, in Google Apps Script: `Newsletter.gs` saves website sign-ups; `Portal.gs` and `Portal.html` are the private member portal. | No |
| `tests/` | Automated tests for the back office (see below). | No |
| `docs/` | The project brief and admin guides. | No |
| `tools/` | Image scripts and helpers (see below). | No |

## Adding or replacing a photo
1. Make the new image with the matching script so it looks like the rest: `tools/headshots.py` for B&W founder and officer portraits, `tools/photos.py` for event photos, `tools/crest.py` for a crest. Originals go in `assets/src/`, which stays out of git.
2. Save it in `site/images/` under the same file name and shape as the one it replaces.
3. Run `python3 tools/optimize_images.py`. It compresses the image and makes the `.webp` copy the site loads first.
4. If the image is new rather than a replacement, copy an existing `<picture>` block in `index.html` and change the names, `width`, `height`, and `alt`.

Photos of Jr. SMOOTH youth need written parent consent before they go up.

## Launch checklist (Phase 1)
- [x] Review against the brief and brand kit
- [x] Images compressed (WebP with JPEG/PNG fallback), sizes set so nothing shifts while loading
- [x] SEO: description, Open Graph image, sitemap.xml, robots.txt, organization data
- [x] Accessibility check, both themes
- [ ] PayPal: embed pasted inside `<div id="paypal-slot"></div>` and receiving account confirmed (the current fallback pays Info@smoothmen.org)
- [ ] EIN filled in (search `[EIN]` in `site/index.html`)
- [ ] Social links added to the footer
- [ ] Back office deployed and its URL pasted into `FORM_ENDPOINT` (see `docs/admin-guide-portal.md`)
- [ ] Newsletter form tested from the live site
- [ ] Site deployed and smooth2009.org connected
- [ ] Sitemap submitted in Google Search Console
- [ ] The Inc. approves the navy national crest

## Helpers
- `tools/contrast.py` checks color contrast: pipe in lines of `name foreground background`.
- `tools/make-preview.sh` writes `preview/site-body.html`, the page without its `<html>`/`<head>` wrapper, for preview tools. Never edit that file.

## Member portal
The private back office for The Inc. and section officers: event reports with photos, funds requests, new members, semester rosters, constitutional amendments with voting, and newsletter drafts built from each section's event summaries. See `docs/admin-guide-portal.md`.

## Tests
`node tests/portal.test.js` runs the back office (portal and newsletter) against stand-ins for Google's services. `node tests/portal-ui.js <folder>` also loads the portal screens in a browser and saves screenshots; it needs Playwright.
