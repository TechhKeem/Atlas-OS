// Render slide-N.html -> slides/slide-N.png at 1080x1350 (and a 2x contact check).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = __dirname;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  for (let i = 1; i <= 5; i++) {
    await page.goto('file://' + path.join(dir, `slide-${i}.html`));
    await page.evaluate(() => document.fonts.ready);
    const ok = await page.evaluate(() => [
      document.fonts.check('76px "Limelight"'), document.fonts.check('700 35px "Josefin Sans"'), (!document.querySelector('.brand') || document.fonts.check('34px "Poiret One"')),
    ]);
    if (ok.includes(false)) throw new Error(`slide ${i}: font not loaded ${ok}`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dir, 'slides', `slide-${i}.png`) });
  }
  await browser.close();
  console.log('rendered 5 slides');
})();
