"""Build the 5-slide "1% market vs 4% rule / sequence of returns" carousel (1080x1350).

Run:  python -I build.py   then   node render.js   (writes slides/slide-N.png)
Numbers: $1M portfolio, 4% ($40K) withdrawn at the start of each year.
  1 yr at +1%: 1,000,000 + 10,000 - 40,000 = 970,000 (simple form shown on slide)
  A: +20%, +10%, -15% -> 1,005,720     B: -15%, +10%, +20% -> 976,320
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SAGE, SAGE_L, CHAR, SOFT, RED = "#5CA581", "#8FD6AE", "#20242D", "#F6F7F9", "#F08A7E"

BASE = f"""
@font-face {{ font-family: 'Limelight'; src: url('fonts/limelight-latin-400-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Josefin Sans'; font-weight: 400; src: url('fonts/josefin-sans-latin-400-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Josefin Sans'; font-weight: 600; src: url('fonts/josefin-sans-latin-600-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Josefin Sans'; font-weight: 700; src: url('fonts/josefin-sans-latin-700-normal.woff2') format('woff2'); }}
@font-face {{ font-family: 'Poiret One'; src: url('fonts/poiret-one-latin-400-normal.woff2') format('woff2'); }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 1080px; height: 1350px; overflow: hidden; background: {CHAR}; font-family: 'Josefin Sans', sans-serif; color: {SOFT}; }}
.photo {{ position: absolute; inset: 0; background-size: cover; background-repeat: no-repeat; }}
/* charcoal gradient, 60% at the text side fading out toward the subject */
.shade {{ position: absolute; inset: 0; background: linear-gradient(to top, rgba(32,36,45,0.60) 0%, rgba(32,36,45,0.60) 36%, rgba(32,36,45,0.22) 64%, rgba(32,36,45,0.22) 84%, rgba(32,36,45,0.60) 100%); }}
.shade.cover {{ background: linear-gradient(to bottom, rgba(32,36,45,0.55) 0%, rgba(32,36,45,0) 14%); }}
.shade.top {{ background: linear-gradient(to bottom, rgba(32,36,45,0.60) 0%, rgba(32,36,45,0.60) 52%, rgba(32,36,45,0.20) 80%, rgba(32,36,45,0.20) 100%); }}
.glass {{ position: absolute; border-radius: 40px; padding: 42px 46px;
          background: linear-gradient(140deg, rgba(92,165,129,0.42) 0%, rgba(44,62,58,0.55) 38%, rgba(32,36,45,0.72) 100%);
          border: 1.5px solid rgba(255,255,255,0.30);
          box-shadow: 0 30px 70px rgba(0,0,0,0.40), inset 0 1.5px 0 rgba(255,255,255,0.40);
          backdrop-filter: blur(24px) saturate(150%); -webkit-backdrop-filter: blur(24px) saturate(150%); }}
.glass::before {{ content: ''; position: absolute; inset: 0; border-radius: 40px; pointer-events: none;
                  background: radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0) 55%); }}
.glass > * {{ position: relative; }}
.kicker {{ font-weight: 700; font-size: 28px; letter-spacing: 0.22em; text-transform: uppercase; color: {SAGE_L}; }}
.deco {{ font-family: 'Limelight', serif; font-size: 74px; line-height: 1.04; text-transform: uppercase; color: #fff; }}
.deco em {{ font-style: normal; background: linear-gradient(180deg, #FFFFFF 0%, {SAGE_L} 60%, {SAGE} 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }}
.rule {{ position: relative; height: 3px; width: 120px; margin: 22px 0 20px; background: linear-gradient(90deg, {SAGE_L}, rgba(143,214,174,0)); }}
.rule::after {{ content: ''; position: absolute; left: 130px; top: -4px; width: 10px; height: 10px; transform: rotate(45deg); background: {SAGE_L}; }}
.desc {{ font-size: 37px; line-height: 1.28; color: rgba(255,255,255,0.93); }}
.desc b {{ font-weight: 700; color: #fff; }}
.brand {{ position: absolute; left: 56px; top: 52px; font-family: 'Poiret One', sans-serif; font-size: 34px; letter-spacing: 0.18em; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,0.5); }}
.brand b {{ font-family: 'Limelight', serif; font-weight: 400; color: {SAGE_L}; letter-spacing: 0.06em; }}
.count {{ position: absolute; right: 56px; top: 48px; padding: 10px 22px; border-radius: 30px; font-weight: 600; font-size: 26px; letter-spacing: 0.08em;
          background: rgba(32,36,45,0.55); border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(12px); }}
.swipe {{ display: inline-flex; align-items: center; gap: 14px; margin-top: 26px; padding: 16px 30px; border-radius: 40px; background: {SOFT}; color: {CHAR}; font-weight: 700; font-size: 30px; }}
.math {{ margin-top: 6px; }}
.row {{ display: flex; justify-content: space-between; align-items: baseline; font-size: 39px; padding: 10px 0; }}
.row .k {{ color: rgba(255,255,255,0.85); }} .row .v {{ font-weight: 700; letter-spacing: -0.01em; }}
.row .op {{ display: inline-block; width: 44px; color: {SAGE_L}; font-weight: 700; }}
.neg {{ color: {RED}; }} .pos {{ color: {SAGE_L}; }}
.line {{ height: 2px; background: rgba(255,255,255,0.32); margin: 8px 0; }}
.total {{ font-size: 46px; }}
.note {{ font-size: 24px; color: rgba(255,255,255,0.62); margin-top: 16px; letter-spacing: 0.02em; }}
.duo {{ display: flex; gap: 18px; margin-top: 8px; }}
.tile {{ flex: 1; border-radius: 26px; padding: 22px 24px; background: rgba(255,255,255,0.09); border: 1px solid rgba(255,255,255,0.18); }}
.tile .who {{ font-weight: 700; font-size: 26px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.75); }}
.tile .seq {{ font-weight: 700; font-size: 32px; margin-top: 10px; }}
.tile .end {{ font-family: 'Limelight', serif; font-size: 50px; margin-top: 12px; }}
.tile.good {{ border-color: rgba(143,214,174,0.6); }} .tile.bad {{ border-color: rgba(240,138,126,0.6); }}
.proof {{ position: absolute; left: 50px; top: 172px; width: 560px; transform: rotate(-2.5deg); transform-origin: left top; }}
.proof img {{ display: block; width: 100%; border-radius: 22px; border: 2px solid rgba(255,255,255,0.55);
              box-shadow: 0 24px 60px rgba(0,0,0,0.55); }}
.proof .tag {{ position: absolute; left: 18px; top: -22px; padding: 8px 18px; border-radius: 22px; background: {SAGE}; color: #fff;
               font-weight: 700; font-size: 22px; letter-spacing: 0.16em; text-transform: uppercase; box-shadow: 0 8px 20px rgba(0,0,0,0.35); }}
.cta {{ display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 28px; height: 96px; border-radius: 48px;
        background: #3B7F5E; font-weight: 700; font-size: 34px; box-shadow: 0 14px 36px rgba(59,127,94,0.5); }}
.sig {{ margin-top: 18px; font-size: 26px; color: rgba(255,255,255,0.8); text-align: center; }}
"""

ARROW = '<svg width="34" height="22" viewBox="0 0 34 22"><path d="M2 11h27M21 3l8 8-8 8" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
ARROW_D = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M12 4v15M5 13l7 7 7-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
BRAND = '<div class="brand"><b>FK</b> MANAGEMENT</div>'
DISC = 'Hypothetical example for illustration only. Not investment advice.'


def page(n, photo, pos, inner, shade="bottom"):
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE}</style></head><body>
<div class="photo" style="background-image:url('photos/{photo}'); background-position: {pos};"></div>
<div class="shade{' top' if shade == 'top' else ''}{' cover' if shade == 'cover' else ''}"></div>
{BRAND}
<div class="count">{n} / 5</div>
{inner}
</body></html>"""


slides = [
    page(1, "1_sitting.jpg", "50% 30%", f"""
<div class="glass" style="left:56px; right:56px; bottom:56px; padding:34px 42px;">
  <div class="kicker">The 4% rule problem</div>
  <div class="deco" style="font-size:62px; margin-top:12px; white-space:nowrap;">The market&rsquo;s up 1%.<br><em>Why are you down?</em></div>
  <div class="rule"></div>
  <div class="desc" style="font-size:34px;">If the year ended today, many retirees would have <b>less</b> than they started with.</div>
  <div class="swipe" style="margin-top:20px; padding:12px 26px; font-size:30px;">Swipe {ARROW}</div>
</div>""", shade="cover"),
    page(2, "2_side.jpg", "50% 20%", f"""
<div class="proof"><div class="tag">Proof &middot; SPY YTD</div><img src="photos/spy_ytd.png" alt="SPY up 1.16% year to date"></div>
<div class="glass" style="left:56px; right:56px; bottom:64px;">
  <div class="kicker">Do the math</div>
  <div class="deco" style="font-size:64px; margin-top:10px;">An &ldquo;up&rdquo; year<br>that costs you</div>
  <div class="rule"></div>
  <div class="math">
    <div class="row"><span class="k"><span class="op"></span>Portfolio</span><span class="v">$1,000,000</span></div>
    <div class="row"><span class="k"><span class="op">+</span>S&amp;P 500 up ~1%</span><span class="v pos">+$10,000</span></div>
    <div class="row"><span class="k"><span class="op">&minus;</span>4% withdrawal</span><span class="v neg">&minus;$40,000</span></div>
    <div class="line"></div>
    <div class="row total"><span class="k"><span class="op">=</span>Year-end</span><span class="v">$970,000</span></div>
  </div>
  <div class="note">{DISC}</div>
</div>"""),
    page(3, "4_bending.jpg", "50% 30%", f"""
<div class="glass" style="left:56px; right:56px; top:128px;">
  <div class="kicker">Sequence of returns</div>
  <div class="deco" style="font-size:60px; margin-top:10px;">Same returns.<br><em>Different order.</em></div>
  <div class="rule"></div>
  <div class="duo">
    <div class="tile good"><div class="who">Retiree A</div><div class="seq">+20% &middot; +10% &middot; <span class="neg">&minus;15%</span></div><div class="end pos">$1.01M</div></div>
    <div class="tile bad"><div class="who">Retiree B</div><div class="seq"><span class="neg">&minus;15%</span> &middot; +10% &middot; +20%</div><div class="end neg">$976K</div></div>
  </div>
  <div class="desc" style="font-size:31px; margin-top:20px;">Both start with $1M and take $40K a year. B hit the bad year first, <b>selling low to pay the bills</b>, and never caught up.</div>
  <div class="note">{DISC}</div>
</div>""", shade="top"),
    page(4, "3_standing.jpg", "50% 30%", f"""
<div class="glass" style="left:56px; right:56px; bottom:64px;">
  <div class="kicker">The fix</div>
  <div class="deco" style="font-size:66px; margin-top:10px;">Guaranteed<br>income <em>first</em></div>
  <div class="rule"></div>
  <div class="desc">Cover your <b>essential bills</b> with income that doesn&rsquo;t depend on the market &mdash; Social Security, a pension, guaranteed income. Let your investments handle <b>growth</b>, not your grocery bill.</div>
</div>"""),
    page(5, "5_arms_out.jpg", "50% 22%", f"""
<div class="glass" style="left:56px; right:56px; bottom:60px; text-align:center;">
  <div class="kicker">Be honest</div>
  <div class="deco" style="font-size:58px; margin-top:14px;">Is your retirement income<br><em>guaranteed</em> &mdash; or hoping<br>the market cooperates?</div>
  <div class="cta">Comment &ldquo;INCOME&rdquo; or DM me {ARROW_D}</div>
  <div class="sig">I&rsquo;ll stress-test your plan &middot; <b style="color:#fff">Hakeem Hooker</b>, FK Management</div>
</div>"""),
]

for i, html in enumerate(slides, 1):
    with open(os.path.join(HERE, f"slide-{i}.html"), "w") as f:
        f.write(html)
print("wrote", len(slides), "slides")
