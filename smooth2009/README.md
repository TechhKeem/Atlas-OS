# smooth2009.org: website and back office for S.M.O.O.T.H. Inc.

## What is in this folder
| Folder | What it is | Public? |
|---|---|---|
| `site/` | The website. This is the only folder the web host publishes. | Yes |
| `site/index.html` | The whole one-page site. This is the one file to edit for site content. | Yes |
| `site/images/` | Logo and photos (names below). | Yes |
| `apps-script/Code.gs` | The script that saves form submissions into the Google Sheet. | No |
| `docs/` | The project brief and admin guides. | No |
| `tools/` | Helper scripts (share image, preview copy, contrast check). | No |

## Photos and logo
Put these in `site/images/` with these exact names. A missing photo shows lettered initials instead.
- `logo.png` (square or tall, transparent background preferred)
- `section-msu.jpg`, `section-tu.jpg`, `section-csu.jpg` (landscape, about 1200 x 900)
- `founder-flowers.jpg`, `founder-lawrence.jpg`, `founder-hooker.jpg`, `founder-watkins.jpg` (square, about 600 x 600)
- `og-image.png` is the picture shown when the site is shared on social media. Do not edit it by hand. Rebuild it with `node tools/make-og-image.js` after the logo or brand color changes.

## Changing the brand color
The highlight color is set in one place: the `--accent` and `--band-accent` lines at the top of the `<style>` block in `site/index.html`. There are three copies, for light mode, dark mode, and forced dark mode. Change all three.
- `--band-accent` is the color used on navy backgrounds (buttons, hero letters).
- `--accent` is the same color darkened enough to read on white. Check it with `tools/contrast.py`. It needs at least 4.5 against `#ffffff` and `#f2f4f8`.

## Launch checklist (Phase 1)
- [ ] Logo, brand color, and photos added
- [ ] PayPal embed pasted inside `<div id="paypal-slot"></div>`, receiving account confirmed, fallback button deleted
- [ ] EIN filled in (search `[EIN]` in `site/index.html`)
- [ ] Apps Script deployed and its URL pasted into `FORM_ENDPOINT` (see `docs/admin-guide-forms.md`)
- [ ] All four forms tested from the live site
- [ ] Site deployed and smooth2009.org connected
- [ ] Sitemap submitted in Google Search Console

## Preview copy
Some preview tools want the page without its `<html>`/`<head>` wrapper. Run `tools/make-preview.sh` to write `preview/site-body.html`. Never edit that file. It is rebuilt from `site/index.html` each time.
