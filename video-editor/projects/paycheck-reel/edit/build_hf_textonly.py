"""HyperFrames build for "Paycheck" — a 30 s text-led reel made only from Hakeem's B-roll + Authority library.

No voice: kinetic Outfit text carries the script; lo-fi bed is muxed afterwards (see project.md).
Run: python -I build_hf.py  ->  hf/index.html + hf/compositions/*.html
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
HF = os.path.join(HERE, "hf")
W, H, TOTAL = 1080, 1920, 31.0
SAGE, SAGE_L, CHAR, SOFT, PLAT = "#5CA581", "#8FD6AE", "#20242D", "#F6F7F9", "#C1C4C8"
FONT = "'Outfit', sans-serif"

# ---------------- background shots: (id, src, start, dur, kind, zoom from->to, y-drift px) ----------------
SHOTS = [
    ("s1", "8720_sunset.jpg", 0.0, 3.0, "img", (1.12, 1.0), 0),
    ("s2", "8770_profile.jpg", 3.0, 2.0, "img", (1.0, 1.10), -20),
    ("s3", "6364_courtyard.jpg", 5.0, 3.5, "img", (1.10, 1.0), 0),
    ("s4", "8718_phone.jpg", 8.5, 3.5, "img", (1.0, 1.09), 0),
    ("s5", "6425_handshake.jpg", 12.0, 3.5, "img", (1.10, 1.0), 0),
    ("s6", "7105_hillside.jpg", 15.5, 3.5, "img", (1.0, 1.10), 0),
    ("s7", "0985_stage.mp4", 19.0, 3.5, "video", (1.0, 1.06), 0),
    ("s8", "8752_camera_crew.mp4", 22.5, 2.0, "video", (1.08, 1.0), 0),
    ("s9", "7358_hope_speaking.jpg", 24.5, 1.5, "img", (1.0, 1.08), 0),
    ("s10", "wsl22_headshot.jpg", 26.0, 5.0, "img", (1.16, 1.12), -130),
]

BASE_CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; color: #fff; }}
    .wrap {{ position: absolute; left: 110px; right: 180px; bottom: 700px; text-align: left; }}
    .kick {{ font-weight: 600; font-size: 38px; letter-spacing: 0.16em; text-transform: uppercase; color: {SAGE_L}; }}
    .h {{ font-weight: 700; font-size: 92px; line-height: 1.03; letter-spacing: -0.025em; text-shadow: 0 6px 30px rgba(0,0,0,0.45); }}
    .h2 {{ font-weight: 600; font-size: 72px; line-height: 1.08; letter-spacing: -0.02em; text-shadow: 0 6px 30px rgba(0,0,0,0.45); }}
    .hl {{ color: {SAGE_L}; }}
    .line {{ display: block; }}
    .glass {{ background: linear-gradient(140deg, rgba(92,165,129,0.88), rgba(32,36,45,0.9)); border: 2px solid rgba(255,255,255,0.38);
              backdrop-filter: blur(20px); border-radius: 44px; box-shadow: 0 24px 60px rgba(0,0,0,0.35); }}
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


def add(cid, start, dur, body, js, css="", z=6, kind="graphics"):
    with open(os.path.join(HF, "compositions", f"{cid}.html"), "w") as f:
        f.write(scene(cid, body, js, css))
    SCENES.append((cid, start, dur, kind, z))


def rise(sel, t, d=0.5, y=60):
    return f'    tl.fromTo("{sel}", {{ opacity: 0, y: {y} }}, {{ opacity: 1, y: 0, duration: {d}, ease: "power3.out" }}, {t:.2f});'


def words(text, pid, cls="h"):
    """Split into word spans for a staggered cascade."""
    out = []
    for k, w in enumerate(text.split(" ")):
        hl = w.startswith("*")
        w = w.strip("*")
        out.append(f'<span id="{pid}w{k}" class="{"hl" if hl else ""}" style="display:inline-block">{w}</span>')
    return f'<div class="{cls}" id="{pid}">' + " ".join(out) + "</div>", len(out)


def cascade(pid, n, t, step=0.07):
    return "\n".join(
        f'    tl.fromTo("#{pid}w{k}", {{ opacity: 0, y: 70, filter: "blur(10px)" }}, {{ opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power4.out" }}, {t + k * step:.2f});'
        for k in range(n))


def exit_up(sel, t):
    return f'    tl.to("{sel}", {{ opacity: 0, y: -50, filter: "blur(8px)", duration: 0.28, ease: "power2.in" }}, {t:.2f});'


# 1. Hook (0-3)
a, na = words("Your *paycheck stops", "hk1")
b, nb = words("when you retire.", "hk2", "h2")
add("hook", 0, 3.0, f'    <div class="wrap">{a}<div style="height:18px"></div>{b}</div>',
    "\n".join([cascade("hk1", na, 0.15), cascade("hk2", nb, 1.0), exit_up(".wrap", 2.72)]))

# 2. Bills (3-5)
a, na = words("Your bills *don't.", "bl")
add("bills", 3.0, 2.0, f'    <div class="wrap">{a}</div>',
    "\n".join([cascade("bl", na, 0.05, 0.09),
               '    tl.fromTo("#blw2", { scale: 1 }, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }, 0.62);',
               exit_up(".wrap", 1.75)]))

# 3. Stop asking (5-8.5)
q, nq = words("“How much do I have?”", "sq", "h2")
add("stop", 5.0, 3.5, f'''    <div class="wrap"><div class="kick" id="sk">Stop asking</div><div style="height:22px"></div>
      <div style="position:relative; display:inline-block">{q}<div id="strike" style="position:absolute; left:-6px; right:-6px; top:52%; height:12px; border-radius:6px; background:{SAGE}; transform-origin:left center"></div></div></div>''',
    "\n".join([rise("#sk", 0.1), cascade("sq", nq, 0.35),
               '    tl.fromTo("#strike", { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: "power3.inOut" }, 2.0);',
               '    tl.to("#sq", { opacity: 0.55, duration: 0.3 }, 2.2);', exit_up(".wrap", 3.2)]))

# 4. Start asking (8.5-12)
q, nq = words("“What can I spend every month, *for *life?”", "aq", "h2")
add("start", 8.5, 3.5, f'    <div class="wrap"><div class="kick" id="ak">Start asking</div><div style="height:22px"></div>{q}</div>',
    "\n".join([rise("#ak", 0.1), cascade("aq", nq, 0.35, 0.08),
               '    tl.fromTo("#aqw6, #aqw7", { color: "#ffffff" }, { color: "' + SAGE_L + '", duration: 0.3 }, 1.4);',
               exit_up(".wrap", 3.22)]))

# 5-7. Three steps (12-22.5), one glass card each + progress dots
STEPS = [
    ("1", "Cover the basics with <span class='hl'>guaranteed income</span>", "Social Security · pension · private pension account"),
    ("2", "Invest the rest for <span class='hl'>growth</span>", "Low-cost index funds you leave alone"),
    ("3", "Keep <span class='hl'>1–2 years</span> of spending in cash", "So a bad market never forces you to sell"),
]
step_css = f"""
    .card {{ position: absolute; left: 100px; right: 180px; bottom: 700px; padding: 40px 44px 44px; }}
    .num {{ display: flex; align-items: center; gap: 18px; font-weight: 600; font-size: 30px; letter-spacing: 0.18em; text-transform: uppercase; color: {SAGE_L}; }}
    .num b {{ display: inline-flex; width: 64px; height: 64px; border-radius: 50%; background: {SOFT}; color: {CHAR}; align-items: center; justify-content: center;
              font-weight: 700; font-size: 38px; letter-spacing: 0; }}
    .st {{ font-weight: 600; font-size: 60px; line-height: 1.08; letter-spacing: -0.02em; margin-top: 24px; }}
    .sub {{ font-weight: 300; font-size: 36px; line-height: 1.3; color: rgba(246,247,249,0.88); margin-top: 22px; }}
    .dots {{ position: absolute; right: 224px; bottom: 1198px; display: flex; justify-content: center; gap: 16px; }}
    .dot {{ width: 18px; height: 18px; border-radius: 9px; background: rgba(255,255,255,0.35); }}
    .dot.on {{ width: 54px; background: {SAGE_L}; }}"""
for i, (n, title, sub) in enumerate(STEPS):
    dots = "".join(f'<div class="dot{" on" if k == i else ""}" id="d{n}{k}"></div>' for k in range(3))
    add(f"step{n}", 12.0 + 3.5 * i, 3.5, f'''    <div class="dots" id="dots{n}">{dots}</div>
    <div class="card glass" id="c{n}"><div class="num" id="n{n}"><b>{n}</b>Step {n} of 3</div>
      <div class="st" id="t{n}">{title}</div><div class="sub" id="u{n}">{sub}</div></div>''',
        "\n".join([
            f'    tl.fromTo("#dots{n}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, 0.2);',
            f'    tl.fromTo("#d{n}{i}", {{ width: 18 }}, {{ width: 54, duration: 0.4, ease: "power3.out" }}, 0.1);',
            f'    tl.fromTo("#c{n}", {{ opacity: 0, y: 140, scale: 0.94 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power4.out" }}, 0.05);',
            rise(f"#n{n}", 0.3, 0.45, 30), rise(f"#t{n}", 0.42, 0.5, 40), rise(f"#u{n}", 0.75, 0.5, 30),
            f'    tl.to("#c{n}, #dots{n}", {{ opacity: 0, x: -120, duration: 0.3, ease: "power2.in" }}, 3.18);',
        ]), step_css)

# 8. Authority (22.5-26)
a, na = words("I'm *Finance *Keem.", "me")
b, nb = words("I turn savings into *paychecks.", "me2", "h2")
add("me", 22.5, 3.5, f'''    <div class="wrap">{a}<div style="height:20px"></div>{b}
      <div id="mark" style="margin-top:34px; font-size:40px; letter-spacing:0.22em; font-weight:300"><span style="font-weight:700; color:{SAGE_L}">FK</span> MANAGEMENT</div></div>''',
    "\n".join([cascade("me", na, 0.15, 0.1), cascade("me2", nb, 1.6, 0.08), rise("#mark", 2.2, 0.5, 20), exit_up(".wrap", 3.22)]))

# 9. End card (26-30)
end_css = f"""
    .logo {{ position: absolute; left: 260px; right: 290px; top: 640px; padding: 20px 26px; border-radius: 36px; background: rgba(246,247,249,0.96);
             box-shadow: 0 20px 50px rgba(0,0,0,0.3); }}
    .logo img {{ display: block; width: 100%; }}
    .cta {{ position: absolute; left: 110px; right: 180px; top: 830px; padding: 26px 36px; text-align: center; }}
    .cta .c1 {{ font-weight: 300; font-size: 40px; color: rgba(246,247,249,0.9); }}
    .cta .c2 {{ font-weight: 700; font-size: 76px; letter-spacing: 0.02em; margin: 2px 0 4px; }}
    .cta .c3 {{ font-weight: 400; font-size: 36px; line-height: 1.3; color: rgba(246,247,249,0.92); }}
    .disc {{ position: absolute; left: 110px; right: 180px; top: 1150px; text-align: center; font-weight: 300; font-size: 28px; line-height: 1.35; color: rgba(246,247,249,0.75); }}"""
add("endcard", 26.0, 5.0, f'''    <div class="logo" id="lg"><img src="assets/logo.png" alt="FK Management by Finance Keem"></div>
    <div class="cta glass" id="cta"><div class="c1">Comment</div><div class="c2" id="kw">PAYCHECK</div>
      <div class="c3">and I'll send you my retirement income checklist</div></div>
    <div class="disc" id="disc">Educational only. Not investment advice. Guarantees are subject to the claims-paying ability of the issuing insurer.</div>''',
    "\n".join([
        '    tl.fromTo("#lg", { opacity: 0, y: -60, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power4.out" }, 0.1);',
        '    tl.fromTo("#cta", { opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.6, ease: "power4.out" }, 0.45);',
        '    tl.fromTo("#kw", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2.4)" }, 0.8);',
        '    tl.to("#kw", { scale: 1.07, duration: 0.35, yoyo: true, repeat: 3, ease: "sine.inOut" }, 1.6);',
        rise("#disc", 0.5, 0.5, 10),
    ]), end_css, z=8)

# ---------------- root index ----------------
media = []
kb = []
for i, (sid, src, s, d, kind, (z0, z1), dy) in enumerate(SHOTS):
    style = f"position:absolute; left:0; top:0; width:{W}px; height:{H}px; object-fit:cover; z-index:1"
    if kind == "img":
        media.append(f'      <img id="{sid}" class="clip shot" src="assets/{src}" data-start="{s}" data-duration="{d}" data-track-index="0" style="{style}" alt="">')
    else:
        media.append(f'      <video id="{sid}" class="clip shot" src="assets/{src}" data-start="{s}" data-duration="{d}" data-track-index="0" muted playsinline style="{style}"></video>')
    kb.append(f'      tl.fromTo("#{sid}", {{ scale: {z0}, y: {dy if sid == "s10" else 0} }}, {{ scale: {z1}, y: {dy}, duration: {d}, ease: "none" }}, {s});')
# soft-white flash on the two act breaks (question->steps, steps->authority)
hosts = "\n".join(
    f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.2f}" data-duration="{d:.2f}" '
    f'data-track-index="1" data-track-kind="{k}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>'
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
      html, body {{ width: {W}px; height: {H}px; overflow: hidden; background: {CHAR}; }}
      #root {{ position: relative; width: 100%; height: 100%; font-family: {FONT}; background: {CHAR}; }}
      .shot {{ transform-origin: 50% 40%; }}
      /* FK rule: charcoal #20242D gradient at 60% on the text side (lower half), fading toward the subject */
      #grad {{ position: absolute; inset: 0; z-index: 3; pointer-events: none;
               background: linear-gradient(to top, rgba(32,36,45,0.6) 0%, rgba(32,36,45,0.6) 42%, rgba(32,36,45,0) 72%); }}
      #gradEnd {{ position: absolute; inset: 0; z-index: 4; background: linear-gradient(to top, rgba(32,36,45,0.94) 0%, rgba(32,36,45,0.88) 38%, rgba(32,36,45,0.25) 62%, rgba(32,36,45,0.05) 80%); }}
      #flash {{ position: absolute; inset: 0; z-index: 9; background: {SOFT}; opacity: 0; pointer-events: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
{chr(10).join(media)}
      <div id="grad"></div>
      <div id="gradEnd" class="clip" data-start="26" data-duration="5" data-track-index="2"></div>
      <div id="flash"></div>
      <audio id="music" class="clip" src="assets/music.m4a" data-start="0" data-duration="{TOTAL}" data-track-index="3" data-volume="1"></audio>
{hosts}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(kb)}
      tl.fromTo("#gradEnd", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6 }}, 26.0);
      tl.fromTo("#flash", {{ opacity: 0.85 }}, {{ opacity: 0, duration: 0.35, ease: "power2.out", immediateRender: false }}, 12.0);
      tl.fromTo("#flash", {{ opacity: 0.85 }}, {{ opacity: 0, duration: 0.35, ease: "power2.out", immediateRender: false }}, 22.5);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print(len(SCENES), "scenes,", len(SHOTS), "shots")
