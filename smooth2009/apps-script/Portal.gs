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
 *                 confirms the semester roster, keeps the chapter's constitution and bylaws current
 *   role Applicant leads a group applying to charter a new chapter: sees only the Chapter tab and
 *                 only their own application. Approval turns them into that section's officer.
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

// The founding sections. Chapters The Inc. approves on the Chapter tab are added to this list automatically.
const SECTIONS = { MSU: "Morgan State", CSU: "Coppin State", TU: "Temple" };
const BASE_CHAPTERS = [
  { code: "MSU", school: "Morgan State University", city: "Baltimore", state: "MD", charter_date: "2009-10-28" },
  { code: "TU", school: "Temple University", city: "Philadelphia", state: "PA", charter_date: "2016-01-16" },
  { code: "CSU", school: "Coppin State University", city: "Baltimore", state: "MD", charter_date: "2016-12-12" }
];
const CHAPTER_STATUSES = ["Draft", "Submitted", "Under review", "Needs changes", "Voting", "Approved", "Denied"];
// Statuses The Inc. can set by hand. "Voting" and "Approved" only come from a vote of The Inc.
const CHAPTER_MANUAL_STATUSES = ["Under review", "Needs changes", "Denied"];

/**
 * Chartering a new chapter takes a vote of The Inc. Set these to match the constitution.
 *   passShare  1/2 means MORE than half of Yes + No votes; any larger share (like 2/3) means AT LEAST that share
 *   quorum     share of Inc members who must cast a ballot (abstaining counts as voting)
 */
const CHARTER_VOTE = {
  passShare: 1 / 2,
  quorum: 1 / 2,
  voteDays: 7,
  showRunningTotals: false
};
const RECOGNITION = ["Recognized by the university", "Recognition in progress", "Not started yet"];
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
  Chapters: ["chapter_id", "school", "code", "city", "state", "chartering_year", "charter_date",
             "contact_name", "contact_email", "contact_phone", "advisor_name", "advisor_title", "advisor_email",
             "recognition", "school_min_members", "school_requirements", "jr_smooth_school", "chartering_members",
             "roster_count", "constitution_file",
             "bylaws_file", "recognition_file", "file_folder", "agreed", "status", "inc_notes",
             "decided_by", "decided_at", "submitted_by", "submitted_at", "updated_at",
             "vote_opens", "vote_closes", "eligible", "yes", "no", "abstain", "result"],
  CharterRoster: ["chapter_id", "first_name", "last_name", "email", "phone", "grad_year", "position"],
  Amendments: ["amendment_id", "title", "article", "current_text", "proposed_text", "rationale", "status",
               "proposed_by", "proposed_at", "vote_opens", "vote_closes", "eligible", "yes", "no", "abstain",
               "result", "decided_at"],
  Ballots: ["amendment_id", "voter", "choice", "cast_at"],   // amendment_id holds A-… (amendments) or C-… (chapter votes)
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
  return boot_(session_(token, true));
}

function boot_(user) {
  return {
    user: { email: user.email, name: user.name, role: user.role, section: user.section,
            sectionName: user.role === "Applicant" ? "Chapter applicant" : (SECTIONS[user.section] || "All sections") },
    sections: SECTIONS,
    eventTypes: EVENT_TYPES,
    memberStatuses: MEMBER_STATUSES,
    currentTerm: currentTerm_(),
    terms: knownTerms_(),
    minPhotos: PORTAL.minPhotos,
    maxPhotos: PORTAL.maxPhotos,
    chapterStatuses: CHAPTER_STATUSES,
    recognition: RECOGNITION,
    chapterManualStatuses: CHAPTER_MANUAL_STATUSES
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
    const apps = rows_("Chapters").filter(function (c) { return c.status === "Submitted" || c.status === "Under review"; }).length;
    if (apps) todo.push(apps + " chapter application" + (apps > 1 ? "s" : "") + " to review");
    const voted = rows_("Ballots").filter(function (b) { return normEmail_(b.voter) === user.email; }).map(function (b) { return b.amendment_id; });
    rows_("Chapters").filter(function (c) { return c.status === "Voting" && voted.indexOf(c.chapter_id) === -1; })
      .forEach(function (c) { todo.push("Vote needed: charter " + c.school); });
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
    SECTIONS[ev.section] + " reported \"" + ev.title + "\" on " + longDate_(ev.event_date) + ".\n" +
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
    "Needed by: " + longDate_(r.needed_by) + "\nPay to: " + r.payee + "\n\nBreakdown:\n" + r.breakdown +
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
    body.appendParagraph(SECTIONS[e.section] + " · " + longDate_(e.event_date) + " · " + e.attendees + " attendees").setItalic(true);
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
      "\n\nReason:\n" + a.rationale + "\n\nSign in to the portal under Amendments to vote. Voting closes " + longDate_(closes) + ".");
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
  return user.role === "Inc" || (user.role === "Officer" && AMENDMENTS.voters === "Inc and Officers");
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

/* ============================== Chapters ============================== */

/** Inc sees every chapter; officers see their own section's; applicants see the applications they started. */
function listChapters(token) {
  const user = session_(token, true);
  ensureBaseChapters_();
  closeExpiredChapterVotes_();
  const roster = rows_("CharterRoster");
  const ballots = rows_("Ballots");
  return rows_("Chapters")
    .filter(function (c) { return c.chapter_id && canSeeChapter_(user, c); })
    .sort(function (a, b) { return String(b.chapter_id).localeCompare(String(a.chapter_id)); })
    .map(function (c) {
      const o = pick_(c, SCHEMA.Chapters);
      if (user.role !== "Inc") delete o.file_folder;
      o.roster = roster.filter(function (r) { return r.chapter_id === c.chapter_id; })
        .map(function (r) { return pick_(r, ["first_name", "last_name", "email", "phone", "grad_year", "position"]); });
      o.can_edit = canEditChapter_(user, c);
      o.can_upload = canUploadChapter_(user, c);
      o.below_school_minimum = !!(Number(c.school_min_members) && Number(c.roster_count) < Number(c.school_min_members));
      if (user.role === "Inc") {
        const mine = ballots.filter(function (b) { return b.amendment_id === c.chapter_id && normEmail_(b.voter) === user.email; })[0];
        o.my_vote = mine ? mine.choice : "";
        o.can_vote = c.status === "Voting" && !mine;
        o.turnout = ballots.filter(function (b) { return b.amendment_id === c.chapter_id; }).length;
      } else {
        delete o.eligible; delete o.yes; delete o.no; delete o.abstain;   // vote counts are for The Inc. only
        if (o.result) o.result = c.status === "Approved" ? "Approved by a vote of The Inc." : "Not approved by a vote of The Inc.";
      }
      if (c.status === "Voting" && !CHARTER_VOTE.showRunningTotals) { o.yes = ""; o.no = ""; o.abstain = ""; }
      return o;
    });
}

/** Start or update an application. Files are uploaded next, then submitChapter() sends it. */
function saveChapter(token, f) {
  const user = session_(token, true);
  if (user.role === "Officer") throw new Error("Section officers can update documents on their chapter. To start a new chapter, ask The Inc.");
  f = f || {};
  const existing = f.chapter_id ? findOne_("Chapters", "chapter_id", f.chapter_id) : null;
  if (f.chapter_id && !existing) throw new Error("That application wasn't found.");
  if (existing && !canEditChapter_(user, existing)) throw new Error("This application can't be edited now.");
  const thisYear = new Date().getFullYear();
  const code = text_(f.code, "Section abbreviation", 5, true).toUpperCase();
  if (!/^[A-Z]{2,5}$/.test(code)) bad_("Section abbreviation must be 2 to 5 letters, like MSU.");
  const clash = rows_("Chapters").some(function (c) { return String(c.code).toUpperCase() === code && c.chapter_id !== (existing && existing.chapter_id) && c.status !== "Denied"; });
  if (clash || (SECTIONS[code] && !(existing && existing.status === "Approved"))) bad_("The abbreviation " + code + " is already taken. Choose another.");
  const roster = parseRoster_(f.roster_text);
  if (roster.errors.length) bad_("Fix the roster first: " + roster.errors.slice(0, 5).join(" ") + (roster.errors.length > 5 ? " (and " + (roster.errors.length - 5) + " more)" : ""));
  if (!roster.rows.length) bad_("Add the chartering roster: at least one member.");
  if (String(f.agreed) !== "true" && f.agreed !== true) bad_("Check the agreement box to continue.");
  const rec = {
    school: text_(f.school, "School", 120, true),
    code: code,
    city: text_(f.city, "City", 80, true),
    state: text_(f.state, "State", 30, true),
    chartering_year: int_(f.chartering_year, "Chartering year", 2009, thisYear + 1, true),
    charter_date: dateStr_(f.charter_date, "Charter date", false),
    contact_name: text_(f.contact_name, "Primary contact name", 120, true),
    contact_email: normEmail_(f.contact_email) || bad_("Enter a valid email for the primary contact."),
    contact_phone: phone_(f.contact_phone, true),
    advisor_name: text_(f.advisor_name, "Advisor name", 120, true),
    advisor_title: text_(f.advisor_title, "Advisor title", 120, false),
    advisor_email: normEmail_(f.advisor_email) || bad_("Enter a valid email for the advisor."),
    recognition: oneOf_(f.recognition, RECOGNITION, "University recognition", true),
    school_min_members: int_(f.school_min_members, "Members your university requires", 1, 1000, false),
    school_requirements: text_(f.school_requirements, "University chartering requirements", 3000, false),
    jr_smooth_school: text_(f.jr_smooth_school, "Planned Jr. SMOOTH school", 160, false),
    chartering_members: text_(f.chartering_members, "Chartering members", 4000, true),
    roster_count: roster.rows.length,
    agreed: "Yes",
    updated_at: new Date()
  };
  const lock = lock_();
  let id;
  try {
    if (existing) {
      id = existing.chapter_id;
      update_("Chapters", existing._row, rec);
      replaceRoster_(id, roster.rows);
    } else {
      id = nextId_("Chapters", "chapter_id", "C-", 3);
      rec.chapter_id = id;
      rec.status = "Draft";
      rec.submitted_by = user.email;
      rec.file_folder = folderPath_(["Chapters", safeName_(rec.school) + " (" + id + ")"]).getUrl();
      append_("Chapters", rec);
      replaceRoster_(id, roster.rows);
    }
  } finally { lock.releaseLock(); }
  log_(user.email, existing ? "chapter updated" : "chapter started", id + " " + rec.school);
  return { chapter_id: id, roster_count: rec.roster_count };
}

/** kind: constitution | bylaws | recognition. A new upload replaces the file shown (older versions stay in Drive). */
function uploadChapterFile(token, chapterId, kind, file) {
  const user = session_(token, true);
  const c = findOne_("Chapters", "chapter_id", chapterId);
  if (!c || !canUploadChapter_(user, c)) throw new Error("That chapter wasn't found.");
  kind = oneOf_(kind, ["constitution", "bylaws", "recognition"], "Document type", true);
  const blob = blob_(file, /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|image\/(jpeg|png|heic|heif))$/, "document (PDF, Word, or photo)");
  const lock = lock_();
  try {
    const fresh = findOne_("Chapters", "chapter_id", chapterId);
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    const name = (fresh.code || fresh.chapter_id) + " " + kind + " " + stamp + extFor_(blob.getContentType(), file.name);
    blob.setName(name);
    folderFromUrl_(fresh.file_folder || folderPath_(["Chapters", safeName_(fresh.school) + " (" + fresh.chapter_id + ")"]).getUrl()).createFile(blob);
    const upd = { updated_at: new Date() };
    upd[kind + "_file"] = name;
    if (!fresh.file_folder) upd.file_folder = folderPath_(["Chapters", safeName_(fresh.school) + " (" + fresh.chapter_id + ")"]).getUrl();
    update_("Chapters", fresh._row, upd);
  } finally { lock.releaseLock(); }
  log_(user.email, "chapter " + kind + " uploaded", chapterId);
  return { ok: true };
}

function submitChapter(token, chapterId) {
  const user = session_(token, true);
  const c = findOne_("Chapters", "chapter_id", chapterId);
  if (!c || !canEditChapter_(user, c)) throw new Error("This application can't be submitted now.");
  if (!c.constitution_file || !c.bylaws_file) throw new Error("Upload the chapter's constitution and bylaws before submitting.");
  update_("Chapters", c._row, { status: "Submitted", submitted_at: new Date(), updated_at: new Date() });
  notify_(PORTAL.notify, "Chapter application: " + c.school,
    c.school + " (" + c.city + ", " + c.state + ") applied to charter a S.M.O.O.T.H. section as " + c.code + ".\n" +
    "Chartering year: " + c.chartering_year + "\nRoster: " + c.roster_count + " members" +
    (Number(c.school_min_members) ? " (the university requires " + c.school_min_members + ")" : "") + "\nAdvisor: " + c.advisor_name + " (" + c.advisor_email + ")\n" +
    "Contact: " + c.contact_name + ", " + c.contact_email + "\n\nReview it in the portal under Chapter.");
  log_(user.email, "chapter submitted", chapterId);
  return { ok: true, message: "Application submitted. The Inc. will review it and email " + c.contact_email + "." };
}

/** Inc only. Approving makes the chapter a live section, loads its roster, and turns the applicant into its officer. */
function decideChapter(token, chapterId, d) {
  const user = incOnly_(session_(token));
  d = d || {};
  const c = findOne_("Chapters", "chapter_id", chapterId);
  if (!c) throw new Error("That chapter wasn't found.");
  if (d.status === "Approved" || d.status === "Voting") throw new Error("Approving a chapter takes a vote of The Inc. Choose \"Open the vote\" instead.");
  const status = oneOf_(d.status, CHAPTER_MANUAL_STATUSES, "Approval status", true);
  if (c.status === "Approved" || c.status === "Voting") throw new Error("This chapter's status is set by The Inc.'s vote.");
  const note = text_(d.note, "Note", 1500, status === "Needs changes" || status === "Denied");
  update_("Chapters", c._row, { status: status, inc_notes: note, decided_by: user.email, decided_at: new Date(), updated_at: new Date() });
  tellApplicant_(c, status, note);
  log_(user.email, "chapter " + status.toLowerCase(), chapterId);
  return { ok: true };
}

/** Inc only: open The Inc.'s vote on a submitted application. */
function openChapterVote(token, chapterId) {
  const user = incOnly_(session_(token));
  const c = findOne_("Chapters", "chapter_id", chapterId);
  if (!c) throw new Error("That chapter wasn't found.");
  if (c.status !== "Submitted" && c.status !== "Under review") throw new Error("Only a submitted application can go to a vote.");
  const voters = incVoters_();
  const opens = new Date(), closes = new Date(opens.getTime() + CHARTER_VOTE.voteDays * 86400000);
  update_("Chapters", c._row, { status: "Voting", vote_opens: opens, vote_closes: closes, eligible: voters.length, yes: "", no: "", abstain: "", result: "", updated_at: new Date() });
  voters.forEach(function (v) {
    notify_(v, "Vote open: charter " + c.school,
      "The Inc. is voting on the application to charter a section at " + c.school + " (" + c.city + ", " + c.state + ") as " + c.code + ".\n" +
      "Roster: " + c.roster_count + " members" + (Number(c.school_min_members) ? " (the university requires " + c.school_min_members + ")" : "") +
      "\n\nReview the application and vote in the portal under Chapter. Voting closes " + longDate_(closes) + ".");
  });
  log_(user.email, "chapter vote opened", chapterId + " eligible " + voters.length);
  return { ok: true, closes: ser_(closes), eligible: voters.length };
}

function castChapterVote(token, chapterId, choice) {
  const user = incOnly_(session_(token));
  choice = oneOf_(choice, ["Yes", "No", "Abstain"], "Your vote", true);
  closeExpiredChapterVotes_();
  const lock = lock_();
  try {
    const c = findOne_("Chapters", "chapter_id", chapterId);
    if (!c || c.status !== "Voting") throw new Error("Voting isn't open on this chapter.");
    if (rows_("Ballots").some(function (b) { return b.amendment_id === c.chapter_id && normEmail_(b.voter) === user.email; })) throw new Error("You've already voted on this chapter.");
    append_("Ballots", { amendment_id: c.chapter_id, voter: user.email, choice: choice, cast_at: new Date() });
  } finally { lock.releaseLock(); }
  log_(user.email, "chapter vote cast", chapterId);
  return { ok: true, message: "Your vote is recorded. Votes can't be changed once cast." };
}

/** Inc only: close the vote early, for example once every Inc member has voted. */
function closeChapterVote(token, chapterId) {
  const user = incOnly_(session_(token));
  const c = findOne_("Chapters", "chapter_id", chapterId);
  if (!c || c.status !== "Voting") throw new Error("Voting isn't open on this chapter.");
  const r = tallyChapter_(c, user.email);
  log_(user.email, "chapter vote closed", chapterId + " " + r.status);
  return r;
}

function incVoters_() {
  return rows_("Access").map(function (r) { return accessFor_(r.email); })
    .filter(function (u) { return u && u.role === "Inc"; }).map(function (u) { return u.email; })
    .filter(function (e, i, all) { return all.indexOf(e) === i; });
}

function closeExpiredChapterVotes_() {
  const now = new Date();
  rows_("Chapters").forEach(function (c) {
    if (c.status === "Voting" && c.vote_closes instanceof Date && c.vote_closes <= now) tallyChapter_(c, "vote deadline");
  });
}

/** Count The Inc.'s ballots. Passing approves the chapter; failing denies it with the count. */
function tallyChapter_(c, by) {
  const b = rows_("Ballots").filter(function (x) { return x.amendment_id === c.chapter_id; });
  const yes = b.filter(function (x) { return x.choice === "Yes"; }).length;
  const no = b.filter(function (x) { return x.choice === "No"; }).length;
  const abstain = b.filter(function (x) { return x.choice === "Abstain"; }).length;
  const eligible = Number(c.eligible) || b.length;
  const need = Math.ceil(eligible * CHARTER_VOTE.quorum);
  const quorumMet = b.length >= need;
  const passed = quorumMet && passes_(yes, no, CHARTER_VOTE.passShare);
  const result = yes + " yes, " + no + " no, " + abstain + " abstain of " + eligible + " Inc members. " +
    (quorumMet ? "" : "Quorum not met (" + need + " ballots needed). ") + (passed ? "Approved." : "Not approved.");
  let imported = 0;
  if (passed) imported = approveChapter_(c, by);
  update_("Chapters", c._row, { status: passed ? "Approved" : "Denied", yes: yes, no: no, abstain: abstain, result: result,
                                 decided_by: "Vote of The Inc.", decided_at: new Date(), updated_at: new Date() });
  tellApplicant_(c, passed ? "Approved" : "Denied", "");   // applicants get the outcome, not the count
  incVoters_().forEach(function (v) { notify_(v, "Chapter vote " + (passed ? "passed" : "failed") + ": " + c.school, "The Inc.'s vote on chartering " + c.school + " has closed.\n\n" + result); });
  return { ok: true, status: passed ? "Approved" : "Denied", result: result, imported: imported };
}

/** 1/2 means more than half; any larger share means at least that share. */
function passes_(yes, no, share) {
  if (yes + no === 0) return false;
  const r = yes / (yes + no);
  return share <= 0.5 ? r > share : r >= share - 1e-9;
}

/** Make the chapter a live section, load its roster, and turn the applicant into its officer. */
function approveChapter_(c, by) {
  const code = String(c.code || "").toUpperCase();
  if (SECTIONS[code] && !BASE_CHAPTERS.some(function (b) { return b.code === code; })) bad_("The abbreviation " + code + " is already a section.");
  SECTIONS[code] = shortSchool_(c.school);
  const imported = importCharterRoster_(c, by);
  rows_("Access").forEach(function (a) {
    if (normEmail_(a.email) === normEmail_(c.submitted_by) && String(a.role).trim() === "Applicant") {
      update_("Access", a._row, { role: "Officer", section: code, notes: "Became " + code + " officer when the chapter was approved" });
    }
  });
  ACCESS_ = null;
  return imported;
}

function tellApplicant_(c, status, note) {
  const code = String(c.code || "").toUpperCase();
  const msg = status === "Approved" ? "has been approved by a vote of The Inc. Welcome to S.M.O.O.T.H. Inc. Your section is now set up in the portal as " + code + "."
            : status === "Needs changes" ? "needs a few changes before The Inc. can vote on it."
            : status === "Denied" ? "was not approved at this time."
            : "is now marked \"" + status + "\".";
  [c.contact_email, c.submitted_by].filter(function (e, i, all) { return e && all.indexOf(e) === i; }).forEach(function (e) {
    notify_(e, "Chapter application " + status.toLowerCase() + ": " + c.school,
      "Your application to charter a S.M.O.O.T.H. section at " + c.school + " " + msg + (note ? "\n\nNote from The Inc.:\n" + note : "") +
      "\n\nQuestions: " + PORTAL.notify);
  });
}

function canSeeChapter_(user, c) {
  if (user.role === "Inc") return true;
  if (user.role === "Officer") return String(c.code).toUpperCase() === user.section && c.status === "Approved";
  return normEmail_(c.submitted_by) === user.email;
}
function canEditChapter_(user, c) {
  const open = c.status === "Draft" || c.status === "Needs changes";
  if (user.role === "Inc") return c.status !== "Approved" && c.status !== "Voting";
  return user.role === "Applicant" && open && normEmail_(c.submitted_by) === user.email;
}
function canUploadChapter_(user, c) {
  return user.role === "Inc" || (user.role === "Officer" && canSeeChapter_(user, c)) || canEditChapter_(user, c);
}

/** Records for the founding sections, already approved, so they can keep their documents here. */
function ensureBaseChapters_() {
  const have = rows_("Chapters").map(function (c) { return String(c.code).toUpperCase(); });
  BASE_CHAPTERS.forEach(function (b) {
    if (have.indexOf(b.code) !== -1) return;
    append_("Chapters", { chapter_id: nextId_("Chapters", "chapter_id", "C-", 3), school: b.school, code: b.code, city: b.city, state: b.state,
      chartering_year: Number(b.charter_date.slice(0, 4)), charter_date: b.charter_date, status: "Approved", roster_count: 0,
      inc_notes: "Founding-era section", updated_at: new Date() });
  });
}

function replaceRoster_(chapterId, rows) {
  const sh = tab_("CharterRoster");
  const all = rows_("CharterRoster");
  for (let i = all.length - 1; i >= 0; i--) if (all[i].chapter_id === chapterId) sh.deleteRow(all[i]._row);
  delete ROWS_CACHE_.CharterRoster;
  rows.forEach(function (r) { append_("CharterRoster", Object.assign({ chapter_id: chapterId }, r)); });
}

function importCharterRoster_(c, by) {
  const code = String(c.code).toUpperCase();
  const existing = rows_("Members").map(function (m) { return String(m.email).toLowerCase(); });
  let n = 0;
  rows_("CharterRoster").filter(function (r) { return r.chapter_id === c.chapter_id; }).forEach(function (r) {
    if (existing.indexOf(String(r.email).toLowerCase()) !== -1) return;
    const id = nextId_("Members", "member_id", "M-", 5);
    append_("Members", { member_id: id, first_name: r.first_name, last_name: r.last_name, email: r.email, phone: r.phone, section: code,
      status: "Active", position: r.position, grad_year: r.grad_year, year_joined: new Date().getFullYear(), term_joined: currentTerm_(),
      source: "Charter roster " + c.chapter_id, added_by: by, last_updated: new Date() });
    append_("Rosters", { term: currentTerm_(), section: code, member_id: id, name: r.first_name + " " + r.last_name, standing: "New",
      position: r.position, confirmed_by: by, confirmed_at: new Date() });
    existing.push(String(r.email).toLowerCase()); n++;
  });
  return n;
}

/**
 * Reads a pasted or uploaded roster. Accepts a header row (first name, last name, email, phone,
 * graduation year, position, in any order) or those columns in that order without headers.
 * Columns can be separated by tabs (pasted from a spreadsheet) or commas (CSV).
 */
function parseRoster_(text) {
  text = String(text || "").replace(/\r\n?/g, "\n").trim();
  const out = { rows: [], errors: [] };
  if (!text) return out;
  const lines = text.split("\n").filter(function (l) { return l.trim(); });
  if (lines.length > 401) { out.errors.push("A roster can have 400 people at most."); return out; }
  const delim = lines[0].indexOf("\t") !== -1 ? "\t" : ",";
  const cells = function (line) {
    if (delim === "\t") return line.split("\t").map(function (x) { return x.trim(); });
    const res = []; let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { res.push(cur.trim()); cur = ""; } else cur += ch;
    }
    res.push(cur.trim()); return res;
  };
  const keys = { first_name: /^first/i, last_name: /^last|surname/i, email: /e-?mail/i, phone: /phone|cell|mobile/i, grad_year: /grad|class|year/i, position: /position|role|office|title/i };
  let order = ["first_name", "last_name", "email", "phone", "grad_year", "position"];
  const head = cells(lines[0]);
  let start = 0;
  // A header row is one where every filled-in cell reads like a column label.
  const isLabel = function (h) { return Object.keys(keys).some(function (k) { return keys[k].test(h); }) || /^(name|notes?)$/i.test(h); };
  const filled = head.filter(function (h) { return h; });
  const looksLikeHeader = filled.length > 1 && !filled.some(function (h) { return h.indexOf("@") !== -1; }) && filled.every(isLabel);
  if (looksLikeHeader) {
    order = head.map(function (h) { return Object.keys(keys).filter(function (k) { return keys[k].test(h); })[0] || ""; });
    start = 1;
  }
  const seen = {};
  for (let i = start; i < lines.length; i++) {
    const c = cells(lines[i]), r = {};
    order.forEach(function (k, j) { if (k && c[j] !== undefined) r[k] = c[j]; });
    const n = "Line " + (i + 1) + ":";
    try {
      const row = {
        first_name: text_(r.first_name, "first name", 60, true),
        last_name: text_(r.last_name, "last name", 60, true),
        email: normEmail_(r.email) || bad_("email is missing or not valid."),
        phone: r.phone ? phone_(r.phone, false) : "",
        grad_year: r.grad_year ? int_(r.grad_year, "graduation year", 2009, new Date().getFullYear() + 8, false) : "",
        position: text_(r.position, "position", 80, false)
      };
      if (seen[row.email]) bad_(row.email + " appears twice.");
      seen[row.email] = 1;
      out.rows.push(row);
    } catch (e) { out.errors.push(n + " " + e.message.charAt(0).toLowerCase() + e.message.slice(1)); }
  }
  return out;
}

/** The roster check the form runs before saving, so applicants see problems right away. */
function checkRoster(token, text) {
  session_(token, true);
  const r = parseRoster_(text);
  return { count: r.rows.length, errors: r.errors.slice(0, 20), preview: r.rows.slice(0, 5) };
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
  access.getRange("C2:C").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["Inc", "Officer", "Applicant"], true).build());
  access.getRange("D2:D").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(Object.keys(SECTIONS), true).setAllowInvalid(true).build());
  access.getRange("E2:E").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"], true).build());
  tab_("Members").getRange("G2:G").setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(MEMBER_STATUSES, true).build());
  ensureBaseChapters_();
  const chTab = tab_("Chapters"), statusCol = headers_(chTab).indexOf("status") + 1;
  chTab.getRange(2, statusCol, chTab.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(CHAPTER_STATUSES, true).build());
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

let ROWS_CACHE_ = {}, ENSURED_ = {}, ACCESS_ = null, SECTIONS_LOADED_ = false;

/** Applicants can only reach the Chapter tab: every other function refuses them. */
function session_(token, allowApplicant) {
  const email = token && CacheService.getScriptCache().get("s:" + String(token));
  if (!email) throw new Error("Your session ended. Sign in again.");
  const user = accessFor_(email);
  if (!user) throw new Error("This email no longer has portal access.");
  if (user.role === "Applicant" && !allowApplicant) throw new Error("Chapter applicants can only use the Chapter tab.");
  return user;
}

/** Add approved chapters to SECTIONS (once per run). */
function loadSections_() {
  if (SECTIONS_LOADED_) return;
  SECTIONS_LOADED_ = true;
  rows_("Chapters").forEach(function (c) {
    const code = String(c.code || "").toUpperCase();
    if (c.status === "Approved" && /^[A-Z]{2,5}$/.test(code) && !SECTIONS[code]) SECTIONS[code] = shortSchool_(c.school);
  });
}

/** "Example State University" -> "Example State" for labels. */
function shortSchool_(school) { return String(school || "").replace(/\s+University$/i, "").trim() || String(school || ""); }

function accessFor_(email) {
  email = normEmail_(email);
  if (!email) return null;
  loadSections_();
  if (!ACCESS_) ACCESS_ = rows_("Access");
  const a = ACCESS_.filter(function (r) { return normEmail_(r.email) === email && String(r.active).trim().toLowerCase() === "yes"; })[0];
  if (!a) return null;
  const r = String(a.role).trim();
  const role = r === "Inc" ? "Inc" : r === "Applicant" ? "Applicant" : "Officer";
  const section = String(a.section || "").trim().toUpperCase();
  if (role === "Officer" && !SECTIONS[section]) return null;   // an officer must have a section
  return { email: email, name: String(a.name || ""), role: role, section: role === "Officer" ? section : "" };
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
/** "2026-11-06" or a Date -> "Nov 6, 2026" for emails and documents. */
function longDate_(v) {
  const t = ser_(v), m = String(t).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m[2] - 1] + " " + (+m[3]) + ", " + m[1] : t;
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

function extFor_(type, name) {
  return ({ "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/heic": ".heic",
            "image/heif": ".heif", "image/gif": ".gif", "application/pdf": ".pdf", "application/msword": ".doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx" })[type] ||
         (String(name || "").match(/\.[A-Za-z0-9]{2,5}$/) || [""])[0];
}
