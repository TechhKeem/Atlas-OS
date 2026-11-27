"""HyperFrames build for "Paycheck" — a reel assembled entirely from Hakeem's library.

Voice: cut from his earlier recordings (build_vo.py -> vo/vo.wav, words_out.json).
Picture: B Roll + Authority stills (Ken Burns) and clips. Widgets (FK glass) sync to his words; pill captions below.
Run: python -I build_vo.py && python -I build_hf.py      (the earlier no-voice cut is build_hf_textonly.py)
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
HF = os.path.join(HERE, "hf")
W, H, TOTAL = 1080, 1920, 44.5
SAGE, SAGE_L, CHAR, SOFT, PLAT = "#5CA581", "#8FD6AE", "#20242D", "#F6F7F9", "#C1C4C8"
FONT = "'Outfit', sans-serif"
words = json.load(open(os.path.join(HERE, "words_out.json")))


def wt(seg, text, nth=0):
    """Output time of the nth occurrence of a word in a VO segment."""
    hits = [w["start"] for w in words if w["seg"] == seg and re.sub(r"\W", "", w["text"]).lower() == text.lower()]
    return hits[nth]


# ---------------- shots: (id, src, start, dur, kind, zoom from->to, y from->to) ----------------
SHOTS = [
    ("s1", "6425_handshake.jpg", 0.0, 3.3, "img", (1.12, 1.0), (0, 0)),
    ("s2", "0985_stage.mp4", 3.3, 3.0, "video", (1.0, 1.06), (0, 0)),
    ("s3", "8770_profile.jpg", 6.3, 3.2, "img", (1.0, 1.10), (0, -20)),
    ("s4", "8718_phone.jpg", 9.5, 4.1, "img", (1.10, 1.0), (0, 0)),
    ("s5", "6364_courtyard.jpg", 13.6, 4.37, "img", (1.0, 1.09), (0, 0)),
    ("s6", "7105_hillside.jpg", 17.97, 5.17, "img", (1.10, 1.0), (0, 0)),
    ("s7", "8720_sunset.jpg", 23.14, 4.06, "img", (1.0, 1.10), (0, 0)),
    ("s8", "wsl6_portrait.jpg", 27.2, 4.06, "img", (1.14, 1.06), (-60, -90)),
    ("s9", "8752_camera_crew.mp4", 31.26, 2.0, "video", (1.08, 1.0), (0, 0)),
    ("s10", "7358_hope_speaking.jpg", 33.26, 1.99, "img", (1.0, 1.08), (0, 0)),
    ("s11", "wsl22_headshot.jpg", 35.25, 9.25, "img", (1.16, 1.12), (-130, -130)),
]

BASE_CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; color: #fff; }}
    .glass {{ background: linear-gradient(140deg, rgba(92,165,129,0.9), rgba(32,36,45,0.92)); border: 2px solid rgba(255,255,255,0.38);
              backdrop-filter: blur(20px); border-radius: 40px; box-shadow: 0 24px 60px rgba(0,0,0,0.35); }}
    .band {{ position: absolute; left: 100px; right: 180px; top: 600px; }}
    .kick {{ font-weight: 600; font-size: 30px; letter-spacing: 0.18em; text-transform: uppercase; color: {SAGE_L}; }}
    .hl {{ color: {SAGE_L}; }}
"""


def scene(cid, body, js, css=""):
    return f"""<template>
  <style>
{BASE_CSS}
{css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{H}">
{body}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js}
    window.__timelines["{cid}"] = tl;
  </script>
</template>
"""


SCENES = []


def add(cid, start, dur, body, js, css="", z=6, kind="graphics", lane=1):
    with open(os.path.join(HF, "compositions", f"{cid}.html"), "w") as f:
        f.write(scene(cid, body, js, css))
    SCENES.append((cid, start, dur, kind, z, lane))


def pop(sel, t, y=50, d=0.5):
    return f'    tl.fromTo("{sel}", {{ opacity: 0, y: {y}, scale: 0.96 }}, {{ opacity: 1, y: 0, scale: 1, duration: {d}, ease: "power4.out" }}, {t:.2f});'


def grow(sel, t, h, res=False):
    """Reveal a row by opening its height, so the card grows instead of showing empty space."""
    pad = "paddingTop: 14, paddingBottom: 14" if res else "paddingTop: 12, paddingBottom: 12"
    pad0 = "paddingTop: 0, paddingBottom: 0"
    return (f'    tl.fromTo("{sel}", {{ height: 0, {pad0}, opacity: 0 }}, {{ height: {h}, {pad}, opacity: 1, duration: 0.45, ease: "power3.out" }}, {t:.2f});')


def gone(sel, t):
    return f'    tl.to("{sel}", {{ opacity: 0, y: -40, filter: "blur(8px)", duration: 0.28, ease: "power2.in" }}, {t:.2f});'


for old in os.listdir(os.path.join(HF, "compositions")):
    os.remove(os.path.join(HF, "compositions", old))

# ---- W0 hook tag (0-6.3) ----
add("tag", 0.0, 6.3, f'''    <div class="band" style="top:640px"><div id="tg" class="glass" style="display:inline-flex; align-items:center; gap:16px; padding:20px 30px; border-radius:999px">
      <span style="width:16px;height:16px;border-radius:8px;background:{SAGE_L}"></span><span class="kick" style="color:#fff; font-size:32px">Real client story</span></div></div>''',
    "\n".join([pop("#tg", 0.25), gone("#tg", 6.0)]))

# ---- W1 question (6.55-9.5) ----
s = 6.55
add("ask", s, 2.95, f'''    <div class="band" style="top:620px"><div id="aq" style="font-weight:700; font-size:96px; line-height:1.02; letter-spacing:-0.025em; text-shadow:0 6px 30px rgba(0,0,0,.45)">
      Can he <span class="hl">actually</span> retire?</div></div>''',
    "\n".join([pop("#aq", wt(1, "figure") - s, 70), gone("#aq", 2.65)]))

# ---- W2 401k -> private pension (9.5-17.97) ----
s = 9.5
row = "display:flex; align-items:center; gap:22px; padding:26px 32px; border-radius:30px"
add("roll", s, 8.47, f'''    <div class="band">
      <div id="r1" style="{row}; background:rgba(32,36,45,0.82); border:2px solid rgba(255,255,255,0.25)">
        <div style="font-weight:700; font-size:54px">Old 401(k)</div><div style="font-weight:300; font-size:32px; color:{PLAT}">left at his old job</div></div>
      <div id="ar" style="text-align:center; font-size:64px; line-height:1; margin:14px 0; color:{SAGE_L}">&#8595;</div>
      <div id="r2" class="glass" style="{row}; flex-direction:column; align-items:flex-start; gap:6px">
        <div class="kick">Rolled into</div><div style="font-weight:700; font-size:58px">Private pension account</div>
        <div id="r3" style="font-weight:400; font-size:36px; color:{SOFT}">= <span class="hl" style="font-weight:600">guaranteed monthly income</span></div></div>
    </div>''',
    "\n".join([pop("#r1", wt(2, "401k") - s - 0.1), pop("#ar", wt(2, "roll") - s, 20, 0.35), pop("#r2", wt(2, "private") - s - 0.1),
               f'    tl.fromTo("#r3", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }}, {wt(2, "produce") - s:.2f});',
               gone(".band", 8.2)]))

# ---- W3 the paycheck math (17.97-31.26) ----
s = 17.97
eq_css = f"""
    .eq {{ position: absolute; left: 100px; right: 180px; bottom: 830px; padding: 30px 40px 26px; }}
    .ln {{ display: flex; align-items: center; font-size: 46px; font-weight: 500; padding: 12px 0; height: 72px; overflow: hidden; box-sizing: border-box; }}
    .ln b {{ font-weight: 700; font-size: 50px; width: 56px; color: #fff; }}
    .eq .kick {{ color: #fff; opacity: 0.92; }}
    .rule {{ height: 3px; background: rgba(255,255,255,0.5); margin: 10px 0 6px; transform-origin: left center; }}
    .res {{ display: flex; align-items: center; gap: 18px; font-size: 44px; font-weight: 600; padding: 14px 20px; border-radius: 24px; margin-top: 10px; height: 86px; overflow: hidden; box-sizing: border-box; }}
    .res i {{ font-style: normal; display: inline-flex; width: 58px; height: 58px; border-radius: 29px; align-items: center; justify-content: center; font-weight: 700; font-size: 40px; }}
    .pos {{ background: rgba(143,214,174,0.22); }} .pos i {{ background: {SAGE_L}; color: {CHAR}; }}
    .neg {{ background: rgba(193,196,200,0.18); }} .neg i {{ background: {PLAT}; color: {CHAR}; }}"""
add("math", s, 13.29, f'''    <div class="eq glass" id="eq">
      <div class="kick" id="ek">Can he retire? The math</div>
      <div class="ln" id="l1"><b></b><span>Private pension income</span></div>
      <div class="ln" id="l2"><b>+</b><span>Social Security</span></div>
      <div class="ln" id="l3"><b>&minus;</b><span>Monthly expenses</span></div>
      <div class="rule" id="ru"></div>
      <div class="res pos" id="p1"><i>+</i><span>Positive? <span class="hl">Retire today.</span></span></div>
      <div class="res neg" id="n1"><i>&minus;</i><span>Negative? We fix the gap.</span></div>
    </div>''',
    "\n".join([pop("#eq", 0.0, 80, 0.55), pop("#ek", 0.2, 20), pop("#l1", 0.35, 30),
               grow("#l2", wt(3, "social") - s - 0.05, 72), grow("#l3", wt(3, "monthly") - s - 0.05, 72),
               f'    tl.fromTo("#ru", {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.4, ease: "power3.inOut" }}, {wt(4, "guess") - s:.2f});',
               grow("#p1", wt(4, "positive") - s - 0.05, 86, res=True),
               f'    tl.fromTo("#p1", {{ scale: 1 }}, {{ scale: 1.05, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }}, {wt(4, "today") - s:.2f});',
               grow("#n1", wt(4, "negative") - s - 0.05, 86, res=True),
               gone("#eq", 12.95)]), eq_css)

# ---- W4 name card (31.26-35.25) ----
s = 31.26
add("name", s, 3.99, f'''    <div class="band" style="top:640px"><div id="nc" class="glass" style="padding:30px 38px">
      <div style="font-weight:700; font-size:64px; letter-spacing:-0.02em">Finance Keem</div>
      <div style="font-weight:300; font-size:34px; color:{SOFT}; margin-top:6px">Licensed fiduciary &middot; <span style="font-weight:700; color:{SAGE_L}">FK</span> MANAGEMENT</div></div></div>''',
    "\n".join([pop("#nc", 0.15), gone("#nc", 3.7)]))

# ---- W5 end card (35.25-44.5) ----
s = 35.25
end_css = f"""
    .logo {{ position: absolute; left: 260px; right: 290px; top: 600px; padding: 20px 26px; border-radius: 32px; background: rgba(246,247,249,0.96);
             box-shadow: 0 20px 50px rgba(0,0,0,0.3); }}
    .logo img {{ display: block; width: 100%; }}
    .cta {{ position: absolute; left: 110px; right: 180px; top: 800px; padding: 26px 36px; text-align: center; }}
    .c1 {{ font-weight: 400; font-size: 36px; color: rgba(246,247,249,0.92); }}
    .c2 {{ font-weight: 700; font-size: 70px; letter-spacing: 0.01em; margin: 4px 0; }}
    .c3 {{ font-weight: 400; font-size: 36px; color: rgba(246,247,249,0.92); }}
    .disc {{ position: absolute; left: 110px; right: 180px; top: 1110px; text-align: center; font-weight: 300; font-size: 28px; line-height: 1.35; color: rgba(246,247,249,0.78); }}"""
add("endcard", s, TOTAL - s, f'''    <div class="logo" id="lg"><img src="assets/logo.png" alt="FK Management by Finance Keem"></div>
    <div class="cta glass" id="cta"><div class="c1" id="c1">Within 10 years of retirement?</div>
      <div class="c2" id="c2">DM me <span class="hl">INCOME</span></div><div class="c3" id="c3">I'll stress-test your plan</div></div>
    <div class="disc" id="disc">Educational only. Not investment advice. Private pension account guarantees are subject to the claims-paying ability of the issuing insurer.</div>''',
    "\n".join([pop("#lg", 0.1, -50), pop("#cta", 0.35, 90), pop("#c1", 0.5, 20),
               f'    tl.fromTo("#c2", {{ opacity: 0, scale: 0.75 }}, {{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2.4)" }}, {wt(6, "dm") - s:.2f});',
               f'    tl.to("#c2", {{ scale: 1.06, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }}, {wt(6, "income") - s:.2f});',
               pop("#c3", wt(6, "stress") - s, 20), pop("#disc", 0.9, 10)]), end_css, z=8)

# ---- captions (VO words; none over the end card, which carries the CTA) ----
KEY = {"401k", "pension", "private", "social", "security", "positive", "negative", "retire", "today", "simple", "job", "expenses", "monthly"}
groups, cur = [], []
for w in words:
    if w["seg"] == 6:
        break
    cur.append(w)
    if len(cur) >= 4 or w["text"][-1] in ",.?!":
        groups.append(cur); cur = []
if cur:
    groups.append(cur)
items = []
for k, g in enumerate(groups):
    st = g[0]["start"]
    nxt = groups[k + 1][0]["start"] if k + 1 < len(groups) else g[-1]["end"] + 0.3
    en = min(nxt, g[-1]["end"] + 0.6)
    txt = " ".join(f'<i>{w["text"]}</i>' if re.sub(r"\W", "", w["text"]).lower() in KEY else w["text"] for w in g)
    items.append((st, en - st, txt))
cap_css = f"""    .cap {{ position: absolute; left: 100px; right: 180px; bottom: 700px; text-align: center; }}
    .cap span {{ display: inline-block; padding: 14px 28px; border-radius: 24px; background: rgba(32,36,45,0.88); color: #fff; font-weight: 600; font-size: 52px;
                 line-height: 1.15; letter-spacing: -0.01em; box-shadow: 0 10px 28px rgba(0,0,0,0.3); }}
    .cap i {{ font-style: normal; color: {SAGE_L}; }}"""
body = "\n".join(f'    <div class="cap clip" id="cap{k}" data-start="{st:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>'
                 for k, (st, d, t) in enumerate(items))
js = "\n".join(f'    tl.fromTo("#capt{k}", {{ opacity: 0, y: 14, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.14, ease: "back.out(2.2)" }}, {st:.3f});'
               for k, (st, d, t) in enumerate(items))
add("captions", 0, 35.25, body, js, cap_css, z=7, kind="captions", lane=2)

# ---------------- root index ----------------
media, kb = [], []
for sid, src, s, d, kind, (z0, z1), (y0, y1) in SHOTS:
    style = f"position:absolute; left:0; top:0; width:{W}px; height:{H}px; object-fit:cover; z-index:1"
    if kind == "img":
        media.append(f'      <img id="{sid}" class="clip shot" src="assets/{src}" data-start="{s}" data-duration="{d}" data-track-index="0" alt="" style="{style}">')
    else:
        media.append(f'      <video id="{sid}" class="clip shot" src="assets/{src}" data-start="{s}" data-duration="{d}" data-track-index="0" muted playsinline style="{style}"></video>')
    kb.append(f'      tl.fromTo("#{sid}", {{ scale: {z0}, y: {y0} }}, {{ scale: {z1}, y: {y1}, duration: {d}, ease: "none" }}, {s});')
hosts = "\n".join(
    f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.2f}" data-duration="{d:.2f}" '
    f'data-track-index="{lane}" data-track-kind="{k}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>'
    for c, s, d, k, z, lane in SCENES)
flashes = "\n".join(f'      tl.fromTo("#flash", {{ opacity: 0.8 }}, {{ opacity: 0, duration: 0.3, ease: "power2.out", immediateRender: false }}, {t});'
                    for t in (17.97, 31.26))
with open(os.path.join(HF, "index.html"), "w") as f:
    f.write(f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: {CHAR}; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: {FONT}; background: {CHAR}; }}
      .shot {{ transform-origin: 50% 40%; }}
      /* FK rule: charcoal #20242D at 60% on the text side, fading toward the subject */
      #grad {{ position: absolute; inset: 0; z-index: 3; pointer-events: none;
               background: linear-gradient(to top, rgba(32,36,45,0.6) 0%, rgba(32,36,45,0.6) 48%, rgba(32,36,45,0.15) 70%, rgba(32,36,45,0) 80%); }}
      #gradEnd {{ position: absolute; inset: 0; z-index: 4; background: linear-gradient(to top, rgba(32,36,45,0.94) 0%, rgba(32,36,45,0.88) 40%, rgba(32,36,45,0.25) 64%, rgba(32,36,45,0.05) 80%); }}
      #flash {{ position: absolute; inset: 0; z-index: 9; background: {SOFT}; opacity: 0; pointer-events: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
{chr(10).join(media)}
      <div id="grad"></div>
      <div id="gradEnd" class="clip" data-start="35.25" data-duration="{TOTAL - 35.25:.2f}" data-track-index="3"></div>
      <div id="flash"></div>
      <audio id="vo" class="clip" src="assets/vo.m4a" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-volume="1"></audio>
      <audio id="music" class="clip" src="assets/music.m4a" data-start="0" data-duration="{TOTAL}" data-track-index="5" data-volume="1"></audio>
{hosts}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(kb)}
      tl.fromTo("#gradEnd", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6 }}, 35.25);
{flashes}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print(len(SCENES), "scenes,", len(SHOTS), "shots,", len(items), "caption groups")
