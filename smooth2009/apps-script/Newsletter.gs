/**
 * S.M.O.O.T.H. Inc. — newsletter sign-up receiver
 *
 * One of three files in the Apps Script project on the "SMOOTH Back Office" Google Sheet
 * (Newsletter.gs, Portal.gs, Portal.html). Website sign-ups land in the "Newsletter" tab.
 *
 * The server checks every sign-up itself and does not trust the browser:
 *   - only the fields listed in FIELDS are saved; anything else is thrown away
 *   - name, email, and relationship are required; email must look like an email
 *   - relationship must be one of the dropdown choices
 *   - a hidden "website" field catches bots (honeypot)
 *   - the same email can't sign up twice within REPEAT_WINDOW_SECONDS
 *   - cells that would run as a spreadsheet formula are neutralized
 *
 * setup() in Portal.gs creates this tab. Run testSignup() from the editor to add one test row.
 */

// Email The Inc. whenever someone signs up. Leave "" to turn off.
// Consumer Gmail accounts can send about 100 of these a day; Google Workspace accounts can send more.
const NOTIFY_EMAIL = "Info@smooth2009.org";

// Seconds before the same email address can sign up again (stops double clicks and floods).
const REPEAT_WINDOW_SECONDS = 60;

const ALLOWED_FORMS = ["Newsletter"];
const TAB = "Newsletter";

const RELATIONSHIPS = ["Current member", "Alumni", "Parent or family", "Supporter or donor", "Educator or partner"];

// Order here is the column order in the sheet. `member_id` is filled in by The Inc. later
// (Phase 2) to link a sign-up to someone in the member directory.
const FIELDS = {
  name:         { req: true, max: 120 },
  email:        { req: true, max: 200, type: "email" },
  relationship: { req: true, oneOf: RELATIONSHIPS }
};
const COLUMNS = ["submitted_at", "status"].concat(Object.keys(FIELDS), ["page", "member_id"]);

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (ALLOWED_FORMS.indexOf(String(p.form || "")) === -1) return out_({ ok: false, error: "unknown form" });
  if (p.website) return out_({ ok: true }); // honeypot: bots fill this hidden field; pretend success

  const checked = validate_(p);
  if (checked.errors.length) return out_({ ok: false, error: checked.errors.join("; ") });
  const data = checked.data;

  const cache = CacheService.getScriptCache();
  const key = "n:" + data.email.toLowerCase();
  if (cache.get(key)) return out_({ ok: true, duplicate: true });
  cache.put(key, "1", REPEAT_WINDOW_SECONDS);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = sheet_();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    data.submitted_at = new Date();
    data.status = "New";
    data.page = cleanPage_(p.page);
    sheet.appendRow(headers.map(function (h) {
      const v = data[h];
      if (v === undefined || v === null) return "";
      return v instanceof Date ? v : safeCell_(String(v));
    }));
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: "could not save" });
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: "New newsletter sign-up",
        body: "Name: " + data.name + "\nEmail: " + data.email + "\nRelationship: " + data.relationship +
              "\n\nOpen the \"Newsletter\" tab in the SMOOTH Website Submissions sheet to follow up.",
        replyTo: data.email
      });
    } catch (err) {
      console.error("notify failed: " + err); // the row is already saved
    }
  }
  return out_({ ok: true });
}

// doGet lives in Portal.gs: the same web app address serves the member portal.

/** Check one sign-up against FIELDS. Returns { data, errors }. */
function validate_(p) {
  const data = {}, errors = [];
  Object.keys(FIELDS).forEach(function (k) {
    const r = FIELDS[k];
    const v = p[k] === undefined ? "" : String(p[k]).replace(/[\u0000-\u001F\u007F]/g, " ").trim();
    if (!v) { if (r.req) errors.push(k + " is required"); return; }
    if (v.length > (r.max || 200)) { errors.push(k + " is too long"); return; }
    if (r.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { errors.push("email is not valid"); return; }
    if (r.oneOf && r.oneOf.indexOf(v) === -1) { errors.push(k + " has an unexpected answer"); return; }
    data[k] = v;
  });
  return { data: data, errors: errors };
}

/** Get (or create) the Newsletter tab and make sure every expected column exists. */
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
  let headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (headers.join("") === "") headers = [];
  COLUMNS.forEach(function (h) { if (headers.indexOf(h) === -1) headers.push(h); });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

/** Stop a cell from being read as a formula. */
function safeCell_(v) {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

/** Keep the page address only if it is on our own site. */
function cleanPage_(v) {
  v = String(v || "").slice(0, 300);
  return /^https:\/\/(www\.)?smooth2009\.org(\/|$)/i.test(v) ? v : "";
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Run these from the Apps Script editor ---------- */

/** Creates the Newsletter tab with headers and a status dropdown. Portal.gs setup() calls this. */
function setupNewsletter_() {
  const sheet = sheet_();
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["New", "Added to email list", "Unsubscribed", "Spam"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, COLUMNS.indexOf("status") + 1, sheet.getMaxRows() - 1, 1).setDataValidation(rule);
}

/** Sends one fake sign-up through doPost. Delete the test row afterwards. */
function testSignup() {
  editorOnly_();
  const res = doPost({ parameter: {
    form: "Newsletter", name: "Test Subscriber", email: "test@example.com",
    relationship: "Supporter or donor", page: "https://smooth2009.org/"
  } }).getContent();
  console.log(res);
}
