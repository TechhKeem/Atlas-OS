// Run: node tests/portal.test.js   (from the smooth2009 folder)
// Exercises Portal.gs and Newsletter.gs against the in-memory mocks in gas-mock.js.
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const ctx = { console, Date, Math, JSON, Object, Array, String, Number, Error, RegExp, isFinite, parseInt, isNaN, Buffer };
vm.createContext(ctx);
const dir = path.join(__dirname, '..', 'apps-script');
vm.runInContext(fs.readFileSync(path.join(__dirname, 'gas-mock.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'Newsletter.gs'), 'utf8'), ctx, { filename: 'Newsletter.gs' });
vm.runInContext(fs.readFileSync(path.join(dir, 'Portal.gs'), 'utf8'), ctx, { filename: 'Portal.gs' });
const M = ctx.__mock;
// Each Apps Script call starts fresh; mimic that by clearing per-execution caches.
const run = (fn, ...a) => { vm.runInContext('ROWS_CACHE_={};ENSURED_={};ACCESS_=null;', ctx); return ctx[fn](...a); };
const throws = (fn, re, ...a) => assert.throws(() => run(fn, ...a), re);
let passed = 0; const ok = (name) => { passed++; console.log('  ok  ' + name); };
const sheet = n => M.sheets[n]._rows;
const today = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
const jpg = { name: 'p.jpg', type: 'image/jpeg', data: 'data:image/jpeg;base64,' + Buffer.from('fakejpegbytes').toString('base64') };

// --- setup is editor-only
throws('setup', /editor/);
M.users.active = M.users.effective; run('setup'); M.users.active = '';
assert.deepStrictEqual(sheet('Access')[1].slice(0, 3), ['owner@smooth2009.org', 'Owner', 'Inc']);
assert(sheet('Newsletter'), 'newsletter tab created too'); ok('setup creates tabs, owner as Inc, editor-only');

// --- access rows: an officer per section, one inactive, one officer with no section
const acc = sheet('Access');
acc.push(['pres.tu@example.com', 'TU President', 'Officer', 'TU', 'Yes', '']);
acc.push(['pres.msu@example.com', 'MSU President', 'Officer', 'MSU', 'Yes', '']);
acc.push(['gone@example.com', 'Former', 'Officer', 'CSU', 'No', '']);
acc.push(['nosection@example.com', 'X', 'Officer', '', 'Yes', '']);

function signIn(email) {
  const before = M.mails.length;
  const r = run('requestCode', email);
  assert(/If that email/.test(r.message));
  const mail = M.mails.slice(before).find(m => m.to === email.toLowerCase());
  assert(mail, 'code mailed to ' + email);
  const code = mail.subject.match(/(\d{6})$/)[1];
  return run('verifyCode', email, code);
}
const inc = signIn('Owner@smooth2009.org');
assert.strictEqual(inc.boot.user.role, 'Inc');
const tu = signIn('pres.tu@example.com'), msu = signIn('pres.msu@example.com');
assert.strictEqual(tu.boot.user.section, 'TU'); ok('sign-in by emailed code (case-insensitive email)');

for (const e of ['gone@example.com', 'nosection@example.com', 'stranger@example.com']) {
  const n = M.mails.length; run('requestCode', e); assert.strictEqual(M.mails.length, n, 'no code for ' + e);
}
ok('inactive, section-less, and unknown emails get no code but the same message');

// wrong codes, lockout, cooldown
run('requestCode', 'pres.tu@example.com'); // within cooldown: no new mail, old code consumed already
delete M.cache['cd:pres.tu@example.com'];
run('requestCode', 'pres.tu@example.com');
for (let i = 0; i < 4; i++) throws('verifyCode', /doesn't match/, 'pres.tu@example.com', '000000');
throws('verifyCode', /Too many tries/, 'pres.tu@example.com', '000000');
throws('verifyCode', /expired/, 'pres.tu@example.com', '000000');
throws('whoami', /session ended/, 'bogus-token');
ok('wrong codes lock out after 5 tries; bad tokens rejected');

// --- events
throws('createEvent', /future/, tu.token, { event_date: '2099-01-01', title: 'x', event_type: 'Social', description: 'd', attendees: 3, newsletter_summary: 's', minors_in_photos: 'No' });
throws('createEvent', /consent/, tu.token, { event_date: today, title: 'Youth day', event_type: 'Jr. SMOOTH', description: 'd', attendees: 30, newsletter_summary: 's', minors_in_photos: 'Yes', parent_consent: 'No' });
throws('createEvent', /Event type has an unexpected answer/, tu.token, { event_date: today, title: 'x', event_type: 'Party', description: 'd', attendees: 3, newsletter_summary: 's', minors_in_photos: 'No' });
const ev = run('createEvent', tu.token, { section: 'MSU', event_date: today, title: '=HYPERLINK("x")', event_type: 'Community service', location: 'North Philly', description: 'Park cleanup', attendees: '24', service_hours: '48', newsletter_summary: 'Brothers cleaned up the park.', minors_in_photos: 'No' });
let row = run('listEvents', inc.token, {})[0];
assert.strictEqual(row.section, 'TU', 'officer cannot file for another section');
assert.strictEqual(row.title, '=HYPERLINK("x")'); assert(String(M.sheets.Events._raw[0][4]).startsWith("'="), 'formula neutralized when written');
for (let i = 0; i < 3; i++) run('uploadEventPhoto', tu.token, ev.event_id, jpg);
throws('uploadEventPhoto', /isn't a supported photo/, tu.token, ev.event_id, { name: 'a.exe', type: 'application/x-msdownload', data: 'AAAA' });
throws('uploadEventPhoto', /wasn't found/, msu.token, ev.event_id, jpg);
let fin = run('finishEvent', tu.token, ev.event_id);
assert.strictEqual(fin.status, 'Incomplete');
run('uploadEventPhoto', tu.token, ev.event_id, jpg); run('uploadEventPhoto', tu.token, ev.event_id, jpg);
fin = run('finishEvent', tu.token, ev.event_id);
assert.strictEqual(fin.status, 'Submitted');
throws('uploadEventPhoto', /already submitted/, tu.token, ev.event_id, jpg);
const folder = Object.values(M.drive).find(f => f.files && f.files.length === 5);
assert(folder && /E-0001-05\.jpg/.test(folder.files[4].getName()), 'photos named and stored');
assert.strictEqual(run('listEvents', msu.token, {}).length, 0, 'other section cannot see it');
assert(!('photo_folder' in run('listEvents', tu.token, {})[0]), 'officers get no Drive links');
ok('event report: validation, section lock, 5-photo minimum, Drive storage, privacy');

throws('reviewEvent', /Only The Inc/, tu.token, ev.event_id, 'Reviewed', '');
throws('reviewEvent', /Note is required/, inc.token, ev.event_id, 'Needs changes', '');
run('reviewEvent', inc.token, ev.event_id, 'Reviewed', 'Great work');
assert.strictEqual(run('listEvents', tu.token, {})[0].status, 'Reviewed'); ok('Inc reviews events; officers cannot');

// --- funds
const fr = run('createFundsRequest', msu.token, { purpose: 'SMOOTH Week venue', amount: '$1,250.50', needed_by: '2099-10-01', payee: 'Student Center', breakdown: 'Room 1000\nAV 250.50' });
run('uploadFundsFile', msu.token, fr.request_id, { name: 'q.pdf', type: 'application/pdf', data: Buffer.from('%PDF').toString('base64') });
assert.strictEqual(run('listFunds', inc.token, {}).length, 0, 'drafts hidden until sent');
run('submitFundsRequest', msu.token, fr.request_id);
let f = run('listFunds', inc.token, {})[0];
assert.strictEqual(f.amount, 1250.5); assert.strictEqual(f.status, 'Pending'); assert.strictEqual(f.file_count, 1);
throws('decideFunds', /Only The Inc/, msu.token, fr.request_id, { status: 'Approved' });
throws('decideFunds', /Approve the request before/, inc.token, fr.request_id, { status: 'Paid' });
run('decideFunds', inc.token, fr.request_id, { status: 'Approved', approved_amount: '1000' });
run('decideFunds', inc.token, fr.request_id, { status: 'Paid', paid_date: today });
f = run('listFunds', msu.token, {})[0];
assert.strictEqual(f.status, 'Paid'); assert.strictEqual(f.approved_amount, 1000);
assert(M.mails.some(m => m.to === 'pres.msu@example.com' && /paid/.test(m.subject)), 'officer emailed');
assert.strictEqual(run('listFunds', tu.token, {}).length, 0);
ok('funds request: draft, files, approve, mark paid, emails, section privacy');

// --- members and rosters
const a1 = run('addMember', tu.token, { first_name: 'Kai', last_name: 'Smith', email: 'Kai@Example.com', phone: '(215) 555-0101', position: 'President', grad_year: 2027, section: 'CSU' });
assert(!a1.flagged);
let mem = run('listMembers', inc.token, {})[0];
assert.strictEqual(mem.section, 'TU'); assert.strictEqual(mem.email, 'kai@example.com'); assert.strictEqual(mem.member_id, 'M-00001');
throws('addMember', /already in the directory/, msu.token, { first_name: 'K', last_name: 'S', email: 'kai@example.com', phone: '4105550000' });
const a2 = run('addMember', msu.token, { first_name: 'Kai', last_name: 'Smith', email: 'kai2@example.com', phone: '410-555-0199' });
assert(a2.flagged, 'same name flagged as possible duplicate');
throws('addMember', /10 digits/, tu.token, { first_name: 'A', last_name: 'B', email: 'ab@example.com', phone: '555' });
run('addMember', tu.token, { first_name: 'Trey', last_name: 'Gerst', email: 'trey@example.com', phone: '2155550102' });
assert.strictEqual(run('listMembers', tu.token, {}).length, 2, 'officer sees own section only');
assert.strictEqual(run('listMembers', inc.token, { q: 'gerst' }).length, 1);
let roster = run('getRoster', tu.token, 'MSU');
assert.strictEqual(roster.section, 'TU'); assert.strictEqual(roster.people.length, 2);
assert(roster.people.every(p => p.standing === 'New'));
ok('add member: directory + roster as New, dedupe by email, flag by name/phone, section lock');

// returning brothers next term: simulate an older member not yet on this term's roster
sheet('Members').push(['M-00099', 'Old', 'Head', 'old@example.com', '2155550199', 'TU', 'Active', 'Treasurer', 2023, 'Fall 2023', 2026]);
roster = run('getRoster', tu.token, '');
const old = roster.people.find(p => p.member_id === 'M-00099'); assert.strictEqual(old.standing, '');
const res = run('confirmRoster', tu.token, 'TU', '', [{ member_id: 'M-00099', returning: true, position: 'Vice President' }, { member_id: 'M-00002', returning: true }]);
assert(/1 returning brother added/.test(res.message), res.message);
roster = run('getRoster', tu.token, '');
assert.strictEqual(roster.people.find(p => p.member_id === 'M-00099').standing, 'Returning');
assert.strictEqual(roster.confirmed, true);
ok('semester roster: returning brothers added once, positions updated, other sections ignored');

const exp = run('exportMembers', inc.token, { section: 'TU' });
assert.strictEqual(exp.rows, 3); throws('exportMembers', /Only The Inc/, tu.token, {});
ok('Inc CSV export to Drive');

// --- newsletter draft
const cand = run('newsletterCandidates', inc.token, '');
assert.strictEqual(cand.length, 1);
const draft = run('createNewsletterDraft', inc.token, 'Fall newsletter', [ev.event_id]);
assert.strictEqual(draft.count, 1);
const doc = M.docs[M.docs.length - 1];
assert(doc.paras.some(p => p.text === 'Brothers cleaned up the park.')); assert.strictEqual(doc.images.length, 1); assert.strictEqual(doc.images[0].w, 460);
assert.strictEqual(run('listEvents', inc.token, {})[0].newsletter_issue, 'Fall newsletter');
throws('createNewsletterDraft', /Only The Inc/, tu.token, 'x', [ev.event_id]);
ok('newsletter draft from reviewed summaries with one photo each');

// --- amendments
const am = run('proposeAmendment', tu.token, { title: 'Virtual meetings', article: 'Article IV, Section 2', proposed_text: 'Sections may meet online.', rationale: 'Flexibility.' });
throws('castVote', /isn't open/, tu.token, am.amendment_id, 'Yes');
throws('openVote', /Only The Inc/, tu.token, am.amendment_id);
const ov = run('openVote', inc.token, am.amendment_id);
assert.strictEqual(ov.eligible, 3, 'Inc owner + 2 active officers');
run('castVote', tu.token, am.amendment_id, 'Yes');
throws('castVote', /already voted/, tu.token, am.amendment_id, 'No');
let la = run('listAmendments', msu.token).find(a => a.amendment_id === am.amendment_id);
assert.strictEqual(la.yes, '', 'running totals hidden'); assert.strictEqual(la.turnout, 1); assert.strictEqual(la.can_vote, true);
run('castVote', msu.token, am.amendment_id, 'Yes');
run('castVote', inc.token, am.amendment_id, 'No');
const cl = run('closeVote', inc.token, am.amendment_id);
assert.strictEqual(cl.status, 'Passed', cl.result);   // 2/3 yes of yes+no, quorum 3/3
// a second one fails on quorum
const am2 = run('proposeAmendment', inc.token, { title: 'Dues change', article: 'Article VI', proposed_text: 'Dues are $50.', rationale: 'Costs.' });
run('openVote', inc.token, am2.amendment_id); run('castVote', inc.token, am2.amendment_id, 'Yes');
assert.strictEqual(run('closeVote', inc.token, am2.amendment_id).status, 'Failed');
// expired votes close themselves
const am3 = run('proposeAmendment', inc.token, { title: 'Name', article: 'Article I', proposed_text: 'x', rationale: 'y' });
run('openVote', inc.token, am3.amendment_id);
const amRows = sheet('Amendments'); const h = amRows[0]; const r3 = amRows.find(r => r[0] === am3.amendment_id);
r3[h.indexOf('vote_closes')] = new Date(Date.now() - 1000);
assert.strictEqual(run('listAmendments', inc.token).find(a => a.amendment_id === am3.amendment_id).status, 'Failed');
const am4 = run('proposeAmendment', tu.token, { title: 'w', article: 'a', proposed_text: 'p', rationale: 'r' });
throws('withdrawAmendment', /Only The Inc. or the person/, msu.token, am4.amendment_id);
run('withdrawAmendment', tu.token, am4.amendment_id);
ok('amendments: propose, open, one vote each, hidden totals, two-thirds + quorum, auto-close, withdraw');

// --- dashboard
const d = run('getDashboard', inc.token, '');
const tuStats = d.sections.find(s => s.section === 'TU');
assert.strictEqual(tuStats.events, 1); assert.strictEqual(tuStats.attendees, 24); assert.strictEqual(tuStats.serviceHours, 48);
assert.strictEqual(tuStats.roster, 3); assert.strictEqual(tuStats.newMembers, 2);
assert.strictEqual(d.sections.find(s => s.section === 'MSU').fundsPaid, 1000);
assert(d.todo.some(t => /possible duplicate/.test(t)));
assert.strictEqual(run('getDashboard', tu.token, '').sections.length, 1, 'officer sees own section');
ok('dashboard totals by section and term');

// --- newsletter sign-up still works in the shared project
const sign = JSON.parse(ctx.doPost({ parameter: { form: 'Newsletter', name: 'Fan', email: 'fan@example.com', relationship: 'Alumni' } }).getContent());
assert.strictEqual(sign.ok, true); ok('website newsletter sign-up (doPost) alongside the portal');

console.log('\n' + passed + ' checks passed');
