"""HyperFrames build for "Same $1 Million" (sequence-of-returns explainer).

Two layouts: FACE (Hakeem full-frame) and CARD (Hakeem in a round PiP bubble at the bottom,
explainer cards above on a soft background). Reads ../words_out.json. Run: python -I build_hf.py
All text Outfit (house rule); FK colours.
"""
import json, os, html

HERE = os.path.dirname(os.path.abspath(__file__))
EDIT = os.path.dirname(HERE)
HF = os.path.join(HERE, "hf")
W, H = 1080, 1920
TOTAL = 120.7
SAGE, SAGE_D, SAGE_L, CHAR, SOFT, RED, SUN = "#5CA581", "#3B7F5E", "#8FD6AE", "#20242D", "#F6F7F9", "#F08A7E", "#FFC83D"
FONT = "'Outfit', sans-serif"
words = json.load(open(os.path.join(EDIT, "words_out.json")))

# CARD-mode windows (Hakeem in the bubble); everything else is FACE mode
CARD = [(9.2, 65.4), (69.9, 104.8)]
END = (117.6, TOTAL)        # end card
PIP = dict(cx=540, cy=1420, r=235, face_x=540, face_y=760, scale=0.42)

CSS = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; }}
    .hdr {{ position: absolute; left: 0; right: 0; top: 250px; display: flex; flex-direction: column; align-items: center; }}
    .chap {{ display: inline-block; padding: 12px 26px; border-radius: 999px; background: {CHAR}; color: #fff; font-weight: 700;
             font-size: 30px; letter-spacing: 0.14em; text-transform: uppercase; }}
    .area {{ position: absolute; left: 70px; right: 70px; top: 345px; height: 720px; display: flex; flex-direction: column;
             align-items: center; justify-content: center; gap: 22px; }}
    .card {{ border-radius: 36px; padding: 30px 40px; color: #fff; text-align: center;
             background: linear-gradient(140deg, rgba(92,165,129,0.95) 0%, rgba(44,62,58,0.96) 45%, rgba(32,36,45,0.98) 100%);
             border: 1.5px solid rgba(255,255,255,0.35); box-shadow: 0 24px 60px rgba(32,36,45,0.28), inset 0 1.5px 0 rgba(255,255,255,0.35); }}
    .lbl {{ font-weight: 500; font-size: 32px; letter-spacing: 0.06em; text-transform: uppercase; color: {SAGE_L}; }}
    .num {{ font-weight: 800; font-size: 104px; letter-spacing: -0.03em; line-height: 1.0; }}
    .mid {{ font-weight: 700; font-size: 60px; letter-spacing: -0.02em; line-height: 1.05; }}
    .sub {{ font-weight: 400; font-size: 34px; color: rgba(255,255,255,0.86); margin-top: 6px; }}
    .row {{ display: flex; gap: 20px; justify-content: center; align-items: stretch; }}
    .chip {{ padding: 18px 30px; border-radius: 26px; font-weight: 800; font-size: 64px; color: #fff; background: {RED};
             box-shadow: 0 14px 30px rgba(240,138,126,0.35); }}
    .avatar {{ width: 120px; height: 120px; border-radius: 60px; display: flex; align-items: center; justify-content: center;
               margin: 0 auto 8px; color: #fff; }}
    .pos {{ color: {SAGE_L}; }} .neg {{ color: {RED}; }} .hl {{ color: {SUN}; }}
    .note {{ font-weight: 400; font-size: 28px; color: rgba(32,36,45,0.7); margin-top: 4px; }}
    .tbl {{ width: 100%; }}
    .tr {{ display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px 26px; border-radius: 26px;
           margin-top: 14px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.16); text-align: left; }}
    .who {{ font-weight: 700; font-size: 40px; }}
    .val {{ font-weight: 800; font-size: 46px; text-align: right; }}
    .val small {{ display: block; font-weight: 500; font-size: 26px; color: rgba(255,255,255,0.8); }}
    .mark {{ width: 56px; height: 56px; border-radius: 28px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 34px; flex: none; }}
"""
USER = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'
SHIELD = '<svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def pop(sel, t, y=24):
    return (f'    tl.fromTo("{sel}", {{ opacity: 0, y: {y}, scale: 0.92 }}, '
            f'{{ opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.8)" }}, {t:.3f});')


SCENES = []


def scene(cid, start, dur, body, js, extra_css="", z=6, kind="graphics"):
    out_js = f'    tl.to("#{cid}-all", {{ opacity: 0, y: -16, duration: 0.25, ease: "power2.in" }}, {dur - 0.27:.3f});' if kind == "graphics" else ""
    with open(os.path.join(HF, "compositions", f"{cid}.html"), "w") as f:
        f.write(f"""<template>
  <style>
{CSS}
{extra_css}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{H}">
    <div id="{cid}-all">
{body}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js}
{out_js}
    window.__timelines["{cid}"] = tl;
  </script>
</template>
""")
    SCENES.append((cid, start, dur, kind, z))


def card_scene(cid, start, end, chapter, inner, cues):
    """cues: list of (selector, absolute_time)."""
    body = f'    <div class="hdr"><div class="chap" id="{cid}h">{chapter}</div></div>\n    <div class="area">{inner}</div>'
    js = [pop(f"#{cid}h", 0.05, 10)] + [pop(sel, max(0.12, t - start)) for sel, t in cues]
    scene(cid, start, end - start, body, "\n".join(js))


os.makedirs(os.path.join(HF, "compositions"), exist_ok=True)

# ---------- FACE-mode hook chips ----------
body = f'''    <div class="hdr" style="top:260px; gap:16px">
      <div class="chap" id="hk1" style="font-size:40px; background:{SAGE_D}">Same $1,000,000</div>
      <div class="chap" id="hk2" style="font-size:40px">Same $60,000 / year</div>
    </div>'''
scene("hook", 1.1, 8.0, body, "\n".join([pop("#hk1", 0.2), pop("#hk2", 1.75)]))

# ---------- PLAN 1: James ----------
card_scene("james", 9.2, 17.55, "Plan 1 &middot; James", f'''
      <div class="card" id="ja1" style="width:100%">
        <div class="avatar" style="background:{CHAR}">{USER}</div>
        <div class="mid">James</div>
        <div class="sub">All in the S&amp;P 500 (VOO)</div>
      </div>
      <div class="row" style="width:100%">
        <div class="card" id="ja2" style="flex:1"><div class="lbl">Invested</div><div class="mid">$1,000,000</div></div>
        <div class="card" id="ja3" style="flex:1"><div class="lbl">Takes 6%</div><div class="mid">$60,000<span style="font-size:34px">/yr</span></div></div>
      </div>''', [("#ja1", 9.35), ("#ja2", 12.95), ("#ja3", 14.15)])

card_scene("rough", 17.55, 23.7, "Plan 1 &middot; A rough start", f'''
      <div class="card" id="ro0" style="width:100%"><div class="mid">James retires into<br>a <span class="neg">rough market</span></div></div>
      <div class="row">
        <div class="chip" id="ro1">&minus;15%</div><div class="chip" id="ro2">&minus;10%</div><div class="chip" id="ro3">&minus;5%</div>
      </div>
      <div class="note" id="ro4" style="font-size:28px">Year 1 &middot; Year 2 &middot; Year 3</div>''',
           [("#ro0", 17.7), ("#ro1", 20.05), ("#ro2", 21.55), ("#ro3", 22.95), ("#ro4", 23.05)])

body = f'''    <div class="hdr"><div class="chap" id="seh">Plan 1 &middot; Selling at the bottom</div></div>
    <div class="area">
      <div class="card" id="se1" style="width:100%"><div class="lbl">Bills don&rsquo;t stop &rarr; he keeps selling</div></div>
      <div class="card" id="se2" style="width:100%">
        <div class="lbl">His $1 million after 3 years</div>
        <div class="num" id="secnt">$1,000,000</div>
        <div class="sub neg" id="se3" style="font-weight:700">&minus;$425,000</div>
      </div>
    </div>'''
js = "\n".join([pop("#seh", 0.05, 10), pop("#se1", 25.9 - 23.7), pop("#se2", 27.3 - 23.7), pop("#se3", 29.7 - 23.7),
                f'''    const cnt = {{ v: 1000000 }};
    tl.fromTo(cnt, {{ v: 1000000 }}, {{ v: 575000, duration: 1.4, ease: "power2.inOut",
      onUpdate: () => {{ document.querySelector("#secnt").textContent = "$" + Math.round(cnt.v / 1000).toLocaleString("en-US") + ",000"; }} }}, {28.2 - 23.7:.3f});
    tl.fromTo("#secnt", {{ color: "#ffffff" }}, {{ color: "{RED}", duration: 0.4 }}, {29.4 - 23.7:.3f});'''])
scene("selling", 23.7, 31.9 - 23.7, body, js)

# ---------- PLAN 2: Carol ----------
card_scene("carol", 31.9, 41.2, "Plan 2 &middot; Carol", f'''
      <div class="card" id="ca1" style="width:100%">
        <div class="avatar" style="background:{SAGE_D}">{USER}</div>
        <div class="mid">Carol</div>
      </div>
      <div class="card" id="ca2" style="width:100%; text-align:left">
        <div class="sub" id="ca3" style="font-size:40px; margin:6px 0">&#10003; Same $1,000,000</div>
        <div class="sub" id="ca4" style="font-size:40px; margin:6px 0">&#10003; Same $60,000 / year</div>
        <div class="sub" id="ca5" style="font-size:40px; margin:6px 0">&#10003; Same bad start</div>
      </div>
      <div class="chap" id="ca6" style="font-size:40px; background:{SUN}; color:{CHAR}">But she buys income first</div>''',
           [("#ca1", 32.75), ("#ca2", 33.6), ("#ca3", 33.75), ("#ca4", 34.75), ("#ca5", 37.0), ("#ca6", 39.75)])

card_scene("pension", 41.2, 53.6, "Plan 2 &middot; Step 1: Buy income", f'''
      <div class="card" id="pe1" style="width:100%">
        <div style="color:{SAGE_L}; display:flex; justify-content:center">{SHIELD}</div>
        <div class="lbl" style="margin-top:6px">Private pension account</div>
        <div class="mid">$500,000 <span class="pos">@ 6.5%</span></div>
      </div>
      <div class="card" id="pe2" style="width:100%">
        <div class="num">$32,500<span style="font-size:44px">/yr</span></div>
        <div class="sub" style="font-weight:700; color:{SUN}">For the rest of her life</div>
      </div>
      <div class="row"><div class="chap" id="pe3" style="font-size:32px; background:{SAGE_D}">&#10003; No matter what the market does</div></div>''',
           [("#pe1", 41.75), ("#pe2", 47.25), ("#pe3", 51.35)])

card_scene("voo", 53.6, 65.4, "Plan 2 &middot; Step 2: Invest the rest", f'''
      <div class="card" id="vo1" style="width:100%"><div class="lbl">Other half in VOO</div><div class="mid">$500,000</div>
        <div class="sub">She only needs <b style="color:#fff">$27,500 / yr</b> from it</div></div>
      <div class="card" id="vo2" style="width:100%">
        <div class="row" style="align-items:baseline; gap:14px">
          <span class="mid" id="vo3" style="font-size:54px">$32,500</span><span class="mid pos" style="font-size:54px">+</span>
          <span class="mid" id="vo4" style="font-size:54px">$27,500</span></div>
        <div class="num" id="vo5" style="margin-top:8px">= $60,000</div>
        <div class="sub" id="vo6" style="font-weight:700; color:{SUN}">Same as James</div>
      </div>''', [("#vo1", 54.15), ("#vo2", 60.35), ("#vo3", 60.35), ("#vo4", 61.65), ("#vo5", 63.75), ("#vo6", 64.95)])

# ---------- FACE: "same income, same bad start" ----------
body = '''    <div class="hdr" style="top:260px"><div class="chap" id="tw1" style="font-size:40px">Same income &middot; Same bad start</div></div>'''
scene("turn", 65.5, 4.3, body, pop("#tw1", 0.3))

# ---------- Results ----------
def tr(rid, who, val, small, ok):
    mark = (f'<div class="mark" style="background:{SAGE}">&#10003;</div>' if ok else
            f'<div class="mark" style="background:#C8473C">&#10007;</div>')
    return (f'<div class="tr" id="{rid}"><div style="display:flex; align-items:center; gap:16px">{mark}<span class="who">{who}</span></div>'
            f'<div class="val">{val}<small>{small}</small></div></div>')

card_scene("strong", 69.9, 83.5, "If the market averages 9%", f'''
      <div class="card" id="st0" style="width:100%">
        <div class="lbl">After 20 years</div>
        <div class="tbl">
          {tr("st1", "James", "$859K", "left on paper", True)}
          {tr("st2", "Carol", "$606K", "+ $32,500 / yr for life", True)}
        </div>
      </div>
      <div class="chap" id="st3" style="font-size:34px; background:{SAGE_D}">Strong market: both are fine</div>
      <div class="note" id="st4">Hypothetical example for illustration only</div>''',
           [("#st0", 70.95), ("#st1", 75.55), ("#st2", 77.95), ("#st3", 81.0), ("#st4", 81.0)])

card_scene("weak", 83.5, 96.0, "If it averages 6.6%", f'''
      <div class="card" id="wk0" style="width:100%">
        <div class="lbl">Same income &middot; same bad start</div>
        <div class="tbl">
          {tr("wk1", "James", '<span class="neg">$0</span>', "runs out in year 26", False)}
          {tr("wk2", "Carol", "$187K", "at year 30 + $32,500 / yr for life", True)}
        </div>
      </div>
      <div class="chap" id="wk3" style="font-size:34px; background:{SUN}; color:{CHAR}">Carol&rsquo;s paycheck never changed</div>
      <div class="note" id="wk4">Hypothetical example for illustration only</div>''',
           [("#wk0", 86.05), ("#wk1", 87.05), ("#wk2", 90.25), ("#wk3", 93.6), ("#wk4", 93.6)])

card_scene("srr", 96.0, 104.8, "The lesson", f'''
      <div class="card" id="sr1" style="width:100%; padding:44px 40px">
        <div class="mid" style="font-size:72px">Sequence of<br><span class="hl">returns risk</span></div>
      </div>
      <div class="card" id="sr2" style="width:100%">
        <div class="sub" style="font-size:40px; color:#fff">A bad start + withdrawals<br>can <b class="neg">break your plan</b>,</div>
        <div class="sub" style="font-size:34px">even if the average looks fine.</div>
      </div>''', [("#sr1", 96.75), ("#sr2", 99.75)])

# ---------- FACE CTA chips ----------
body = f'''    <div class="hdr" style="top:260px; gap:16px">
      <div class="chap" id="ct1" style="font-size:38px; background:{RED}">James: hoping the market cooperates</div>
      <div class="chap" id="ct2" style="font-size:38px; background:{SAGE_D}">Carol: has a paycheck</div>
    </div>'''
scene("contrast", 104.9, 5.4, body, "\n".join([pop("#ct1", 0.1), pop("#ct2", 107.7 - 104.9)]))
body = f'''    <div class="hdr" style="top:260px"><div class="chap" id="dm1" style="font-size:48px; background:{SAGE_D}; padding:18px 36px">DM me &ldquo;INCOME&rdquo;</div>
      <div class="chap" id="dm2" style="font-size:32px; margin-top:16px">Within 10 years of retirement?</div></div>'''
scene("dm", 110.4, 117.6 - 110.4, body, "\n".join([pop("#dm2", 0.2), pop("#dm1", 113.85 - 110.4)]))

# ---------- end card ----------
body = f'''    <div id="eb" style="position:absolute; inset:0; background: radial-gradient(120% 80% at 50% 25%, #2E3440 0%, {CHAR} 60%, #14171D 100%);
         display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#fff">
      <div class="lbl" id="e1">Same $1M &middot; Same income</div>
      <div class="num" id="e2" style="font-size:120px; margin-top:20px">Different plan.</div>
      <div class="chap" id="e3" style="font-size:46px; background:{SAGE_D}; margin-top:48px; padding:18px 38px">DM &ldquo;INCOME&rdquo;</div>
      <div class="sub" id="e4" style="margin-top:30px; font-size:36px"><b style="font-weight:700">Finance Keem</b> &middot; FK Management</div>
      <div class="sub" id="e5" style="position:absolute; left:80px; right:80px; bottom:110px; font-size:21px; color:rgba(255,255,255,0.55)">
        Hypothetical example for illustration only; not investment advice. Returns are not guaranteed. &ldquo;Private pension account&rdquo; refers to a lifetime
        income product issued by an insurance company; payouts vary by age, product and insurer, and guarantees depend on the issuer&rsquo;s claims-paying ability.</div>
    </div>'''
scene("endcard", END[0], END[1] - END[0], body,
      "\n".join(['    tl.fromTo("#eb", { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" }, 0);',
                 pop("#e1", 0.3), pop("#e2", 0.5), pop("#e3", 0.85), pop("#e4", 1.1), pop("#e5", 1.2, 0)]), z=9, kind="end")

# ---------- captions ----------
BLOCK = [END]
groups, cur = [], []
for w in words:
    if any(a <= w["start"] < b for a, b in BLOCK):
        continue
    if cur and (w["start"] - cur[-1]["end"] >= 0.2 or len(cur) >= 4):
        groups.append(cur); cur = []
    cur.append(w)
    if w["text"].endswith((".", "?", "!", ",")):
        groups.append(cur); cur = []
if cur: groups.append(cur)
KEY = {"$1", "million,", "$60,000", "$60,000,", "6%", "15%,", "10,", "5.", "$575,000.", "$500,000", "6.5%.", "$32,500", "$27,500", "9%",
       "$859,000", "$600,000", "6.6%,", "26,", "completely.", "paycheck.", "income,", "first.", "INCOME,", "life,", "life."}
items = []
for k, g in enumerate(groups):
    s = max(0.05, g[0]["start"] - 0.03)
    nxt = groups[k + 1][0]["start"] - 0.03 if k + 1 < len(groups) else END[0]
    e = min(max(g[-1]["end"] + 0.12, s + 0.4), nxt, END[0])
    card = any(a <= s < b for a, b in CARD)
    def fmt(w):
        t = html.escape(w["text"])
        return f"<i>{t}</i>" if w["text"] in KEY else t
    items.append((s, e - s, " ".join(fmt(w) for w in g), card))
ccss = f"""    .cap {{ position: absolute; left: 0; right: 0; top: 1290px; text-align: center; }}
    .cap.c {{ top: 1100px; }}
    .cap span {{ display: inline-block; padding: 12px 28px; border-radius: 24px; background: rgba(32,36,45,0.9); color: #fff; font-weight: 700;
                 font-size: 50px; letter-spacing: -0.01em; white-space: nowrap; box-shadow: 0 10px 26px rgba(0,0,0,0.25); }}
    .cap i {{ font-style: normal; color: {SUN}; }}"""
body = "\n".join(f'    <div class="cap clip{" c" if c else ""}" id="cap{k}" data-start="{s:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>'
                 for k, (s, d, t, c) in enumerate(items))
js = "\n".join(f'    tl.fromTo("#capt{k}", {{ opacity: 0, y: 10 }}, {{ opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }}, {s:.3f});'
               for k, (s, d, t, c) in enumerate(items))
scene("captions", 0, TOTAL, body, js, ccss, z=7, kind="captions")

# ---------- root: layout morphs FACE <-> CARD ----------
p = PIP
full_clip = f"circle(1500px at {p['face_x']}px {p['face_y']}px)"
pip_clip = f"circle({p['r']}px at {p['cx']}px {p['cy']}px)"
dy = p["cy"] - p["face_y"]
morph = []
for i, (a, b) in enumerate(CARD):
    if i == 0:
        morph.append(f'      tl.fromTo("#stage", {{ clipPath: "{full_clip}" }}, {{ clipPath: "{pip_clip}", duration: 0.6, ease: "power3.inOut" }}, {a - 0.3:.3f});')
        morph.append(f'      tl.fromTo("#cam", {{ scale: 1, y: 0 }}, {{ scale: {p["scale"]}, y: {dy}, duration: 0.6, ease: "power3.inOut" }}, {a - 0.3:.3f});')
        morph.append(f'      tl.fromTo("#ring", {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, {a + 0.1:.3f});')
    else:
        morph.append(f'      tl.to("#stage", {{ clipPath: "{pip_clip}", duration: 0.6, ease: "power3.inOut" }}, {a - 0.3:.3f});')
        morph.append(f'      tl.to("#cam", {{ scale: {p["scale"]}, y: {dy}, duration: 0.6, ease: "power3.inOut" }}, {a - 0.3:.3f});')
        morph.append(f'      tl.to("#ring", {{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, {a + 0.1:.3f});')
    morph.append(f'      tl.to("#ring", {{ opacity: 0, duration: 0.2 }}, {b - 0.35:.3f});')
    morph.append(f'      tl.to("#stage", {{ clipPath: "{full_clip}", duration: 0.6, ease: "power3.inOut" }}, {b - 0.3:.3f});')
    morph.append(f'      tl.to("#cam", {{ scale: 1, y: 0, duration: 0.6, ease: "power3.inOut" }}, {b - 0.3:.3f});')
# FACE-mode punch-ins (only between card windows)
for t, s in [(5.35, 1.12), (8.5, 1.0), (67.4, 1.12), (69.3, 1.0), (107.7, 1.12), (110.4, 1.0), (113.85, 1.1)]:
    morph.append(f'      tl.set("#cam", {{ scale: {s} }}, {t:.3f});')

SFX = [("pop", 1.3), ("whoosh-short", 8.9), ("pop", 14.15), ("click", 20.05), ("click", 21.55), ("click", 22.95), ("pop", 29.6),
       ("whoosh-short", 31.7), ("pop", 47.25), ("pop", 63.75), ("whoosh-short", 69.6), ("pop", 75.55), ("pop", 87.05), ("pop", 96.75),
       ("pop", 113.85), ("chime", 117.7)]
json.dump(SFX, open(os.path.join(EDIT, "sfx_cues.json"), "w"))

hosts = "\n".join(
    f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.3f}" data-duration="{d:.3f}" '
    f'data-track-index="{2 if k == "captions" else 1}" data-track-kind="{"captions" if k == "captions" else "graphics"}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>'
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
      #ground {{ position: absolute; inset: 0; background: radial-gradient(110% 70% at 50% 20%, #FFFFFF 0%, {SOFT} 55%, #E4ECE7 100%); }}
      #stage {{ position: absolute; inset: 0; overflow: hidden; z-index: 2; clip-path: {full_clip}; }}
      #cam {{ position: absolute; inset: 0; transform-origin: {p['face_x']}px {p['face_y']}px; }}
      #footage {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: cover; }}
      #ring {{ position: absolute; left: {p['cx'] - p['r'] - 8}px; top: {p['cy'] - p['r'] - 8}px; width: {2 * p['r'] + 16}px; height: {2 * p['r'] + 16}px;
               border-radius: 50%; border: 8px solid {SAGE}; box-shadow: 0 20px 50px rgba(32,36,45,0.3); z-index: 3; opacity: 0; pointer-events: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
      <div id="ground"></div>
      <div id="stage" data-layout-allow-overflow><div id="cam">
        <video id="footage" class="clip" src="assets/footage.mp4" data-start="0" data-duration="{TOTAL}" data-track-index="0" muted playsinline></video>
      </div></div>
      <div id="ring" data-layout-ignore></div>
{hosts}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(morph)}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print(len(SCENES), "scenes;", len(items), "caption groups")
