// Browser test of the practice-mode members page (site/members/index.html).
// Run from the smooth2009 folder:  node tests/members-ui.js <screenshot-dir> [path-to-axe.min.js]
const path = require('path'), http = require('http'), fs = require('fs');
const { chromium } = require('playwright');
const out = process.argv[2] || '.', axePath = process.argv[3];
const siteDir = path.join(__dirname, '..', 'site');
// serve the site over http so localStorage works like on the real host
const server = http.createServer((req, res) => {
  let p = path.join(siteDir, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); res.end(d); });
}).listen(0);
const base = 'http://127.0.0.1:' + server.address().port;
const problems = [], must = (c, m) => { if (!c) problems.push(m); };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await ctx.newPage();
  p.on('pageerror', e => problems.push('page error: ' + e.message));
  await p.goto(base + '/members/');
  await p.waitForSelector('#app:not([hidden])', { timeout: 10000 });
  must(await p.isVisible('.practice-bar'), 'practice bar visible');
  must(await p.isHidden('#signin'), 'no sign-in screen');
  const tabs = ['overview', 'events', 'funds', 'members', 'amendments', 'newsletter'];
  async function visit(label, list) {
    for (const t of list) {
      const btn = await p.$(`#tabs button[data-tab="${t}"]`); if (!btn) { problems.push(label + ': no tab ' + t); continue; }
      await btn.click(); await p.waitForFunction(() => !document.querySelector('#view').textContent.startsWith('Loading'));
      await p.waitForTimeout(80);
      const err = await p.$eval('#view', v => (v.querySelector('.status.err') || {}).textContent || ''); if (err) problems.push(label + ' ' + t + ': ' + err);
      await p.screenshot({ path: `${out}/members-${label}-${t}.png`, fullPage: true });
      if (axePath) {
        await p.addScriptTag({ path: axePath });
        const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(x => x.id + ' x' + x.nodes.length + ' ' + x.nodes[0].target.join(' ')));
        v.forEach(x => problems.push(label + ' ' + t + ' axe: ' + x));
      }
    }
  }
  await visit('inc', tabs);

  // add a member as Inc, then reload: it should still be there
  await p.click('#tabs button[data-tab="members"]'); await p.click('[data-sub="add"]');
  await p.selectOption('#nm-section', 'TU'); await p.fill('#nm-first', 'Test'); await p.fill('#nm-last', 'Persist');
  await p.fill('#nm-email', 'test.persist@example.com'); await p.fill('#nm-phone', '2155550000');
  await p.click('text=Add member'); await p.waitForSelector('.status.ok');
  await p.reload(); await p.waitForSelector('#app:not([hidden])');
  await p.click('#tabs button[data-tab="members"]'); await p.waitForSelector('table');
  must(await p.$('text=Test Persist'), 'entry survives reload');

  // newsletter draft opens in the viewer
  await p.click('#tabs button[data-tab="newsletter"]'); await p.waitForSelector('text=Create newsletter draft');
  await p.click('text=Create newsletter draft'); await p.waitForSelector('text=open it in Google Docs');
  await p.click('text=open it in Google Docs'); await p.waitForSelector('dialog[open]');
  must(await p.$('dialog[open] >> text=SMOOTH Week opened'), 'draft shows summary');
  await p.screenshot({ path: `${out}/members-draft.png` });
  await p.click('dialog[open] >> text=Close');
  // outbox
  await p.click('.practice-bar >> text=/Emails sent/'); await p.waitForSelector('dialog[open]');
  const outboxText = await p.$eval('dialog[open]', d => d.textContent);
  must(/Vote open/.test(outboxText), 'outbox lists vote email: ' + outboxText.slice(0, 300));
  await p.click('dialog[open] >> text=Close');

  // switch to Temple officer: own section only
  await p.selectOption('#practiceRole', 'TU'); await p.waitForLoadState('load'); await p.waitForSelector('#app:not([hidden])');
  must((await p.textContent('#who')).includes('Temple'), 'viewing as Temple officer');
  must(!(await p.$('#tabs button[data-tab="newsletter"]')), 'officer has no newsletter tab');
  await visit('tu', ['overview', 'events', 'members']);
  await p.click('#tabs button[data-tab="members"]'); await p.waitForSelector('table');
  must(!(await p.$('text=Jordan Reed')), 'Temple officer cannot see Morgan State members');

  // phone width
  const ph = await ctx.newPage(); await ph.setViewportSize({ width: 390, height: 844 });
  await ph.goto(base + '/members/'); await ph.waitForSelector('#app:not([hidden])');
  await ph.screenshot({ path: `${out}/members-phone.png`, fullPage: false });
  must(!(await ph.evaluate(() => document.documentElement.scrollWidth > innerWidth)), 'no sideways scroll on phone');

  // start empty
  await p.click('text=Start empty'); await p.click('text=Yes, do it'); await p.waitForLoadState('load'); await p.waitForSelector('#app:not([hidden])');
  await p.click('#tabs button[data-tab="events"]'); await p.waitForSelector('text=No event reports yet');
  must(true, 'start empty');
  await b.close(); server.close();
  console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'no problems found');
})().catch(e => { console.error(e); server.close(); process.exit(1); });
