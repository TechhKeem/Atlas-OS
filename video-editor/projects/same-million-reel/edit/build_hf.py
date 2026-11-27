"""HyperFrames build for "Same $1 Million" (fk-reel, format C) — v2: video-first, per-shot text placement.

Every text block (hook title, glass card, caption) moves at each cut to the band chosen for that shot in shots.py,
so nothing covers Hakeem or the people with him. Cards are compact "tickers" (one big value + one small line) that
change on the spoken word, so they fit the free band of any shot. No music. Run: build_vo.py -> prep_clips.py ->
prep_media.py (stills) -> this.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
HF = os.path.join(HERE, "hf")
sys.path.insert(0, HERE)
from shots import shots

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
SIDE_X = {"L": 100, "R": 340, "C": 260}
BLOCK_W = 560
CARD_H = 196
TITLE_H = 228


def wt(label, text, nth=0):
    hits = [w["start"] for w in words if w["label"] == label and re.sub(r"[^\w$]", "", w["text"]).lower() == text.lower()]
    return hits[nth]


SH = shots(SEG)
STARTS = [r[2] for r in SH] + [TOTAL]


def section(t):
    if t < SEG["james"]: return "hook"
    if t < SEG["closer"]: return "card"
    return "closer"


def place_sets(sel, a, b, kind):
    """tl.set x/y for `sel` at every shot start inside [a, b) (scene-local times). kind: title|card|cap."""
    out = []
    for i, (src, ms, st, ty, side) in enumerate(SH):
        en = STARTS[i + 1]
        if en <= a or st >= b: continue
        x = SIDE_X[side]
        if kind == "cap":
            sec = section(st)
            y = ty + (TITLE_H + 14 if sec == "hook" else CARD_H + 16 if sec == "card" else 0)
        else:
            y = ty
        out.append(f'    tl.set("{sel}", {{ x: {x}, y: {y} }}, {max(st - a, 0):.3f});')
    return "\n".join(out)


BASE_CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; color: {WHITE}; }}
    .blk {{ position: absolute; left: 0; top: 0; width: {BLOCK_W}px; }}
    .glass {{ background: linear-gradient(140deg, rgba(92,165,129,0.93), rgba(32,37,45,0.95)); border: 2px solid rgba(255,255,255,0.38);
              backdrop-filter: blur(20px); border-radius: 34px; box-shadow: 0 20px 50px rgba(0,0,0,0.35); }}
    .box {{ display: inline-block; background: {CHAR}; color: {WHITE}; border-radius: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }}
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
    SCENES.append((cid, round(start, 2), round(dur, 2), kind, z, lane))


def pop(sel, t, d=0.4):
    return f'    tl.fromTo("{sel}", {{ opacity: 0, scale: 0.94 }}, {{ opacity: 1, scale: 1, duration: {d}, ease: "power4.out" }}, {max(t, 0):.2f});'


def fade_out(sel, t):
    return f'    tl.to("{sel}", {{ opacity: 0, duration: 0.22, ease: "power2.in" }}, {t:.2f});'


for old in os.listdir(os.path.join(HF, "compositions")):
    os.remove(os.path.join(HF, "compositions", old))

# ---- hook title + proof chip ----
a, b = 0.0, SEG["james"]
title_css = """    .tt { padding: 18px 28px; font-weight: 600; font-size: 50px; line-height: 1.12; letter-spacing: -0.01em; }
    .chip { margin-top: 14px; padding: 12px 22px; font-size: 30px; font-weight: 400; }"""
add("title", a, b - a, f'''    <div class="blk" id="tb"><div class="box tt" id="tt">Same <span class="hl">$1 million.</span><br>Same income.</div><br>
      <div class="box chip" id="tc">Licensed fiduciary &middot; 200+ families</div></div>''',
    "\n".join([place_sets("#tb", a, b, "title"),
               '    tl.fromTo("#tt", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, 0);',
               pop("#tc", 1.4), fade_out("#tb", b - a - 0.25)]), title_css)

# ---- ticker cards ----
card_css = f"""
    .card {{ height: {CARD_H}px; padding: 20px 30px; box-sizing: border-box; overflow: hidden; }}
    .kick {{ font-weight: 600; font-size: 25px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.92; white-space: nowrap; }}
    .stage {{ position: relative; height: 128px; margin-top: 8px; }}
    .st {{ position: absolute; left: 0; top: 0; width: 100%; opacity: 0; }}
    .big {{ font-weight: 700; font-size: 60px; line-height: 1.05; letter-spacing: -0.02em; white-space: nowrap; }}
    .small {{ font-weight: 400; font-size: 30px; line-height: 1.25; margin-top: 8px; color: rgba(255,255,255,0.92); }}
    .r {{ display: flex; align-items: center; gap: 14px; font-size: 37px; font-weight: 500; height: 56px; opacity: 0; white-space: nowrap; }}
    .r b {{ font-weight: 700; }}
    .ok, .no {{ display: inline-flex; width: 44px; height: 44px; border-radius: 22px; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; flex: none; }}
    .ok {{ background: {SAGE_L}; color: {CHAR}; }} .no {{ background: {PLAT}; color: {CHAR}; }}"""


def ticker(cid, a, b, kick, states):
    """states: [(t_abs, big_html, small_html)] — each replaces the previous on its word."""
    body = [f'    <div class="blk" id="{cid}b"><div class="card glass" id="{cid}c"><div class="kick">{kick}</div><div class="stage">']
    js = [place_sets(f"#{cid}b", a, b, "card"),
          f'    tl.fromTo("#{cid}c", {{ opacity: 0, scale: 0.94 }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }}, 0.02);']
    for k, (t, big, small) in enumerate(states):
        body.append(f'      <div class="st" id="{cid}s{k}"><div class="big">{big}</div><div class="small">{small}</div></div>')
        lt = max(t - a, 0.05)
        if k:
            js.append(f'    tl.to("#{cid}s{k - 1}", {{ opacity: 0, y: -24, duration: 0.2, ease: "power2.in" }}, {lt - 0.05:.2f});')
        js.append(f'    tl.fromTo("#{cid}s{k}", {{ opacity: 0, y: 24 }}, {{ opacity: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: false }}, {lt:.2f});')
    body.append("    </div></div></div>")
    for k, extra in enumerate(EXTRA.get(cid, [])):
        js.append(f'    tl.fromTo("#{extra[0]}", {{ opacity: 0, scale: 0.7 }}, {{ opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.4)", immediateRender: false }}, {extra[1] - a:.2f});')
    js.append(fade_out(f"#{cid}c", b - a - 0.25))
    add(cid, a, b - a, "\n".join(body), "\n".join(js), card_css)


EXTRA = {"james": [("d1", wt("crash", "down", 0)), ("d2", wt("crash", "down", 1)), ("d3", wt("crash", "down", 2))]}
ticker("james", SEG["james"], SEG["carol"], "1 &middot; All in the market &middot; James", [
    (SEG["james"] + 0.1, "$1,000,000", "all in VOO (S&amp;P 500)"),
    (wt("james", "takes"), "<span class='hl'>$60,000</span>/yr", "takes out 6% a year"),
    (wt("crash", "down", 0) - 0.4, "<span id='d1' style='opacity:0'>&minus;15%</span> <span id='d2' style='opacity:0'>&minus;10%</span> <span id='d3' style='opacity:0'>&minus;5%</span>", "retires into a rough market"),
    (wt("selling", "bills"), "Still $60,000/yr", "selling at the bottom"),
    (wt("selling", "$575"), "$575,000", "left after just 3 years"),
])
ticker("carol", SEG["carol"], SEG["less"], "2 &middot; Income first &middot; Carol", [
    (SEG["carol"] + 0.1, "Same $1M", "same $60K/yr &middot; same bad start"),
    (wt("pension", "puts"), "$500,000", "&rarr; private pension account"),
    (wt("life", "$32"), "<span class='hl'>$32,500</span>/yr", "6.5% &middot; for the rest of her life"),
    (wt("life", "no"), "+ $27,500/yr", "from $500K in VOO = same $60K"),
])
a, b = SEG["less"], SEG["closer"]
add("result", a, b - a, f'''    <div class="blk" id="rcb"><div class="card glass" id="rcc"><div class="kick">3 &middot; If markets average 6.6%</div>
      <div style="margin-top:14px"><div class="r" id="r1"><span class="no">&times;</span>James: <b>$0 by year 26</b></div>
      <div class="r" id="r2" style="margin-top:10px"><span class="ok">&#10003;</span>Carol: <b class="hl">+$32,500/yr</b> for life</div></div></div></div>''',
    "\n".join([place_sets("#rcb", a, b, "card"),
               '    tl.fromTo("#rcc", { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out" }, 0.02);',
               f'    tl.fromTo("#r1", {{ opacity: 0, x: -20 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }}, {wt("less", "runs") - a:.2f});',
               f'    tl.fromTo("#r2", {{ opacity: 0, x: -20 }}, {{ opacity: 1, x: 0, duration: 0.35, ease: "power3.out" }}, {wt("year26", "carol") - a:.2f});',
               fade_out("#rcc", b - a - 0.25)]), card_css)

# ---- end card ----
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
    <div class="cta glass" id="cta"><div class="q">James or Carol?</div><div class="c2" id="kw">Comment <span class="hl">PLAN</span></div>
      <div class="c3">for my free retirement quiz</div><div class="url">hello.financekeem.com</div></div>
    <div class="disc" id="disc">Hypothetical example. Not investment advice. Returns not guaranteed. Guarantees subject to the issuing insurer&#39;s claims-paying ability.</div>''',
    "\n".join(['    tl.fromTo("#lg", { opacity: 0, y: -40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.05);',
               '    tl.fromTo("#cta", { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.5, ease: "power4.out" }, 0.2);',
               '    tl.fromTo("#kw", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.4)" }, 0.55);',
               '    tl.to("#kw", { scale: 1.06, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.4);',
               '    tl.fromTo("#disc", { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.35);']), end_css, z=8)

# ---- captions (follow the text stack of each shot) ----
toks = []
for w in words:
    t = w["text"]
    if toks and re.match(r"^[,.%&]", t) and w["seg"] == toks[-1]["seg"]:
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
    done, parts = False, []
    for w in g:
        if not done and KEY.match(re.sub(r"[,.?!]+$", "", w["text"])):
            parts.append(f"<i>{w['text']}</i>"); done = True
        else:
            parts.append(w["text"])
    items.append((st, en - st, " ".join(parts)))
cap_css = f"""    .cap {{ position: absolute; left: 0; top: 0; width: 100%; text-align: center; }}
    .cap span {{ display: inline-block; padding: 12px 26px; border-radius: 22px; background: {CHAR}; color: {WHITE}; font-weight: 600; font-size: 52px;
                 line-height: 1.12; letter-spacing: -0.01em; box-shadow: 0 10px 28px rgba(0,0,0,0.3); }}
    .cap i {{ font-style: normal; color: {SAGE}; }}"""
body = '    <div class="blk" id="capwrap">\n' + "\n".join(
    f'      <div class="cap clip" id="cap{k}" data-start="{st:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>'
    for k, (st, d, t) in enumerate(items)) + "\n    </div>"
js = place_sets("#capwrap", 0, END_START, "cap") + "\n" + "\n".join(
    f'    tl.fromTo("#capt{k}", {{ opacity: 0, scale: 0.92 }}, {{ opacity: 1, scale: 1, duration: 0.12, ease: "back.out(2.2)" }}, {st:.3f});'
    for k, (st, d, t) in enumerate(items))
add("captions", 0, END_START, body, js, cap_css, z=7, kind="captions", lane=2)

# ---------------- root ----------------
media, kb = [], []
for i, (src, ms, s, ty, side) in enumerate(SH):
    d = round(STARTS[i + 1] - s, 3)
    sid = f"s{i + 1}"
    style = f"position:absolute; left:0; top:0; width:{W}px; height:{H}px; object-fit:cover; z-index:1"
    if src.endswith(".jpg"):
        media.append(f'      <img id="{sid}" class="clip shot" src="assets/{src}" data-start="{s:.3f}" data-duration="{d}" data-track-index="0" alt="" style="{style}">')
        z0, z1, y0, y1 = (1.04, 1.12, -130, -130) if src.startswith("wsl22") else ((1.0, 1.08, 0, 0) if i % 2 else (1.10, 1.02, 0, 0))
        kb.append(f'      tl.fromTo("#{sid}", {{ scale: {z0}, y: {y0} }}, {{ scale: {z1}, y: {y1}, duration: {d}, ease: "none" }}, {s:.3f});')
    else:
        media.append(f'      <video id="{sid}" class="clip shot" src="assets/shot{i + 1:02d}.mp4" data-start="{s:.3f}" data-duration="{d}" data-track-index="0" muted playsinline style="{style}"></video>')
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
      #grad {{ position: absolute; inset: 0; z-index: 3; pointer-events: none;
               background: linear-gradient(to bottom, rgba(32,37,45,0.45) 0%, rgba(32,37,45,0.2) 22%, rgba(32,37,45,0) 34%); }}
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
n_img = sum(1 for r in SH if r[0].endswith(".jpg"))
print(f"{len(SCENES)} scenes, {len(SH)} shots ({len(SH) - n_img} video, {n_img} stills), {len(items)} captions; end card {END_START}-{TOTAL}")
