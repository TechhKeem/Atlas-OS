# Admin guide: newsletter sign-ups

For The Inc. No coding needed after the one-time setup.

## Where sign-ups go
Every sign-up on smooth2009.org adds a row to the **Newsletter** tab of the Google Sheet **SMOOTH Website Submissions**.

| Column | Meaning |
|---|---|
| submitted_at | When they signed up |
| status | Starts as **New**. Change it to **Added to email list**, **Unsubscribed**, or **Spam** as you work through it. |
| name, email, relationship | What they entered |
| page | The page they signed up from |
| member_id | Leave blank for now. Later, the member directory uses it to link a sign-up to a brother. |

Don't rename the tab or the headers in row 1, or new sign-ups will land in the wrong place.

An email goes to Info@smooth2009.org for each sign-up. Replying to it reaches the person who signed up.

## Privacy
The sheet holds people's emails. Share it only with Inc. members, never with "Anyone with the link." When someone leaves The Inc., remove their access.

## One-time setup
1. Using The Inc.'s shared Google account, create a Google Sheet named **SMOOTH Website Submissions**.
2. Open **Extensions > Apps Script**. Delete what's there, paste in all of `apps-script/Code.gs`, and click **Save**.
3. In the function menu at the top, choose **setup** and click **Run**. Approve the permissions. This creates the Newsletter tab.
4. Choose **testSignup** and click **Run**. A test row should appear and Info@smooth2009.org should get an email. Delete the test row.
5. Click **Deploy > New deployment**. Choose the type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
6. Copy the Web app URL (it ends in `/exec`) and paste it between the quotes in `const FORM_ENDPOINT = "";` in `site/index.html`.

"Anyone" lets the public website add rows. It does not let anyone read the sheet.

## Changing the script later
Use **Deploy > Manage deployments**, edit the existing deployment, and choose **New version**. Don't use "New deployment": that makes a new URL and the website would stop saving.

## What the script blocks
- Any form other than the newsletter, and any field that isn't on it
- Missing answers, invalid emails, and "I am a…" answers that aren't one of the choices
- Bots (a hidden field only bots fill in)
- The same email signing up twice within a minute
- Text that would run as a spreadsheet formula
