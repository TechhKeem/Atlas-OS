"""HyperFrames build for "Same $1 Million" — viral-optimised fk-reel (format C: VO from Retirement Scenes + library b-roll).

Hook in frame 1, a visual change every ~2-3 s, three named sections (1. ALL IN THE MARKET / 2. INCOME FIRST /
3. THE RESULT), glass widgets on the numbers, quotable closer, comment-bait end card ("James or Carol? Comment PLAN").
No music (fk-reel default). Run: python -I build_vo.py && python -I build_hf.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
HF = os.path.join(HERE, "hf")
W, H = 1080, 1920
SAGE, SAGE_L, CHAR, WHITE, PLAT, SOFT = "#5CA581", "#8FD6AE", "#20252D", "#FFFFFF", "#C1C4C8", "#F6F7F9"
FONT = "'Outfit', sans-serif"
words = json.load(open(os.path.join(HERE, "words_out.json")))
SEG = {}
for w in words:
    SEG.setdefault(w["label"], w["start"])
VO_END = max(w["end"] for w in words)
END_START = round(VO_END + 0.15, 2)
TOTAL = round(END_START + 6.8, 2)


def wt(label, text, nth=0):
    hits = [w["start"] for w in words if w["label"] == label and re.sub(r"[^\w$]", "", w["text"]).lower() == text.lower()]
    return hits[nth]


# ---------------- shots: (src, start, kind, zoom from->to, y from->to, media_start) — each runs to the next start ----------------
S = SEG
SHOTS = [
    ("7358_hope_speaking.jpg", 0.0, "img", (1.14, 1.04), (0, 0)),
    ("6405_ws_stage.jpg", 2.4, "img", (1.0, 1.08), (0, 0)),
    ("8770_profile.jpg", 5.2, "img", (1.12, 1.02), (0, 0)),
    ("7020_procon.jpg", 7.3, "img", (1.12, 1.04), (0, 0)),
    ("8718_phone.jpg", S["james"], "img", (1.0, 1.08), (0, 0)),
    ("6364_courtyard.jpg", 12.6, "img", (1.10, 1.02), (0, 0)),
    ("7105_hillside.jpg", S["crash"], "img", (1.0, 1.08), (0, 0)),
    ("6361_walking.jpg", 18.6, "img", (1.10, 1.02), (0, 0)),
    ("8720_sunset.jpg", S["selling"], "img", (1.0, 1.08), (0, 0)),
    ("7356_seated_phone.jpg", 25.2, "img", (1.10, 1.03), (0, 0)),
    ("6425_handshake.jpg", S["carol"], "img", (1.12, 1.04), (0, 0)),
    ("8752_camera_crew.mp4", S["income"], "video", (1.06, 1.0), (0, 0)),
    ("6751_mug.jpg", S["pension"], "img", (1.0, 1.08), (0, 0)),
    ("8793_rooftop.jpg", 36.5, "img", (1.10, 1.02), (0, 0)),
    ("5362_cornhole_child.mp4", S["life"], "video", (1.0, 1.05), (0, 0)),
    ("8750_micup.jpg", 42.0, "img", (1.10, 1.02), (0, 0)),
    ("0985_stage.mp4", S["less"], "video", (1.0, 1.06), (0, 0)),
    ("6414_ws_group.jpg", 48.6, "img", (1.10, 1.02), (0, 0)),
    ("8739_lounge.jpg", S["year26"], "img", (1.0, 1.08), (0, 0)),
    ("6430_posed.jpg", 54.2, "img", (1.10, 1.02), (0, 0)),
    ("wsl22_headshot.jpg", S["closer"], "img", (1.04, 1.12), (0, -130)),
]
starts = [s for _, s, *_ in SHOTS] + [TOTAL]

BASE_CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; color: {WHITE}; }}
    .glass {{ background: linear-gradient(140deg, rgba(92,165,129,0.92), rgba(32,37,45,0.94)); border: 2px solid rgba(255,255,255,0.38);
              backdrop-filter: blur(20px); border-radius: 38px; box-shadow: 0 24px 60px rgba(0,0,0,0.35); }}
    .box {{ display: inline-block; background: {CHAR}; color: {WHITE}; border-radius: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }}
    .hl {{ color: {SAGE_L}; }}
    .kick {{ font-weight: 600; font-size: 28px; letter-spacing: 0.18em; text-transform: uppercase; color: {WHITE}; opacity: 0.92; }}
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
    SCENES.append((cid, round(start, 2), round(dur, 2), kind, z, lane))


def pop(sel, t, y=40, d=0.45):
    return f'    tl.fromTo("{sel}", {{ opacity: 0, y: {y}, scale: 0.95 }}, {{ opacity: 1, y: 0, scale: 1, duration: {d}, ease: "power4.out" }}, {max(t, 0):.2f});'


def grow(sel, t, h):
    return f'    tl.fromTo("{sel}", {{ height: 0, opacity: 0 }}, {{ height: {h}, opacity: 1, duration: 0.42, ease: "power3.out" }}, {max(t, 0):.2f});'


def gone(sel, t):
    return f'    tl.to("{sel}", {{ opacity: 0, y: -30, filter: "blur(8px)", duration: 0.25, ease: "power2.in" }}, {t:.2f});'


for old in os.listdir(os.path.join(HF, "compositions")):
    os.remove(os.path.join(HF, "compositions", old))

# ---- top band: title (hook) then section labels — #20252D box, Outfit 600 ----
top_css = """    .top { position: absolute; left: 100px; right: 180px; top: 300px; text-align: left; }
    .top .box { padding: 18px 28px; font-weight: 600; font-size: 50px; line-height: 1.12; letter-spacing: -0.01em; }
    .chip { margin-top: 14px; padding: 12px 22px !important; font-size: 30px !important; font-weight: 400 !important; }"""
add("title", 0, SEG["james"], f'''    <div class="top"><div class="box" id="tt">Same <span class="hl">$1 million.</span><br>Same income.</div><br>
      <div class="box chip" id="tc">Licensed fiduciary &middot; 200+ families helped</div></div>''',
    "\n".join(['    tl.fromTo("#tt", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, 0);',
               pop("#tc", 1.4, 20), gone(".top", SEG["james"] - 0.3)]), top_css)
LABELS = [("lab1", "1. ALL IN THE MARKET", SEG["james"], SEG["carol"]), ("lab2", "2. INCOME FIRST", SEG["carol"], SEG["less"]),
          ("lab3", "3. THE RESULT", SEG["less"], SEG["closer"])]
for cid, txt, a, b in LABELS:
    add(cid, a, b - a, f'    <div class="top"><div class="box" id="{cid}b">{txt}</div></div>',
        "\n".join([pop(f"#{cid}b", 0.05, 20), gone(f"#{cid}b", b - a - 0.28)]), top_css)

# ---- widget cards: bottom-anchored above the captions, grow row by row ----
card_css = f"""
    .card {{ position: absolute; left: 100px; right: 180px; bottom: 830px; padding: 26px 34px 22px; }}
    .row {{ display: flex; align-items: center; gap: 16px; font-size: 42px; font-weight: 500; height: 64px; overflow: hidden; }}
    .row b {{ font-weight: 700; }}
    .chips {{ display: flex; gap: 14px; height: 78px; overflow: hidden; align-items: center; }}
    .chips span {{ font-weight: 700; font-size: 44px; padding: 6px 20px; border-radius: 18px; background: rgba(32,37,45,0.75); color: {WHITE}; }}
    .bal {{ display: flex; align-items: baseline; gap: 16px; height: 86px; overflow: hidden; font-size: 34px; font-weight: 400; }}
    .bal .v {{ position: relative; display: inline-block; width: 330px; height: 76px; }}
    .bal .v span {{ position: absolute; left: 0; top: 0; font-weight: 700; font-size: 64px; letter-spacing: -0.02em; }}
    .ok, .no {{ display: inline-flex; width: 50px; height: 50px; border-radius: 25px; align-items: center; justify-content: center; font-weight: 700; font-size: 32px; flex: none; }}
    .ok {{ background: {SAGE_L}; color: {CHAR}; }} .no {{ background: {PLAT}; color: {CHAR}; }}
    .sm {{ font-size: 32px; font-weight: 400; color: rgba(255,255,255,0.9); }}"""

# James (9.65 -> carol)
a = SEG["james"]
add("james", a, SEG["carol"] - a, f'''    <div class="card glass" id="jc">
      <div class="kick">James</div>
      <div class="row" id="j1"><b>$1,000,000</b>&nbsp;all in VOO</div>
      <div class="row" id="j2">Takes out 6% = <b class="hl">$60,000/yr</b></div>
      <div class="chips" id="jch"><span id="c1">&minus;15%</span><span id="c2">&minus;10%</span><span id="c3">&minus;5%</span></div>
      <div class="bal" id="jb">Balance <div class="v"><span id="b0">$1,000,000</span><span id="b1" style="opacity:0">$575,000</span></div></div>
    </div>''',
    "\n".join([pop("#jc", 0.0, 60, 0.5), grow("#j1", wt("james", "puts") - a, 64), grow("#j2", wt("james", "takes") - a, 64),
               '    tl.set("#jch", { height: 0 }, 0);',
               f'    tl.to("#jch", {{ height: 78, duration: 0.3, ease: "power3.out" }}, {wt("crash", "down") - a - 0.1:.2f});',
               pop("#c1", wt("crash", "down", 0) - a, 20, 0.3), pop("#c2", wt("crash", "down", 1) - a, 20, 0.3), pop("#c3", wt("crash", "down", 2) - a, 20, 0.3),
               grow("#jb", wt("selling", "three") - a, 86),
               f'    tl.to("#b0", {{ opacity: 0, y: -30, duration: 0.25 }}, {wt("selling", "$575") - a:.2f});',
               f'    tl.fromTo("#b1", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)", immediateRender: false }}, {wt("selling", "$575") - a:.2f});',
               f'    tl.to("#b1", {{ color: "{PLAT}", duration: 0.3 }}, {wt("selling", "$575") - a + 0.4:.2f});',
               gone("#jc", SEG["carol"] - a - 0.25)]), card_css)

# Carol (carol -> less)
a = SEG["carol"]
add("carol", a, SEG["less"] - a, f'''    <div class="card glass" id="cc">
      <div class="kick">Carol &middot; same $1M, same bad start</div>
      <div class="row" id="k1"><b>$500,000</b>&nbsp;&rarr; private pension account</div>
      <div class="row" id="k2">pays 6.5% = <b class="hl">$32,500/yr for life</b></div>
      <div class="row sm" id="k3">+ $500,000 in VOO &rarr; $27,500/yr = same $60K</div>
    </div>''',
    "\n".join([pop("#cc", 0.0, 60, 0.5), grow("#k1", wt("pension", "puts") - a, 64), grow("#k2", wt("life", "$32") - a, 64),
               grow("#k3", wt("life", "year") - a + 0.2, 64), gone("#cc", SEG["less"] - a - 0.25)]), card_css)

# Result (less -> closer)
a = SEG["less"]
add("result", a, SEG["closer"] - a, f'''    <div class="card glass" id="rc">
      <div class="kick" id="rk">If the market averages 6.6%</div>
      <div class="row" id="r1"><span class="no">&times;</span>James: <b>$0 by year 26</b></div>
      <div class="row" id="r2"><span class="ok">&#10003;</span><span>Carol: still invested + <b class="hl">$32,500/yr</b></span></div>
    </div>''',
    "\n".join([pop("#rc", 0.0, 60, 0.5), grow("#r1", wt("less", "runs") - a, 64),
               grow("#r2", wt("year26", "carol") - a, 64),
               gone("#rc", SEG["closer"] - a - 0.25)]), card_css)

# End card (after the closer)
a = END_START
end_css = f"""
    .logo {{ position: absolute; left: 300px; right: 330px; top: 610px; padding: 14px 20px; border-radius: 30px; background: rgba(246,247,249,0.97);
             box-shadow: 0 20px 50px rgba(0,0,0,0.3); }}
    .logo img {{ display: block; width: 100%; }}
    .cta {{ position: absolute; left: 110px; right: 180px; top: 790px; padding: 24px 32px; text-align: center; }}
    .q {{ font-weight: 600; font-size: 46px; }}
    .c2 {{ font-weight: 700; font-size: 74px; letter-spacing: 0.01em; margin: 2px 0; }}
    .c3 {{ font-weight: 400; font-size: 34px; color: rgba(255,255,255,0.92); }}
    .url {{ font-weight: 600; font-size: 34px; color: {SAGE_L}; margin-top: 4px; }}
    .disc {{ position: absolute; left: 110px; right: 180px; top: 1102px; text-align: center; font-weight: 300; font-size: 28px; line-height: 1.32;
             color: rgba(255,255,255,0.8); }}"""
add("endcard", a, TOTAL - a, f'''    <div class="logo" id="lg"><img src="assets/logo.png" alt="FK Management by Finance Keem"></div>
    <div class="cta glass" id="cta"><div class="q" id="q">James or Carol?</div><div class="c2" id="kw">Comment <span class="hl">PLAN</span></div>
      <div class="c3">for my free retirement quiz</div><div class="url">hello.financekeem.com</div></div>
    <div class="disc" id="disc">Hypothetical example. Not investment advice. Returns not guaranteed. Guarantees subject to the issuing insurer&#39;s claims-paying ability.</div>''',
    "\n".join([pop("#lg", 0.05, -40), pop("#cta", 0.2, 80, 0.5),
               '    tl.fromTo("#kw", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.55);',
               '    tl.to("#kw", { scale: 1.06, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.4);',
               pop("#disc", 0.35, 10)]), end_css, z=8)

# ---- captions: merge split tokens ($60 ,000 / S &P / 6 %), 2-4 words, #20252D box, one sage keyword ----
toks = []
for w in words:
    t = w["text"]
    if toks and (re.match(r"^[,.%&]", t) and not re.match(r"^\.\.\.", t)) and w["seg"] == toks[-1]["seg"]:
        toks[-1] = dict(toks[-1], text=toks[-1]["text"] + t, end=w["end"])
    else:
        toks.append(dict(w))
for w in toks:
    if w["label"] == "carol" and w["text"].lower().startswith("meet"):
        w["text"] = "Meet"
KEY = re.compile(r"^(\$[\d,.]+|\d+(\.\d+)?%|million|paycheck|income|never|run|bills|selling|bottom|pension|life|james|carol|completely|26|vOO|s&p)$", re.I)
groups, cur = [], []
for w in toks:
    cur.append(w)
    if len(cur) >= 3 or w["text"][-1] in ",.?!":
        groups.append(cur); cur = []
if cur:
    groups.append(cur)
items = []
for k, g in enumerate(groups):
    st = g[0]["start"]
    nxt = groups[k + 1][0]["start"] if k + 1 < len(groups) else g[-1]["end"] + 0.3
    en = min(nxt, g[-1]["end"] + 0.5)
    hl_done = False
    parts = []
    for w in g:
        bare = re.sub(r"[,.?!]+$", "", w["text"])
        if not hl_done and KEY.match(bare):
            parts.append(f"<i>{w['text']}</i>"); hl_done = True
        else:
            parts.append(w["text"])
    items.append((st, en - st, " ".join(parts)))
cap_css = f"""    .cap {{ position: absolute; left: 100px; right: 180px; bottom: 700px; text-align: center; }}
    .cap span {{ display: inline-block; padding: 14px 28px; border-radius: 24px; background: {CHAR}; color: {WHITE}; font-weight: 600; font-size: 54px;
                 line-height: 1.15; letter-spacing: -0.01em; box-shadow: 0 10px 28px rgba(0,0,0,0.3); }}
    .cap i {{ font-style: normal; color: {SAGE}; }}"""
body = "\n".join(f'    <div class="cap clip" id="cap{k}" data-start="{st:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>'
                 for k, (st, d, t) in enumerate(items))
js = "\n".join(f'    tl.fromTo("#capt{k}", {{ opacity: 0, y: 12, scale: 0.92 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.12, ease: "back.out(2.2)" }}, {st:.3f});'
               for k, (st, d, t) in enumerate(items))
add("captions", 0, END_START, body, js, cap_css, z=7, kind="captions", lane=2)

# ---------------- root ----------------
media, kb = [], []
for i, (src, s, kind, (z0, z1), (y0, y1)) in enumerate(SHOTS):
    d = round(starts[i + 1] - s, 2)
    sid = f"s{i + 1}"
    style = f"position:absolute; left:0; top:0; width:{W}px; height:{H}px; object-fit:cover; z-index:1"
    if kind == "img":
        media.append(f'      <img id="{sid}" class="clip shot" src="assets/{src}" data-start="{s:.2f}" data-duration="{d}" data-track-index="0" alt="" style="{style}">')
    else:
        media.append(f'      <video id="{sid}" class="clip shot" src="assets/{src}" data-start="{s:.2f}" data-duration="{d}" data-track-index="0" muted playsinline style="{style}"></video>')
    kb.append(f'      tl.fromTo("#{sid}", {{ scale: {z0}, y: {y0} }}, {{ scale: {z1}, y: {y1}, duration: {d}, ease: "none" }}, {s:.2f});')
hosts = "\n".join(
    f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.2f}" data-duration="{d:.2f}" '
    f'data-track-index="{lane}" data-track-kind="{k}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>'
    for c, s, d, k, z, lane in SCENES)
flashes = "\n".join(f'      tl.fromTo("#flash", {{ opacity: 0.75 }}, {{ opacity: 0, duration: 0.28, ease: "power2.out", immediateRender: false }}, {t:.2f});'
                    for t in (SEG["carol"], SEG["less"]))
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
      /* FK rule: charcoal #20252D at 60% on the text side, fading toward the subject */
      #grad {{ position: absolute; inset: 0; z-index: 3; pointer-events: none;
               background: linear-gradient(to top, rgba(32,37,45,0.6) 0%, rgba(32,37,45,0.6) 46%, rgba(32,37,45,0.12) 68%, rgba(32,37,45,0) 78%),
                           linear-gradient(to bottom, rgba(32,37,45,0.35) 0%, rgba(32,37,45,0) 18%); }}
      #gradEnd {{ position: absolute; inset: 0; z-index: 4; background: linear-gradient(to top, rgba(32,37,45,0.95) 0%, rgba(32,37,45,0.88) 40%, rgba(32,37,45,0.25) 64%, rgba(32,37,45,0.05) 80%); }}
      #flash {{ position: absolute; inset: 0; z-index: 9; background: {SOFT}; opacity: 0; pointer-events: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
{chr(10).join(media)}
      <div id="grad"></div>
      <div id="gradEnd" class="clip" data-start="{END_START}" data-duration="{TOTAL - END_START:.2f}" data-track-index="3"></div>
      <div id="flash"></div>
      <audio id="vo" class="clip" src="assets/vo.m4a" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-volume="1"></audio>
{hosts}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(kb)}
      tl.fromTo("#gradEnd", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5 }}, {END_START});
{flashes}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print(f"{len(SCENES)} scenes, {len(SHOTS)} shots, {len(items)} captions; VO ends {VO_END:.2f}, end card {END_START}-{TOTAL}")
gaps = [round(b - a, 2) for a, b in zip(starts, starts[1:])]
print("shot lengths:", gaps)
