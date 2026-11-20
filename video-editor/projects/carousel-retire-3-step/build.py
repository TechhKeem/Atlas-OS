"""Build the 5-slide "3-step retirement check" carousel (1080x1350) as HTML.

Run:  python -I build.py   then   node render.js   (writes slides/slide-N.png)
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SAGE, SAGE_L, CHAR, PLAT, SOFT = "#5CA581", "#8FD6AE", "#20242D", "#C1C4C8", "#F6F7F9"

BASE = f"""
@font-face {{ font-family: 'Limelight'; src: url('fonts/limelight-latin-400-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Poiret One'; src: url('fonts/poiret-one-latin-400-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Inter'; font-weight: 400; src: url('fonts/inter-latin-400-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Inter'; font-weight: 600; src: url('fonts/inter-latin-600-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Inter'; font-weight: 700; src: url('fonts/inter-latin-700-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Inter'; font-weight: 800; src: url('fonts/inter-latin-800-normal.woff2') format('woff2'); }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1080px; height: 1350px; overflow: hidden; background: {CHAR}; font-family: 'Inter', sans-serif; color: {SOFT}; }}
.photo {{ position: absolute; inset: 0; background-size: cover; background-repeat: no-repeat; }}
.scrim {{ position: absolute; left: 0; right: 0; bottom: 0; height: 58%;
          background: linear-gradient(to bottom, rgba(20,23,29,0) 0%, rgba(20,23,29,0.45) 55%, rgba(20,23,29,0.78) 100%); }}
.scrim.top {{ top: 0; bottom: auto; height: 48%; background: linear-gradient(to top, rgba(20,23,29,0) 0%, rgba(20,23,29,0.5) 70%, rgba(20,23,29,0.7) 100%); }}
.glass {{ position: absolute; border-radius: 40px; padding: 44px 48px;
          background: linear-gradient(140deg, rgba(92,165,129,0.46) 0%, rgba(44,62,58,0.55) 38%, rgba(32,36,45,0.70) 100%);
          border: 1.5px solid rgba(255,255,255,0.30);
          box-shadow: 0 30px 70px rgba(0,0,0,0.40), inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(24px) saturate(150%); -webkit-backdrop-filter: blur(24px) saturate(150%); }}
.glass::before {{ content: ''; position: absolute; inset: 0; border-radius: 40px; pointer-events: none;
                  background: radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 55%); }}
.kicker {{ font-weight: 700; font-size: 26px; letter-spacing: 0.22em; text-transform: uppercase; color: {SAGE_L}; position: relative; }}
.num {{ font-family: 'Limelight', serif; font-size: 120px; line-height: 0.9; position: relative;
        background: linear-gradient(180deg, #FFFFFF 0%, {SAGE_L} 55%, {SAGE} 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }}
.deco {{ font-family: 'Limelight', serif; font-size: 76px; line-height: 1.02; letter-spacing: 0.01em; text-transform: uppercase; position: relative; color: #fff; }}
.rule {{ position: relative; height: 3px; width: 120px; margin: 22px 0 20px; background: linear-gradient(90deg, {SAGE_L}, rgba(143,214,174,0)); }}
.rule::after {{ content: ''; position: absolute; left: 130px; top: -4px; width: 10px; height: 10px; transform: rotate(45deg); background: {SAGE_L}; }}
.desc {{ position: relative; font-weight: 400; font-size: 35px; line-height: 1.32; color: rgba(255,255,255,0.92); }}
.desc b {{ font-weight: 700; color: #fff; }}
.brand {{ position: absolute; left: 56px; top: 52px; font-family: 'Poiret One', sans-serif; font-weight: 400; font-size: 34px; letter-spacing: 0.18em; color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5); }}
.brand b {{ font-family: 'Limelight', serif; font-weight: 400; color: {SAGE_L}; letter-spacing: 0.06em; }}
.count {{ position: absolute; right: 56px; top: 48px; padding: 10px 22px; border-radius: 30px; font-weight: 600; font-size: 26px; letter-spacing: 0.08em;
          background: rgba(32,36,45,0.55); border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(12px); }}
.swipe {{ display: inline-flex; align-items: center; gap: 14px; margin-top: 28px; padding: 16px 30px; border-radius: 40px; position: relative;
          background: {SOFT}; color: {CHAR}; font-weight: 800; font-size: 30px; letter-spacing: 0.04em; }}
.chips {{ position: relative; display: flex; align-items: center; gap: 12px; margin-top: 24px; flex-wrap: nowrap; }}
.chip {{ padding: 12px 18px; border-radius: 18px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22); font-weight: 700; font-size: 28px; white-space: nowrap; }}
.op {{ font-weight: 800; font-size: 32px; color: {SAGE_L}; }}
.chip.res {{ background: {SAGE}; border-color: {SAGE}; }}
.small {{ position: relative; font-size: 22px; color: rgba(255,255,255,0.62); margin-top: 14px; letter-spacing: 0.02em; }}
.cta {{ position: relative; display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 30px; height: 96px; border-radius: 48px;
        background: #3B7F5E; font-weight: 800; font-size: 34px; box-shadow: 0 14px 36px rgba(59,127,94,0.5); }}
.sig {{ position: relative; margin-top: 22px; font-size: 26px; color: rgba(255,255,255,0.78); text-align: center; letter-spacing: 0.02em; }}
"""

ARROW = '<svg width="34" height="22" viewBox="0 0 34 22"><path d="M2 11h27M21 3l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_D = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 4v15M5 13l7 7 7-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
BRAND = '<div class="brand"><b>FK</b> MANAGEMENT</div>'


def page(n, photo, pos, inner, scrim="bottom", brand=True):
    sc = {"top": '<div class="scrim top"></div>', "both": '<div class="scrim"></div><div class="scrim top" style="height:22%"></div>'}.get(scrim, '<div class="scrim"></div>')
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE}</style></head><body>
<div class="photo" style="background-image:url('photos/{photo}'); background-position: {pos};"></div>
{sc}
{BRAND if brand else ''}
<div class="count">{n} / 5</div>
{inner}
</body></html>"""


slides = []
# 1 — cover
slides.append(page(1, "1_stage_peace.jpg", "50% 22%", f"""
<div class="glass" style="left:56px; right:56px; bottom:64px;">
  <div class="kicker">The retirement check</div>
  <div class="deco" style="font-size:96px; margin-top:16px;">Can you<br>retire?</div>
  <div class="rule"></div>
  <div class="desc">The <b>3 simple steps</b> I walk every client through to find out.</div>
  <div class="swipe">Swipe {ARROW}</div>
</div>"""))
# 2 — step 1
slides.append(page(2, "2_stage_stand.jpg", "50% 20%", f"""
<div class="glass" style="left:56px; right:56px; bottom:64px;">
  <div class="kicker">Step</div>
  <div class="num">01</div>
  <div class="deco" style="margin-top:10px;">Roll it over</div>
  <div class="rule"></div>
  <div class="desc">That old <b>401(k)</b> sitting at a past job? Roll it into a <b>private pension</b> that pays you a steady monthly income.</div>
</div>"""))
# 3 — step 2
slides.append(page(3, "3_red_carpet.jpg", "50% 18%", f"""
<div class="glass" style="left:56px; right:56px; bottom:64px;">
  <div class="kicker">Step</div>
  <div class="num">02</div>
  <div class="deco" style="margin-top:10px;">Do the math</div>
  <div class="rule"></div>
  <div class="desc">Add your pension income to your <b>Social Security</b>, then subtract your <b>monthly expenses</b>.</div>
  <div class="chips"><span class="chip">$2,100</span><span class="op">+</span><span class="chip">$1,900</span><span class="op">&minus;</span><span class="chip">$3,600</span><span class="op">=</span><span class="chip res">+$400</span></div>
  <div class="small">Example numbers for illustration</div>
</div>""", scrim="both"))
# 4 — step 3 (booth: widget top-left, clear of the face and the FK sign)
slides.append(page(4, "4_booth.jpg", "50% 10%", f"""
<div class="glass" style="left:44px; width:640px; top:120px; padding:38px 40px;">
  <div class="kicker"><span style="font-family:'Limelight',serif; letter-spacing:.06em">FK</span> &middot; Step</div>
  <div class="num" style="font-size:104px">03</div>
  <div class="deco" style="font-size:64px; margin-top:8px;">Read the<br>result</div>
  <div class="rule"></div>
  <div class="desc" style="font-size:31px"><b style="color:{SAGE_L}">Positive?</b> You can retire.<br><b style="color:#F2C46B">Negative?</b> We build a plan to close the gap.</div>
</div>""", scrim="top", brand=False))
# 5 — CTA
slides.append(page(5, "5_headshot.jpg", "50% 0%", f"""
<div class="glass" style="left:56px; right:56px; bottom:60px; text-align:center;">
  <div class="kicker">Be honest</div>
  <div class="deco" style="font-size:62px; margin-top:16px;">Positive or negative &mdash;<br>where would<br>your number land?</div>
  <div class="cta">Comment &ldquo;RETIRE&rdquo; or DM me {ARROW_D}</div>
  <div class="sig">I&rsquo;ll help you run your numbers &middot; <b style="color:#fff">Hakeem Hooker</b>, FK Management</div>
</div>"""))

for i, html in enumerate(slides, 1):
    with open(os.path.join(HERE, f"slide-{i}.html"), "w") as f:
        f.write(html)
print("wrote", len(slides), "slides")
