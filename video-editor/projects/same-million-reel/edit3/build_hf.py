"""v3 "Same $1 Million": Hakeem on camera as the backbone, library inserts cut on his words (each clip once),
own animations for the money moments, one caption layer, spoken CTA over a slowed end card. No music; natural clip
audio comes through softly where it helps. Run: build_aroll.py -> prep_inserts.py -> this.
"""
import os, re, sys

E = os.path.dirname(os.path.abspath(__file__)); HF = os.path.join(E, "hf"); sys.path.insert(0, E)
from plan import PIC, PUNCH, CAP_LIFT, W as words, st, en, wt, END0, TOTAL

WD, HT = 1080, 1920
SAGE, SAGE_L, CHAR, WHITE, PLAT, SOFT = "#5CA581", "#8FD6AE", "#20252D", "#FFFFFF", "#C1C4C8", "#F6F7F9"
FONT = "'Outfit', sans-serif"
BASE_CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; color: {WHITE}; }}
    .bg {{ position: absolute; inset: 0; background: radial-gradient(120% 70% at 50% 35%, #2B3A36 0%, {CHAR} 62%); }}
    .grid {{ position: absolute; inset: 0; opacity: 0.07; background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
             background-size: 90px 90px; }}
    .glass {{ background: linear-gradient(140deg, rgba(92,165,129,0.9), rgba(32,37,45,0.94)); border: 2px solid rgba(255,255,255,0.36);
              backdrop-filter: blur(20px); border-radius: 34px; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }}
    .box {{ display: inline-block; background: {CHAR}; color: {WHITE}; border-radius: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }}
    .kick {{ font-weight: 600; font-size: 28px; letter-spacing: 0.16em; text-transform: uppercase; color: {SAGE_L}; }}
    .hl {{ color: {SAGE_L}; }}
"""


def scene(cid, body, js, css=""):
    return f"""<template>
  <style>
{BASE_CSS}
{css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{WD}" data-height="{HT}">
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
    SCENES.append((cid, round(start, 3), round(dur, 3), kind, z, lane))


def fin(sel, t, d=0.35, y=24):
    return f'    tl.fromTo("{sel}", {{ opacity: 0, y: {y} }}, {{ opacity: 1, y: 0, duration: {d}, ease: "power3.out", immediateRender: false }}, {max(t, 0):.2f});'


def draw(sel, t, d):
    return f'    tl.fromTo("{sel}", {{ strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: {d}, ease: "power2.inOut", immediateRender: false }}, {max(t, 0):.2f});'


for old in os.listdir(os.path.join(HF, "compositions")):
    os.remove(os.path.join(HF, "compositions", old))

# ---------- hook title (above his head) ----------
a, b = 0.0, wt("james", "he")
add("title", a, b - a, '    <div style="position:absolute; left:0; right:0; top:292px; text-align:center"><div class="box" id="tt" style="padding:10px 24px; font-weight:600; font-size:40px">Same <span class="hl">$1M</span>. Same income.</div></div>',
    '    tl.fromTo("#tt", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0);\n    tl.to("#tt", { opacity: 0, duration: 0.2 }, %.2f);' % (b - a - 0.25))

# ---------- animation 1: the crash ----------
a, b = st("crash"), st("selling")
d0, d1, d2 = (wt("crash", "down", k) - a for k in range(3))
pts = [(40, 70), (250, 92), (330, 210), (520, 238), (600, 320), (780, 340), (860, 400)]
segs = [f"M{pts[0][0]},{pts[0][1]} L{pts[1][0]},{pts[1][1]}", f"M{pts[1][0]},{pts[1][1]} L{pts[2][0]},{pts[2][1]} L{pts[3][0]},{pts[3][1]}",
        f"M{pts[3][0]},{pts[3][1]} L{pts[4][0]},{pts[4][1]} L{pts[5][0]},{pts[5][1]}", f"M{pts[5][0]},{pts[5][1]} L{pts[6][0]},{pts[6][1]}"]
crash_css = f"""    .chart {{ position: absolute; left: 90px; top: 420px; width: 900px; height: 560px; }}
    .lbl {{ position: absolute; font-weight: 700; font-size: 46px; padding: 6px 18px; border-radius: 16px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3); }}"""
path_tags = "\n".join(f'        <path id="cs{k}" d="{d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="{PLAT if k else SAGE_L}" stroke-width="10" stroke-linecap="butt" stroke-linejoin="round"/>' for k, d in enumerate(segs))
add("crash", a, b - a, f'''    <div class="bg"></div><div class="grid"></div>
    <div style="position:absolute; left:110px; right:180px; top:300px"><div class="kick" id="ck">James &middot; $1,000,000 in VOO</div>
      <div id="ct" style="font-weight:600; font-size:52px; margin-top:8px">Retires into a rough market</div></div>
    <div class="chart"><svg width="900" height="560" viewBox="0 0 900 560">
        <line x1="40" y1="500" x2="880" y2="500" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
{path_tags}
      </svg>
      <div class="lbl" id="l1" style="left:330px; top:120px">&minus;15%</div><div class="lbl" id="l2" style="left:600px; top:230px">&minus;10%</div>
      <div class="lbl" id="l3" style="left:720px; top:420px">&minus;5%</div></div>''',
    "\n".join([fin("#ck", 0.05), fin("#ct", 0.2), draw("#cs0", 0.1, max(d0 - 0.2, 0.3)), draw("#cs1", d0 - 0.1, 0.45), fin("#l1", d0 + 0.1, 0.25),
               draw("#cs2", d1 - 0.1, 0.45), fin("#l2", d1 + 0.1, 0.25), draw("#cs3", d2 - 0.1, 0.4), fin("#l3", d2 + 0.05, 0.25)]), crash_css, z=4)

# ---------- animation 2: the counter ----------
a, b = wt("selling", "in"), st("carol")
t575 = wt("selling", "$575") - a
add("counter", a, b - a, f'''    <div class="bg"></div><div class="grid"></div>
    <div style="position:absolute; left:110px; right:180px; top:430px">
      <div class="kick">James &middot; after just 3 years</div>
      <div id="num" style="font-weight:700; font-size:132px; letter-spacing:-0.03em; margin-top:10px">$1,000,000</div>
      <div style="margin-top:26px; height:26px; border-radius:13px; background:rgba(255,255,255,0.12); overflow:hidden">
        <div id="bar" style="height:100%; width:100%; border-radius:13px; background:{PLAT}; transform-origin:left center"></div></div>
      <div id="sub" style="font-weight:400; font-size:36px; margin-top:22px; color:rgba(255,255,255,0.9)">still taking <b>$60,000</b> a year &mdash; selling at the bottom</div>
    </div>''',
    "\n".join(['    const o = { v: 1000000 };',
               f'    tl.to(o, {{ v: 575000, duration: 1.1, ease: "power2.inOut", onUpdate: () => {{ document.querySelector("#num").textContent = "$" + Math.round(o.v / 1000).toLocaleString("en-US") + ",000"; }} }}, {max(t575 - 0.9, 0.2):.2f});',
               f'    tl.fromTo("#bar", {{ scaleX: 1 }}, {{ scaleX: 0.575, duration: 1.1, ease: "power2.inOut" }}, {max(t575 - 0.9, 0.2):.2f});',
               fin("#sub", 0.15)]), "", z=4)

# ---------- animation 3: the split ----------
a, b = st("pension"), wt("life", "every")
split_css = f"""    .pc {{ position: absolute; top: 640px; width: 384px; padding: 26px 28px; box-sizing: border-box; }}
    .pc .k {{ font-weight: 600; font-size: 28px; letter-spacing: 0.1em; text-transform: uppercase; }}
    .pc .v {{ font-weight: 700; font-size: 60px; margin-top: 6px; letter-spacing: -0.02em; }}
    .pc .s {{ font-weight: 400; font-size: 30px; margin-top: 8px; line-height: 1.25; }}"""
add("split", a, b - a, f'''    <div class="bg"></div><div class="grid"></div>
    <div style="position:absolute; left:110px; right:180px; top:330px"><div class="kick">Carol &middot; same $1M, same bad start</div>
      <div style="font-weight:600; font-size:52px; margin-top:8px">She buys income first</div></div>
    <div id="top" class="box" style="position:absolute; left:330px; top:500px; padding:14px 30px; font-weight:700; font-size:54px">$1,000,000</div>
    <div class="pc glass" id="pl" style="left:100px"><div class="k">Private pension account</div><div class="v">$500,000</div>
      <div class="s" id="ps">pays 6.5% = <b class="hl">$32,500/yr</b><br>for life</div></div>
    <div class="pc" id="pr" style="left:516px; background:rgba(255,255,255,0.08); border:2px solid rgba(255,255,255,0.25); border-radius:34px">
      <div class="k" style="color:{PLAT}">VOO</div><div class="v">$500,000</div><div class="s">stays invested</div></div>''',
    "\n".join([fin("#top", 0.05, 0.3, -20),
               f'    tl.fromTo("#pl", {{ opacity: 0, x: 120 }}, {{ opacity: 1, x: 0, duration: 0.45, ease: "power3.out", immediateRender: false }}, {wt("pension", "private") - a - 0.3:.2f});',
               f'    tl.fromTo("#pr", {{ opacity: 0, x: -120 }}, {{ opacity: 1, x: 0, duration: 0.45, ease: "power3.out", immediateRender: false }}, {wt("pension", "private") - a - 0.1:.2f});',
               '    tl.set("#ps", { opacity: 0 }, 0);',
               fin("#ps", wt("pension", "paying") - a, 0.3)]), split_css, z=4)

# ---------- animation 4: the race (6.6% market) ----------
a, b = st("less"), wt("year26", "carol")
X0, X1, Y0, Y1 = 60, 860, 60, 470          # chart box; years 0..30 on x, balance on y
def px(year): return X0 + (X1 - X0) * year / 30
james = [(0, 1.0), (3, 0.575), (8, 0.55), (14, 0.48), (20, 0.24), (24, 0.08), (26, 0.0)]
carol = [(0, 1.0), (3, 0.59), (8, 0.62), (14, 0.6), (20, 0.5), (26, 0.4), (30, 0.37)]
def path(points): return "M" + " L".join(f"{px(y):.0f},{Y1 - (Y1 - Y0) * v:.0f}" for y, v in points)
race_css = f"""    .chart {{ position: absolute; left: 90px; top: 480px; width: 900px; height: 560px; }}
    .tag {{ position: absolute; font-weight: 700; font-size: 34px; padding: 6px 16px; border-radius: 14px; white-space: nowrap; }}"""
add("race", a, b - a, f'''    <div class="bg"></div><div class="grid"></div>
    <div style="position:absolute; left:110px; right:180px; top:300px"><div class="kick">If markets average 6.6%</div>
      <div style="font-weight:600; font-size:52px; margin-top:8px">Same income. Same bad start.</div></div>
    <div class="chart"><svg width="900" height="560" viewBox="0 0 900 560">
        <line x1="{X0}" y1="{Y1}" x2="{X1}" y2="{Y1}" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
        <path id="rj" d="{path(james)}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="{PLAT}" stroke-width="9" stroke-linecap="butt" stroke-linejoin="round"/>
        <path id="rc" d="{path(carol)}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="{SAGE_L}" stroke-width="9" stroke-linecap="butt" stroke-linejoin="round"/>
        <text x="{X0}" y="{Y1 + 46}" fill="rgba(255,255,255,0.6)" font-family="Outfit" font-size="30">Year 0</text>
        <text x="{px(26) - 110:.0f}" y="{Y1 + 46}" fill="rgba(255,255,255,0.6)" font-family="Outfit" font-size="30">Year 26</text>
      </svg>
      <div class="tag" id="tj" style="left:{px(26) - 250:.0f}px; top:{Y1 - 70}px; background:rgba(255,255,255,0.12); border:2px solid rgba(255,255,255,0.3)">James: $0</div>
      <div class="tag glass" id="tc" style="left:{px(14) - 40:.0f}px; top:{Y1 - (Y1 - Y0) * 0.6 - 92:.0f}px; border-radius:14px">Carol: + $32,500/yr</div></div>''',
    "\n".join([draw("#rc", 0.2, 3.2), draw("#rj", 0.2, wt("less", "completely") - a),
               fin("#tj", wt("less", "completely") - a + 0.1, 0.3), fin("#tc", wt("year26", "26") - a, 0.3)]), race_css, z=4)

# ---------- proof chip on the panel insert ----------
k = [p for p in PIC if p[1] == "IMG_6408"][0]
add("chip", k[2], k[3] - k[2], '    <div style="position:absolute; left:100px; top:300px"><div class="box" id="ch" style="padding:12px 22px; font-size:32px">Finance Keem &middot; <span class="hl">licensed fiduciary</span></div></div>',
    fin("#ch", 0.05, 0.3, 12))

# ---------- end card ----------
a = END0
end_css = f"""
    .shade {{ position: absolute; inset: 0; background: linear-gradient(to top, rgba(32,37,45,0.94) 0%, rgba(32,37,45,0.85) 42%, rgba(32,37,45,0.2) 66%, rgba(32,37,45,0) 80%); }}
    .logo {{ position: absolute; left: 300px; right: 330px; top: 690px; padding: 14px 20px; border-radius: 30px; background: rgba(246,247,249,0.97); }}
    .logo img {{ display: block; width: 100%; }}
    .cta {{ position: absolute; left: 110px; right: 180px; top: 850px; padding: 24px 32px; text-align: center; }}
    .q {{ font-weight: 500; font-size: 36px; line-height: 1.25; }}
    .c2 {{ font-weight: 700; font-size: 76px; margin: 6px 0 2px; }}
    .c3 {{ font-weight: 400; font-size: 32px; color: rgba(255,255,255,0.92); }}
    .url {{ font-weight: 600; font-size: 32px; color: {SAGE_L}; margin-top: 4px; }}
    .disc {{ position: absolute; left: 110px; right: 180px; top: 1168px; text-align: center; font-weight: 300; font-size: 28px; line-height: 1.3; color: rgba(255,255,255,0.8); }}"""
cta_plan = wt("cta", "plan") - a
add("endcard", a, TOTAL - a, f'''    <div class="shade" id="sh"></div>
    <div class="logo" id="lg"><img src="assets/logo.png" alt="FK Management by Finance Keem"></div>
    <div class="cta glass" id="cta"><div class="q">Never thought about income after you stop working?</div>
      <div class="c2" id="kw">Comment <span class="hl">PLAN</span></div><div class="c3">for my free retirement quiz</div><div class="url">hello.financekeem.com</div></div>
    <div class="disc" id="disc">Hypothetical example. Not investment advice. Returns not guaranteed. Guarantees subject to the issuing insurer&#39;s claims-paying ability.</div>''',
    "\n".join(['    tl.fromTo("#sh", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);', fin("#lg", 0.3, 0.4, -20), fin("#cta", 0.6, 0.45, 40),
               f'    tl.fromTo("#kw", {{ scale: 1 }}, {{ scale: 1.08, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }}, {cta_plan:.2f});',
               fin("#disc", 1.0, 0.4, 0)]), end_css, z=8)

# ---------- captions: one layer, no bounce, #20252D box, one sage keyword ----------
toks = []
for w in words:
    if w["label"] == "cta": break
    t = w["text"]
    if toks and re.match(r"^[,.%&]", t) and toks[-1]["label"] == w["label"]:
        toks[-1] = dict(toks[-1], text=toks[-1]["text"] + t, end=w["end"])
    else:
        toks.append(dict(w))
for w in toks:
    if w["label"] == "carol" and w["text"].lower().startswith("meet"): w["text"] = "Meet"
KEY = re.compile(r"^(\$[\d,.]+|\d+(\.\d+)?%|million|paycheck|income|never|bills|selling|bottom|pension|life|completely|26|voo|risk|plan)$", re.I)
groups, cur = [], []
for w in toks:
    cur.append(w)
    if len(cur) >= 3 or w["text"][-1] in ",.?!":
        groups.append(cur); cur = []
if cur: groups.append(cur)
items = []
for k2, g in enumerate(groups):
    s0 = g[0]["start"]; nxt = groups[k2 + 1][0]["start"] if k2 + 1 < len(groups) else g[-1]["end"] + 0.3
    e0 = min(nxt, g[-1]["end"] + 0.4, END0)
    done, parts = False, []
    for w in g:
        if not done and KEY.match(re.sub(r"[,.?!]+$", "", w["text"])): parts.append(f"<i>{w['text']}</i>"); done = True
        else: parts.append(w["text"])
    items.append((s0, e0 - s0, " ".join(parts)))
cap_css = f"""    .cap {{ position: absolute; left: 140px; right: 140px; bottom: 700px; text-align: center; }}
    .cap span {{ display: inline-block; padding: 12px 26px; border-radius: 22px; background: {CHAR}; color: {WHITE}; font-weight: 600; font-size: 52px; line-height: 1.12; }}
    .cap i {{ font-style: normal; color: {SAGE}; }}"""
lift = []
for kind, key, a0, b0, ms, vol in PIC:
    if key in CAP_LIFT:
        lift += [f'    tl.set("#cw", {{ y: {CAP_LIFT[key]} }}, {a0:.3f});', f'    tl.set("#cw", {{ y: 0 }}, {b0:.3f});']
add("captions", 0, END0, '    <div id="cw" style="position:absolute; inset:0">\n' + "\n".join(f'    <div class="cap clip" id="cap{k2}" data-start="{s0:.3f}" data-duration="{d:.3f}" data-track-index="0"><span>{t}</span></div>' for k2, (s0, d, t) in enumerate(items)) + "\n    </div>",
    "\n".join(lift) + "\n" + "\n".join(f'    tl.fromTo("#cap{k2}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.06 }}, {s0:.3f});' for k2, (s0, d, t) in enumerate(items)), cap_css, z=7, kind="captions", lane=2)

# ---------- root ----------
media, sets = [], []
style = f"position:absolute; left:0; top:0; width:{WD}px; height:{HT}px; object-fit:cover"
media.append(f'      <video id="aroll" class="clip" src="assets/aroll.mp4" data-start="0" data-duration="{END0}" data-track-index="0" muted playsinline style="{style}; z-index:1; transform-origin:50% 15%"></video>')
for i, (kind, key, a, b, ms, vol) in enumerate(PIC):
    if kind in ("clip", "end"):
        audio = f'data-has-audio="true" data-volume="{vol}"' if vol else "muted"
        media.append(f'      <video id="v{i}" class="clip" src="assets/ins{i:02d}.mp4" data-start="{a:.3f}" data-duration="{b - a:.3f}" data-track-index="{1 if kind == "clip" else 3}" {audio} playsinline style="{style}; z-index:2; transform-origin:50% 40%"></video>')
        if kind == "clip" and b - a > 4.5:   # long insert: one punch-in halfway so it never sits still
            sets.append(f'      tl.set("#v{i}", {{ scale: 1.0 }}, {a:.3f});\n      tl.set("#v{i}", {{ scale: 1.14 }}, {a + (b - a) / 2:.3f});')
for t, s in PUNCH:
    sets.append(f'      tl.set("#aroll", {{ scale: {s} }}, {t:.3f});')
hosts = "\n".join(f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.3f}" data-duration="{d:.3f}" '
                  f'data-track-index="{lane}" data-track-kind="{k}" data-width="{WD}" data-height="{HT}" style="z-index:{z}"></div>' for c, s, d, k, z, lane in SCENES)
with open(os.path.join(HF, "index.html"), "w") as f:
    f.write(f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={WD}, height={HT}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {WD}px; height: {HT}px; overflow: hidden; background: {CHAR}; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: {FONT}; background: {CHAR}; overflow: hidden; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{WD}" data-height="{HT}">
{chr(10).join(media)}
      <audio id="vo" class="clip" src="assets/vo.m4a" data-start="0" data-duration="{TOTAL}" data-track-index="5" data-volume="1"></audio>
{hosts}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(sets)}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print(f"{len(SCENES)} scenes, {len(items)} captions, total {TOTAL}s")
