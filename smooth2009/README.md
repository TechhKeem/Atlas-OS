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
- `logo.png`: the main S.M.O.O.T.H. crest (orange and blue), transparent background
- `section-msu.png`, `section-tu.png`, `section-csu.png`: each section's crest (Morgan orange and blue, Temple red and white, Coppin gold and blue)
- `founder-flowers.jpg`, `founder-lawrence.jpg`, `founder-hooker.jpg`, `founder-watkins.jpg`: square, about 600 x 600
- `about-members.jpg` (2:1), `involved-members.jpg` (2:1): wide group photos
- `program-mentoring.jpg`, `program-service.jpg`, `program-cleanup.jpg`, `program-events.jpg`: 4:3 photos in the What We Do gallery
- To swap a photo, save the new one under the same name and shape. All current images came from the old Wix site.
- `og-image.png` is the picture shown when the site is shared on social media. Do not edit it by hand. Rebuild it with `node tools/make-og-image.js` after the logo or brand color changes.

## Changing the brand color
The highlight color is the orange from the S.M.O.O.T.H. crest (`#f07427`). It is set in one place: the `--accent` and `--band-accent` lines at the top of the `<style>` block in `site/index.html`. There are three copies, for light mode, dark mode, and forced dark mode. Change all three.
- `--band-accent` is the color used on navy backgrounds (buttons, hero letters).
- `--accent` is the same color darkened enough to read on white. Check it with `tools/contrast.py`. It needs at least 4.5 against `#ffffff` and `#f2f4f8`.

## Launch checklist (Phase 1)
- [x] Logo, brand color, and photos added
- [x] Founder bios updated from the old site
- [ ] PayPal donate button: uses the old site's link, which pays **Info@smoothmen.org**. Confirm that account is active and owned by The Inc.
- [ ] EIN filled in (search `[EIN]` in `site/index.html`)
- [ ] Apps Script deployed and its URL pasted into `FORM_ENDPOINT` (see `docs/admin-guide-forms.md`)
- [ ] All four forms tested from the live site
- [ ] Site deployed and smooth2009.org connected
- [ ] Sitemap submitted in Google Search Console

## Preview copy
Some preview tools want the page without its `<html>`/`<head>` wrapper. Run `tools/make-preview.sh` to write `preview/site-body.html`. Never edit that file. It is rebuilt from `site/index.html` each time.
