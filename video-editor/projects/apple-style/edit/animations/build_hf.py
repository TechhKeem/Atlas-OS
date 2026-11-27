"""Generate the HyperFrames project (index + scenes) for the apple-style edit.

Reads ../words_out.json and ../segmap.json (output-timeline word times / cut points).
Run: python -I build_hf.py   (writes into ./hf)
"""
import json, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
EDIT = os.path.dirname(HERE)
HF = os.path.join(HERE, "hf")
W, H = 1080, 1440
FOOTAGE_DUR = 49.366
TOTAL = 52.7

C = dict(charcoal="#20242D", sage="#5CA581", platinum="#C1C4C8", soft="#F6F7F9")

words = json.load(open(os.path.join(EDIT, "words_out.json")))
cuts = [s["out_start"] for s in json.load(open(os.path.join(EDIT, "segmap.json")))]

# Framing per segment: W(ide) / M(edium) / C(lose). Neighbours always differ so
# every jump cut reads as a camera change.
FR = {"W": 1.0, "M": 1.14, "C": 1.30}
framing = "W M W M W C M W M C W M C W M W C W M C W".split()
assert len(framing) == len(cuts)

# Scene windows (output seconds)
LOWER = (6.95, 4.0)
CARD1 = (11.40, 2.05)
CARD2 = (20.40, 1.45)
CARD3 = (28.28, 2.12)
CTA = (40.55, 5.45)
END = (49.00, TOTAL - 49.00)
NO_CAPS = [(CARD1[0] - 0.05, sum(CARD1)), (CARD2[0] - 0.05, sum(CARD2)),
           (CARD3[0] - 0.05, sum(CARD3)), (END[0] - 0.1, TOTAL)]

HEAD = """<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>"""
FONT = "'Inter', sans-serif"


def scene(cid, css, body, js, transparent=True):
    bg = "transparent" if transparent else C["soft"]
    return f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; background: {bg}; font-family: {FONT}; }}
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


def write(name, text):
    with open(os.path.join(HF, name), "w") as f:
        f.write(text)


os.makedirs(os.path.join(HF, "compositions"), exist_ok=True)

# ---------- full-frame cards: shared stage behaviour (blur swap in/out) ----------
CARD_CSS = f"""    .stage {{ position: absolute; inset: 0; background: {C['soft']}; }}
    .lines {{ position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; flex-direction: column;
             align-items: center; justify-content: center; gap: 6px; }}
    .line {{ font-weight: 700; font-size: 104px; letter-spacing: -0.035em; color: {C['charcoal']}; line-height: 1.08; text-align: center; }}
    .w {{ display: inline-block; }}
    .accent {{ color: {C['sage']}; }}"""


def card_in_out(dur):
    return f"""    tl.fromTo(".stage", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.16, ease: "power2.out" }}, 0);
    tl.to(".lines", {{ opacity: 0, filter: "blur(8px)", duration: 0.16, ease: "power2.in" }}, {dur - 0.36:.3f});
    tl.to(".stage", {{ opacity: 0, duration: 0.18, ease: "power2.in" }}, {dur - 0.2:.3f});"""


# Card 1: per-word blur-in, payoff word lands on the spoken "money"
c1_words = [("Clear", 11.55), ("on", 11.95), ("your", 12.10), ("money.", 12.30)]
body = '    <div class="stage"></div>\n    <div class="lines"><div class="line">' + " ".join(
    f'<span class="w{" accent" if i == 3 else ""}" id="c1w{i}">{t}</span>' for i, (t, _) in enumerate(c1_words)
) + "</div></div>"
js = card_in_out(CARD1[1]) + "\n" + "\n".join(
    f'    tl.fromTo("#c1w{i}", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.14, ease: "power4.out" }}, {t - CARD1[0]:.3f});'
    for i, (_, t) in enumerate(c1_words))
write("compositions/card1.html", scene("card1", CARD_CSS, body, js, transparent=True))

# Card 2: whole line blurs in
body = '    <div class="stage"></div>\n    <div class="lines"><div class="line" id="c2line">Life <span class="accent">happens.</span></div></div>'
js = card_in_out(CARD2[1]) + '\n    tl.fromTo("#c2line", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }, 0.08);'
write("compositions/card2.html", scene("card2", CARD_CSS, body, js))

# Card 3: words go light grey -> ink on the spoken words, no movement
c3 = [("No", 28.43, 0), ("pressure.", 28.61, 0), ("No", 29.36, 1), ("judgment.", 29.54, 1)]
lines = ["", ""]
for i, (t, _, ln) in enumerate(c3):
    lines[ln] += f'<span class="w" id="c3w{i}">{t}</span> '
body = '    <div class="stage"></div>\n    <div class="lines">' + "".join(f'<div class="line">{l.strip()}</div>' for l in lines) + "</div>"
js = card_in_out(CARD3[1]) + "\n" + "\n".join(
    f'    tl.fromTo("#c3w{i}", {{ color: "{C["platinum"]}", opacity: 0.55 }}, {{ color: "{C["sage"] if i == 3 else C["charcoal"]}", opacity: 1, duration: 0.12, ease: "power2.out" }}, {t - CARD3[0]:.3f});'
    for i, (_, t, _) in enumerate(c3))
write("compositions/card3.html", scene("card3", CARD_CSS, body, js))

# ---------- lower third: name + title, bottom-left over the dark jacket ----------
css = f"""    .lt {{ position: absolute; left: 64px; top: 76px; }}
    .bar {{ width: 64px; height: 5px; border-radius: 3px; background: {C['sage']}; margin-bottom: 18px; transform-origin: left center; }}
    .name {{ font-weight: 700; font-size: 46px; letter-spacing: -0.02em; color: {C['charcoal']}; }}
    .role {{ font-weight: 400; font-size: 28px; color: #6B7079; margin-top: 6px; letter-spacing: 0.005em; line-height: 1.3; }}
    .ch {{ display: inline-block; white-space: pre; }}"""
name = "Hakeem Hooker"
body = ('    <div class="lt"><div class="bar" id="ltbar"></div><div class="name">'
        + "".join(f'<span class="ch" id="ltc{i}">{html.escape(ch)}</span>' for i, ch in enumerate(name))
        + '</div><div class="role" id="ltrole">Licensed Fiduciary<br>FK Management</div></div>')
js = ['    tl.fromTo("#ltbar", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, 0.05);']
js += [f'    tl.fromTo("#ltc{i}", {{ opacity: 0.0, filter: "blur(4px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "power2.out" }}, {0.12 + i * 0.035:.3f});' for i in range(len(name))]
js += ['    tl.fromTo("#ltrole", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }, 0.75);',
       f'    tl.to(".lt", {{ opacity: 0, filter: "blur(6px)", duration: 0.22, ease: "power2.in" }}, {LOWER[1] - 0.3:.2f});']
write("compositions/lower.html", scene("lower", css, body, "\n".join(js)))

# ---------- CTA pill: "Save my contact ↓" then "Book a time · Text me" ----------
swap = 43.85 - CTA[0]
css = f"""    .pill {{ position: absolute; left: 0; right: 0; bottom: 112px; display: flex; justify-content: center; }}
    .pin {{ position: relative; height: 76px; border-radius: 38px; background: {C['sage']}; color: #fff; font-weight: 700; font-size: 32px;
            letter-spacing: -0.01em; display: flex; align-items: center; justify-content: center; padding: 0 40px; min-width: 420px;
            box-shadow: 0 10px 30px rgba(32,36,45,0.25); }}
    .t {{ position: absolute; left: 0; right: 0; text-align: center; white-space: nowrap; }}
    .arrow {{ display: inline-block; margin-left: 10px; }}"""
body = ('    <div class="pill"><div class="pin" id="pin">'
        '<span class="t" id="ctat1">Save my contact <span class="arrow" id="arr">↓</span></span>'
        '<span class="t" id="ctat2">Book a time · Text me</span></div></div>')
js = f"""    tl.fromTo("#pin", {{ opacity: 0, y: 24, scale: 0.96 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "expo.out" }}, 0.05);
    tl.fromTo("#arr", {{ y: -6 }}, {{ y: 4, duration: 0.45, ease: "power2.inOut" }}, 0.7);
    tl.to("#arr", {{ y: 0, duration: 0.35, ease: "power2.out" }}, 1.15);
    tl.fromTo("#ctat2", {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 0, filter: "blur(6px)", duration: 0.01 }}, 0);
    tl.to("#ctat1", {{ opacity: 0, filter: "blur(6px)", duration: 0.15, ease: "power2.in" }}, {swap - 0.1:.3f});
    tl.to("#ctat2", {{ opacity: 1, filter: "blur(0px)", duration: 0.16, ease: "power4.out" }}, {swap + 0.05:.3f});
    tl.to("#pin", {{ opacity: 0, y: 12, duration: 0.25, ease: "power2.in" }}, {CTA[1] - 0.3:.3f});"""
write("compositions/cta.html", scene("cta", css, body, js))

# ---------- end card ----------
css = f"""    .wrap {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }}
    .en {{ font-weight: 700; font-size: 92px; letter-spacing: -0.035em; color: {C['charcoal']}; }}
    .er {{ font-weight: 400; font-size: 34px; color: #6B7079; margin-top: 14px; }}
    .ebar {{ width: 88px; height: 5px; border-radius: 3px; background: {C['sage']}; margin: 44px 0 40px; }}
    .ecta {{ font-weight: 700; font-size: 36px; color: {C['sage']}; letter-spacing: -0.01em; }}
    .ar {{ display: inline-block; margin-left: 8px; }}"""
body = ('    <div class="stage" id="endstage" style="position:absolute;inset:0;background:' + C['soft'] + '"></div>\n'
        '    <div class="wrap"><div class="en" id="en">Hakeem Hooker</div><div class="er" id="er">Licensed Fiduciary · FK Management</div>'
        '<div class="ebar" id="ebar"></div><div class="ecta" id="ecta">Save my contact below <span class="ar" id="ear">↓</span></div></div>')
js = """    tl.fromTo("#endstage", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.inOut" }, 0);
    tl.fromTo("#en", { opacity: 0, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }, 0.35);
    tl.fromTo("#er", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }, 0.6);
    tl.fromTo("#ebar", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "expo.out" }, 0.8);
    tl.fromTo("#ecta", { opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.2, ease: "power4.out" }, 1.1);
    tl.fromTo("#ear", { y: -6 }, { y: 4, duration: 0.5, ease: "power2.inOut" }, 1.4);
    tl.to("#ear", { y: 0, duration: 0.4, ease: "power2.out" }, 1.9);"""
write("compositions/end.html", scene("endcard", css, body, js))

# ---------- captions: calm 3-5 word groups, hidden during full-frame cards ----------
def blocked(w):
    return any(a <= w["start"] < b or a < w["end"] <= b for a, b in NO_CAPS)

groups, cur = [], []
for i, w in enumerate(words):
    if blocked(w):
        if cur: groups.append(cur); cur = []
        continue
    if cur and (w["start"] - cur[-1]["end"] >= 0.15 or len(cur) >= 5):
        groups.append(cur); cur = []
    cur.append(w)
    if w["text"].endswith((".", "?", "!", ",")) and len(cur) >= 2:
        groups.append(cur); cur = []
if cur: groups.append(cur)
# merge single dangling words into neighbour when close
merged = []
for g in groups:
    if merged and len(g) == 1 and g[0]["start"] - merged[-1][-1]["end"] < 0.35 and len(merged[-1]) < 6:
        merged[-1] += g
    else:
        merged.append(g)
groups = merged

items = []
for k, g in enumerate(groups):
    s = max(0.12, g[0]["start"] - 0.05)
    e = g[-1]["end"] + 0.2
    nxt = groups[k + 1][0]["start"] - 0.05 if k + 1 < len(groups) else TOTAL
    for a, b in NO_CAPS:
        if s < a < e: e = a
    e = min(e, nxt)
    if e - s < 0.45: e = min(s + 0.45, nxt)
    items.append((s, e - s, " ".join(w["text"] for w in g)))

css = f"""    .cap {{ position: absolute; left: 0; right: 0; top: 1040px; text-align: center; overflow: visible; }}
    .cap span {{ display: inline-block; max-width: 900px; font-weight: 700; font-size: 46px; letter-spacing: -0.015em; color: #fff;
                 text-shadow: 0 2px 14px rgba(0,0,0,0.45); line-height: 1.2; }}"""
body = "\n".join(
    f'    <div class="cap clip" id="cap{k}" data-start="{s:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{html.escape(t)}</span></div>'
    for k, (s, d, t) in enumerate(items))
js = "\n".join(
    f'    tl.fromTo("#capt{k}", {{ opacity: 0, filter: "blur(4px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.12, ease: "power2.out" }}, {s:.3f});\n'
    f'    tl.to("#capt{k}", {{ opacity: 0, duration: 0.1, ease: "power2.in" }}, {s + d - 0.1:.3f});'
    for k, (s, d, t) in enumerate(items))
write("compositions/captions.html", scene("captions", css, body, js))

# ---------- root ----------
def host(cid, src, start, dur, track, kind="graphics", z=5):
    return (f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{src}" '
            f'data-start="{start:.3f}" data-duration="{dur:.3f}" data-track-index="{track}" data-track-kind="{kind}" '
            f'data-width="{W}" data-height="{H}" style="z-index:{z}"></div>')

sets = "\n".join(f'      tl.set("#cam", {{ scale: {FR[f]} }}, {t:.3f});' for f, t in zip(framing, cuts))
index = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    {HEAD}
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: {C['soft']}; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: {FONT}; }}
      #ground {{ position: absolute; inset: 0; background: {C['soft']}; }}
      #stage {{ position: absolute; inset: 0; overflow: hidden; z-index: 1; }}
      #cam {{ position: absolute; inset: 0; transform-origin: 50% 26%; }}
      #footage {{ position: absolute; left: 0; top: -11px; width: {W}px; height: 1462px; object-fit: cover; }}
      #wash {{ position: absolute; inset: 0; background: {C['soft']}; z-index: 2; pointer-events: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
      <div id="ground"></div>
      <div id="stage" data-layout-allow-overflow><div id="cam">
        <video id="footage" class="clip" src="assets/footage.mp4" data-start="0" data-duration="{FOOTAGE_DUR}" data-track-index="0" muted playsinline></video>
      </div></div>
      <div id="wash"></div>
{host("lower", "lower.html", *LOWER, 1)}
{host("card1", "card1.html", *CARD1, 1, z=6)}
{host("card2", "card2.html", *CARD2, 1, z=6)}
{host("card3", "card3.html", *CARD3, 1, z=6)}
{host("cta", "cta.html", *CTA, 1)}
{host("endcard", "end.html", *END, 1, z=8)}
{host("captions", "captions.html", 0, TOTAL, 2, kind="captions", z=7)}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      tl.fromTo("#wash", {{ opacity: 1 }}, {{ opacity: 0, duration: 0.35, ease: "power2.out" }}, 0);
{sets}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
write("index.html", index)
print(f"{len(items)} caption groups; framing cuts {len(cuts)}")
for s, d, t in items[:8]: print(f"  {s:6.2f}+{d:4.2f} {t}")
