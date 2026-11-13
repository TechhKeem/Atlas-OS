/**
 * S.M.O.O.T.H. Inc. — website form receiver
 * Paste this into Extensions > Apps Script on the Google Sheet that will hold submissions.
 * Newsletter sign-ups land in a "Newsletter" tab, created automatically on the first submission.
 * New columns are added automatically if a form gains a field.
 */

// Optional: email The Inc. whenever a form comes in. Leave "" to turn off.
const NOTIFY_EMAIL = "Info@smooth2009.org";

const ALLOWED_FORMS = ["Newsletter"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const p = Object.assign({}, e.parameter);
    const formName = String(p.form || "");
    if (ALLOWED_FORMS.indexOf(formName) === -1) return out_({ ok: false, error: "unknown form" });
    if (p.website) return out_({ ok: true }); // spam trap
    delete p.form;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(formName) || ss.insertSheet(formName);

    // Header row
    let headers = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];
    if (headers.length === 0) {
      headers = ["submitted_at", "status"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    Object.keys(p).forEach(function (k) {
      if (headers.indexOf(k) === -1) {
        headers.push(k);
        sheet.getRange(1, headers.length).setValue(k).setFontWeight("bold");
      }
    });

    p.status = "New";
    const row = headers.map(function (h) {
      const v = p[h] === undefined ? "" : String(p[h]).slice(0, 5000);
      return /^[=+\-@]/.test(v) ? "'" + v : v; // stop formula injection
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      const body = headers.map(function (h) { return h + ": " + (p[h] || ""); }).join("\n");
      MailApp.sendEmail(NOTIFY_EMAIL, "New website form: " + formName, body);
    }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return out_({ ok: true, service: "SMOOTH forms" });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
