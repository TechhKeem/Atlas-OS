"""Generate the HyperFrames project for the "Coworker Retiring" edit (glass widgets).

Reads ../words_out.json (output-timeline word times). Run: python -I build_hf.py
"""
import json, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
EDIT = os.path.dirname(HERE)
HF = os.path.join(HERE, "hf")
W, H = 1080, 1920
TOTAL = 46.75
FOOT = 46.766

SAGE, SAGE_L, CHAR, PLAT = "#5CA581", "#86D1A8", "#20242D", "#C1C4C8"
AMBER = "#E8B04B"
FONT = "'Inter', sans-serif"
words = json.load(open(os.path.join(EDIT, "words_out.json")))

# scene windows (output seconds)
S = dict(
    hook=(0.30, 7.15),
    question=(7.55, 1.75),
    step1=(9.45, 8.55),
    formula=(18.10, 6.25),
    result=(24.45, 7.05),
    simple=(31.65, 2.45),
    cta=(35.85, TOTAL - 35.85),
)

GLASS = f"""    .scrim {{ display: none; }}
    .glass {{ position: absolute; left: 96px; right: 120px; top: 410px; border-radius: 36px; padding: 30px 36px;
              background: linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 40%, rgba(22,25,32,0.55) 100%), rgba(22,25,32,0.52);
              border: 1.5px solid rgba(255,255,255,0.22); box-shadow: 0 24px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35);
              backdrop-filter: blur(26px) saturate(150%); -webkit-backdrop-filter: blur(26px) saturate(150%); color: #fff; }}
    .kicker {{ font-weight: 700; font-size: 28px; letter-spacing: 0.14em; text-transform: uppercase; color: {SAGE_L}; }}
    .title {{ font-weight: 700; font-size: 50px; letter-spacing: -0.025em; line-height: 1.12; margin-top: 10px; }}
    .sub {{ font-weight: 400; font-size: 34px; color: rgba(255,255,255,0.82); margin-top: 10px; line-height: 1.25; }}
    .note {{ font-weight: 400; font-size: 28px; color: rgba(255,255,255,0.62); margin-top: 16px; letter-spacing: 0.02em; }}
    .tile {{ background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.14); border-radius: 26px; }}"""


def scene(cid, css, body, js, enter=True, dur=None):
    js_io = ""
    if enter:
        js_io = f"""    tl.fromTo(".scrim", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.35, ease: "power2.out" }}, 0);
    tl.fromTo(".glass", {{ opacity: 0, y: 48, scale: 0.97, filter: "blur(8px)" }}, {{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }}, 0.02);
    tl.to(".glass", {{ opacity: 0, y: 26, filter: "blur(6px)", duration: 0.28, ease: "power2.in" }}, {dur - 0.32:.3f});
    tl.to(".scrim", {{ opacity: 0, duration: 0.3, ease: "power2.in" }}, {dur - 0.3:.3f});
"""
    return f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; background: transparent; font-family: {FONT}; }}
{GLASS}
{css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{H}">
    <div class="scrim"></div>
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js_io}{js}
    window.__timelines["{cid}"] = tl;
  </script>
</template>
"""


def at(name, t):  # absolute output time -> scene-local
    return round(t - S[name][0], 3)


def pop(sel, t, dx=0, dy=18):
    return (f'    tl.fromTo("{sel}", {{ opacity: 0, x: {dx}, y: {dy}, filter: "blur(6px)" }}, '
            f'{{ opacity: 1, x: 0, y: 0, filter: "blur(0px)", duration: 0.32, ease: "power4.out" }}, {t:.3f});')


def write(name, text):
    with open(os.path.join(HF, name), "w") as f:
        f.write(text)


os.makedirs(os.path.join(HF, "compositions"), exist_ok=True)
CHECK = f'<svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
TOOL = f'<svg width="34" height="34" viewBox="0 0 24 24"><path d="M12 7v6M12 16.5v.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>'
ARROW_R = '<svg width="40" height="24" viewBox="0 0 54 24"><path d="M2 12h44M38 4l9 8-9 8" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_D = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 4v15M5 13l7 7 7-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# ---- hook ----
name = "hook"; d = S[name][1]
css = ""
body = ('    <div class="glass"><div class="kicker" id="hk">Real client story</div>'
        '<div class="title" id="ht">My old employee is about to retire&hellip;</div>'
        '<div class="sub" id="hs">&hellip;or at least he thinks so.</div></div>')
js = "\n".join([pop("#hk", 0.25), pop("#ht", 0.4), pop("#hs", at(name, 5.55))])
write("compositions/hook.html", scene(name, css, body, js, dur=d))

# ---- question ----
name = "question"; d = S[name][1]
css = "    .q { font-weight: 700; font-size: 60px; letter-spacing: -0.03em; margin-top: 12px; } .q b { color: " + SAGE_L + "; }"
body = '    <div class="glass"><div class="kicker" id="qk">My job</div><div class="q" id="qq">Can he <b>actually</b> retire?</div></div>'
js = "\n".join([pop("#qk", 0.2), pop("#qq", 0.35)])
write("compositions/question.html", scene(name, css, body, js, dur=d))

# ---- step 1: 401(k) -> private pension -> monthly income ----
name = "step1"; d = S[name][1]
css = f"""    .row {{ display: flex; align-items: center; justify-content: space-between; margin-top: 20px; }}
    .tile {{ width: 226px; height: 190px; display: flex; flex-direction: column; justify-content: center; padding: 0 18px; }}
    .tl {{ font-weight: 400; font-size: 28px; color: rgba(255,255,255,0.8); line-height: 1.1; }}
    .tv {{ font-weight: 700; font-size: 40px; letter-spacing: -0.02em; margin-top: 8px; }}
    .ts {{ font-weight: 400; font-size: 28px; color: rgba(255,255,255,0.78); margin-top: 4px; line-height: 1.1; }}
    .hl {{ border-color: {SAGE}; background: rgba(92,165,129,0.22); }}
    .hl .tv {{ color: {SAGE_L}; }}
    .arr {{ transform-origin: left center; }}"""
body = f"""    <div class="glass">
      <div class="kicker" id="s1k">Step 1 &middot; Roll it over</div>
      <div class="row">
        <div class="tile" id="t1"><div class="tl">Old<br>401(k)</div><div class="tv">$350K</div><div class="ts" id="t1s">at old job</div></div>
        <div class="arr" id="a1">{ARROW_R}</div>
        <div class="tile" id="t2"><div class="tl">Private<br>pension</div><div class="tv">Rolled</div><div class="ts">into pension</div></div>
        <div class="arr" id="a2">{ARROW_R}</div>
        <div class="tile hl" id="t3"><div class="tl">Monthly<br>income</div><div class="tv">$2,100</div><div class="ts">per month</div></div>
      </div>
      <div class="note" id="s1n">Example numbers for illustration</div>
    </div>"""
js = "\n".join([
    pop("#s1k", 0.2),
    pop("#t1", at(name, 10.75), dy=24),
    pop("#t1s", at(name, 12.25), dy=8),
    f'    tl.fromTo("#a1", {{ opacity: 0, scaleX: 0 }}, {{ opacity: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }}, {at(name, 13.9):.3f});',
    pop("#t2", at(name, 14.45), dy=24),
    f'    tl.fromTo("#a2", {{ opacity: 0, scaleX: 0 }}, {{ opacity: 1, scaleX: 1, duration: 0.45, ease: "power3.out" }}, {at(name, 15.95):.3f});',
    pop("#t3", at(name, 16.4), dy=24),
    pop("#s1n", at(name, 16.8), dy=0),
])
write("compositions/step1.html", scene(name, css, body, js, dur=d))

# ---- formula ----
name = "formula"; d = S[name][1]
css = f"""    .ln {{ display: flex; justify-content: space-between; align-items: baseline; font-size: 38px; margin-top: 10px; }}
    .ln .k {{ font-weight: 400; color: rgba(255,255,255,0.85); }}
    .ln .op {{ display: inline-block; width: 46px; font-weight: 700; color: {SAGE_L}; }}
    .ln .v {{ font-weight: 700; letter-spacing: -0.02em; }}
    .div {{ height: 2px; background: rgba(255,255,255,0.3); margin-top: 14px; transform-origin: left center; }}
    .res {{ font-size: 46px; margin-top: 10px; }}
    .res .v {{ color: {SAGE_L}; }}"""
body = """    <div class="glass">
      <div class="kicker" id="fk">Step 2 &middot; Do the math</div>
      <div class="ln" id="f1"><span class="k"><span class="op"></span>Pension income</span><span class="v">$2,100</span></div>
      <div class="ln" id="f2"><span class="k"><span class="op">+</span>Social Security</span><span class="v">$1,900</span></div>
      <div class="ln" id="f3"><span class="k"><span class="op">&minus;</span>Monthly expenses</span><span class="v">$3,600</span></div>
      <div class="div" id="fd"></div>
      <div class="ln res" id="f4"><span class="k"><span class="op">=</span>Left over</span><span class="v" id="f4v">+$400/mo</span></div>
      <div class="note" id="fn">Example numbers for illustration</div>
    </div>"""
js = "\n".join([
    pop("#fk", 0.2), pop("#f1", 0.35, dx=-24, dy=0),
    pop("#f2", at(name, 18.85), dx=-24, dy=0),
    pop("#f3", at(name, 21.05), dx=-24, dy=0),
    f'    tl.fromTo("#fd", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.5, ease: "power3.inOut" }}, {at(name, 22.6):.3f});',
    pop("#f4", at(name, 23.35), dx=0, dy=16),
    f'    tl.fromTo("#f4v", {{ scale: 0.85 }}, {{ scale: 1, duration: 0.5, ease: "back.out(1.6)" }}, {at(name, 23.35):.3f});',
    pop("#fn", at(name, 23.6), dy=0),
])
write("compositions/formula.html", scene(name, css, body, js, dur=d))

# ---- result ----
name = "result"; d = S[name][1]
css = f"""    .opt {{ display: flex; align-items: center; gap: 22px; padding: 18px 22px; margin-top: 14px; }}
    .ic {{ width: 68px; height: 68px; border-radius: 34px; display: flex; align-items: center; justify-content: center; flex: none; }}
    .pos .ic {{ background: {SAGE}; }} .neg .ic {{ background: {AMBER}; }}
    .ot {{ font-weight: 700; font-size: 38px; letter-spacing: -0.02em; }}
    .os {{ font-weight: 400; font-size: 30px; color: rgba(255,255,255,0.75); margin-top: 4px; }}"""
body = f"""    <div class="glass">
      <div class="kicker" id="rk">The answer</div>
      <div class="tile opt pos" id="r1"><div class="ic">{CHECK}</div><div><div class="ot">Positive number</div><div class="os">He can retire <b>today</b></div></div></div>
      <div class="tile opt neg" id="r2"><div class="ic">{TOOL}</div><div><div class="ot">Negative number</div><div class="os">We build a plan to close the gap</div></div></div>
    </div>"""
js = "\n".join([
    pop("#rk", 0.15),
    pop("#r1", at(name, 24.7), dy=22),
    pop("#r2", at(name, 27.5), dy=22),
    f'    tl.to("#r1", {{ opacity: 0.45, duration: 0.3, ease: "power2.out" }}, {at(name, 27.5):.3f});',
])
write("compositions/result.html", scene(name, css, body, js, dur=d))

# ---- simple ----
name = "simple"; d = S[name][1]
css = "    .glass { text-align: center; padding: 34px 30px; } .big { font-weight: 700; font-size: 58px; letter-spacing: -0.03em; } .big b { color: " + SAGE_L + "; }"
body = '    <div class="glass"><div class="big" id="sb">It&rsquo;s really <b>that simple.</b></div></div>'
write("compositions/simple.html", scene(name, css, body, pop("#sb", 0.15, dy=10), dur=d))

# ---- cta (holds to the end) ----
name = "cta"; d = S[name][1]
css = f"""    .pill {{ margin-top: 22px; height: 92px; border-radius: 46px; background: #3B7F5E; display: flex; align-items: center; justify-content: center; gap: 16px;
             font-weight: 700; font-size: 36px; letter-spacing: -0.01em; box-shadow: 0 12px 34px rgba(92,165,129,0.45); }}
    .ad {{ display: inline-flex; }}"""
body = f"""    <div class="glass">
      <div class="kicker" id="ck">Is this you?</div>
      <div class="title" id="ct">Want to retire in the next <span style="color:{SAGE_L}">5&ndash;10 years?</span></div>
      <div class="sub" id="cs">Or not sure if you&rsquo;re on track?</div>
      <div class="pill" id="cp">DM me or comment below <span class="ad" id="cad">{ARROW_D}</span></div>
    </div>"""
js = "\n".join([
    pop("#ck", 0.2), pop("#ct", at(name, 36.15)), pop("#cs", at(name, 39.75)),
    f'    tl.fromTo("#cp", {{ opacity: 0, y: 24, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, {at(name, 41.15):.3f});',
    f'    tl.fromTo("#cad", {{ y: -6 }}, {{ y: 6, duration: 0.5, ease: "power2.inOut" }}, {at(name, 41.8):.3f});',
    f'    tl.to("#cad", {{ y: 0, duration: 0.4, ease: "power2.out" }}, {at(name, 42.3):.3f});',
    f'    tl.to("#cad", {{ y: 6, duration: 0.5, ease: "power2.inOut" }}, {at(name, 43.6):.3f});',
    f'    tl.to("#cad", {{ y: 0, duration: 0.4, ease: "power2.out" }}, {at(name, 44.1):.3f});',
])
write("compositions/cta.html", scene(name, css, body, js, enter=False) .replace(
    "const tl = gsap.timeline({ paused: true });",
    'const tl = gsap.timeline({ paused: true });\n    tl.fromTo(".scrim", { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);\n'
    '    tl.fromTo(".glass", { opacity: 0, y: 48, scale: 0.97, filter: "blur(8px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.55, ease: "expo.out" }, 0.02);'))

# ---- captions: punchy 2-3 word groups at the top, keywords in sage ----
KEY = {"401(k)", "private", "pension", "social", "security", "expenses", "positive", "negative", "retire", "retire.",
       "today.", "simple.", "dm", "comment", "5", "10", "total", "subtract", "balance.", "solution"}
groups, cur = [], []
for w in words:
    if cur and (w["start"] - cur[-1]["end"] >= 0.15 or len(cur) >= 3):
        groups.append(cur); cur = []
    cur.append(w)
    if w["text"].endswith((".", "?", "!", ",")):
        groups.append(cur); cur = []
if cur: groups.append(cur)
items = []
for k, g in enumerate(groups):
    s = max(0.1, g[0]["start"] - 0.04)
    nxt = groups[k + 1][0]["start"] - 0.04 if k + 1 < len(groups) else TOTAL
    e = min(max(g[-1]["end"] + 0.12, s + 0.4), nxt)
    if k + 1 == len(groups): e = min(TOTAL, g[-1]["end"] + 0.8)
    def fmt(w):
        t = html.escape(w["text"])
        return f'<i>{t}</i>' if w["text"].lower().strip(",?!") in KEY or w["text"].lower() in KEY else t
    items.append((s, e - s, " ".join(fmt(w) for w in g)))
css = f"""    .cap {{ position: absolute; left: 0; right: 0; top: 300px; text-align: center; overflow: visible; }}
    .cap span {{ display: inline-block; max-width: 860px; white-space: nowrap; font-weight: 900; font-size: 56px; letter-spacing: -0.02em; color: #fff; text-transform: uppercase;
                 text-shadow: 0 4px 18px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.6); line-height: 1.1; }}
    .cap i {{ font-style: normal; color: {SAGE_L}; }}"""
body = "\n".join(f'    <div class="cap clip" id="cap{k}" data-start="{s:.3f}" data-duration="{d_:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>'
                 for k, (s, d_, t) in enumerate(items))
js = "\n".join(f'    tl.fromTo("#capt{k}", {{ opacity: 0, scale: 0.88 }}, {{ opacity: 1, scale: 1, duration: 0.14, ease: "back.out(2)" }}, {s:.3f});'
               for k, (s, d_, t) in enumerate(items))
write("compositions/captions.html", f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; background: transparent; font-family: {FONT}; }}
{css}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js}
    window.__timelines["captions"] = tl;
  </script>
</template>
""")

# ---- root: footage with punch-ins on emphasis beats ----
punch = [(0, 1.0), (2.7, 1.1), (3.37, 1.0), (9.15, 1.07), (18.1, 1.0), (23.35, 1.13), (24.45, 1.0),
         (31.65, 1.1), (32.85, 1.0), (35.85, 1.06), (41.13, 1.0)]
sets = "\n".join(f'      tl.set("#cam", {{ y: 340, scale: {s} }}, {t:.3f});' for t, s in punch)


def host(cid, start, dur, track, kind="graphics", z=5):
    return (f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="{start:.3f}" '
            f'data-duration="{dur:.3f}" data-track-index="{track}" data-track-kind="{kind}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>')

hosts = "\n".join(host(k, *v, 1) for k, v in S.items())
write("index.html", f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: #111; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: {FONT}; }}
      #stage {{ position: absolute; inset: 0; overflow: hidden; z-index: 1; }}
      #cam {{ position: absolute; inset: 0; transform-origin: 50% 40%; }}
      #header {{ position: absolute; left: 0; right: 0; top: 0; height: 760px; z-index: 2;
                 background: linear-gradient(to bottom, #1A1D24 0%, #1A1D24 44%, rgba(26,29,36,0.85) 58%, rgba(26,29,36,0) 100%); }}
      #footage {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: cover; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
      <div id="stage" data-layout-allow-overflow><div id="cam">
        <video id="footage" class="clip" src="assets/footage.mp4" data-start="0" data-duration="{FOOT}" data-track-index="0" muted playsinline></video>
      </div></div>
      <div id="header"></div>
{hosts}
{host("captions", 0, TOTAL, 2, kind="captions", z=7)}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{sets}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print(len(items), "caption groups")
