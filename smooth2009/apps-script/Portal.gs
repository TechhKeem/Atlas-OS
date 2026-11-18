/**
 * S.M.O.O.T.H. Portal — private back office for The Inc. and section officers.
 *
 * One of three files in the Apps Script project on the "SMOOTH Back Office" Google Sheet:
 *   Newsletter.gs  website newsletter sign-ups (doPost)
 *   Portal.gs      this file: sign-in, events, funds, members, rosters, newsletter drafts (doGet)
 *   Portal.html    the portal screens
 *
 * Who can do what (set on the "Access" tab of the Sheet; no code changes needed):
 *   role Inc      sees and manages every section, reviews events, decides funds, builds newsletters
 *   role Officer  works only on their own section: reports events, requests funds, adds members,
 *                 confirms the semester roster
 *
 * Sign-in: people enter their email and get a 6-digit code by email. Only active emails on the
 * Access tab get a code. Sessions last 6 hours. Removing someone from Access locks them out at once.
 *
 * Everything a visitor's browser sends is checked here. Functions whose names end in "_" can't be
 * called from the browser. setup() and installReminders() run only from the Apps Script editor.
 */

const PORTAL = {
  name: "S.M.O.O.T.H. Portal",
  notify: "Info@smooth2009.org",          // gets new event reports and funds requests
  rootFolderName: "SMOOTH Portal Files",  // Drive folder for photos, receipts, drafts, exports
  sessionSeconds: 6 * 60 * 60,            // CacheService allows 6 hours at most
  codeSeconds: 10 * 60,
  minPhotos: 5,
  maxPhotos: 20,
  maxUploadBytes: 10 * 1024 * 1024,
  rosterReminders: ["09-15", "02-01"]     // MM-DD each year; officers are reminded if their roster isn't in
};

/**
 * Constitutional amendments. Set these to match the amendment article of the constitution.
 *   voters      "Inc" = only The Inc. votes; "Inc and Officers" = The Inc. plus every active section officer
 *   passShare   share of Yes among Yes + No votes needed to pass (2/3 = two-thirds)
 *   quorum      share of eligible voters who must cast a ballot (abstaining counts as voting)
 *   voteDays    how long a vote stays open once The Inc. opens it
 *   showRunningTotals  false keeps the count hidden until the vote closes
 */
const AMENDMENTS = {
  voters: "Inc and Officers",
  passShare: 2 / 3,
  quorum: 1 / 2,
  voteDays: 14,
  showRunningTotals: false
};

const SECTIONS = { MSU: "Morgan State", CSU: "Coppin State", TU: "Temple" };
const EVENT_TYPES = ["SMOOTH Week", "R.U.L.E.S. Symposium", "Jr. SMOOTH", "Community service", "Social",
                     "Professional development", "Fundraiser", "Other"];
const MEMBER_STATUSES = ["Active", "Alumni", "Inactive"];

const SCHEMA = {
  Access:  ["email", "name", "role", "section", "active", "notes"],
  Events:  ["event_id", "section", "term", "event_date", "title", "event_type", "location", "description",
            "attendees", "service_hours", "newsletter_summary", "minors_in_photos", "parent_consent",
            "photo_count", "photo_folder", "status", "inc_notes", "newsletter_issue",
            "submitted_by", "submitted_at", "updated_at"],
  Funds:   ["request_id", "section", "term", "purpose", "event_name", "amount", "needed_by", "payee",
            "breakdown", "file_count", "file_folder", "status", "approved_amount", "inc_notes",
            "decided_by", "decided_at", "paid_date", "submitted_by", "submitted_at"],
  Members: ["member_id", "first_name", "last_name", "email", "phone", "section", "status", "position",
            "year_joined", "term_joined", "grad_year", "city", "state", "occupation", "linkedin",
            "help_with", "dues_status", "last_dues_paid", "newsletter_opt_in", "review_flag", "notes",
            "source", "added_by", "last_updated"],
  Rosters: ["term", "section", "member_id", "name", "standing", "position", "confirmed_by", "confirmed_at"],
  Amendments: ["amendment_id", "title", "article", "current_text", "proposed_text", "rationale", "status",
               "proposed_by", "proposed_at", "vote_opens", "vote_closes", "eligible", "yes", "no", "abstain",
               "result", "decided_at"],
  Ballots: ["amendment_id", "voter", "choice", "cast_at"],
  Log:     ["at", "user", "action", "detail"]
};

/* ============================== Web app ============================== */

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Portal")
    .setTitle(PORTAL.name)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

/* ============================== Sign-in ============================== */

function requestCode(email) {
  email = normEmail_(email);
  if (!email) throw new Error("Enter a valid email address.");
  const generic = { ok: true, message: "If that email is on The Inc.'s access list, a 6-digit code is on its way. It works for 10 minutes." };
  const cache = CacheService.getScriptCache();
  if (cache.get("cd:" + email)) return generic;          // one code a minute per email
  cache.put("cd:" + email, "1", 60);
  const user = accessFor_(email);
  if (!user) { log_(email, "sign-in refused", "not on Access list"); return generic; }
  const code = randomCode_();
  cache.put("code:" + email, JSON.stringify({ h: hash_(code), tries: 0 }), PORTAL.codeSeconds);
  MailApp.sendEmail({
    to: email,
    subject: "Your " + PORTAL.name + " code: " + code,
    body: "Your sign-in code is " + code + ". It works for 10 minutes.\n\n" +
          "If you didn't ask for this, you can ignore this email.\n\n" +
          "Strong Men Overcoming Obstacles Through Hard-work Inc."
  });
  return generic;
}

function verifyCode(email, code) {
  email = normEmail_(email);
  code = String(code || "").replace(/\D/g, "");
  const cache = CacheService.getScriptCache();
  const raw = email && cache.get("code:" + email);
  if (!raw) throw new Error("That code has expired. Request a new one.");
  const rec = JSON.parse(raw);
  if (rec.h !== hash_(code)) {
    rec.tries++;
    if (rec.tries >= 5) { cache.remove("code:" + email); throw new Error("Too many tries. Request a new code."); }
    cache.put("code:" + email, JSON.stringify(rec), PORTAL.codeSeconds);
    throw new Error("That code doesn't match. Check the email and try again.");
  }
  cache.remove("code:" + email);
  const user = accessFor_(email);
  if (!user) throw new Error("This email no longer has portal access.");
  const token = Utilities.getUuid() + Utilities.getUuid();
  cache.put("s:" + token, email, PORTAL.sessionSeconds);
  log_(email, "signed in", "");
  return { token: token, boot: boot_(user) };
}

function signOut(token) {
  CacheService.getScriptCache().remove("s:" + String(token || ""));
  return { ok: true };
}

/** Everything the screens need after sign-in. */
function whoami(token) {
  return boot_(session_(token));
}

function boot_(user) {
  return {
    user: { email: user.email, name: user.name, role: user.role, section: user.section,
            sectionName: SECTIONS[user.section] || "All sections" },
    sections: SECTIONS,
    eventTypes: EVENT_TYPES,
    memberStatuses: MEMBER_STATUSES,
    currentTerm: currentTerm_(),
    terms: knownTerms_(),
    minPhotos: PORTAL.minPhotos,
    maxPhotos: PORTAL.maxPhotos
  };
}

/* ============================== Dashboard ============================== */

function getDashboard(token, term) {
  const user = session_(token);
  term = validTerm_(term) || currentTerm_();
  const secs = user.role === "Inc" ? Object.keys(SECTIONS) : [user.section];
  const events = rows_("Events").filter(function (e) { return e.status === "Submitted" || e.status === "Reviewed"; });
  const funds = rows_("Funds").filter(function (f) { return f.status && f.status !== "Draft"; });
  const rosters = rows_("Rosters");
  const members = rows_("Members");

  function stats(sec, t) {
    const ev = events.filter(function (e) { return e.section === sec && (!t || e.term === t); });
    const fu = funds.filter(function (f) { return f.section === sec && (!t || f.term === t); });
    const ro = rosters.filter(function (r) { return r.section === sec && (!t || r.term === t); });
    return {
      section: sec, name: SECTIONS[sec],
      roster: ro.length,
      newMembers: ro.filter(function (r) { return r.standing === "New"; }).length,
      events: ev.length,
      attendees: sum_(ev, "attendees"),
      serviceHours: sum_(ev, "service_hours"),
      fundsRequested: sum_(fu, "amount"),
      fundsApproved: sum_(fu.filter(function (f) { return f.status === "Approved" || f.status === "Paid"; }), "approved_amount"),
      fundsPaid: sum_(fu.filter(function (f) { return f.status === "Paid"; }), "approved_amount"),
      fundsPending: fu.filter(function (f) { return f.status === "Pending"; }).length,
      activeMembers: members.filter(function (m) { return m.section === sec && m.status === "Active"; }).length,
      alumni: members.filter(function (m) { return m.section === sec && m.status === "Alumni"; }).length
    };
  }
  const bySection = secs.map(function (s) { return stats(s, term); });
  const total = {};
  ["roster", "newMembers", "events", "attendees", "serviceHours", "fundsRequested", "fundsApproved",
   "fundsPaid", "fundsPending", "activeMembers", "alumni"].forEach(function (k) {
    total[k] = bySection.reduce(function (a, s) { return a + s[k]; }, 0);
  });

  // Attendance and roster size over time, oldest term first
  const terms = knownTerms_().slice().reverse();
  const trend = terms.map(function (t) {
    const row = { term: t };
    secs.forEach(function (s) {
      row[s] = sum_(events.filter(function (e) { return e.section === s && e.term === t; }), "attendees");
      row[s + "_roster"] = rosters.filter(function (r) { return r.section === s && r.term === t; }).length;
    });
    return row;
  });

  const todo = [];
  if (user.role === "Inc") {
    const toReview = events.filter(function (e) { return e.status === "Submitted"; }).length;
    if (toReview) todo.push(toReview + " event report" + (toReview > 1 ? "s" : "") + " to review");
    if (total.fundsPending) todo.push(total.fundsPending + " funds request" + (total.fundsPending > 1 ? "s" : "") + " waiting for a decision");
    const flagged = members.filter(function (m) { return m.review_flag; }).length;
    if (flagged) todo.push(flagged + " possible duplicate member" + (flagged > 1 ? "s" : "") + " to check");
  }
  secs.forEach(function (s) {
    if (!rosters.some(function (r) { return r.section === s && r.term === currentTerm_() && r.standing === "Returning"; })) {
      todo.push(SECTIONS[s] + ": " + currentTerm_() + " roster not confirmed yet");
    }
  });
  return { term: term, sections: bySection, total: total, trend: trend, todo: todo };
}

/* ============================== Event reports ============================== */

function listEvents(token, filter) {
  const user = session_(token);
  filter = filter || {};
  return rows_("Events")
    .filter(function (e) { return canSee_(user, e.section) && (!filter.term || e.term === filter.term) &&
                                  (!filter.section || e.section === filter.section) && e.event_id; })
    .sort(function (a, b) { return String(b.event_date).localeCompare(String(a.event_date)); })
    .map(function (e) {
      const o = pick_(e, SCHEMA.Events);
      if (user.role !== "Inc") delete o.photo_folder; // officers don't get Drive links
      o.mine = e.submitted_by === user.email;
      return o;
    });
}

function createEvent(token, f) {
  const user = session_(token);
  f = f || {};
  const section = sectionFor_(user, f.section);
  const date = dateStr_(f.event_date, "Event date", true);
  if (date > today_()) throw new Error("The event date can't be in the future. Report events after they happen.");
  const ev = {
    section: section,
    term: termOf_(date),
    event_date: date,
    title: text_(f.title, "Title", 120, true),
    event_type: oneOf_(f.event_type, EVENT_TYPES, "Event type", true),
    location: text_(f.location, "Location", 160, false),
    description: text_(f.description, "Description", 4000, true),
    attendees: int_(f.attendees, "Number of attendees", 0, 100000, true),
    service_hours: num_(f.service_hours, "Service hours", 0, 100000, false),
    newsletter_summary: text_(f.newsletter_summary, "Newsletter summary", 800, true),
    minors_in_photos: oneOf_(f.minors_in_photos, ["Yes", "No"], "Are there minors in the photos", true),
    parent_consent: oneOf_(f.parent_consent, ["Yes", "No", ""], "Parent consent", false),
    photo_count: 0,
    status: "Uploading",
    submitted_by: user.email,
    submitted_at: new Date(),
    updated_at: new Date()
  };
  if (ev.minors_in_photos === "Yes" && ev.parent_consent !== "Yes") {
    throw new Error("Photos of minors need written parent consent on file. Leave those photos out, or get consent first.");
  }
  const lock = lock_();
  try {
    ev.event_id = nextId_("Events", "event_id", "E-", 4);
    const folder = folderPath_(["Events", SECTIONS[section], ev.term, ev.event_date + " " + safeName_(ev.title) + " (" + ev.event_id + ")"]);
    ev.photo_folder = folder.getUrl();
    append_("Events", ev);
  } finally { lock.releaseLock(); }
  log_(user.email, "event started", ev.event_id + " " + ev.title);
  return { event_id: ev.event_id };
}

function uploadEventPhoto(token, eventId, file) {
  const user = session_(token);
  const ev = findOne_("Events", "event_id", eventId);
  if (!ev || !canSee_(user, ev.section)) throw new Error("That event report wasn't found.");
  if (["Uploading", "Incomplete", "Needs changes"].indexOf(ev.status) === -1) throw new Error("This report is already submitted.");
  if (Number(ev.photo_count) >= PORTAL.maxPhotos) throw new Error("That's the most photos one report can hold (" + PORTAL.maxPhotos + ").");
  const blob = blob_(file, /^image\/(jpeg|png|webp|heic|heif|gif)$/, "photo");
  const lock = lock_();
  try {
    const fresh = findOne_("Events", "event_id", eventId);
    const n = Number(fresh.photo_count || 0) + 1;
    blob.setName(eventId + "-" + ("0" + n).slice(-2) + extFor_(blob.getContentType()));
    folderFromUrl_(fresh.photo_folder).createFile(blob);
    update_("Events", fresh._row, { photo_count: n, updated_at: new Date() });
    return { photo_count: n };
  } finally { lock.releaseLock(); }
}

function finishEvent(token, eventId) {
  const user = session_(token);
  const ev = findOne_("Events", "event_id", eventId);
  if (!ev || !canSee_(user, ev.section)) throw new Error("That event report wasn't found.");
  const n = Number(ev.photo_count || 0);
  if (n < PORTAL.minPhotos) {
    update_("Events", ev._row, { status: "Incomplete", updated_at: new Date() });
    return { ok: false, status: "Incomplete", message: "Saved, but it has " + n + " of the " + PORTAL.minPhotos + " photos needed. Add more photos to finish it." };
  }
  update_("Events", ev._row, { status: "Submitted", updated_at: new Date() });
  notify_(PORTAL.notify, "Event report: " + SECTIONS[ev.section] + ", " + ev.title,
    SECTIONS[ev.section] + " reported \"" + ev.title + "\" on " + ser_(ev.event_date) + ".\n" +
    "Attendees: " + ev.attendees + "\nPhotos: " + n + "\n\nSummary for the newsletter:\n" + ev.newsletter_summary +
    "\n\nReview it in the portal under Events.");
  log_(user.email, "event submitted", ev.event_id);
  return { ok: true, status: "Submitted", message: "Event report submitted. The Inc. will review it." };
}

function reviewEvent(token, eventId, status, note) {
  const user = incOnly_(session_(token));
  const ev = findOne_("Events", "event_id", eventId);
  if (!ev) throw new Error("That event report wasn't found.");
  status = oneOf_(status, ["Reviewed", "Needs changes"], "Review result", true);
  note = text_(note, "Note", 1000, status === "Needs changes");
  update_("Events", ev._row, { status: status, inc_notes: note, updated_at: new Date() });
  if (status === "Needs changes") {
    notify_(ev.submitted_by, "Changes needed: " + ev.title,
      "The Inc. reviewed your report for \"" + ev.title + "\" and asked for changes:\n\n" + note +
      "\n\nSign in to the portal to add photos, or reply to The Inc. at " + PORTAL.notify + ".");
  }
  log_(user.email, "event " + status.toLowerCase(), ev.event_id);
  return { ok: true };
}

/* ============================== Funds requests ============================== */

function listFunds(token, filter) {
  const user = session_(token);
  filter = filter || {};
  return rows_("Funds")
    .filter(function (r) { return r.request_id && r.status !== "Draft" && canSee_(user, r.section) &&
                                  (!filter.term || r.term === filter.term) && (!filter.section || r.section === filter.section); })
    .sort(function (a, b) { return String(b.submitted_at).localeCompare(String(a.submitted_at)); })
    .map(function (r) {
      const o = pick_(r, SCHEMA.Funds);
      if (user.role !== "Inc") delete o.file_folder;
      return o;
    });
}

function createFundsRequest(token, f) {
  const user = session_(token);
  f = f || {};
  const section = sectionFor_(user, f.section);
  const needed = dateStr_(f.needed_by, "Date needed", true);
  const req = {
    section: section,
    term: termOf_(today_()),
    purpose: text_(f.purpose, "What the money is for", 160, true),
    event_name: text_(f.event_name, "Event", 160, false),
    amount: money_(f.amount, "Amount", true),
    needed_by: needed,
    payee: text_(f.payee, "Who gets paid", 160, true),
    breakdown: text_(f.breakdown, "Cost breakdown", 3000, true),
    file_count: 0,
    status: "Draft",
    submitted_by: user.email,
    submitted_at: new Date()
  };
  const lock = lock_();
  try {
    req.request_id = nextId_("Funds", "request_id", "F-", 4);
    req.file_folder = folderPath_(["Funds", SECTIONS[section], req.term, req.request_id + " " + safeName_(req.purpose)]).getUrl();
    append_("Funds", req);
  } finally { lock.releaseLock(); }
  return { request_id: req.request_id };
}

function uploadFundsFile(token, requestId, file) {
  const user = session_(token);
  const r = findOne_("Funds", "request_id", requestId);
  if (!r || !canSee_(user, r.section)) throw new Error("That funds request wasn't found.");
  if (r.status !== "Draft") throw new Error("Files can only be added before the request is sent.");
  if (Number(r.file_count) >= 10) throw new Error("A request can hold 10 files at most.");
  const blob = blob_(file, /^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/, "quote or receipt");
  const lock = lock_();
  try {
    const fresh = findOne_("Funds", "request_id", requestId);
    const n = Number(fresh.file_count || 0) + 1;
    blob.setName(requestId + "-" + n + extFor_(blob.getContentType()));
    folderFromUrl_(fresh.file_folder).createFile(blob);
    update_("Funds", fresh._row, { file_count: n });
    return { file_count: n };
  } finally { lock.releaseLock(); }
}

function submitFundsRequest(token, requestId) {
  const user = session_(token);
  const r = findOne_("Funds", "request_id", requestId);
  if (!r || !canSee_(user, r.section)) throw new Error("That funds request wasn't found.");
  if (r.status !== "Draft") return { ok: true };
  update_("Funds", r._row, { status: "Pending", submitted_at: new Date() });
  notify_(PORTAL.notify, "Funds request: " + SECTIONS[r.section] + ", " + money_fmt_(r.amount),
    SECTIONS[r.section] + " requested " + money_fmt_(r.amount) + " for " + r.purpose + ".\n" +
    "Needed by: " + ser_(r.needed_by) + "\nPay to: " + r.payee + "\n\nBreakdown:\n" + r.breakdown +
    "\n\nApprove or deny it in the portal under Funds.");
  log_(user.email, "funds requested", r.request_id + " " + r.amount);
  return { ok: true };
}

function decideFunds(token, requestId, d) {
  const user = incOnly_(session_(token));
  d = d || {};
  const r = findOne_("Funds", "request_id", requestId);
  if (!r) throw new Error("That funds request wasn't found.");
  const status = oneOf_(d.status, ["Approved", "Denied", "Paid"], "Decision", true);
  const upd = { status: status, decided_by: user.email, decided_at: new Date(), inc_notes: text_(d.note, "Note", 1000, status === "Denied") };
  if (status === "Approved") upd.approved_amount = money_(d.approved_amount === undefined || d.approved_amount === "" ? r.amount : d.approved_amount, "Approved amount", true);
  if (status === "Paid") {
    if (r.status !== "Approved" && r.status !== "Paid") throw new Error("Approve the request before marking it paid.");
    upd.paid_date = dateStr_(d.paid_date || today_(), "Date paid", true);
    upd.approved_amount = r.approved_amount;
  }
  if (status === "Denied") upd.approved_amount = 0;
  update_("Funds", r._row, upd);
  const msg = status === "Approved" ? "was approved for " + money_fmt_(upd.approved_amount) + "."
            : status === "Paid" ? "has been paid (" + money_fmt_(upd.approved_amount) + ")."
            : "was not approved.";
  notify_(r.submitted_by, "Funds request " + status.toLowerCase() + ": " + r.purpose,
    "Your request for " + r.purpose + " (" + money_fmt_(r.amount) + ") " + msg +
    (upd.inc_notes ? "\n\nNote from The Inc.:\n" + upd.inc_notes : "") + "\n\nQuestions: " + PORTAL.notify);
  log_(user.email, "funds " + status.toLowerCase(), r.request_id);
  return { ok: true };
}

/* ============================== Members and rosters ============================== */

function listMembers(token, filter) {
  const user = session_(token);
  filter = filter || {};
  const q = String(filter.q || "").toLowerCase().trim();
  const onTerm = filter.term ? rows_("Rosters").filter(function (r) { return r.term === filter.term; })
                                 .map(function (r) { return r.member_id; }) : null;
  return rows_("Members")
    .filter(function (m) {
      if (!m.member_id || !canSee_(user, m.section)) return false;
      if (filter.section && m.section !== filter.section) return false;
      if (filter.status && m.status !== filter.status) return false;
      if (onTerm && onTerm.indexOf(m.member_id) === -1) return false;
      if (q && (m.first_name + " " + m.last_name + " " + m.email + " " + m.position).toLowerCase().indexOf(q) === -1) return false;
      return true;
    })
    .sort(function (a, b) { return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name); })
    .map(function (m) { return pick_(m, SCHEMA.Members); });
}

function addMember(token, m) {
  const user = session_(token);
  m = m || {};
  const section = sectionFor_(user, m.section);
  const rec = {
    first_name: text_(m.first_name, "First name", 60, true),
    last_name: text_(m.last_name, "Last name", 60, true),
    email: normEmail_(m.email) || bad_("Enter a valid email address."),
    phone: phone_(m.phone, true),
    section: section,
    status: "Active",
    position: text_(m.position, "Position", 80, false),
    grad_year: int_(m.grad_year, "Expected graduation year", 2009, new Date().getFullYear() + 8, false),
    year_joined: new Date().getFullYear(),
    term_joined: currentTerm_(),
    source: "Portal",
    added_by: user.email,
    last_updated: new Date()
  };
  const lock = lock_();
  try {
    const all = rows_("Members");
    const byEmail = all.filter(function (x) { return String(x.email).toLowerCase() === rec.email; })[0];
    if (byEmail) {
      throw new Error(rec.email + " is already in the directory as " + byEmail.first_name + " " + byEmail.last_name +
        " (" + (SECTIONS[byEmail.section] || byEmail.section) + "). If he's joining your section, ask The Inc. to move him.");
    }
    const digits = rec.phone.replace(/\D/g, "").slice(-10);
    const similar = all.filter(function (x) {
      return (digits && String(x.phone).replace(/\D/g, "").slice(-10) === digits) ||
             (String(x.first_name).toLowerCase() === rec.first_name.toLowerCase() &&
              String(x.last_name).toLowerCase() === rec.last_name.toLowerCase());
    });
    if (similar.length) rec.review_flag = "Possible duplicate of " + similar.map(function (x) { return x.member_id; }).join(", ");
    rec.member_id = nextId_("Members", "member_id", "M-", 5);
    append_("Members", rec);
    append_("Rosters", { term: rec.term_joined, section: section, member_id: rec.member_id,
                         name: rec.first_name + " " + rec.last_name, standing: "New", position: rec.position,
                         confirmed_by: user.email, confirmed_at: new Date() });
  } finally { lock.releaseLock(); }
  log_(user.email, "member added", rec.member_id + " " + rec.first_name + " " + rec.last_name);
  return { member_id: rec.member_id, flagged: !!rec.review_flag,
           message: rec.first_name + " " + rec.last_name + " was added to " + SECTIONS[section] + "'s " + rec.term_joined + " roster." +
                    (rec.review_flag ? " The Inc. will double-check him: someone with the same name or phone is already in the directory." : "") };
}

/** Inc only: change a member's details. */
function updateMember(token, memberId, f) {
  const user = incOnly_(session_(token));
  f = f || {};
  const m = findOne_("Members", "member_id", memberId);
  if (!m) throw new Error("That member wasn't found.");
  const upd = { last_updated: new Date() };
  if ("first_name" in f) upd.first_name = text_(f.first_name, "First name", 60, true);
  if ("last_name" in f) upd.last_name = text_(f.last_name, "Last name", 60, true);
  if ("email" in f) upd.email = normEmail_(f.email) || bad_("Enter a valid email address.");
  if ("phone" in f) upd.phone = phone_(f.phone, false);
  if ("section" in f) upd.section = oneOf_(f.section, Object.keys(SECTIONS), "Section", true);
  if ("status" in f) upd.status = oneOf_(f.status, MEMBER_STATUSES, "Status", true);
  if ("position" in f) upd.position = text_(f.position, "Position", 80, false);
  if ("grad_year" in f) upd.grad_year = int_(f.grad_year, "Graduation year", 2009, new Date().getFullYear() + 8, false);
  if ("notes" in f) upd.notes = text_(f.notes, "Notes", 2000, false);
  if ("review_flag" in f) upd.review_flag = text_(f.review_flag, "Review flag", 200, false);
  update_("Members", m._row, upd);
  log_(user.email, "member updated", memberId + " " + Object.keys(upd).join(","));
  return { ok: true };
}

/** The roster screen: active brothers in a section and whether each is on this term's roster. */
function getRoster(token, section, term) {
  const user = session_(token);
  section = sectionFor_(user, section);
  term = validTerm_(term) || currentTerm_();
  const roster = rows_("Rosters").filter(function (r) { return r.section === section; });
  const thisTerm = {};
  roster.filter(function (r) { return r.term === term; }).forEach(function (r) { thisTerm[r.member_id] = r; });
  const people = rows_("Members")
    .filter(function (m) { return m.section === section && m.member_id && (m.status === "Active" || thisTerm[m.member_id]); })
    .sort(function (a, b) { return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name); })
    .map(function (m) {
      const r = thisTerm[m.member_id];
      return { member_id: m.member_id, name: m.first_name + " " + m.last_name, email: m.email, phone: m.phone,
               position: (r && r.position) || m.position || "", standing: r ? r.standing : "", grad_year: m.grad_year };
    });
  return { section: section, term: term, people: people,
           confirmed: roster.some(function (r) { return r.term === term && r.standing === "Returning"; }) };
}

/** Officers tick who is back this semester. New members are added with addMember instead. */
function confirmRoster(token, section, term, entries) {
  const user = session_(token);
  section = sectionFor_(user, section);
  term = validTerm_(term) || currentTerm_();
  if (!Array.isArray(entries)) throw new Error("Nothing to save.");
  const lock = lock_();
  let added = 0, updated = 0;
  try {
    const members = {};
    rows_("Members").forEach(function (m) { if (m.section === section) members[m.member_id] = m; });
    const existing = {};
    rows_("Rosters").forEach(function (r) { if (r.term === term && r.section === section) existing[r.member_id] = r; });
    entries.slice(0, 500).forEach(function (e) {
      const m = members[String(e.member_id)];
      if (!m) return;
      const pos = text_(e.position, "Position", 80, false);
      const r = existing[m.member_id];
      if (e.returning && !r) {
        append_("Rosters", { term: term, section: section, member_id: m.member_id, name: m.first_name + " " + m.last_name,
                             standing: "Returning", position: pos, confirmed_by: user.email, confirmed_at: new Date() });
        added++;
      } else if (r && pos !== String(r.position || "")) {
        update_("Rosters", r._row, { position: pos, confirmed_by: user.email, confirmed_at: new Date() }); updated++;
      }
      if (pos !== String(m.position || "")) update_("Members", m._row, { position: pos, last_updated: new Date() });
    });
  } finally { lock.releaseLock(); }
  log_(user.email, "roster confirmed", section + " " + term + " +" + added);
  return { ok: true, message: SECTIONS[section] + " " + term + " roster saved: " + added + " returning brother" + (added === 1 ? "" : "s") + " added" + (updated ? ", " + updated + " position" + (updated === 1 ? "" : "s") + " updated" : "") + "." };
}

/** Inc only: write the filtered member list to a CSV file in Drive and return its link. */
function exportMembers(token, filter) {
  const user = incOnly_(session_(token));
  const list = listMembers(token, filter);
  const cols = SCHEMA.Members;
  const esc = function (v) { v = String(v === undefined || v === null ? "" : v); v = /^[=+\-@\t\r]/.test(v) ? "'" + v : v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const csv = [cols.join(",")].concat(list.map(function (m) { return cols.map(function (c) { return esc(m[c]); }).join(","); })).join("\n");
  const name = "Members " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm") + ".csv";
  const file = folderPath_(["Exports"]).createFile(name, csv, MimeType.CSV);
  log_(user.email, "members exported", list.length + " rows");
  return { url: file.getUrl(), name: name, rows: list.length };
}

/* ============================== Newsletter ============================== */

/** Inc only: reviewed event reports with a newsletter summary, newest first. */
function newsletterCandidates(token, term) {
  incOnly_(session_(token));
  return rows_("Events")
    .filter(function (e) { return e.status === "Reviewed" && e.newsletter_summary && (!term || e.term === term); })
    .sort(function (a, b) { return String(b.event_date).localeCompare(String(a.event_date)); })
    .map(function (e) { return pick_(e, ["event_id", "section", "term", "event_date", "title", "event_type", "attendees", "newsletter_summary", "newsletter_issue", "photo_count"]); });
}

/** Inc only: build a Google Doc draft from chosen event summaries, one photo each. */
function createNewsletterDraft(token, issueTitle, eventIds) {
  const user = incOnly_(session_(token));
  issueTitle = text_(issueTitle, "Issue title", 100, true);
  if (!Array.isArray(eventIds) || !eventIds.length) throw new Error("Choose at least one event.");
  const events = rows_("Events").filter(function (e) { return eventIds.indexOf(e.event_id) !== -1 && e.status === "Reviewed"; })
    .sort(function (a, b) { return String(a.event_date).localeCompare(String(b.event_date)); });
  if (!events.length) throw new Error("None of those events are reviewed yet.");

  const doc = DocumentApp.create("Newsletter draft: " + issueTitle);
  const body = doc.getBody();
  body.appendParagraph("S.M.O.O.T.H. Inc.").setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  body.appendParagraph(issueTitle).setHeading(DocumentApp.ParagraphHeading.TITLE);
  body.appendParagraph("In every obstacle lies equal opportunity.").setItalic(true);
  events.forEach(function (e) {
    body.appendParagraph(e.title).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(SECTIONS[e.section] + " · " + ser_(e.event_date) + " · " + e.attendees + " attendees").setItalic(true);
    try {
      const files = folderFromUrl_(e.photo_folder).getFiles();
      if (files.hasNext()) {
        const img = body.appendImage(files.next().getBlob());
        const w = img.getWidth(), h = img.getHeight(), target = 460;
        if (w > target) img.setWidth(target).setHeight(Math.round(h * target / w));
      }
    } catch (err) { console.warn("photo skipped for " + e.event_id + ": " + err); }
    body.appendParagraph(String(e.newsletter_summary));
  });
  body.appendParagraph("Strong Men Overcoming Obstacles Through Hard-work Inc. · A 501(c)(3) nonprofit · smooth2009.org").setItalic(true);
  doc.saveAndClose();
  const file = DriveApp.getFileById(doc.getId());
  file.moveTo(folderPath_(["Newsletter drafts"]));
  events.forEach(function (e) { update_("Events", e._row, { newsletter_issue: issueTitle }); });
  log_(user.email, "newsletter draft", issueTitle + " (" + events.length + " events)");
  return { url: doc.getUrl(), count: events.length };
}

/* ============================== Constitutional amendments ============================== */

/** Everyone signed in can see amendments. Totals show once a vote closes (or live, if configured). */
function listAmendments(token) {
  const user = session_(token);
  closeExpiredVotes_();
  const ballots = rows_("Ballots");
  return rows_("Amendments").filter(function (a) { return a.amendment_id; })
    .sort(function (a, b) { return String(b.amendment_id).localeCompare(String(a.amendment_id)); })
    .map(function (a) {
      const o = pick_(a, SCHEMA.Amendments);
      const mine = ballots.filter(function (b) { return b.amendment_id === a.amendment_id && normEmail_(b.voter) === user.email; })[0];
      o.my_vote = mine ? mine.choice : "";
      o.can_vote = a.status === "Voting" && !mine && canVote_(user);
      const cast = ballots.filter(function (b) { return b.amendment_id === a.amendment_id; }).length;
      o.turnout = cast;
      if (a.status === "Voting" && !AMENDMENTS.showRunningTotals) { o.yes = ""; o.no = ""; o.abstain = ""; }
      return o;
    });
}

function proposeAmendment(token, f) {
  const user = session_(token);
  f = f || {};
  const a = {
    title: text_(f.title, "Title", 140, true),
    article: text_(f.article, "Article and section", 120, true),
    current_text: text_(f.current_text, "Current wording", 6000, false),
    proposed_text: text_(f.proposed_text, "Proposed wording", 6000, true),
    rationale: text_(f.rationale, "Reason for the change", 3000, true),
    status: "Proposed",
    proposed_by: user.email,
    proposed_at: new Date()
  };
  const lock = lock_();
  try {
    a.amendment_id = nextId_("Amendments", "amendment_id", "A-", 3);
    append_("Amendments", a);
  } finally { lock.releaseLock(); }
  notify_(PORTAL.notify, "Amendment proposed: " + a.title,
    (user.name || user.email) + " proposed an amendment to " + a.article + ".\n\nProposed wording:\n" + a.proposed_text +
    "\n\nReason:\n" + a.rationale + "\n\nOpen the vote from the portal under Amendments when it's ready.");
  log_(user.email, "amendment proposed", a.amendment_id + " " + a.title);
  return { amendment_id: a.amendment_id };
}

/** Inc only: open voting. Eligible voters are counted now, so later Access changes don't move the quorum. */
function openVote(token, amendmentId) {
  const user = incOnly_(session_(token));
  const a = findOne_("Amendments", "amendment_id", amendmentId);
  if (!a) throw new Error("That amendment wasn't found.");
  if (a.status !== "Proposed") throw new Error("Only a proposed amendment can be opened for a vote.");
  const voters = eligibleVoters_();
  if (!voters.length) throw new Error("No one is eligible to vote. Check the Access tab.");
  const opens = new Date(), closes = new Date(opens.getTime() + AMENDMENTS.voteDays * 86400000);
  update_("Amendments", a._row, { status: "Voting", vote_opens: opens, vote_closes: closes, eligible: voters.length });
  voters.forEach(function (v) {
    notify_(v, "Vote open: " + a.title,
      "The Inc. opened a vote on a proposed amendment to " + a.article + ".\n\nProposed wording:\n" + a.proposed_text +
      "\n\nReason:\n" + a.rationale + "\n\nSign in to the portal under Amendments to vote. Voting closes " + ser_(closes) + ".");
  });
  log_(user.email, "vote opened", a.amendment_id + " eligible " + voters.length);
  return { ok: true, closes: ser_(closes), eligible: voters.length };
}

function castVote(token, amendmentId, choice) {
  const user = session_(token);
  choice = oneOf_(choice, ["Yes", "No", "Abstain"], "Your vote", true);
  closeExpiredVotes_();
  const lock = lock_();
  try {
    const a = findOne_("Amendments", "amendment_id", amendmentId);
    if (!a || a.status !== "Voting") throw new Error("Voting isn't open on this amendment.");
    if (!canVote_(user)) throw new Error("You aren't eligible to vote on amendments.");
    if (rows_("Ballots").some(function (b) { return b.amendment_id === a.amendment_id && normEmail_(b.voter) === user.email; })) {
      throw new Error("You've already voted on this amendment.");
    }
    append_("Ballots", { amendment_id: a.amendment_id, voter: user.email, choice: choice, cast_at: new Date() });
  } finally { lock.releaseLock(); }
  log_(user.email, "voted", amendmentId);
  return { ok: true, message: "Your vote is recorded. Votes can't be changed once cast." };
}

/** Inc only: close a vote early (for example, after everyone has voted). */
function closeVote(token, amendmentId) {
  const user = incOnly_(session_(token));
  const a = findOne_("Amendments", "amendment_id", amendmentId);
  if (!a || a.status !== "Voting") throw new Error("Voting isn't open on this amendment.");
  const r = tallyAndClose_(a);
  log_(user.email, "vote closed", amendmentId + " " + r.status);
  return r;
}

/** Inc, or the person who proposed it, can withdraw an amendment before voting opens. */
function withdrawAmendment(token, amendmentId) {
  const user = session_(token);
  const a = findOne_("Amendments", "amendment_id", amendmentId);
  if (!a) throw new Error("That amendment wasn't found.");
  if (user.role !== "Inc" && normEmail_(a.proposed_by) !== user.email) throw new Error("Only The Inc. or the person who proposed it can withdraw it.");
  if (a.status !== "Proposed") throw new Error("An amendment can only be withdrawn before voting opens.");
  update_("Amendments", a._row, { status: "Withdrawn", decided_at: new Date() });
  log_(user.email, "amendment withdrawn", amendmentId);
  return { ok: true };
}

function canVote_(user) {
  return user.role === "Inc" || AMENDMENTS.voters === "Inc and Officers";
}

function eligibleVoters_() {
  return rows_("Access").map(function (r) { return accessFor_(r.email); })
    .filter(function (u) { return u && canVote_(u); })
    .map(function (u) { return u.email; })
    .filter(function (e, i, all) { return all.indexOf(e) === i; });
}

function closeExpiredVotes_() {
  const now = new Date();
  rows_("Amendments").forEach(function (a) {
    if (a.status === "Voting" && a.vote_closes instanceof Date && a.vote_closes <= now) tallyAndClose_(a);
  });
}

function tallyAndClose_(a) {
  const b = rows_("Ballots").filter(function (x) { return x.amendment_id === a.amendment_id; });
  const yes = b.filter(function (x) { return x.choice === "Yes"; }).length;
  const no = b.filter(function (x) { return x.choice === "No"; }).length;
  const abstain = b.filter(function (x) { return x.choice === "Abstain"; }).length;
  const eligible = Number(a.eligible) || b.length;
  const quorumMet = b.length >= Math.ceil(eligible * AMENDMENTS.quorum);
  const passed = quorumMet && (yes + no) > 0 && yes / (yes + no) >= AMENDMENTS.passShare - 1e-9;
  const status = passed ? "Passed" : "Failed";
  const result = yes + " yes, " + no + " no, " + abstain + " abstain of " + eligible + " eligible. " +
    (quorumMet ? "" : "Quorum not met (" + Math.ceil(eligible * AMENDMENTS.quorum) + " ballots needed). ") +
    (passed ? "Passed." : "Did not pass.");
  update_("Amendments", a._row, { status: status, yes: yes, no: no, abstain: abstain, result: result, decided_at: new Date() });
  eligibleVoters_().concat([PORTAL.notify]).forEach(function (v) {
    notify_(v, "Amendment " + status.toLowerCase() + ": " + a.title, "The vote on the amendment to " + a.article + " has closed.\n\n" + result);
  });
  return { ok: true, status: status, result: result };
}

/* ============================== Editor-only setup ============================== */

/** Run once from the editor: creates every tab, makes you an Inc admin, and creates the Drive folder. */
function setup() {
  editorOnly_();
  Object.keys(SCHEMA).forEach(function (name) { tab_(name); });
  const owner = Session.getEffectiveUser().getEmail();
  if (!rows_("Access").some(function (a) { return normEmail_(a.email) === normEmail_(owner); })) {
    append_("Access", { email: owner, name: "Owner", role: "Inc", section: "", active: "Yes", notes: "Added by setup()" });
  }
  const access = tab_("Access");
  access.getRange("C2:C").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["Inc", "Officer"], true).build());
  access.getRange("D2:D").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(SECTIONS), true).setAllowInvalid(true).build());
  access.getRange("E2:E").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"], true).build());
  tab_("Members").getRange("G2:G").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MEMBER_STATUSES, true).build());
  const root = rootFolder_();
  if (typeof setupNewsletter_ === "function") setupNewsletter_();
  console.log("Portal ready. Drive folder: " + root.getUrl() + "\nShare that folder with Inc members only (not officers).");
}

/** Run once from the editor: emails officers on the roster reminder dates if their roster isn't confirmed. */
function installReminders() {
  editorOnly_();
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "rosterReminder_") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("rosterReminder_").timeBased().everyDays(1).atHour(9).create();
  console.log("Daily roster check installed. Reminder dates: " + PORTAL.rosterReminders.join(", "));
}

function rosterReminder_() {
  const md = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MM-dd");
  if (PORTAL.rosterReminders.indexOf(md) === -1) return;
  const term = currentTerm_();
  const rosters = rows_("Rosters");
  Object.keys(SECTIONS).forEach(function (s) {
    if (rosters.some(function (r) { return r.section === s && r.term === term && r.standing === "Returning"; })) return;
    rows_("Access").filter(function (a) { return a.role === "Officer" && a.section === s && String(a.active) === "Yes"; })
      .forEach(function (a) {
        notify_(a.email, SECTIONS[s] + ": confirm your " + term + " roster",
          "It's the start of " + term + ". Please sign in to the " + PORTAL.name + " and confirm who is back this semester " +
          "under Members > Semester roster, and add any new members.\n\nThank you,\nThe Inc.");
      });
  });
}

/* ============================== Helpers (not callable from the browser) ============================== */

let ROWS_CACHE_ = {}, ENSURED_ = {}, ACCESS_ = null;

function session_(token) {
  const email = token && CacheService.getScriptCache().get("s:" + String(token));
  if (!email) throw new Error("Your session ended. Sign in again.");
  const user = accessFor_(email);
  if (!user) throw new Error("This email no longer has portal access.");
  return user;
}

function accessFor_(email) {
  email = normEmail_(email);
  if (!email) return null;
  if (!ACCESS_) ACCESS_ = rows_("Access");
  const a = ACCESS_.filter(function (r) { return normEmail_(r.email) === email && String(r.active).trim().toLowerCase() === "yes"; })[0];
  if (!a) return null;
  const role = String(a.role).trim() === "Inc" ? "Inc" : "Officer";
  const section = String(a.section || "").trim().toUpperCase();
  if (role === "Officer" && !SECTIONS[section]) return null;   // an officer must have a section
  return { email: email, name: String(a.name || ""), role: role, section: role === "Inc" ? "" : section };
}

function incOnly_(user) {
  if (user.role !== "Inc") throw new Error("Only The Inc. can do that.");
  return user;
}

function canSee_(user, section) { return user.role === "Inc" || user.section === section; }

/** Officers always work on their own section; Inc members choose one. */
function sectionFor_(user, requested) {
  if (user.role !== "Inc") return user.section;
  const s = String(requested || "").toUpperCase();
  if (!SECTIONS[s]) throw new Error("Choose a section.");
  return s;
}

function editorOnly_() {
  const active = Session.getActiveUser().getEmail(), effective = Session.getEffectiveUser().getEmail();
  if (!active || active !== effective) throw new Error("Run this from the Apps Script editor.");
}

function tab_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (ENSURED_[name]) return sh;
  const want = SCHEMA[name];
  let h = sh.getLastColumn() > 0 ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0] : [];
  if (h.join("") === "") h = [];
  const before = h.length;
  want.forEach(function (k) { if (h.indexOf(k) === -1) h.push(k); });
  if (h.length !== before) {
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  ENSURED_[name] = true;
  return sh;
}

function headers_(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]; }

function rows_(name) {
  if (ROWS_CACHE_[name]) return ROWS_CACHE_[name];
  const sh = tab_(name);
  const last = sh.getLastRow();
  if (last < 2) return (ROWS_CACHE_[name] = []);
  const vals = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
  const h = vals[0];
  return (ROWS_CACHE_[name] = vals.slice(1).map(function (r, i) {
    const o = { _row: i + 2 };
    h.forEach(function (k, j) { o[k] = r[j] instanceof Date ? r[j] : (typeof r[j] === "string" ? r[j].trim() : r[j]); });
    return o;
  }));
}

function append_(name, obj) {
  const sh = tab_(name);
  sh.appendRow(headers_(sh).map(function (k) { return cell_(obj[k]); }));
  delete ROWS_CACHE_[name];
  if (name === "Access") ACCESS_ = null;
}

function update_(name, row, obj) {
  const sh = tab_(name);
  const h = headers_(sh);
  Object.keys(obj).forEach(function (k) {
    const c = h.indexOf(k);
    if (c > -1) sh.getRange(row, c + 1).setValue(cell_(obj[k]));
  });
  delete ROWS_CACHE_[name];
}

function findOne_(name, key, value) {
  value = String(value || "");
  return value ? rows_(name).filter(function (r) { return String(r[key]) === value; })[0] : null;
}

function nextId_(name, key, prefix, width) {
  const max = rows_(name).reduce(function (m, r) {
    const n = parseInt(String(r[key] || "").replace(prefix, ""), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return prefix + String(max + 1).padStart(width, "0");
}

function cell_(v) {
  if (v === undefined || v === null) return "";
  if (v instanceof Date || typeof v === "number" || typeof v === "boolean") return v;
  return safeCell_(String(v));
}

/** Values the browser can receive: no Date objects. */
function pick_(row, keys) {
  const o = {};
  keys.forEach(function (k) { o[k] = ser_(row[k]); });
  return o;
}

function ser_(v) {
  if (v instanceof Date) {
    const tz = Session.getScriptTimeZone();
    const hasTime = v.getHours() || v.getMinutes();
    return Utilities.formatDate(v, tz, hasTime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd");
  }
  return v === undefined || v === null ? "" : v;
}

function lock_() { const l = LockService.getScriptLock(); l.waitLock(20000); return l; }

function log_(user, action, detail) {
  try { append_("Log", { at: new Date(), user: user, action: action, detail: String(detail || "").slice(0, 300) }); }
  catch (e) { console.warn("log failed: " + e); }
}

function notify_(to, subject, body) {
  if (!to) return;
  try { MailApp.sendEmail({ to: to, subject: subject, body: body + "\n\n" + PORTAL.name }); }
  catch (e) { console.warn("email failed: " + e); }
}

/* ----- terms ----- */

function today_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }

/** Jan–Jun is Spring, Jul–Dec is Fall. */
function termOf_(dateStr) {
  const y = Number(String(dateStr).slice(0, 4)), m = Number(String(dateStr).slice(5, 7));
  return (m <= 6 ? "Spring " : "Fall ") + y;
}
function currentTerm_() { return termOf_(today_()); }
function termKey_(t) { const p = String(t).split(" "); return Number(p[1]) * 10 + (p[0] === "Fall" ? 2 : 1); }
function validTerm_(t) { t = String(t || ""); return /^(Spring|Fall) 20\d\d$/.test(t) ? t : ""; }

/** Every term that has data, plus the current one, newest first. */
function knownTerms_() {
  const set = {};
  set[currentTerm_()] = 1;
  ["Events", "Funds", "Rosters"].forEach(function (n) { rows_(n).forEach(function (r) { if (validTerm_(r.term)) set[r.term] = 1; }); });
  return Object.keys(set).sort(function (a, b) { return termKey_(b) - termKey_(a); });
}

/* ----- validation ----- */

function bad_(msg) { throw new Error(msg); }

function text_(v, label, max, req) {
  v = v === undefined || v === null ? "" : String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (!v && req) bad_(label + " is required.");
  if (v.length > max) bad_(label + " is too long (" + max + " characters at most).");
  return v;
}
function oneOf_(v, list, label, req) {
  v = v === undefined || v === null ? "" : String(v).trim();
  if (!v) { if (req) bad_(label + " is required."); return ""; }
  if (list.indexOf(v) === -1) bad_(label + " has an unexpected answer.");
  return v;
}
function num_(v, label, min, max, req) {
  if (v === undefined || v === null || String(v).trim() === "") { if (req) bad_(label + " is required."); return ""; }
  const n = Number(String(v).replace(/,/g, ""));
  if (!isFinite(n) || n < min || n > max) bad_(label + " must be a number from " + min + " to " + max + ".");
  return n;
}
function int_(v, label, min, max, req) {
  const n = num_(v, label, min, max, req);
  if (n !== "" && Math.floor(n) !== n) bad_(label + " must be a whole number.");
  return n;
}
function money_(v, label, req) {
  const n = num_(String(v === undefined ? "" : v).replace(/[$\s]/g, ""), label, 0.01, 1000000, req);
  return n === "" ? "" : Math.round(n * 100) / 100;
}
function money_fmt_(n) { return "$" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function dateStr_(v, label, req) {
  v = String(v || "").trim();
  if (!v) { if (req) bad_(label + " is required."); return ""; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + "T12:00:00").getTime())) bad_(label + " isn't a valid date.");
  if (v < "2009-01-01") bad_(label + " is too far in the past.");
  return v;
}
function phone_(v, req) {
  v = text_(v, "Phone", 30, req);
  if (v && v.replace(/\D/g, "").length < 10) bad_("Phone needs at least 10 digits.");
  return v;
}
function normEmail_(v) {
  v = String(v || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 200 ? v : "";
}
function sum_(list, key) { return list.reduce(function (a, r) { const n = Number(r[key]); return a + (isFinite(n) ? n : 0); }, 0); }

function randomCode_() {
  const hex = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  const n = parseInt(hex.slice(0, 12), 16);
  if (!isFinite(n)) throw new Error("Could not make a sign-in code. Try again.");
  return String(n % 1000000).padStart(6, "0");
}
function hash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("");
}

/* ----- Drive ----- */

function rootFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty("ROOT_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { /* recreated below */ } }
  const f = DriveApp.createFolder(PORTAL.rootFolderName);
  props.setProperty("ROOT_FOLDER_ID", f.getId());
  return f;
}

function folderPath_(parts) {
  let f = rootFolder_();
  parts.forEach(function (p) {
    const it = f.getFoldersByName(p);
    f = it.hasNext() ? it.next() : f.createFolder(p);
  });
  return f;
}

function folderFromUrl_(url) {
  const m = String(url || "").match(/folders\/([A-Za-z0-9_-]+)/);
  if (!m) throw new Error("This report's Drive folder is missing. Ask The Inc. to check it.");
  return DriveApp.getFolderById(m[1]);
}

function safeName_(s) { return String(s).replace(/[\\/:*?"<>|#%]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60); }

function blob_(file, typeRe, what) {
  file = file || {};
  const type = String(file.type || "").toLowerCase();
  if (!typeRe.test(type)) bad_("That file isn't a supported " + what + " (" + (type || "unknown type") + ").");
  const data = String(file.data || "").replace(/^data:[^,]*,/, "");
  if (!data) bad_("The file was empty.");
  if (data.length * 0.75 > PORTAL.maxUploadBytes) bad_("That file is over 10 MB.");
  const bytes = Utilities.base64Decode(data);
  if (bytes.length > PORTAL.maxUploadBytes) bad_("That file is over 10 MB.");
  return Utilities.newBlob(bytes, type, "upload");
}

function extFor_(type) {
  return ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/heic": ".heic",
            "image/heif": ".heif", "image/gif": ".gif", "application/pdf": ".pdf" })[type] || "";
}
