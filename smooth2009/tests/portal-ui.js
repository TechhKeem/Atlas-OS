// Browser test of Portal.html with the real server code running in-page on gas-mock.js.
// Run from the smooth2009 folder:  node tests/portal-ui.js <screenshot-dir> [path-to-axe.min.js]
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const out = process.argv[2] || '.', axePath = process.argv[3];
const A = path.join(__dirname, '..', 'apps-script');
const portal = fs.readFileSync(path.join(A, 'Portal.html'), 'utf8');
const shim = `
<script>${fs.readFileSync(path.join(__dirname, '..', 'practice', 'gas-mock.js'), 'utf8')}</script>
<script>${fs.readFileSync(path.join(A, 'Newsletter.gs'), 'utf8')}</script>
<script>${fs.readFileSync(path.join(A, 'Portal.gs'), 'utf8')}</script>
<script>
function noDates(v){ if (v instanceof Date) throw new Error('Date returned to browser'); if (v && typeof v === 'object') Object.values(v).forEach(noDates); }
function runner(ok, bad){ return new Proxy({}, { get(_, p){
  if (p === 'withSuccessHandler') return h => runner(h, bad);
  if (p === 'withFailureHandler') return h => runner(ok, h);
  return (...a) => setTimeout(() => { try { ROWS_CACHE_ = {}; ENSURED_ = {}; ACCESS_ = null;
    const r = window[p](...JSON.parse(JSON.stringify(a))); noDates(r); ok && ok(JSON.parse(JSON.stringify(r === undefined ? null : r))); }
    catch (e) { bad && bad({ message: e.message }); } }, 5); } }); }
window.google = { script: { run: runner() } };
// seed: setup, access list, and sample activity so screens have content
__mock.users.active = __mock.users.effective; setup(); __mock.users.active = '';
const acc = __mock.sheets.Access._rows;
acc.push(['pres.tu@example.com','Kai Smith','Officer','TU','Yes',''], ['pres.msu@example.com','Julien Johnson','Officer','MSU','Yes',''], ['pres.csu@example.com','Kevin Dryden','Officer','CSU','Yes','']);
function tok(email){ ROWS_CACHE_={}; ACCESS_=null; delete __mock.cache['cd:'+email]; requestCode(email); const m=__mock.mails.filter(x=>x.to===email).pop(); return verifyCode(email, m.subject.slice(-6)).token; }
const T = { inc: tok('owner@smooth2009.org'), tu: tok('pres.tu@example.com'), msu: tok('pres.msu@example.com') };
const d = new Date(), iso = x => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
const ago = n => iso(new Date(d.getTime() - n*86400000));
const jpg = { name:'p.jpg', type:'image/jpeg', data: btoa('fake') };
function ev(t, f, n){ const e = createEvent(t, f); for (let i=0;i<n;i++) uploadEventPhoto(t, e.event_id, jpg); finishEvent(t, e.event_id); return e.event_id; }
const e1 = ev(T.tu, { event_date: ago(3), title: 'North Philly park cleanup', event_type: 'Community service', location: 'Fairmount Park', description: 'Twelve brothers and community volunteers cleared two blocks of the park.', attendees: 24, service_hours: 48, newsletter_summary: 'Temple brothers and neighbors cleared two blocks of Fairmount Park on Saturday morning.', minors_in_photos: 'No' }, 5);
const e2 = ev(T.msu, { event_date: ago(10), title: 'SMOOTH Week kickoff', event_type: 'SMOOTH Week', location: 'Student Center', description: 'Opening night of SMOOTH Week with alumni speakers.', attendees: 85, newsletter_summary: 'SMOOTH Week opened with three alumni speakers and a full room.', minors_in_photos: 'No' }, 6);
ev(T.msu, { event_date: ago(1), title: 'Study hall', event_type: 'Professional development', description: 'Weekly study hall.', attendees: 14, newsletter_summary: 'Weekly study hall continues.', minors_in_photos: 'No' }, 2);
reviewEvent(T.inc, e2, 'Reviewed', '');
const f1 = createFundsRequest(T.msu, { purpose: 'SMOOTH Week venue', event_name: 'SMOOTH Week kickoff', amount: 650, needed_by: iso(new Date(d.getTime()+20*86400000)), payee: 'Morgan State Student Center', breakdown: 'Room rental 500\\nAV 150' }); submitFundsRequest(T.msu, f1.request_id);
const f2 = createFundsRequest(T.tu, { purpose: 'Cleanup supplies', amount: 120, needed_by: iso(new Date(d.getTime()+5*86400000)), payee: 'Kai Smith (reimburse)', breakdown: 'Gloves 40\\nBags 30\\nWater 50' }); submitFundsRequest(T.tu, f2.request_id);
decideFunds(T.inc, f2.request_id, { status: 'Approved', approved_amount: 120 });
[['Kai','Smith','kai@example.com','2155550101','President',2027,T.tu],['TreVaughn','Gerst','trey@example.com','2155550102','Vice President',2027,T.tu],['Marcus','Hill','marcus@example.com','2155550103','',2029,T.tu],
 ['Julien','Johnson','julien@example.com','4105550104','President',2026,T.msu],['Kevin','Louine','kevin@example.com','4105550105','Vice President',2027,T.msu]]
 .forEach(([a,b,c,p,pos,g,t]) => addMember(t, { first_name:a, last_name:b, email:c, phone:p, position:pos, grad_year:g }));
proposeAmendment(T.tu, { title: 'Allow virtual section meetings', article: 'Article IV, Section 2', current_text: 'Sections shall meet in person at least twice a month.', proposed_text: 'Sections shall meet at least twice a month, in person or online.', rationale: 'Exams and weather cancel meetings every semester. Online meetings keep sections on schedule.' });
const a2 = proposeAmendment(T.inc, { title: 'Add a national treasurer', article: 'Article V, Section 1', proposed_text: 'The Inc. shall include a National Treasurer elected each spring.', rationale: 'Funds requests need one clear approver.' });
openVote(T.inc, a2.amendment_id); castVote(T.msu, a2.amendment_id, 'Yes');
__mock.mails.length = 0; Object.keys(__mock.cache).filter(k => k.startsWith("cd:")).forEach(k => delete __mock.cache[k]);
</script>`;
const html = portal.replace('<script>\n"use strict";', shim + '\n<script>\n"use strict";');
if (html === portal) throw new Error('could not inject shim');
const file = path.join(out, 'portal-harness.html'); fs.writeFileSync(file, html);

(async () => {
  const b = await chromium.launch(); const problems = [];
  async function session(email, label, vp, scheme) {
    const p = await b.newPage({ viewport: vp, colorScheme: scheme });
    p.on('pageerror', e => problems.push(label + ' page error: ' + e.message));
    await p.goto('file://' + file);
    await p.fill('#si-email', email); await p.click('#emailForm button');
    await p.waitForSelector('#codeForm:not([hidden])');
    const code = await p.evaluate(e => __mock.mails.filter(m => m.to === e).pop().subject.slice(-6), email);
    await p.fill('#si-code', code); await p.click('#codeForm button[type=submit]');
    await p.waitForSelector('#app:not([hidden])');
    return p;
  }
  async function audit(p, label) {
    if (!axePath) return;
    await p.addScriptTag({ path: axePath });
    const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(x => x.id + ' x' + x.nodes.length + ' ' + x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')));
    v.forEach(x => problems.push(label + ' axe: ' + x));
  }
  const tabs = ['overview', 'events', 'funds', 'members', 'amendments', 'newsletter'];
  for (const [email, who, scheme] of [['owner@smooth2009.org', 'inc', 'light'], ['pres.tu@example.com', 'officer', 'light'], ['owner@smooth2009.org', 'inc-dark', 'dark']]) {
    const p = await session(email, who, { width: 1200, height: 900 }, scheme);
    for (const t of tabs) {
      const btn = await p.$(`#tabs button[data-tab="${t}"]`); if (!btn) continue;
      await btn.click(); await p.waitForFunction(() => !document.querySelector('#view').textContent.startsWith('Loading'));
      await p.waitForTimeout(60);
      const err = await p.$eval('#view', v => (v.querySelector('.status.err') || {}).textContent || '');
      if (err) problems.push(who + ' ' + t + ': ' + err);
      if (who !== 'inc-dark' || t === 'overview' || t === 'amendments') await p.screenshot({ path: `${out}/portal-${who}-${t}.png`, fullPage: true });
      if (who !== 'inc-dark') await audit(p, who + ' ' + t);
    }
    await p.close();
  }
  // officer flows through the UI: open forms, submit a member, cast a vote
  const p = await session('pres.msu@example.com', 'officer-flow', { width: 390, height: 844 }, 'light');
  await p.click('#tabs button[data-tab="events"]'); await p.waitForSelector('text=Report an event');
  await p.click('text=Report an event'); await p.screenshot({ path: `${out}/portal-phone-event-form.png`, fullPage: true });
  await audit(p, 'phone event form');
  await p.click('#tabs button[data-tab="members"]'); await p.waitForSelector('[data-sub="add"]');
  await p.click('[data-sub="add"]'); await p.fill('#nm-first', 'Andre'); await p.fill('#nm-last', 'Banks'); await p.fill('#nm-email', 'andre@example.com'); await p.fill('#nm-phone', '410-555-0150');
  await p.click('text=Add member'); await p.waitForSelector('.status.ok');
  console.log('add member:', await p.textContent('.status.ok'));
  await p.click('#tabs button[data-tab="amendments"]'); await p.waitForSelector('text=Add a national treasurer');
  const voted = await p.$('text=You voted: Yes'); console.log('already voted shown:', !!voted);
  await p.click('#tabs button[data-tab="members"]'); await p.waitForSelector('[data-sub="roster"]'); await p.click('[data-sub="roster"]');
  await p.waitForSelector('text=Save roster'); await p.screenshot({ path: `${out}/portal-phone-roster.png`, fullPage: true });
  const hscroll = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth); if (hscroll) problems.push('phone: horizontal scroll');
  await p.close(); await b.close();
  console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'no problems found');
})();
