/* In-memory stand-ins for the Google Apps Script services the back office uses.
   Runs in Node (vm context) and in a browser page. Only what Newsletter.gs and Portal.gs call. */
(function (G) {
  const mails = [], cache = {}, props = {};
  let uuidN = 0, idN = 0;
  const drive = {};          // id -> folder/file
  const TZ = 'America/New_York';

  function sheetObj(name) {
    const rows = [], raw = [];   // rows: what Sheets shows; raw: exactly what the script wrote
    const shown = x => (typeof x === 'string' && x[0] === "'") ? x.slice(1) : x;  // a leading ' marks text in Sheets
    const width = () => rows.reduce((m, r) => Math.max(m, r.length), 0);
    const rangeObj = (r, c, nr, nc) => ({
      getValues: () => { const out = []; for (let i = 0; i < nr; i++) { const row = rows[r - 1 + i] || []; out.push(Array.from({ length: nc }, (_, j) => row[c - 1 + j] === undefined ? '' : row[c - 1 + j])); } return out; },
      setValues: v => { v.forEach((vr, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; vr.forEach((x, j) => { rows[r - 1 + i][c - 1 + j] = x; }); }); return rangeObj(r, c, nr, nc); },
      setValue: x => { rows[r - 1] = rows[r - 1] || []; rows[r - 1][c - 1] = shown(x); return rangeObj(r, c, nr, nc); },
      setFontWeight() { return this; }, setDataValidation() { return this; }
    });
    return {
      _rows: rows, _raw: raw, getName: () => name,
      getLastRow: () => rows.length, getLastColumn: () => width(), getMaxRows: () => 1000,
      getRange: (a, b, c, d) => typeof a === 'string' ? rangeObj(1, 1, 1, 1) : rangeObj(a, b, c || 1, d || 1),
      appendRow: r => { raw.push(r.slice()); rows.push(r.map(shown)); }, setFrozenRows() {}
    };
  }
  const sheets = {};
  const spreadsheet = { getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = sheetObj(n)) };

  function folder(name, parent) {
    const id = 'F' + (++idN);
    const f = { id, name, parent, folders: [], files: [],
      getId: () => id, getName: () => name, getUrl: () => 'https://drive.google.com/drive/folders/' + id,
      createFolder: n => { const c = folder(n, f); f.folders.push(c); return c; },
      getFoldersByName: n => iter(f.folders.filter(x => x.name === n)),
      getFiles: () => iter(f.files),
      createFile: (a, content, mime) => { const fl = file(typeof a === 'string' ? { name: a, content, type: mime } : a, f); f.files.push(fl); return fl; }
    };
    drive[id] = f; return f;
  }
  function file(blob, parent) {
    const id = 'D' + (++idN);
    const fl = { id, blob, parent, getId: () => id, getName: () => blob.name || (blob.getName && blob.getName()), getUrl: () => 'https://drive.google.com/file/d/' + id,
      getBlob: () => blob, moveTo: f => { fl.parent = f; f.files.push(fl); } };
    drive[id] = fl; return fl;
  }
  function iter(list) { let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; }

  function pad(n, w) { return String(n).padStart(w || 2, '0'); }
  function fmt(d, tz, f) {
    return f.replace('yyyy', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('dd', pad(d.getDate()))
            .replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes()));
  }
  function b64decode(s) {
    if (typeof Buffer !== 'undefined') return Array.from(Buffer.from(s, 'base64'));
    const bin = atob(s); return Array.from(bin, ch => ch.charCodeAt(0));
  }
  function digest(s) { // stand-in for SHA-256; deterministic, 32 bytes
    const out = []; let h = 2166136261;
    for (let k = 0; k < 32; k++) { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i) + k; h = Math.imul(h, 16777619); } out.push((h & 255) - 128); }
    return out;
  }
  const docs = [];
  function para(text) { const p = { text, heading: null, italic: false, setHeading(x) { p.heading = x; return p; }, setItalic(x) { p.italic = x; return p; } }; return p; }

  Object.assign(G, {
    __mock: { mails, cache, sheets, drive, docs, users: { active: '', effective: 'owner@smooth2009.org' } },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      newDataValidation: () => { const b = { requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; }
    },
    CacheService: { getScriptCache: () => ({ get: k => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = String(v); }, remove: k => { delete cache[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: o => mails.push(o) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; } }) },
    Session: {
      getScriptTimeZone: () => TZ,
      getActiveUser: () => ({ getEmail: () => G.__mock.users.active }),
      getEffectiveUser: () => ({ getEmail: () => G.__mock.users.effective })
    },
    Utilities: {
      getUuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => ((Math.random() * 16) | 0).toString(16)),
      formatDate: fmt,
      computeDigest: (alg, s) => digest(String(s)),
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      base64Decode: b64decode,
      newBlob: (bytes, type, name) => { const b = { bytes, type, name, setName: n => { b.name = n; return b; }, getName: () => b.name, getContentType: () => type }; return b; }
    },
    DriveApp: {
      createFolder: n => folder(n, null),
      getFolderById: id => { if (!drive[id]) throw new Error('No folder ' + id); return drive[id]; },
      getFileById: id => drive[id]
    },
    DocumentApp: {
      ParagraphHeading: { TITLE: 'TITLE', SUBTITLE: 'SUBTITLE', HEADING2: 'HEADING2' },
      create: title => {
        const id = 'DOC' + (++idN), paras = [], images = [];
        const body = { appendParagraph: t => { const p = para(t); paras.push(p); return p; },
                       appendImage: blob => { const im = { w: 1600, h: 1200, getWidth: () => im.w, getHeight: () => im.h, setWidth(w) { im.w = w; return im; }, setHeight(h) { im.h = h; return im; } }; images.push(im); paras.push({ text: '[image]' }); return im; } };
        const doc = { title, paras, images, getBody: () => body, saveAndClose() {}, getId: () => id, getUrl: () => 'https://docs.google.com/document/d/' + id };
        drive[id] = file({ name: title }, null); drive[id].moveTo = () => {};
        docs.push(doc); return doc;
      }
    },
    MimeType: { CSV: 'text/csv' },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: t => ({ setMimeType() { return { getContent: () => t }; } }) },
    HtmlService: { createHtmlOutputFromFile: () => ({ setTitle() { return this; }, addMetaTag() { return this; } }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyDays: () => ({ atHour: () => ({ create() {} }) }) }) }) }
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
