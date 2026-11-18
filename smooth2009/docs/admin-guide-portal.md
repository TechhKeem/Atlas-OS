# Admin guide: the S.M.O.O.T.H. Portal

The portal is the private back office for The Inc. and section officers. No coding is needed after the one-time setup. Everything it saves lands in the Google Sheet **SMOOTH Back Office** and in a Google Drive folder called **SMOOTH Portal Files**.

## Who uses it

| Person | What they can do |
|---|---|
| **The Inc.** | Everything, for every section: review event reports, approve or deny funds, see and export the directory, open and close amendment votes, build newsletter drafts. |
| **Section officers** (presidents, event coordinators) | Only their own section: report events, request funds, add new members, confirm the semester roster, propose and vote on amendments. They never see other sections' data. |

## Giving and removing access

Open the **Access** tab in the Sheet. Each row is one person.

| Column | What to enter |
|---|---|
| email | The email they'll sign in with. Any email works, Gmail or school. |
| name | Their name, as it should appear in the portal |
| role | **Inc** or **Officer** |
| section | For officers: **MSU**, **CSU**, or **TU**. Leave blank for Inc. |
| active | **Yes** to allow sign-in. **No** locks them out right away. |

When officers change each year, set the old officer's row to **No** and add the new officer. Nothing else changes.

## How people sign in

They open the portal link, type their email, and get a 6-digit code by email. The code works for 10 minutes. A sign-in lasts 6 hours. No passwords.

## What each section does

**After every event: Events > Report an event**
- Date, title, type, location, number of attendees, service hours (if any)
- A description, plus a 2 to 4 sentence summary written for the newsletter
- At least 5 photos (up to 20). Photos are shrunk on the phone before uploading, so it's quick.
- If any photo shows a minor, the officer must confirm written parent consent is on file, or leave those photos out.

If an upload is interrupted, the report shows as **Incomplete** with an "Add photos" button.

**When money is needed: Funds > Request funds**
- What it's for, the amount, the date needed, who gets paid, and a cost breakdown. Quotes or receipts are optional.
- The officer gets an email when The Inc. approves, denies, or pays it.

**When someone joins: Members > Add a new member**
- He goes straight into the directory and onto this semester's roster as **New**.
- If the email is already in the directory, the portal stops and says who has it. If the name or phone matches someone, he's added but flagged for The Inc. to check.

**Start of every semester: Members > Semester roster**
- Tick every brother who is back and update positions. New members are added separately.
- On **September 15** and **February 1**, officers whose roster isn't in get an automatic reminder email.

## What The Inc. does

- **Overview** shows what needs attention, then totals by section for the chosen term: roster size, new members, events, attendees, service hours, and funds requested, approved, and paid. The table at the bottom tracks attendance and roster size term by term.
- **Events:** open the photos in Drive, then choose **Mark reviewed** or **Needs changes** (with a note, which is emailed to the officer).
- **Funds:** **Approve** (you can approve less than requested), **Deny** (a note is required), then **Mark paid** once the money goes out.
- **Members > Directory:** filter by section, status, and semester, and search by name. Change a member's status (Active, Alumni, Inactive) right in the list. **Clear flag** once you've checked a possible duplicate. **Export CSV** saves the filtered list to Drive.
- **Newsletter:** pick a term, tick the reviewed events to include, and choose **Create newsletter draft**. You get a Google Doc with each event's summary and one photo, ready to edit and send. Events already used show which issue they went into.

## Amendments to the constitution

1. Anyone with portal access proposes an amendment: the article, current wording, proposed wording, and the reason.
2. The Inc. reviews it and chooses **Open the vote**. Every eligible voter gets an email.
3. Each voter picks Yes, No, or Abstain. A vote can't be changed once cast.
4. Voting closes on its own after 14 days, or earlier if The Inc. chooses **Close the vote now**. Everyone gets the result by email.

The current rules, which should match the constitution's amendment article:
- **Who votes:** The Inc. and section officers, one vote each
- **To pass:** two-thirds of the Yes and No votes. Abstentions don't count either way.
- **Quorum:** at least half of eligible voters must cast a ballot (abstaining counts as voting)
- **Totals:** hidden until the vote closes

To change any of these, edit the `AMENDMENTS` settings near the top of `Portal.gs` (see "Changing settings" below).

## Privacy

- Members' phone numbers and emails are visible only to The Inc. and to that member's own section officers.
- Share the **SMOOTH Back Office** Sheet and the **SMOOTH Portal Files** folder with Inc members only. Never share them with "Anyone with the link." Officers don't need either one; the portal does the work for them.
- The **Log** tab records every sign-in and change, with who made it.

## One-time setup

You need The Inc.'s shared Google account. Ideally it's a Google Workspace for Nonprofits account, which is free.

1. Create a Google Sheet named **SMOOTH Back Office**.
2. Open **Extensions > Apps Script**. Create three files and paste in each one from the `apps-script` folder:
   - `Newsletter.gs`
   - `Portal.gs`
   - `Portal.html` (to make it, choose **+ > HTML** and name it `Portal`)

   Delete the empty `Code.gs`.
3. Choose **setup** in the function menu and click **Run**. Approve the permissions. This creates every tab, adds you as Inc, and creates the Drive folder. The log shows the folder's link; share that folder with Inc members only.
4. Choose **installReminders** and click **Run**. This turns on the roster reminder emails.
5. Click **Deploy > New deployment**, choose **Web app**, set Execute as: **Me** and Who has access: **Anyone**, then click **Deploy**.
6. Copy the Web app URL (it ends in `/exec`). The same address does two jobs:
   - It's the **portal link**. Bookmark it and send it to officers.
   - It's where the website sends newsletter sign-ups. Paste it into `FORM_ENDPOINT` in `site/index.html`.
7. Add officers on the **Access** tab.

"Anyone" lets people reach the sign-in page. Only emails on the Access tab can get a code.

## Changing settings

The settings are at the top of `Portal.gs`:
- `PORTAL`: notification email, photo minimum and maximum, roster reminder dates
- `AMENDMENTS`: who votes, pass threshold, quorum, voting days, hidden totals
- `EVENT_TYPES`: the event type choices

After any change, use **Deploy > Manage deployments**, edit the deployment, and choose **New version**. Don't use "New deployment": that makes a new address and the old link stops working.

## Limits to know

- Google lets a free Gmail account send about 100 emails a day: sign-in codes, notifications, and reminders combined. A Google Workspace account can send more.
- Photos, receipts, and newsletter drafts are stored in Drive and count toward that account's storage.
