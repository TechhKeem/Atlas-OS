/* Practice mode for smooth2009.org/members.
   Runs the real portal code (Portal.gs, Newsletter.gs) in the browser on gas-mock.js, with no password.
   Everything is saved in this browser only (localStorage). Nothing is sent anywhere.
   Built into site/members/index.html by tools/build_members.py. */
(function () {
  "use strict";
  const KEY = "smoothPracticeV1", ROLE_KEY = "smoothPracticeRole";
  const ROLES = {
    inc: { email: "inc@example.com", label: "The Inc." },
    MSU: { email: "officer.msu@example.com", label: "Morgan State officer" },
    CSU: { email: "officer.csu@example.com", label: "Coppin State officer" },
    TU:  { email: "officer.tu@example.com", label: "Temple officer" },
    applicant: { email: "applicant@example.com", label: "New chapter applicant" }
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };
  const fresh = () => { ROWS_CACHE_ = {}; ENSURED_ = {}; ACCESS_ = null; };
  let saveFailed = false;
  function save() {
    const ok = store.set(KEY, JSON.stringify({ v: 1, state: __mock.dump() }));
    if (!ok && !saveFailed) { saveFailed = true; setTimeout(() => note("This browser can't save practice entries (private window or storage blocked). Changes will be lost when you leave."), 0); }
  }

  /* ---------- data: restore or seed ---------- */
  __mock.users.effective = ROLES.inc.email;
  let saved = null;
  try { saved = JSON.parse(store.get(KEY) || "null"); } catch (_) {}
  if (saved && saved.v === 1) { __mock.load(saved.state); ensurePracticeAccess(); }
  else { seed(store.get("smoothPracticeSeed") !== "empty"); store.del("smoothPracticeSeed"); }

  /** Practice data saved before a role existed gets that role's account added. */
  function ensurePracticeAccess() {
    const acc = __mock.sheets.Access && __mock.sheets.Access._rows; if (!acc) return;
    if (!acc.some(r => String(r[0]).toLowerCase() === ROLES.applicant.email)) acc.push([ROLES.applicant.email, "New chapter applicant (practice)", "Applicant", "", "Yes", "Practice account"]);
  }

  function seed(withExamples) {
    __mock.users.active = __mock.users.effective; fresh(); setup(); __mock.users.active = "";
    const acc = __mock.sheets.Access._rows;
    acc[1][1] = "You (practice)";
    acc.push(["officer.msu@example.com", "Morgan State officer (practice)", "Officer", "MSU", "Yes", "Practice account"],
             ["officer.csu@example.com", "Coppin State officer (practice)", "Officer", "CSU", "Yes", "Practice account"],
             ["officer.tu@example.com", "Temple officer (practice)", "Officer", "TU", "Yes", "Practice account"],
             ["applicant@example.com", "New chapter applicant (practice)", "Applicant", "", "Yes", "Practice account"]);
    if (withExamples) examples();   // keep the emails the examples trigger, so the outbox shows what the portal sends
    save();
  }

  function token(email) {
    fresh(); delete __mock.cache["cd:" + email];
    const before = __mock.mails.length;
    requestCode(email);
    const mail = __mock.mails.slice(before).filter(m => m.to === email).pop();
    __mock.mails.splice(before);                        // sign-in codes don't belong in the outbox
    fresh();
    return verifyCode(email, mail.subject.slice(-6)).token;
  }

  function examples() {
    const T = { inc: token(ROLES.inc.email), MSU: token(ROLES.MSU.email), CSU: token(ROLES.CSU.email), TU: token(ROLES.TU.email) };
    const day = 86400000, d = new Date();
    const iso = x => x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
    const ago = n => iso(new Date(d.getTime() - n * day)), ahead = n => iso(new Date(d.getTime() + n * day));
    const photo = { name: "example.jpg", type: "image/jpeg", data: btoa("example photo") };
    const run = (fn, ...a) => { fresh(); return window[fn](...a); };
    function ev(t, f, n) { const e = run("createEvent", t, f); for (let i = 0; i < n; i++) run("uploadEventPhoto", t, e.event_id, photo); run("finishEvent", t, e.event_id); return e.event_id; }

    const e1 = ev(T.TU, { event_date: ago(4), title: "Park cleanup", event_type: "Community service", location: "Fairmount Park, Philadelphia",
      description: "Brothers and neighborhood volunteers cleared litter from two blocks of the park and the playground.", attendees: 24, service_hours: 48,
      newsletter_summary: "Temple brothers and neighbors cleared two blocks of Fairmount Park on Saturday morning, 48 service hours in all.", minors_in_photos: "No" }, 5);
    const e2 = ev(T.MSU, { event_date: ago(12), title: "SMOOTH Week opening night", event_type: "SMOOTH Week", location: "Student Center ballroom",
      description: "Opening night of SMOOTH Week with three alumni speakers on life after graduation.", attendees: 85,
      newsletter_summary: "SMOOTH Week opened with three alumni speakers and a full ballroom at Morgan State.", minors_in_photos: "No" }, 6);
    ev(T.CSU, { event_date: ago(20), title: "Jr. SMOOTH reading day", event_type: "Jr. SMOOTH", location: "Partner elementary school",
      description: "Brothers read with third and fourth graders at our adopted school.", attendees: 32, service_hours: 24,
      newsletter_summary: "Coppin State brothers spent the morning reading with third and fourth graders at their adopted school.", minors_in_photos: "Yes", parent_consent: "Yes" }, 5);
    ev(T.MSU, { event_date: ago(2), title: "Study hall", event_type: "Professional development", description: "Weekly study hall in the library.", attendees: 14,
      newsletter_summary: "Weekly study hall continues every Tuesday night.", minors_in_photos: "No" }, 2);
    run("reviewEvent", T.inc, e2, "Reviewed", "");

    const f1 = run("createFundsRequest", T.MSU, { purpose: "SMOOTH Week venue", event_name: "SMOOTH Week opening night", amount: 650, needed_by: ahead(20),
      payee: "Student Center events office", breakdown: "Ballroom rental: $500\nSound system: $150" }); run("submitFundsRequest", T.MSU, f1.request_id);
    const f2 = run("createFundsRequest", T.TU, { purpose: "Cleanup supplies", event_name: "Park cleanup", amount: 120, needed_by: ahead(5),
      payee: "Reimburse the section treasurer", breakdown: "Gloves: $40\nTrash bags: $30\nWater: $50" }); run("submitFundsRequest", T.TU, f2.request_id);
    run("decideFunds", T.inc, f2.request_id, { status: "Approved", approved_amount: 120 });

    [["Jordan", "Reed", "MSU", "President", 2027], ["Marcus", "Hill", "MSU", "Vice President", 2027], ["Andre", "Banks", "MSU", "", 2029],
     ["Isaiah", "Grant", "CSU", "President", 2026], ["Malik", "Price", "CSU", "Treasurer", 2028],
     ["Darius", "Cole", "TU", "President", 2027], ["Elijah", "Ward", "TU", "Secretary", 2028], ["Caleb", "Brooks", "TU", "", 2029]]
      .forEach(([a, b, s, pos, g], i) => run("addMember", T[s], { first_name: a, last_name: b, email: (a + "." + b + "@example.com").toLowerCase(),
        phone: "410555" + String(1000 + i).slice(-4), position: pos, grad_year: g }));

    run("proposeAmendment", T.TU, { title: "Allow virtual section meetings", article: "Article IV, Section 2",
      current_text: "Sections shall meet in person at least twice a month.",
      proposed_text: "Sections shall meet at least twice a month, in person or online.",
      rationale: "Exams and weather cancel meetings every semester. Online meetings keep sections on schedule." });
    const a2 = run("proposeAmendment", T.inc, { title: "Add a national treasurer", article: "Article V, Section 1",
      proposed_text: "The Inc. shall include a National Treasurer elected each spring.", rationale: "Funds requests need one clear approver." });
    run("openVote", T.inc, a2.amendment_id); run("castVote", T.MSU, a2.amendment_id, "Yes");

    // An example chapter application from another school, waiting for The Inc. to review
    __mock.sheets.Access._rows.push(["lead@example.edu", "Example applicant", "Applicant", "", "Yes", "Example"]);
    const A = token("lead@example.edu");
    const doc = { name: "example.pdf", type: "application/pdf", data: btoa("%PDF example") };
    const c = run("saveChapter", A, { school: "Example State University", code: "ESU", city: "Towson", state: "MD", chartering_year: d.getFullYear(),
      contact_name: "Example applicant", contact_email: "lead@example.edu", contact_phone: "4105550199", advisor_name: "Dr. Example Advisor",
      advisor_title: "Assistant Dean of Students", advisor_email: "advisor@example.edu", recognition: "Recognition in progress",
      jr_smooth_school: "Example Elementary School", chartering_members: "Example applicant, President\nSecond Founder, Vice President\nThird Founder, Treasurer",
      roster_text: "First name\tLast name\tEmail\tPhone\tClass year\tPosition\nExample\tApplicant\tlead@example.edu\t4105550199\t2027\tPresident\n" +
        "Second\tFounder\tsecond@example.edu\t4105550198\t2028\tVice President\nThird\tFounder\tthird@example.edu\t4105550197\t2028\tTreasurer\n" +
        "Fourth\tMember\tfourth@example.edu\t\t2029\t\nFifth\tMember\tfifth@example.edu\t\t2029\t", agreed: true });
    run("uploadChapterFile", A, c.chapter_id, "constitution", doc);
    run("uploadChapterFile", A, c.chapter_id, "bylaws", doc);
    run("submitChapter", A, c.chapter_id);
  }

  /* ---------- sign in as the chosen role, no password ---------- */
  let role = store.get(ROLE_KEY); if (!ROLES[role]) role = "inc";
  window.__PRACTICE = true;
  window.__PRACTICE_TOKEN = token(ROLES[role].email);
  save();

  /* ---------- google.script.run, answered in this page ---------- */
  function noDates(v) { if (v instanceof Date) throw new Error("Date returned to browser"); if (v && typeof v === "object") Object.values(v).forEach(noDates); }
  function runner(ok, bad) {
    return new Proxy({}, { get(_, p) {
      if (p === "withSuccessHandler") return h => runner(h, bad);
      if (p === "withFailureHandler") return h => runner(ok, h);
      return (...a) => setTimeout(() => {
        try {
          fresh();
          const r = window[p](...JSON.parse(JSON.stringify(a)));
          noDates(r); save(); refreshOutbox();
          ok && ok(JSON.parse(JSON.stringify(r === undefined ? null : r)));
        } catch (e) { save(); bad && bad({ message: e.message }); }
      }, 30);
    } });
  }
  window.google = { script: { run: runner() } };

  /* ---------- practice bar ---------- */
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (k === "text") n.textContent = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else if (v !== false && v != null) n.setAttribute(k, v); });
    kids.flat(Infinity).forEach(c => c != null && n.append(c.nodeType ? c : document.createTextNode(String(c))));
    return n;
  }
  let outboxBtn, noteEl;
  function refreshOutbox() { if (outboxBtn) outboxBtn.textContent = "Emails sent (" + __mock.mails.length + ")"; }
  function note(msg) { if (noteEl) noteEl.textContent = msg; }

  function buildBar() {
    const sel = el("select", { id: "practiceRole", "aria-label": "View the portal as" },
      Object.entries(ROLES).map(([k, r]) => el("option", { value: k, text: r.label, selected: k === role ? "" : false })));
    sel.addEventListener("change", () => { store.set(ROLE_KEY, sel.value); location.reload(); });
    outboxBtn = el("button", { type: "button", class: "pbtn", onclick: showOutbox });
    refreshOutbox();
    const confirmRow = el("span", { class: "pconfirm", hidden: "" });
    const ask = (label, action) => () => {
      confirmRow.replaceChildren(el("span", { text: label + " " }),
        el("button", { type: "button", class: "pbtn strong", text: "Yes, do it", onclick: action }),
        el("button", { type: "button", class: "pbtn", text: "Cancel", onclick: () => { confirmRow.hidden = true; } }));
      confirmRow.hidden = false;
    };
    const wipe = withExamples => () => { store.del(KEY); for (const k of Object.keys(__mock.sheets)) delete __mock.sheets[k]; store.set("smoothPracticeSeed", withExamples ? "examples" : "empty"); location.reload(); };
    noteEl = el("span", { class: "pnote", role: "status" });
    const bar = el("div", { class: "practice-bar", role: "region", "aria-label": "Practice mode" },
      el("div", { class: "pinner" },
        el("p", {}, el("b", { text: "Practice mode. " }),
          "No password yet. Entries are saved in this browser only and aren't shared with anyone. Photos aren't kept."),
        el("div", { class: "prow" },
          el("label", { for: "practiceRole", text: "View as" }), sel, outboxBtn,
          el("button", { type: "button", class: "pbtn", text: "Start empty", onclick: ask("Remove everything, including the examples?", wipe(false)) }),
          el("button", { type: "button", class: "pbtn", text: "Reset examples", onclick: ask("Replace your entries with the example entries?", wipe(true)) }),
          el("a", { href: "../", class: "plink", text: "Back to smooth2009.org" })),
        confirmRow, noteEl));
    document.body.prepend(bar);
  }

  /* ---------- viewer for the emails, Drive folders, and Google Docs the portal creates ---------- */
  let dlg;
  function dialog(title, ...content) {
    if (!dlg) { dlg = el("dialog", { class: "pdialog", "aria-labelledby": "pdTitle" }); document.body.append(dlg); }
    dlg.replaceChildren(el("div", { class: "pdhead" }, el("h2", { id: "pdTitle", text: title }), el("button", { type: "button", class: "pbtn", text: "Close", onclick: () => dlg.close() })),
      el("div", { class: "pdbody" }, content));
    dlg.showModal();
  }
  function showOutbox() {
    const mails = __mock.mails.slice().reverse();
    dialog("Emails the portal sent",
      el("p", { class: "pmuted", text: "In practice mode nothing is actually emailed. These are the messages the live portal would send." }),
      mails.length ? mails.map(m => el("article", { class: "pmail" },
        el("p", {}, el("b", { text: m.subject })), el("p", { class: "pmuted", text: "To: " + m.to + (m.replyTo ? " · Reply to: " + m.replyTo : "") }),
        el("pre", { text: m.body || "" }))) : el("p", { text: "No emails yet." }));
  }
  function showFolder(id) {
    const f = __mock.drive[id]; if (!f || !f.folders) return dialog("Drive folder", el("p", { text: "This folder isn't in practice storage." }));
    const files = f.files.map(x => x.getName());
    dialog("Drive folder: " + f.name,
      el("p", { class: "pmuted", text: "The live portal keeps these files in Google Drive. Practice mode keeps only their names." }),
      files.length ? el("ul", {}, files.map(n => el("li", { text: n }))) : el("p", { text: "No files yet." }));
  }
  function showDoc(id) {
    const d = __mock.docs.find(x => x.getId() === id);
    if (!d) return dialog("Google Doc", el("p", { text: "This document isn't in practice storage." }));
    dialog(d.title, el("p", { class: "pmuted", text: "The live portal creates this as a Google Doc you can edit. Photos appear as placeholders here." }),
      el("div", { class: "pdoc" }, d.paras.map(p => p.text === "[image]" ? el("div", { class: "pphoto", text: "Event photo" })
        : el(p.heading === "TITLE" ? "h2" : p.heading === "HEADING2" ? "h3" : "p", { class: p.italic ? "pmuted" : "", text: p.text }))));
  }
  function showFile(id) {
    const f = __mock.drive[id];
    if (!f) return dialog("File", el("p", { text: "This file isn't in practice storage." }));
    dialog(f.getName(), f.blob && typeof f.blob.content === "string" ? el("pre", { class: "pcsv", text: f.blob.content }) : el("p", { text: "Practice mode keeps only this file's name." }));
  }
  document.addEventListener("click", e => {
    const a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    let m;
    if ((m = a.href.match(/drive\.google\.com\/drive\/folders\/([A-Za-z0-9]+)/))) { e.preventDefault(); showFolder(m[1]); }
    else if ((m = a.href.match(/docs\.google\.com\/document\/d\/([A-Za-z0-9]+)/))) { e.preventDefault(); showDoc(m[1]); }
    else if ((m = a.href.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9]+)/))) { e.preventDefault(); showFile(m[1]); }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildBar); else buildBar();
})();
