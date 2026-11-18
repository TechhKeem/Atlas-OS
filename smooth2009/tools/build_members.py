"""Builds site/members/index.html: the member portal in practice mode.

Run from the smooth2009 folder:  python3 tools/build_members.py
Re-run it after changing anything in apps-script/ or practice/.

Practice mode runs the real portal code (apps-script/Portal.gs, Newsletter.gs, Portal.html) in the
visitor's browser on practice/gas-mock.js. There is no password, and entries are saved only in that
browser. When the back office is deployed, this page switches to the live portal with sign-in.
"""
import os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
read = lambda *p: open(os.path.join(ROOT, *p), encoding='utf-8').read()

portal = read('apps-script', 'Portal.html')
code = {name: read(*path) for name, path in {
    'gas-mock.js': ('practice', 'gas-mock.js'),
    'Newsletter.gs': ('apps-script', 'Newsletter.gs'),
    'Portal.gs': ('apps-script', 'Portal.gs'),
    'practice.js': ('practice', 'practice.js'),
}.items()}
for name, src in code.items():
    assert '</script' not in src.lower(), name + ' contains </script>'

css = """
/* Practice mode bar and viewer */
.practice-bar{background:var(--info-bg);color:var(--ink);border-bottom:1px solid var(--line);font-size:14px}
.practice-bar .pinner{max-width:1080px;margin:0 auto;padding-block:10px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:8px}
.practice-bar .prow{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center}
.practice-bar label{color:var(--ink);font-size:14px}
.practice-bar select{width:auto;padding:6px 10px;font-size:14px;background:var(--bg)}
.pbtn{font:500 14px var(--f);padding:6px 12px;border-radius:999px;border:1px solid var(--field-line);background:var(--bg);color:var(--ink);cursor:pointer}
.pbtn.strong{background:var(--navy);color:var(--on-navy);border-color:var(--navy)}
.plink{font-size:14px}
.pnote{color:var(--err);font-weight:500}
.pdialog{border:0;border-radius:22px;padding:0;width:min(720px,calc(100vw - 32px));max-height:min(80vh,900px);background:var(--bg);color:var(--ink)}
.pdialog::backdrop{background:rgba(0,0,0,.45)}
.pdhead{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 22px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--bg)}
.pdbody{padding:18px 22px 24px;display:grid;gap:14px;overflow-wrap:anywhere}
.pmuted{color:var(--muted);font-size:14px}
.pmail{display:grid;gap:4px;padding-bottom:14px;border-bottom:1px solid var(--line)}
.pdialog pre{white-space:pre-wrap;font:14px/1.5 var(--f);margin:0;background:var(--bg-2);padding:12px;border-radius:12px}
.pdialog pre.pcsv{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;overflow-x:auto;white-space:pre}
.pdoc{display:grid;gap:10px}
.pphoto{background:var(--bg-2);border-radius:12px;padding:40px;text-align:center;color:var(--muted)}
"""

html = portal
html = html.replace('<title>S.M.O.O.T.H. Portal</title>',
    '<title>Members | S.M.O.O.T.H. Inc.</title>\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    '<meta name="robots" content="noindex,nofollow">\n<link rel="icon" href="../images/crest-national.png">', 1)
html = html.replace('<base target="_top">\n', '', 1)
html = html.replace('</style>', css + '</style>', 1)
old_token = "try { TOKEN = sessionStorage.getItem('smoothToken'); } catch (_) {}"
assert old_token in html
html = html.replace(old_token, "TOKEN = window.__PRACTICE_TOKEN || null;", 1)
html = html.replace("#signOut", "#signOut", 1)
scripts = ''.join('<script>/* %s */\n%s\n</script>\n' % (n, code[n]) for n in ['gas-mock.js', 'Newsletter.gs', 'Portal.gs', 'practice.js'])
marker = '<script>\n"use strict";'
assert marker in html
html = html.replace(marker, scripts + marker, 1)
# practice mode never signs out; the bar switches roles instead
html = html.replace('<button class="btn quiet" id="signOut" type="button">Sign out</button>', '', 1)
html = html.replace("$('#signOut').addEventListener('click',", "$('#signOut') && $('#signOut').addEventListener('click',", 1)
html = html.replace("$('#signOut').setAttribute('aria-label', 'Sign out ' + (boot.user.name || boot.user.email)); $('#signOut').title = $('#who').textContent;", "", 1)

os.makedirs(os.path.join(ROOT, 'site', 'members'), exist_ok=True)
out = os.path.join(ROOT, 'site', 'members', 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print('wrote site/members/index.html', len(html) // 1024, 'KB')
