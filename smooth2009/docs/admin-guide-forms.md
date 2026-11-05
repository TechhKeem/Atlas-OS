# Admin guide: website forms

For The Inc. No coding needed after the one-time setup.

## Where submissions go
Every form on smooth2009.org saves a row in the Google Sheet **SMOOTH Website Submissions**. Each form has its own tab:

| Tab | Comes from |
|---|---|
| Membership Interest | "Join a section" form |
| Partner and Volunteer | "Partner or volunteer" form |
| Member Directory Update | "Brother update" form |
| Newsletter | "Newsletter" form |

Each new row starts with **status = New**. Change it to **Contacted** or **Done** as you work through it. Do not rename the tabs or the column headers in row 1, or new submissions will land in the wrong place.

When a form comes in, an email goes to Info@smooth2009.org. Reply to that email to reach the person who submitted it.

## Privacy
This sheet holds members' phone numbers and emails, including current students'. Share it only with Inc. members, never with "Anyone with the link." When an officer leaves The Inc., remove their access.

## One-time setup
1. Using The Inc.'s shared Google account, create a Google Sheet named **SMOOTH Website Submissions**.
2. Open **Extensions > Apps Script**. Delete what is there, paste in all of `apps-script/Code.gs`, and click Save.
3. In the function menu at the top, choose **setup** and click **Run**. Approve the permissions. This creates the four tabs.
4. Choose **testAllForms** and click **Run**. Each tab should get one test row, and Info@smooth2009.org should get four emails. Delete the test rows.
5. Click **Deploy > New deployment**. Choose the type **Web app**. Set Execute as: **Me**. Set Who has access: **Anyone**. Click **Deploy**.
6. Copy the Web app URL (it ends in `/exec`). Paste it between the quotes in `const FORM_ENDPOINT = "";` in `site/index.html`.

"Anyone" lets the public website send rows in. It does not let anyone read the sheet.

## If you change the script later
Click **Deploy > Manage deployments**, edit the existing deployment, and choose **New version**. Do not use "New deployment," because that creates a new URL and the website would stop saving.

## What the script blocks
- Forms it does not recognize, and fields that are not on the form
- Missing required answers, invalid emails, and years outside 2009 to 6 years from now
- Answers that are not one of the dropdown choices
- Bots (a hidden field that only bots fill in)
- The same email sending the same form twice within 30 seconds
- Text that would run as a spreadsheet formula
