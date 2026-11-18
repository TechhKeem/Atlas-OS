#!/usr/bin/env python3
"""Apply Look branding to a checkout of the Cap repository (your fork).

Usage:
    python3 -I look/scripts/apply-look-branding.py /path/to/look-fork [--hobby]

--hobby  Trim Vercel cron jobs to once a day so the app deploys on the
         Vercel Hobby plan (Hobby rejects crons that run more often).

Safe to re-run: every step checks whether it has already been applied.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

LOOK_DIR = Path(__file__).resolve().parent.parent
BRAND = LOOK_DIR / "brand"
REBRAND = LOOK_DIR / "rebrand"

SITE_URL = "https://look.financekeem.com"
TITLE = "Look by FinanceKeem: screen recordings for training"
DESCRIPTION = (
    "Record your screen, camera and voice, then share a link in seconds. "
    "Look is FinanceKeem's training and walkthrough video platform."
)

# Tailwind numeric shades used by Cap's UI (bg-blue-500 etc.), remapped to Look Green.
NUMERIC_GREEN = {
    50: "#EEF8F2", 100: "#D6F1DF", 200: "#ADDDC0", 300: "#8ECEAA", 400: "#5CA581",
    500: "#30A46C", 600: "#218358", 700: "#1B6B49", 800: "#18543A", 900: "#193B2D",
    950: "#0E2219",
}

# Crons that matter on a self-hosted instance. The rest serve Cap's own
# cloud (Loops email marketing, WorkOS directory sync, developer API).
KEEP_CRONS = {
    "/api/cron/finalize-stale-desktop-segments",
    "/api/cron/recover-failed-video-processing",
}


def step(msg):
    print(f"• {msg}")


def edit(path: Path, fn):
    text = path.read_text()
    new = fn(text)
    if new != text:
        path.write_text(new)
        return True
    return False


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    hobby = "--hobby" in sys.argv
    if len(args) != 1:
        sys.exit(__doc__)
    root = Path(args[0]).resolve()
    web = root / "apps" / "web"
    ui = root / "packages" / "ui"
    if not (web / "next.config.mjs").exists():
        sys.exit(f"{root} doesn't look like a Cap checkout (no apps/web/next.config.mjs)")

    # 1. Logo component (used by every Logo / LogoBadge in the app)
    shutil.copy(REBRAND / "glass-logo.tsx", ui / "src/components/icons/glass-logo.tsx")
    for f, old, new in [
        (ui / "src/components/icons/LogoBadge.tsx", 'aria-label="Cap"', 'aria-label="Look"'),
        (ui / "src/components/icons/Logo.tsx", 'aria-label="Cap Logo"', 'aria-label="Look"'),
    ]:
        edit(f, lambda t: t.replace(old, new))
    step("Logo swapped to Look")

    # 2. Colors: Radix blue scale -> Look Green (appended so it wins over the imports)
    theme = (REBRAND / "look-theme.css").read_text()
    edit(web / "app/globals.css",
         lambda t: t if "Look brand theme" in t else t.rstrip() + "\n\n" + theme)
    numeric = ", ".join(f'{k}: "{v}"' for k, v in NUMERIC_GREEN.items())
    edit(ui / "style/tailwind.config.js",
         lambda t: t.replace('blue: getColorScale("blue"),',
                             f'blue: {{ ...getColorScale("blue"), {numeric} }},'))
    step("Accent color remapped to Look Green")

    # 3. Site metadata (browser tab, link previews)
    def meta(t):
        t = t.replace("Cap — Beautiful screen recordings, owned by you.", TITLE)
        t = t.replace(
            "Cap is the open source alternative to Loom. Lightweight, powerful, "
            "and cross-platform. Record and share in seconds.", DESCRIPTION)
        t = t.replace('new URL("https://cap.so")', f'new URL("{SITE_URL}")')
        t = t.replace('url: "https://cap.so"', f'url: "{SITE_URL}"')
        t = t.replace('siteName: "Cap"', 'siteName: "Look"')
        return t
    edit(web / "app/layout.tsx", meta)
    manifest = web / "public/site.webmanifest"
    if manifest.exists():
        data = json.loads(manifest.read_text())
        data.update(name="Look", short_name="Look", theme_color="#20242D",
                    background_color="#F6F7F9")
        manifest.write_text(json.dumps(data, indent=2) + "\n")
    step("Site title, description and URL set")

    # 4. Icons (favicons, app icons) rendered from the Look SVGs
    render_icons(web / "public")
    step("Favicons and app icons generated")

    # 5. Vercel config
    vj = web / "vercel.json"
    cfg = json.loads(vj.read_text())
    crons = [c for c in cfg.get("crons", []) if c["path"] in KEEP_CRONS]
    if hobby:
        for i, c in enumerate(crons):
            c["schedule"] = f"{10 + i * 20} 4 * * *"
    cfg["crons"] = crons
    vj.write_text(json.dumps(cfg, indent="\t") + "\n")
    step(f"Vercel crons trimmed to {len(crons)} ({'Hobby: daily' if hobby else 'Pro schedule'})")

    print("\nDone. Review with `git diff`, then commit.")


def render_icons(public: Path):
    """Render PNG/ICO icons from the SVGs with the preinstalled Playwright."""
    mark = (BRAND / "look-mark.svg").read_text()
    fav = (BRAND / "favicon.svg").read_text()
    shutil.copy(BRAND / "look-mark.svg", public / "look-icon.svg")
    jobs = [
        (fav, 16, "favicon-16x16.png"), (fav, 32, "favicon-32x32.png"),
        (mark, 180, "apple-touch-icon.png"), (mark, 192, "android-chrome-192x192.png"),
        (mark, 512, "android-chrome-512x512.png"), (mark, 150, "mstile-150x150.png"),
        (mark, 512, "cap-logo.png"),
    ]
    script = """
const {chromium} = require('playwright');
const jobs = JSON.parse(process.argv[1]);
(async () => {
  const b = await chromium.launch();
  for (const [svg, size, out] of jobs) {
    const p = await b.newPage({viewport: {width: size, height: size}});
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({path: out, omitBackground: true});
    await p.close();
  }
  await b.close();
})();
"""
    payload = json.dumps([[s, n, str(public / o)] for s, n, o in jobs])
    subprocess.run(["node", "-e", script, payload], check=True)
    try:
        from PIL import Image
        img = Image.open(public / "android-chrome-512x512.png")
        img.save(public / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    except ImportError:
        print("  (Pillow not installed: favicon.ico left unchanged)")


if __name__ == "__main__":
    main()
