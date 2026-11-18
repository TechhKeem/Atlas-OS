# Admin guide: newsletter sign-ups

For The Inc. No coding needed after the one-time setup.

## Where sign-ups go
Every sign-up on smooth2009.org adds a row to the **Newsletter** tab of the Google Sheet **SMOOTH Back Office**, the same Sheet the member portal uses.

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
The newsletter is set up together with the member portal. Follow "One-time setup" in `docs/admin-guide-portal.md`. Step 6 there gives you the address to paste into `FORM_ENDPOINT` in `site/index.html`.

To test the sign-up on its own, choose **testSignup** in the Apps Script function menu and click **Run**. A test row should appear on the Newsletter tab and Info@smooth2009.org should get an email. Delete the test row.

## Changing the script later
Use **Deploy > Manage deployments**, edit the existing deployment, and choose **New version**. Don't use "New deployment": that makes a new URL and the website would stop saving.

## What the script blocks
- Any form other than the newsletter, and any field that isn't on it
- Missing answers, invalid emails, and "I am a…" answers that aren't one of the choices
- Bots (a hidden field only bots fill in)
- The same email signing up twice within a minute
- Text that would run as a spreadsheet formula
