"""HyperFrames build for "Rewards Program": vibrant, fast (a visual change every <=3 s).

Reads ../words_out.json (output-timeline words). Run: python -I build_hf.py
All text is Outfit (house rule). Layout: tags/stickers in the top band, pill captions
at chest height, three full-screen colour flash cards, two confetti bursts.
"""
import json, os, html, random

HERE = os.path.dirname(os.path.abspath(__file__))
EDIT = os.path.dirname(HERE)
HF = os.path.join(HERE, "hf")
W, H = 1080, 1920
TOTAL = 48.6
FOOT = 48.83
SAGE, SAGE_L, CHAR, SOFT, SUN = "#5CA581", "#8FD6AE", "#20242D", "#F6F7F9", "#FFC83D"
FONT = "'Outfit', sans-serif"
words = json.load(open(os.path.join(EDIT, "words_out.json")))

ICON = {
    "globe": '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/></svg>',
    "pin": '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    "lock": '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path id="shackle" d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    "plane": '<svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15.5v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8.5l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5z"/></svg>',
    "check": '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    "user": '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    "spark": '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg>',
}

BASE_CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; }}
    .band {{ position: absolute; left: 0; right: 0; top: 270px; display: flex; flex-direction: column; align-items: center; gap: 16px; }}
    .pill {{ display: inline-flex; align-items: center; gap: 16px; padding: 22px 38px; border-radius: 999px; font-weight: 800; font-size: 50px;
             letter-spacing: -0.01em; color: #fff; box-shadow: 0 16px 40px rgba(0,0,0,0.28); white-space: nowrap; }}
    .sage {{ background: #3B7F5E; }}
    .sun {{ background: {SUN}; color: {CHAR}; }}
    .char {{ background: rgba(32,36,45,0.88); }}
    .ocean {{ background: linear-gradient(120deg, #1FA2FF, #12D8FA); }}
    .sunset {{ background: linear-gradient(120deg, #FF6A5F, #FFB45C); }}
    .glass {{ background: linear-gradient(140deg, rgba(92,165,129,0.85), rgba(32,36,45,0.9)); border: 2px solid rgba(255,255,255,0.4);
              backdrop-filter: blur(18px); }}
    .card {{ padding: 30px 40px; border-radius: 40px; color: #fff; box-shadow: 0 20px 50px rgba(0,0,0,0.3); max-width: 900px; text-align: center; }}
    .k {{ font-weight: 600; font-size: 30px; letter-spacing: 0.16em; text-transform: uppercase; color: {SAGE_L}; }}
    .big {{ font-weight: 800; font-size: 64px; line-height: 1.05; letter-spacing: -0.02em; margin-top: 6px; }}
    .hl {{ color: {SUN}; }}
"""


def scene(cid, body, js, css="", bg="transparent"):
    return f"""<template>
  <style>
{BASE_CSS}
    #root {{ background: {bg}; }}
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


def pop(sel, t, rot=-3, dur=0.38):
    return (f'    tl.fromTo("{sel}", {{ opacity: 0, scale: 0.55, rotation: {rot * 2} }}, '
            f'{{ opacity: 1, scale: 1, rotation: {rot}, duration: {dur}, ease: "back.out(2.2)" }}, {t:.3f});')


def out(sel, t):
    return f'    tl.to("{sel}", {{ opacity: 0, scale: 0.8, duration: 0.18, ease: "power2.in" }}, {t:.3f});'


SCENES = []  # (cid, start, dur, kind, z)


def add(cid, start, dur, body, js, css="", bg="transparent", z=6, kind="graphics"):
    with open(os.path.join(HF, "compositions", f"{cid}.html"), "w") as f:
        f.write(scene(cid, body, js, css, bg))
    SCENES.append((cid, start, dur, kind, z))


os.makedirs(os.path.join(HF, "compositions"), exist_ok=True)

# ---- tag / sticker beats (top band) ----
def tag(cid, start, dur, items):
    """items: list of (html, cls, t_in_abs, rot). Pills stack in the band."""
    body = '    <div class="band">' + "".join(
        f'<div class="pill {cls}" id="{cid}p{i}">{h}</div>' for i, (h, cls, _, _) in enumerate(items)) + "</div>"
    js = "\n".join(pop(f"#{cid}p{i}", t - start, rot) for i, (_, _, t, rot) in enumerate(items))
    js += "\n" + "\n".join(out(f"#{cid}p{i}", dur - 0.2) for i in range(len(items)))
    add(cid, start, dur, body, js)


tag("hook", 0.50, 2.0, [(f'{ICON["globe"]} Anywhere in the world', "ocean", 0.62, -2),
                          ("On my dime", "sun", 1.84, 3)])
tag("dime", 4.95, 1.0, [("ON MY DIME", "sun", 5.0, -4)])
tag("name1", 6.10, 2.85, [("Finance Keem", "char", 6.30, -2), ("Financial services", "sage", 7.50, 2)])
tag("goal", 9.05, 2.2, [("My goal:", "char", 9.15, -2), ("Celebrate my clients", "sage", 10.0, 2)])
tag("bigchg", 12.55, 1.75, [("Big life changes", "sun", 12.65, -3)])
tag("santorini", 15.15, 1.15, [(f'{ICON["pin"]} Santorini, Greece', "ocean", 15.25, -2)])
tag("hawaii", 17.05, 1.25, [(f'{ICON["pin"]} Hawaii', "sunset", 17.12, 3)])
tag("helped", 18.40, 1.65, [("Because they helped", "char", 18.42, -2), ("my business grow", "sage", 19.2, 2)])
tag("anytrip", 29.75, 1.95, [(f'{ICON["globe"]} Any trip. Anywhere.', "ocean", 30.45, -2)])
tag("name2", 38.85, 2.8, [("Finance Keem", "char", 38.95, -2), ("Your next financial advisor", "sage", 40.45, 2)])
tag("celebr", 41.75, 3.0, [("Financial advice,", "char", 42.3, -2), ("celebrated.", "sun", 43.95, 3)])
tag("seeyou", 44.80, 1.25, [("See you on the other side", "sage", 44.85, -2)])

# ---- secret -> unlock ----
body = f'''    <div class="band"><div class="card glass" id="sc">
      <div id="lk" style="color:#fff; display:flex; justify-content:center">{ICON["lock"]}</div>
      <div class="big" id="sct">Been a <span class="hl">secret</span>&hellip;</div>
      <div class="big" id="sco" style="font-size:56px">Now it&rsquo;s <span class="hl">open</span>.</div>
    </div></div>'''
js = "\n".join([pop("#sc", 0.0, -2), f'    tl.fromTo("#sco", {{ opacity: 0, y: 20 }}, {{ opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }}, {22.18 - 20.45:.3f});',
                f'    tl.to("#lk svg #shackle", {{ y: -4, x: 3, rotation: 25, transformOrigin: "16px 11px", duration: 0.3, ease: "back.out(2)" }}, {22.18 - 20.45:.3f});',
                out("#sc", 2.25)])
add("secret", 20.45, 2.45, body, js)

# ---- you + referral ----
body = f'''    <div class="band">
      <div style="display:flex; gap:18px">
        <div class="pill sage" id="r1">{ICON["user"]} You</div>
        <div class="pill sun" id="r2">{ICON["user"]} Who you refer</div>
      </div>
      <div class="pill char" id="r3">{ICON["plane"].replace('width="120" height="120"', 'width="44" height="44"')} Same vacation</div>
    </div>'''
js = "\n".join([pop("#r1", 0.0, -3), pop("#r2", 27.62 - 26.3, 3), pop("#r3", 28.95 - 26.3, -2), out("#r1", 3.1), out("#r2", 3.1), out("#r3", 3.1)])
add("refer", 26.30, 3.3, body, js)

# ---- steps ----
css = f"""    .steps {{ position: absolute; left: 90px; right: 90px; top: 255px; }}
    .stp {{ display: flex; align-items: center; gap: 20px; padding: 18px 26px; border-radius: 28px; margin-top: 14px;
            background: rgba(32,36,45,0.88); color: #fff; font-weight: 700; font-size: 42px; box-shadow: 0 14px 34px rgba(0,0,0,0.28); }}
    .n {{ width: 62px; height: 62px; border-radius: 31px; background: #3B7F5E; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 36px; flex: none; }}
    .ttl {{ font-weight: 800; font-size: 48px; color: {CHAR}; background: {SUN}; display: inline-block; padding: 10px 26px; border-radius: 22px; }}"""
body = '''    <div class="steps">
      <div class="ttl" id="st0">All you gotta do:</div>
      <div class="stp" id="st1"><div class="n">1</div>Reach out to me</div>
      <div class="stp" id="st2"><div class="n">2</div><div>Connect me with someone <span id="ret">retiring</span></div></div>
    </div>'''
js = "\n".join([pop("#st0", 0.0, -2), pop("#st1", 32.45 - 31.75, 0), pop("#st2", 33.6 - 31.75, 0),
                f'    tl.fromTo("#ret", {{ color: "#ffffff" }}, {{ color: "{SUN}", duration: 0.2 }}, {35.45 - 31.75:.3f});',
                f'    tl.to("#st2", {{ scale: 1.06, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }}, {35.45 - 31.75:.3f});',
                out("#st0", 5.15), out("#st1", 5.15), out("#st2", 5.15)])
add("steps", 31.75, 5.4, body, js, css)

# ---- that's it stamp ----
body = '''    <div class="band"><div class="pill sun" id="ti" style="font-size:84px; padding:26px 54px">THAT&rsquo;S IT.</div>
      <div class="pill char" id="ti2">As simple as that</div></div>'''
js = "\n".join([pop("#ti", 0.0, -5, 0.32), pop("#ti2", 38.0 - 37.2, 2), out("#ti", 1.45), out("#ti2", 1.45)])
add("thatsit", 37.20, 1.65, body, js)

# ---- full-screen flash cards ----
FCSS = f"""    .fc {{ position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; }}
    .huge {{ font-weight: 800; font-size: 170px; letter-spacing: -0.04em; line-height: 0.95; }}
    .sub {{ font-weight: 400; font-size: 54px; margin-top: 18px; opacity: 0.92; }}"""
body = f'''    <div class="fc" id="f1bg" style="background: radial-gradient(120% 80% at 50% 30%, #12D8FA 0%, #1FA2FF 55%, #1565C0 100%);">
      <div style="color:#fff" id="f1i">{ICON["globe"].replace('width="44" height="44"', 'width="150" height="150"')}</div>
      <div class="huge" id="f1t">ANYWHERE.</div><div class="sub" id="f1s">in the world</div></div>'''
js = "\n".join(['    tl.fromTo("#f1bg", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(80% at 50% 50%)", duration: 0.28, ease: "power3.out" }, 0);',
                pop("#f1i", 0.08, 0), pop("#f1t", 0.14, -2), pop("#f1s", 0.3, 0),
                '    tl.to("#f1bg", { opacity: 0, duration: 0.14, ease: "power2.in" }, 0.86);'])
add("flash1", 3.85, 1.0, body, js, FCSS, z=9)

body = f'''    <div class="fc" id="f2bg" style="background: radial-gradient(120% 80% at 50% 30%, #8FD6AE 0%, {SAGE} 50%, #2E6B4E 100%);">
      <div class="sub" id="f2a" style="font-weight:600; margin:0 0 10px">Help me grow my business</div>
      <div style="color:#fff" id="f2i">{ICON["plane"]}</div>
      <div class="huge" id="f2t" style="font-size:150px">VACATION</div>
      <div class="huge" id="f2f" style="font-size:150px; color:{SUN}">FOR 2</div></div>'''
js = "\n".join(['    tl.fromTo("#f2bg", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(80% at 50% 50%)", duration: 0.3, ease: "power3.out" }, 0);',
                pop("#f2a", 0.1, 0), pop("#f2i", 0.35, -8), pop("#f2t", 0.55, -2), pop("#f2f", 24.95 - 24.20, 3),
                '    tl.fromTo("#f2i", { x: -60 }, { x: 60, duration: 1.2, ease: "power1.inOut" }, 0.35);',
                '    tl.to("#f2bg", { opacity: 0, duration: 0.14, ease: "power2.in" }, 1.6)'])
add("flash2", 24.20, 1.75, body, js, FCSS, z=9)

body = f'''    <div class="fc" id="ebg" style="background: radial-gradient(120% 80% at 50% 25%, #2E3440 0%, {CHAR} 60%, #14171D 100%);">
      <div class="pill sun" id="e1" style="font-size:44px">Rewards Program</div>
      <div class="huge" id="e2" style="font-size:118px; margin-top:40px">Help me grow.</div>
      <div class="huge" id="e3" style="font-size:118px; color:{SAGE_L}">Take a trip.</div>
      <div class="pill sage" id="e4" style="margin-top:54px; font-size:46px">DM Finance Keem</div>
      <div class="sub" id="e5" style="font-size:38px; margin-top:30px"><b style="font-weight:700">FK</b> Management</div></div>'''
js = "\n".join(['    tl.fromTo("#ebg", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0);',
                pop("#e1", 0.25, -3), pop("#e2", 0.45, 0), pop("#e3", 0.7, 0), pop("#e4", 1.0, 2), pop("#e5", 1.2, 0)])
add("endcard", 46.0, TOTAL - 46.0, body, js, FCSS, z=9)

# ---- confetti (deterministic, seeded in Python) ----
def confetti(cid, start, dur, seed):
    rnd = random.Random(seed)
    cols = [SAGE, SAGE_L, SUN, "#FF6A5F", "#12D8FA", "#ffffff"]
    parts, js = [], []
    for i in range(70):
        x = rnd.uniform(0, W); w_ = rnd.uniform(14, 26); h_ = rnd.uniform(22, 40)
        parts.append(f'<div class="cf" id="{cid}c{i}" style="left:{x:.0f}px; width:{w_:.0f}px; height:{h_:.0f}px; background:{rnd.choice(cols)}; border-radius:{rnd.choice([3, 50])}%"></div>')
        t0 = rnd.uniform(0, 0.35); fall = rnd.uniform(1.1, dur - 0.1)
        js.append(f'    tl.fromTo("#{cid}c{i}", {{ y: {rnd.uniform(-260, -60):.0f}, rotation: 0, opacity: 1 }}, {{ y: {rnd.uniform(1100, 2000):.0f}, x: {rnd.uniform(-160, 160):.0f}, rotation: {rnd.uniform(-540, 540):.0f}, duration: {fall:.2f}, ease: "power1.in" }}, {t0:.3f});')
    css = "    .cf { position: absolute; top: 0; }"
    add(cid, start, dur, "    " + "".join(parts), "\n".join(js), css, z=8)


confetti("conf1", 11.20, 2.0, 7)
confetti("conf2", 43.90, 2.0, 11)

# ---- captions: pill style at chest height; hidden under full-screen cards ----
KEY = {"anywhere", "world", "dime?", "serious.", "celebrated", "celebrated.", "santorini,", "greece.", "hawaii,", "secret,", "vacation.",
       "vacation", "refer", "retiring", "simple", "keem.", "two", "business,", "business.", "it."}
BLOCK = [(3.85, 4.85), (24.20, 25.95), (46.0, TOTAL)]
groups, cur = [], []
for w in words:
    if any(a <= w["start"] < b for a, b in BLOCK):
        if cur: groups.append(cur); cur = []
        continue
    if cur and (w["start"] - cur[-1]["end"] >= 0.15 or len(cur) >= 3):
        groups.append(cur); cur = []
    cur.append(w)
    if w["text"].endswith((".", "?", "!", ",")):
        groups.append(cur); cur = []
if cur: groups.append(cur)
items = []
for k, g in enumerate(groups):
    s = max(0.05, g[0]["start"] - 0.03)
    nxt = groups[k + 1][0]["start"] - 0.03 if k + 1 < len(groups) else TOTAL
    e = min(max(g[-1]["end"] + 0.1, s + 0.35), nxt)
    for a, b in BLOCK:
        if s < a < e: e = a
    def fmt(w):
        t = html.escape(w["text"].upper())
        return f'<i>{t}</i>' if w["text"].lower() in KEY else t
    items.append((s, e - s, " ".join(fmt(w) for w in g)))
OVERLAYS = [(14.75, 16.3), (16.75, 17.75)]  # Hakeem's own text-message screenshots (lower half)
def lift(s, d):
    return any(s < b and s + d > a for a, b in OVERLAYS)
css = f"""    .cap {{ position: absolute; left: 0; right: 0; top: 1290px; text-align: center; }}
    .cap.up {{ top: 1170px; }}
    .cap span {{ display: inline-block; padding: 14px 30px; border-radius: 26px; background: rgba(32,36,45,0.9); color: #fff; font-weight: 800; font-size: 60px;
                 letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 10px 28px rgba(0,0,0,0.3); }}
    .cap i {{ font-style: normal; color: {SUN}; }}"""
body = "\n".join(f'    <div class="cap clip{" up" if lift(s, d) else ""}" id="cap{k}" data-start="{s:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>'
                 for k, (s, d, t) in enumerate(items))
js = "\n".join(f'    tl.fromTo("#capt{k}", {{ opacity: 0, scale: 0.8, y: 12 }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.14, ease: "back.out(2.5)" }}, {s:.3f});'
               for k, (s, d, t) in enumerate(items))
add("captions", 0, TOTAL, body, js, css, z=7, kind="captions")

# ---- root: footage + hard punch-in reframes (a framing change every <=3 s) ----
punch = [(0, 1.0), (2.5, 1.28), (3.3, 1.0), (4.85, 1.14), (5.98, 1.0), (9.0, 1.15), (11.3, 1.3), (12.7, 1.0), (14.36, 1.12),
         (16.36, 1.0), (17.72, 1.25), (20.08, 1.0), (22.18, 1.15), (22.88, 1.0), (25.95, 1.12), (27.2, 1.0), (29.26, 1.25),
         (30.5, 1.0), (31.74, 1.12), (33.64, 1.0), (35.48, 1.25), (37.2, 1.32), (37.88, 1.0), (39.0, 1.12), (41.14, 1.0),
         (42.34, 1.2), (44.06, 1.0), (44.82, 1.18)]
sets = "\n".join(f'      tl.set("#cam", {{ scale: {s} }}, {t:.3f});' for t, s in punch)

# sound effects tied to visible events (kept sparse)
SFXLEN = {"pop": 0.72, "whoosh-short": 0.57, "sparkle": 1.8, "ping": 1.32, "click": 0.36, "impact-bass-1": 2.1, "chime": 2.5}
SFX = [("pop", 0.62), ("pop", 1.84), ("whoosh-short", 3.82), ("pop", 5.0), ("pop", 6.30), ("sparkle", 11.2), ("ping", 15.25),
       ("ping", 17.12), ("click", 22.18), ("whoosh-short", 24.17), ("pop", 24.95), ("pop", 32.45), ("pop", 33.6), ("impact-bass-1", 37.2),
       ("sparkle", 43.9), ("chime", 46.05)]
sfx_tags = "\n".join(f'      <audio id="sfx{i}" class="clip" src="assets/sfx/{n}.mp3" data-start="{t:.3f}" data-duration="{min(SFXLEN[n], TOTAL - t):.2f}" data-track-index="{5 + i % 2}" data-volume="0.35"></audio>'
                     for i, (n, t) in enumerate(SFX))
json.dump(SFX, open(os.path.join(EDIT, "sfx_cues.json"), "w"))

hosts = "\n".join(
    f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.3f}" data-duration="{d:.3f}" '
    f'data-track-index="{2 if k == "captions" else 1}" data-track-kind="{k}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>'
    for c, s, d, k, z in SCENES)
with open(os.path.join(HF, "index.html"), "w") as f:
    f.write(f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width={W}, height={H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: {SOFT}; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: {FONT}; }}
      #stage {{ position: absolute; inset: 0; overflow: hidden; z-index: 1; }}
      #cam {{ position: absolute; inset: 0; transform-origin: 50% 58%; }}
      #footage {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: cover; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
      <div id="stage" data-layout-allow-overflow><div id="cam">
        <video id="footage" class="clip" src="assets/footage.mp4" data-start="0" data-duration="{TOTAL}" data-track-index="0" muted playsinline></video>
      </div></div>
{hosts}
{sfx_tags}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{sets}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
# change-cadence report
ev = sorted(set([t for t, _ in punch] + [s for _, s, _, k, _ in SCENES if k != "captions"]))
gaps = [round(b - a, 2) for a, b in zip(ev, ev[1:] + [TOTAL])]
print(len(SCENES), "scenes,", len(items), "caption groups; max gap between visual changes:", max(gaps), "s")
