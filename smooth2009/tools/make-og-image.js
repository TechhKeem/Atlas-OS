// Builds site/images/og-image.png (1200x630), the picture shown when the site is shared.
// Colors come from the tokens in site/index.html, so re-run this after changing the brand color or logo:
//   node tools/make-og-image.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', 'site');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const tok = n => (html.match(new RegExp('--' + n + ':(#[0-9a-fA-F]{3,8})')) || [])[1];
const band = tok('band'), accent = tok('band-accent'), muted = tok('on-band-muted');
const logo = path.join(root, 'images', 'logo.png');
const logoTag = fs.existsSync(logo)
  ? `<img src="data:image/png;base64,${fs.readFileSync(logo).toString('base64')}" style="height:150px;width:auto">` : '';
const page = `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@900&family=IBM+Plex+Mono:wght@500&family=Libre+Franklin:ital@1&display=swap" rel="stylesheet">
<style>body{margin:0;width:1200px;height:630px;background:${band};color:#fff;display:flex;align-items:center;gap:56px;padding:0 80px;box-sizing:border-box;font-family:"Big Shoulders Display",Impact,sans-serif}
.k{font:500 22px "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:${accent}}
h1{font-weight:900;text-transform:uppercase;font-size:92px;line-height:.92;margin:18px 0 26px}b{color:${accent}}
p{font:italic 30px "Libre Franklin",sans-serif;color:${muted};margin:0;border-left:4px solid ${accent};padding-left:18px}</style></head>
<body>${logoTag}<div><div class="k">S.M.O.O.T.H. Inc. · Est. 2009</div>
<h1><b>S</b>trong <b>M</b>en<br><b>O</b>vercoming <b>O</b>bstacles<br><b>T</b>hrough <b>H</b>ard-work</h1>
<p>In Every Obstacle Lies Equal Opportunity.</p></div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await pg.setContent(page, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: path.join(root, 'images', 'og-image.png') });
  await b.close();
  console.log('wrote site/images/og-image.png');
})();
