/**
 * S.M.O.O.T.H. Inc. — website form receiver
 *
 * Paste this into Extensions > Apps Script on the Google Sheet that holds submissions.
 * Each website form writes to its own tab:
 *   Membership Interest | Partner and Volunteer | Member Directory Update | Newsletter
 *
 * The server checks every submission against the field rules below. It does not trust the
 * browser. Fields not listed are thrown away, required fields must be present, dropdown
 * answers must be one of the listed choices, and cells that look like formulas are neutralized.
 *
 * Run setup() once from the editor to create the four tabs with their headers.
 * Run testAllForms() to send one test row to each tab.
 */

// Email The Inc. whenever a form comes in. Leave "" to turn off.
// Consumer Gmail accounts can send about 100 of these a day; Google Workspace accounts can send more.
const NOTIFY_EMAIL = "Info@smooth2009.org";

// Seconds before the same email address can submit the same form again (stops double clicks and floods).
const REPEAT_WINDOW_SECONDS = 30;

const ALLOWED_FORMS = [
  "Membership Interest",
  "Partner and Volunteer",
  "Member Directory Update",
  "Newsletter"
];

const CAMPUSES = ["Morgan State University", "Coppin State University", "Temple University"];
const THIS_YEAR = new Date().getFullYear();

/**
 * Field rules per form. Order here is the column order in the sheet.
 *   req:   required
 *   max:   longest allowed length (default 200)
 *   type:  "email" | "year" | "url"
 *   oneOf: allowed answers (for dropdowns and checkboxes)
 *   many:  true if several checkbox answers arrive joined by ", "
 */
const FORMS = {
  "Membership Interest": {
    first_name: { req: true, max: 80 },
    last_name:  { req: true, max: 80 },
    email:      { req: true, type: "email" },
    phone:      { req: true, max: 40 },
    campus:     { req: true, oneOf: CAMPUSES.concat(["Other / not listed"]) },
    class_year: { req: true, oneOf: ["Freshman", "Sophomore", "Junior", "Senior", "Graduate student"] },
    major:      { max: 120 },
    heard_from: { max: 200 },
    why_join:   { req: true, max: 5000 }
  },
  "Partner and Volunteer": {
    name:         { req: true, max: 120 },
    organization: { max: 200 },
    email:        { req: true, type: "email" },
    phone:        { max: 40 },
    request_type: { req: true, oneOf: [
      "Have S.M.O.O.T.H. visit my school",
      "Start a section at my college",
      "Have members volunteer at my event",
      "Volunteer or mentor",
      "Sponsor or partner with the organization",
      "Something else"
    ] },
    message:      { req: true, max: 5000 }
  },
  "Member Directory Update": {
    first_name:        { req: true, max: 80 },
    last_name:         { req: true, max: 80 },
    email:             { req: true, type: "email" },
    phone:             { max: 40 },
    section:           { req: true, oneOf: CAMPUSES },
    member_status:     { req: true, oneOf: ["Active (current student)", "Alumni"] },
    year_joined:       { req: true, type: "year" },
    grad_year:         { type: "year" },
    city:              { max: 80 },
    state:             { max: 20 },
    occupation:        { max: 200 },
    linkedin:          { type: "url", max: 300 },
    help_with:         { many: true, oneOf: ["Mentoring", "Speaking", "Jobs and internships", "Events", "Fundraising"] },
    newsletter_opt_in: { oneOf: ["Yes"] }
  },
  "Newsletter": {
    name:         { req: true, max: 120 },
    email:        { req: true, type: "email" },
    relationship: { req: true, oneOf: ["Current member", "Alumni", "Parent or family", "Supporter or donor", "Educator or partner"] }
  }
};

// Columns every tab has, before and after the form's own fields.
const LEAD_COLUMNS = ["submitted_at", "status"];
const TAIL_COLUMNS = ["page"];

function doPost(e) {
  const p = (e && e.parameter) || {};
  const formName = String(p.form || "");
  if (ALLOWED_FORMS.indexOf(formName) === -1) return out_({ ok: false, error: "unknown form" });
  if (p.website) return out_({ ok: true }); // honeypot: bots fill this hidden field; pretend success

  const checked = validate_(formName, p);
  if (checked.errors.length) return out_({ ok: false, error: checked.errors.join("; ") });
  const data = checked.data;

  // Throttle repeats from the same address
  const cache = CacheService.getScriptCache();
  const key = "r:" + formName + ":" + data.email.toLowerCase();
  if (cache.get(key)) return out_({ ok: true, duplicate: true });
  cache.put(key, "1", REPEAT_WINDOW_SECONDS);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = sheetFor_(formName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    data.submitted_at = new Date();
    data.status = "New";
    data.page = cleanPage_(p.page);
    const row = headers.map(function (h) {
      const v = data[h];
      if (v === undefined || v === null) return "";
      return v instanceof Date ? v : safeCell_(String(v));
    });
    sheet.appendRow(row);
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: "could not save" });
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      const fields = Object.keys(FORMS[formName]);
      const body = fields.map(function (k) { return k + ": " + (data[k] || ""); }).join("\n") +
        "\n\nOpen the \"" + formName + "\" tab in the submissions sheet to follow up.";
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New website form: " + formName,
        body: body,
        replyTo: data.email
      });
    } catch (err) {
      console.error("notify failed: " + err); // the row is already saved
    }
  }
  return out_({ ok: true });
}

function doGet() {
  return out_({ ok: true, service: "SMOOTH forms" });
}

/** Check one submission against its form's rules. Returns { data, errors }. */
function validate_(formName, p) {
  const rules = FORMS[formName];
  const data = {};
  const errors = [];
  Object.keys(rules).forEach(function (k) {
    const r = rules[k];
    let v = p[k] === undefined ? "" : String(p[k]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
    const max = r.max || 200;
    if (!v) {
      if (r.req) errors.push(k + " is required");
      return;
    }
    if (v.length > max) { errors.push(k + " is too long"); return; }
    if (r.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { errors.push(k + " is not a valid email"); return; }
    if (r.type === "year") {
      const y = Number(v);
      if (!/^\d{4}$/.test(v) || y < 2009 || y > THIS_YEAR + 6) { errors.push(k + " is not a valid year"); return; }
    }
    if (r.type === "url" && !/^https:\/\/[^\s]+$/i.test(v)) { errors.push(k + " must start with https://"); return; }
    if (r.oneOf) {
      const parts = r.many ? v.split(/\s*,\s*/) : [v];
      const bad = parts.filter(function (x) { return r.oneOf.indexOf(x) === -1; });
      if (bad.length) { errors.push(k + " has an unexpected answer"); return; }
      v = parts.join(", ");
    }
    data[k] = v;
  });
  return { data: data, errors: errors };
}

/** Get (or create) a form's tab and make sure every expected column exists. */
function sheetFor_(formName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(formName) || ss.insertSheet(formName);
  const wanted = LEAD_COLUMNS.concat(Object.keys(FORMS[formName]), TAIL_COLUMNS);
  let headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (headers.length === 0 || headers.join("") === "") {
    headers = [];
  }
  wanted.forEach(function (h) {
    if (headers.indexOf(h) === -1) headers.push(h);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

/** Stop a cell from being read as a formula. */
function safeCell_(v) {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

/** Keep only the page address on our own site. */
function cleanPage_(v) {
  v = String(v || "").slice(0, 300);
  return /^https:\/\/(www\.)?smooth2009\.org(\/|$)/i.test(v) ? v : "";
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Run these from the Apps Script editor ---------- */

/** Creates the four tabs with headers and a status dropdown. Safe to run more than once. */
function setup() {
  ALLOWED_FORMS.forEach(function (name) {
    const sheet = sheetFor_(name);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["New", "Contacted", "Done"], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
  });
}

/** Sends one fake submission to each form through doPost. Delete the test rows afterwards. */
function testAllForms() {
  const samples = {
    "Membership Interest": { first_name: "Test", last_name: "Applicant", email: "test1@example.com", phone: "410-555-0100",
      campus: "Morgan State University", class_year: "Freshman", why_join: "Test submission. Delete me." },
    "Partner and Volunteer": { name: "Test Partner", email: "test2@example.com", request_type: "Volunteer or mentor",
      message: "Test submission. Delete me." },
    "Member Directory Update": { first_name: "Test", last_name: "Brother", email: "test3@example.com",
      section: "Temple University", member_status: "Alumni", year_joined: "2016", grad_year: "2019",
      help_with: "Mentoring, Events", newsletter_opt_in: "Yes" },
    "Newsletter": { name: "Test Subscriber", email: "test4@example.com", relationship: "Supporter or donor" }
  };
  ALLOWED_FORMS.forEach(function (name) {
    const params = Object.assign({ form: name, page: "https://smooth2009.org/" }, samples[name]);
    const res = doPost({ parameter: params }).getContent();
    console.log(name + ": " + res);
  });
}
