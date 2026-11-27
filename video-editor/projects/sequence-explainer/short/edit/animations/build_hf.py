"""HyperFrames build for the 60 s "Same $1 Million" short with animated characters.

Original cartoon characters (James, Carol) drawn as layered SVG with soft 3D-style shading
(radial gradients, rim light, contact shadows) and acting: blinks, expressions, waves, reactions.
FACE layout for the hook and CTA; STAGE layout (characters + props, Hakeem in a round PiP bubble)
for the story. All text Outfit, FK colours. Reads ../words_out.json. Run: python -I build_hf.py
"""
import json, os, html, random

HERE = os.path.dirname(os.path.abspath(__file__))
EDIT = os.path.dirname(HERE)
HF = os.path.join(HERE, "hf")
W, H = 1080, 1920
TOTAL = 63.7
S0, S1 = 6.9, 56.35          # STAGE window (characters on screen, Hakeem in bubble)
END0 = 61.25
SAGE, SAGE_D, SAGE_L, CHAR, SOFT, RED, SUN = "#5CA581", "#3B7F5E", "#8FD6AE", "#20242D", "#F6F7F9", "#E5574B", "#FFC83D"
FONT = "'Outfit', sans-serif"
words = json.load(open(os.path.join(EDIT, "words_out.json")))
PIP = dict(cx=540, cy=1500, r=205, face_x=540, face_y=760, scale=0.37)


def T(t):  # absolute -> stage-local
    return round(t - S0, 3)


# ---------------------------------------------------------------- characters
def character(cid, skin, skin_d, hair, top, top_d, female=False, glasses=False, mug=False):
    """Layered SVG character ~360x640. Groups with ids for animation."""
    if female:
        back_hair = (f'<ellipse cx="180" cy="200" rx="150" ry="150" fill="url(#{cid}-hair)"/>'
                     f'<circle cx="180" cy="40" r="52" fill="url(#{cid}-hair)"/>')
        hair_shape = (f'<path d="M58 170 C56 90 116 52 180 52 C244 52 304 90 302 170 C280 120 236 104 180 112 C124 104 80 120 58 170Z" fill="url(#{cid}-hair)"/>')
    else:
        back_hair = ""
        hair_shape = (f'<ellipse cx="74" cy="150" rx="30" ry="46" fill="url(#{cid}-hair)"/>'
                      f'<ellipse cx="286" cy="150" rx="30" ry="46" fill="url(#{cid}-hair)"/>'
                      f'<path d="M120 76 C140 56 220 56 240 76 C220 70 140 70 120 76Z" fill="url(#{cid}-hair)" opacity="0.9"/>')
    specs = (f'<g id="{cid}-glasses" fill="none" stroke="#2B2F38" stroke-width="7">'
             f'<circle cx="138" cy="196" r="34"/><circle cx="222" cy="196" r="34"/><path d="M172 196 h16"/></g>') if glasses else ""
    mug_svg = (f'<g id="{cid}-mug"><rect x="-26" y="-36" width="52" height="60" rx="12" fill="#FFFFFF" stroke="{SAGE_D}" stroke-width="6"/>'
               f'<path d="M26 -20 q22 0 22 18 q0 18 -22 18" fill="none" stroke="{SAGE_D}" stroke-width="6"/>'
               f'<path d="M-10 -52 q8 -12 0 -22 M8 -50 q8 -12 0 -22" stroke="#C9D3CE" stroke-width="5" fill="none" stroke-linecap="round"/></g>') if mug else ""
    return f'''
<svg id="{cid}" class="char" width="414" height="759" viewBox="0 0 360 660" overflow="visible">
  <defs>
    <radialGradient id="{cid}-skin" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="{skin}"/><stop offset="100%" stop-color="{skin_d}"/></radialGradient>
    <radialGradient id="{cid}-hair" cx="40%" cy="30%" r="80%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="{hair}"/></radialGradient>
    <linearGradient id="{cid}-top" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="{top}"/><stop offset="100%" stop-color="{top_d}"/></linearGradient>
    <radialGradient id="{cid}-eye" cx="45%" cy="40%" r="60%"><stop offset="0%" stop-color="#5A3B22"/><stop offset="100%" stop-color="#22140A"/></radialGradient>
  </defs>
  <ellipse cx="180" cy="640" rx="130" ry="18" fill="rgba(32,36,45,0.18)"/>
  <g id="{cid}-body">
    <path d="M70 640 L80 430 C86 360 130 330 180 330 C230 330 274 360 280 430 L290 640 Z" fill="url(#{cid}-top)"/>
    <path d="M150 335 L180 400 L210 335" fill="#FFFFFF" opacity="0.9"/>
    <g id="{cid}-armL"><path d="M92 400 C50 450 52 520 74 560" stroke="url(#{cid}-top)" stroke-width="44" stroke-linecap="round" fill="none"/>
      <circle cx="76" cy="566" r="24" fill="url(#{cid}-skin)"/></g>
    <g id="{cid}-armR"><path d="M268 400 C310 450 308 520 286 560" stroke="url(#{cid}-top)" stroke-width="44" stroke-linecap="round" fill="none"/>
      <circle cx="284" cy="566" r="24" fill="url(#{cid}-skin)"/>{mug_svg.replace('<g id', '<g transform="translate(290 540)" id') if mug else ""}</g>
  </g>
  <g id="{cid}-head">
    {back_hair}
    <rect x="160" y="290" width="40" height="50" rx="16" fill="url(#{cid}-skin)"/>
    <ellipse cx="62" cy="200" rx="22" ry="30" fill="url(#{cid}-skin)"/><ellipse cx="298" cy="200" rx="22" ry="30" fill="url(#{cid}-skin)"/>
    <ellipse cx="180" cy="190" rx="122" ry="130" fill="url(#{cid}-skin)"/>
    <ellipse cx="140" cy="120" rx="54" ry="30" fill="#FFFFFF" opacity="0.18"/>
    {hair_shape}
    <g id="{cid}-eyes">
      <ellipse cx="138" cy="196" rx="26" ry="30" fill="#FFFFFF"/><ellipse cx="222" cy="196" rx="26" ry="30" fill="#FFFFFF"/>
      <circle id="{cid}-pl" cx="141" cy="200" r="15" fill="url(#{cid}-eye)"/><circle id="{cid}-pr" cx="225" cy="200" r="15" fill="url(#{cid}-eye)"/>
      <circle cx="146" cy="193" r="5" fill="#FFFFFF"/><circle cx="230" cy="193" r="5" fill="#FFFFFF"/>
    </g>
    <g id="{cid}-lids" fill="url(#{cid}-skin)"><rect x="108" y="160" width="60" height="70" rx="28"/><rect x="192" y="160" width="60" height="70" rx="28"/></g>
    {specs}
    <path id="{cid}-browL" d="M110 150 Q138 136 166 148" stroke="{'#9AA0A6' if not female else '#B9BEC4'}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path id="{cid}-browR" d="M194 148 Q222 136 250 150" stroke="{'#9AA0A6' if not female else '#B9BEC4'}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <ellipse cx="180" cy="236" rx="14" ry="10" fill="{skin_d}" opacity="0.55"/>
    <ellipse cx="108" cy="248" rx="20" ry="12" fill="#FF8A80" opacity="0.28"/><ellipse cx="252" cy="248" rx="20" ry="12" fill="#FF8A80" opacity="0.28"/>
    <path id="{cid}-smile" d="M140 268 Q180 300 220 268" stroke="#5B2A1E" stroke-width="9" stroke-linecap="round" fill="none"/>
    <ellipse id="{cid}-oh" cx="180" cy="278" rx="16" ry="20" fill="#5B2A1E" opacity="0"/>
    <path id="{cid}-frown" d="M146 286 Q180 262 214 286" stroke="#5B2A1E" stroke-width="9" stroke-linecap="round" fill="none" opacity="0"/>
    <path id="{cid}-sweat" d="M290 120 q14 22 0 34 q-14 -12 0 -34z" fill="#8FD3FF" opacity="0"/>
  </g>
</svg>'''


def blink(cid, times):
    out = []
    for t in times:
        out.append(f'    tl.fromTo("#{cid}-lids", {{ scaleY: 0, transformOrigin: "50% 0%" }}, {{ scaleY: 1, duration: 0.07, ease: "power1.in", yoyo: true, repeat: 1 }}, {t:.2f});')
    return out


def express(cid, kind, t, d=0.25):
    """smile | oh | frown | worried | happy"""
    m = {"smile": (1, 0, 0), "oh": (0, 1, 0), "frown": (0, 0, 1)}
    js = []
    mouth = {"worried": "frown", "happy": "smile"}.get(kind, kind)
    a, b, c = m[mouth]
    js += [f'    tl.to("#{cid}-smile", {{ opacity: {a}, duration: {d} }}, {t:.2f});',
           f'    tl.to("#{cid}-oh", {{ opacity: {b}, duration: {d} }}, {t:.2f});',
           f'    tl.to("#{cid}-frown", {{ opacity: {c}, duration: {d} }}, {t:.2f});']
    if kind in ("worried", "oh", "frown"):
        js += [f'    tl.to("#{cid}-browL", {{ rotation: 14, y: -6, transformOrigin: "100% 50%", duration: {d} }}, {t:.2f});',
               f'    tl.to("#{cid}-browR", {{ rotation: -14, y: -6, transformOrigin: "0% 50%", duration: {d} }}, {t:.2f});']
    else:
        js += [f'    tl.to("#{cid}-browL", {{ rotation: 0, y: 0, duration: {d} }}, {t:.2f});',
               f'    tl.to("#{cid}-browR", {{ rotation: 0, y: 0, duration: {d} }}, {t:.2f});']
    if kind == "worried":
        js.append(f'    tl.to("#{cid}-sweat", {{ opacity: 1, y: 14, duration: 0.6, ease: "power1.in" }}, {t:.2f});')
    return js


def wave(cid, t, n=2):
    js = [f'    tl.to("#{cid}-armR", {{ rotation: -150, transformOrigin: "268px 400px", duration: 0.35, ease: "back.out(2)" }}, {t:.2f});']
    for i in range(n):
        js.append(f'    tl.to("#{cid}-armR", {{ rotation: -120, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 1 }}, {t + 0.35 + i * 0.36:.2f});')
    js.append(f'    tl.to("#{cid}-armR", {{ rotation: 0, duration: 0.35, ease: "power2.inOut" }}, {t + 0.35 + n * 0.36:.2f});')
    return js


def hop(cid, t, h=40):
    return [f'    tl.to("#{cid}", {{ y: -{h}, scaleY: 1.04, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }}, {t:.2f});',
            f'    tl.set("#{cid}", {{ scaleY: 0.94, scaleX: 1.04 }}, {t + 0.36:.2f});',
            f'    tl.to("#{cid}", {{ scaleY: 1, scaleX: 1, duration: 0.25, ease: "elastic.out(1, 0.5)" }}, {t + 0.37:.2f});']


# ---------------------------------------------------------------- stage composition
rnd = random.Random(5)
coins = "".join(f'<circle class="coin" id="coin{i}" cx="0" cy="0" r="16" fill="{SUN}" stroke="#E0A800" stroke-width="4"/>' for i in range(10))
SACK = f'''<svg id="sack" width="260" height="300" viewBox="0 0 260 300" overflow="visible">
  <defs><radialGradient id="sackg" cx="40%" cy="35%" r="75%"><stop offset="0%" stop-color="#B98A5A"/><stop offset="100%" stop-color="#7A5230"/></radialGradient></defs>
  <ellipse cx="130" cy="292" rx="100" ry="12" fill="rgba(32,36,45,0.18)"/>
  <g id="sackbody"><path d="M70 80 C10 140 20 286 130 286 C240 286 250 140 190 80 Z" fill="url(#sackg)"/>
  <path d="M84 70 Q130 92 176 70 L166 52 Q130 66 94 52 Z" fill="#5E3E22"/>
  <text x="130" y="210" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="96" fill="#FFE08A" stroke="#5E3E22" stroke-width="3">$</text></g>
  {coins}
</svg>'''
ENV = f'''<svg class="env" width="170" height="110" viewBox="0 0 170 110"><rect x="2" y="2" width="166" height="106" rx="14" fill="#FFFFFF" stroke="{SAGE_D}" stroke-width="5"/>
  <path d="M4 8 L85 62 L166 8" fill="none" stroke="{SAGE_D}" stroke-width="5"/><text x="85" y="96" text-anchor="middle" font-family="Outfit" font-weight="800" font-size="26" fill="{SAGE_D}">$32,500</text></svg>'''

james = character("jm", "#E9B48E", "#C98B63", "#C9CDD3", "#3E6FB0", "#28487A", glasses=True)
carol = character("cr", "#9A6646", "#6E4329", "#D5D8DD", SAGE, SAGE_D, female=True, mug=True)

stage_css = f"""
    #root {{ position: absolute; inset: 0; font-family: {FONT}; }}
    .sky {{ position: absolute; inset: 0; background: linear-gradient(180deg, #E3F1EA 0%, #F6F7F9 55%, #EEF3F0 100%); }}
    .floor {{ position: absolute; left: -100px; right: -100px; top: 1080px; height: 900px; border-radius: 50% 50% 0 0 / 120px 120px 0 0;
              background: linear-gradient(180deg, #D7E6DD 0%, #E8EFEA 60%); }}
    .glow {{ position: absolute; width: 900px; height: 900px; left: 90px; top: 180px; border-radius: 50%;
             background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%); }}
    .actor {{ position: absolute; top: 352px; }}
    .tag {{ position: absolute; left: 0; right: 0; text-align: center; }}
    .tag span {{ display: inline-block; padding: 14px 30px; border-radius: 999px; background: {CHAR}; color: #fff; font-weight: 700; font-size: 40px;
                 box-shadow: 0 14px 30px rgba(32,36,45,0.25); white-space: nowrap; }}
    .big span {{ font-size: 54px; font-weight: 800; padding: 18px 38px; }}
    .chip {{ display: inline-block; padding: 14px 26px; border-radius: 24px; background: {RED}; color: #fff; font-weight: 800; font-size: 62px;
             box-shadow: 0 14px 30px rgba(229,87,75,0.35); margin: 0 8px; }}
    .lbl {{ position: absolute; text-align: center; font-weight: 800; color: {CHAR}; }}
    .card {{ position: absolute; border-radius: 34px; padding: 26px 34px; color: #fff; text-align: center;
             background: linear-gradient(140deg, rgba(92,165,129,0.97) 0%, rgba(44,62,58,0.97) 45%, rgba(32,36,45,0.98) 100%);
             border: 1.5px solid rgba(255,255,255,0.35); box-shadow: 0 24px 50px rgba(32,36,45,0.28); }}
    .card .k {{ font-weight: 500; font-size: 28px; letter-spacing: 0.08em; text-transform: uppercase; color: {SAGE_L}; }}
    .card .v {{ font-weight: 800; font-size: 64px; letter-spacing: -0.02em; line-height: 1.05; }}
    .badge {{ position: absolute; width: 96px; height: 96px; border-radius: 48px; display: flex; align-items: center; justify-content: center;
              color: #fff; font-weight: 800; font-size: 58px; box-shadow: 0 12px 26px rgba(32,36,45,0.25); }}
    .bubble {{ position: absolute; padding: 18px 26px; border-radius: 28px; background: #fff; color: {CHAR}; font-weight: 700; font-size: 34px;
               box-shadow: 0 14px 30px rgba(32,36,45,0.18); text-align: center; }}
    .env {{ position: absolute; }}
    #chart {{ position: absolute; left: 90px; top: 330px; }}
"""

body = f'''    <div class="sky"></div><div class="glow"></div><div class="floor"></div>
    <svg id="chart" width="900" height="520" viewBox="0 0 900 520"><polyline id="chartline" points="20,60 200,180 330,140 470,300 600,270 760,440 880,470"
      fill="none" stroke="{RED}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1400" stroke-dashoffset="1400" opacity="0.85"/></svg>
    <div class="actor" id="jmwrap" style="left:333px">{james}</div>
    <div class="actor" id="crwrap" style="left:333px">{carol}</div>
    <div id="sackwrap" style="position:absolute; left:720px; top:780px">{SACK}</div>
    <div class="lbl" id="sacklbl" style="left:640px; width:380px; top:1080px; font-size:56px">$1,000,000</div>
    <div class="tag big" id="t_james" style="top:240px"><span>James</span></div>
    <div class="tag" id="t_voo" style="top:330px"><span style="background:{SAGE_D}">All in VOO &middot; takes 6% = $60,000/yr</span></div>
    <div class="tag" id="t_rough" style="top:240px"><span style="background:{RED}">A rough start</span></div>
    <div class="tag" id="t_chips" style="top:325px"><span class="chip" id="c1">&minus;15%</span><span class="chip" id="c2">&minus;10%</span><span class="chip" id="c3">&minus;5%</span></div>
    <div class="tag big" id="t_carol" style="top:240px"><span style="background:{SAGE_D}">Carol</span></div>
    <div class="tag" id="t_same" style="top:330px"><span>Same $1M &middot; same bad start</span></div>
    <div class="tag" id="t_first" style="top:405px"><span style="background:{SUN}; color:{CHAR}">She buys income first</span></div>
    <div class="card" id="pension" style="left:60px; top:240px; width:470px"><div class="k">Private pension account</div><div class="v">$500K <span style="color:{SAGE_L}">@ 6.5%</span></div></div>
    <div class="card" id="forlife" style="left:560px; top:240px; width:460px"><div class="k">Pays her</div><div class="v">$32,500<span style="font-size:32px">/yr</span></div><div class="k" style="color:{SUN}">for life</div></div>
    <div class="card" id="eq" style="left:70px; right:70px; top:240px"><div class="v" style="font-size:58px">$32,500 + $27,500 = <span style="color:{SUN}">$60,000</span></div>
      <div class="k" style="margin-top:6px">pension &nbsp;+&nbsp; VOO &nbsp;=&nbsp; same as James</div></div>
    <div class="tag" id="t_9" style="top:240px"><span style="background:{SAGE_D}">If the market averages 9%: both fine</span></div>
    <div class="tag" id="t_66" style="top:240px"><span style="background:{RED}">If it averages 6.6%&hellip;</span></div>
    <div class="badge" id="bj9" style="left:250px; top:330px; background:{SAGE}">&#10003;</div>
    <div class="badge" id="bc9" style="left:735px; top:330px; background:{SAGE}">&#10003;</div>
    <div class="badge" id="bjx" style="left:262px; top:470px; background:{RED}">&#10007;</div>
    <div class="bubble" id="b_j0" style="left:50px; top:325px; width:420px">James runs out<br><b style="color:{RED}; font-size:44px">$0 &middot; year 26</b></div>
    <div class="bubble" id="b_c" style="left:600px; top:325px; width:420px">Carol&rsquo;s paycheck<br><b style="color:{SAGE_D}; font-size:44px">$32,500 / yr for life</b></div>
    <div class="bubble" id="b_hope" style="left:50px; top:330px; width:420px">&ldquo;Hoping the market cooperates&hellip;&rdquo;</div>
    <div class="bubble" id="b_pay" style="left:600px; top:330px; width:420px">&ldquo;I have a paycheck.&rdquo;</div>
    <div class="env" id="env1" style="left:900px; top:300px">{ENV}</div>
    <div class="env" id="env2" style="left:900px; top:300px">{ENV}</div>
    <div class="env" id="env3" style="left:900px; top:300px">{ENV}</div>
    <div class="env" id="env4" style="left:900px; top:300px">{ENV}</div>
    <div class="lbl" id="note" style="left:60px; right:60px; top:196px; font-size:28px; font-weight:400; color:rgba(32,36,45,0.65)">Hypothetical example for illustration only</div>'''

js = []
hide = ["#crwrap", "#t_voo", "#t_rough", "#t_chips", "#t_carol", "#t_same", "#t_first", "#pension", "#forlife", "#eq", "#t_9", "#t_66",
        "#bj9", "#bc9", "#bjx", "#b_j0", "#b_c", "#b_hope", "#b_pay", "#env1", "#env2", "#env3", "#env4", "#note", "#t_james"]
js.append(f'    tl.set({json.dumps(",".join(hide))}, {{ opacity: 0 }}, 0);')
js.append('    tl.set(".coin", { opacity: 0 }, 0);')


def show(sel, t, y=20, d=0.4):
    js.append(f'    tl.fromTo("{sel}", {{ opacity: 0, y: {y}, scale: 0.9 }}, {{ opacity: 1, y: 0, scale: 1, duration: {d}, ease: "back.out(1.8)" }}, {T(t):.2f});')


def hide_at(sel, t, d=0.25):
    js.append(f'    tl.to("{sel}", {{ opacity: 0, duration: {d}, ease: "power2.in" }}, {T(t):.2f});')


# S1 James intro (7.0 - 11.9)
js.append('    tl.set("#jmwrap", { x: -700, y: 0, scale: 1, rotation: 0, opacity: 1 }, 0);')
js.append('    tl.set("#crwrap", { x: 760, y: 0, scale: 1, rotation: 0 }, 0);')
js.append(f'    tl.to("#jmwrap", {{ x: -120, duration: 0.7, ease: "back.out(1.4)" }}, {T(7.0):.2f});')
js.append(f'    tl.fromTo("#sackwrap", {{ opacity: 0, scale: 0.4 }}, {{ opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }}, {T(8.6):.2f});')
js.append(f'    tl.fromTo("#sacklbl", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.3 }}, {T(8.8):.2f});')
show("#t_james", 7.1); show("#t_voo", 10.6)
js += [l.replace("tl.to(", "tl.to(").replace(f"{0:.2f}", "") for l in wave("jm", T(7.6))]
# S2 rough start (11.9 - 17.3)
hide_at("#t_james", 11.8); hide_at("#t_voo", 11.8)
show("#t_rough", 12.0)
js.append(f'    tl.to("#chartline", {{ strokeDashoffset: 0, duration: 4.6, ease: "power1.inOut" }}, {T(12.2):.2f});')
show("#t_chips", 14.1, 0); show("#c1", 14.15, 30); show("#c2", 15.65, 30); show("#c3", 16.75, 30)
js += express("jm", "oh", T(14.2)) + express("jm", "worried", T(15.7))
for t in (14.2, 15.7, 16.8):
    js.append(f'    tl.set("#jmwrap", {{ x: -132 }}, {T(t):.2f});')
    js.append(f'    tl.to("#jmwrap", {{ x: -120, duration: 0.25, ease: "elastic.out(1, 0.3)" }}, {T(t) + 0.01:.2f});')
# S3 selling (17.3 - 21.9)
hide_at("#t_rough", 17.2); hide_at("#t_chips", 17.2)
js.append(f'    tl.to("#chartline", {{ opacity: 0.25, duration: 0.4 }}, {T(17.2):.2f});')
for i in range(10):
    t0 = T(17.6 + i * 0.22)
    dx, dy = rnd.uniform(-220, 120), rnd.uniform(-260, -120)
    js.append(f'    tl.fromTo("#coin{i}", {{ opacity: 1, x: 130, y: 120 }}, {{ x: {130 + dx:.0f}, y: {120 + dy:.0f}, duration: 0.45, ease: "power2.out" }}, {t0:.2f});')
    js.append(f'    tl.to("#coin{i}", {{ y: 520, opacity: 0, duration: 0.5, ease: "power2.in" }}, {t0 + 0.45:.2f});')
js.append(f'    tl.to("#sackbody", {{ scale: 0.66, transformOrigin: "50% 100%", duration: 2.0, ease: "power2.inOut" }}, {T(17.8):.2f});')
js.append(f'''    const sk = {{ v: 1000000 }};
    tl.fromTo(sk, {{ v: 1000000 }}, {{ v: 575000, duration: 1.6, ease: "power2.inOut", onUpdate: () => {{ document.querySelector("#sacklbl").textContent = "$" + Math.round(sk.v/1000).toLocaleString("en-US") + ",000"; }} }}, {T(18.2):.2f});
    tl.to("#sacklbl", {{ color: "{RED}", duration: 0.3 }}, {T(19.6):.2f});''')
# S4 Carol intro (21.9 - 26.5): James steps aside small, Carol enters center
js.append(f'    tl.to("#jmwrap", {{ x: -470, scale: 0.7, transformOrigin: "50% 100%", opacity: 0.0, duration: 0.6, ease: "power3.inOut" }}, {T(21.7):.2f});')
js.append(f'    tl.to("#sackwrap, #sacklbl, #chartline", {{ opacity: 0, duration: 0.4 }}, {T(21.7):.2f});')
js.append(f'    tl.set("#crwrap", {{ opacity: 1, x: 760 }}, {T(22.0):.2f});')
js.append(f'    tl.to("#crwrap", {{ x: 0, duration: 0.75, ease: "back.out(1.4)" }}, {T(22.0) + 0.01:.2f});')
show("#t_carol", 22.1); show("#t_same", 22.7); show("#t_first", 25.25)
js += wave("cr", T(22.6), 1) + hop("cr", T(25.6))
# S5 pension (26.5 - 35.8)
hide_at("#t_carol", 26.4); hide_at("#t_same", 26.4); hide_at("#t_first", 26.4)
show("#pension", 26.95); show("#forlife", 31.75)
js.append(f'    tl.to("#crwrap", {{ x: 60, duration: 0.5, ease: "power2.inOut" }}, {T(26.6):.2f});')
js.append(f'    tl.fromTo("#env1", {{ opacity: 1, x: 0, y: 0, rotation: -20, scale: 0.6 }}, {{ x: -420, y: 560, rotation: 8, scale: 1, duration: 0.9, ease: "power2.inOut" }}, {T(31.9):.2f});')
js.append(f'    tl.to("#env1", {{ opacity: 0, scale: 0.5, duration: 0.25 }}, {T(32.85):.2f});')
js += hop("cr", T(32.8), 30)
# S6 equation (35.8 - 40.9): James returns on the left
hide_at("#pension", 35.7); hide_at("#forlife", 35.7)
show("#eq", 35.85)
js.append(f'    tl.to("#crwrap", {{ x: 235, scale: 0.86, transformOrigin: "50% 100%", duration: 0.6, ease: "power3.inOut" }}, {T(39.0):.2f});')
js.append(f'    tl.set("#jmwrap", {{ opacity: 1, x: -700, scale: 0.86, rotation: 0, y: 0 }}, {T(39.0):.2f});')
js.append(f'    tl.to("#jmwrap", {{ x: -250, duration: 0.6, ease: "back.out(1.4)" }}, {T(39.0) + 0.01:.2f});')
js += express("jm", "smile", T(39.0))
js.append(f'    tl.to("#jm-sweat", {{ opacity: 0, duration: 0.2 }}, {T(39.0):.2f});')
# S7 9% (40.9 - 43.9)
hide_at("#eq", 40.85)
show("#t_9", 41.0); show("#bj9", 43.4, 30); show("#bc9", 43.5, 30)
js += hop("jm", T(43.55), 24) + hop("cr", T(43.65), 24)
# S8 6.6% (43.9 - 53.9)
hide_at("#t_9", 43.9); hide_at("#bj9", 43.9); hide_at("#bc9", 43.9)
show("#t_66", 44.0)
js += express("jm", "worried", T(46.4))
show("#b_j0", 48.3)
js.append(f'    tl.to("#jmwrap", {{ y: 26, rotation: -4, duration: 0.6, ease: "power2.out" }}, {T(48.3):.2f});')
show("#b_c", 50.1)
for k, t in enumerate((50.3, 51.3, 52.3)):
    e = f"#env{k + 2}"
    js.append(f'    tl.fromTo("{e}", {{ opacity: 1, x: 0, y: 0, rotation: -20, scale: 0.6 }}, {{ x: -140, y: 560, rotation: 6, scale: 0.9, duration: 0.8, ease: "power2.inOut" }}, {T(t):.2f});')
    js.append(f'    tl.to("{e}", {{ opacity: 0, scale: 0.5, duration: 0.2 }}, {T(t + 0.8):.2f});')
js += hop("cr", T(51.2), 22)
show("#note", 44.2, 0)
# S9 contrast (53.9 - 56.35)
hide_at("#t_66", 53.85); hide_at("#b_j0", 53.85); hide_at("#b_c", 53.85)
show("#b_hope", 54.0); show("#b_pay", 56.3)
# blinks throughout (character acting)
js += blink("jm", [T(t) for t in (8.4, 10.9, 13.0, 18.6, 20.9, 40.2, 45.0, 50.8, 54.6)])
js += blink("cr", [T(t) for t in (23.8, 28.4, 30.9, 34.1, 37.6, 42.2, 47.3, 52.9, 55.4)])
# fade the whole stage out at the end of the window
js.append(f'    tl.to("#stage-all", {{ opacity: 0, duration: 0.3 }}, {T(S1) - 0.3:.2f});')

os.makedirs(os.path.join(HF, "compositions"), exist_ok=True)
with open(os.path.join(HF, "compositions", "stage.html"), "w") as f:
    f.write(f"""<template>
  <style>{stage_css}</style>
  <div id="root" data-composition-id="stage" data-width="{W}" data-height="{H}" data-layout-allow-overflow data-layout-allow-overlap>
    <div id="stage-all">
{body}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(js)}
    window.__timelines["stage"] = tl;
  </script>
</template>
""")

# ---------------------------------------------------------------- face-mode chips, end card, captions
def simple(cid, start, dur, inner, cues, z=6, extra=""):
    jsl = [f'    tl.fromTo("{s}", {{ opacity: 0, y: 20, scale: 0.92 }}, {{ opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.8)" }}, {t - start:.2f});' for s, t in cues]
    jsl.append(f'    tl.to("#{cid}-all", {{ opacity: 0, duration: 0.25 }}, {dur - 0.27:.2f});')
    with open(os.path.join(HF, "compositions", f"{cid}.html"), "w") as f:
        f.write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; font-family: {FONT}; }}
    .tags {{ position: absolute; left: 0; right: 0; top: 260px; display: flex; flex-direction: column; align-items: center; gap: 16px; }}
    .p {{ display: inline-block; padding: 14px 30px; border-radius: 999px; color: #fff; font-weight: 700; font-size: 42px; white-space: nowrap;
          box-shadow: 0 14px 30px rgba(0,0,0,0.25); }}
{extra}
  </style>
  <div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{H}"><div id="{cid}-all">
{inner}
  </div></div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(jsl)}
    window.__timelines["{cid}"] = tl;
  </script>
</template>
""")
    SCENES.append((cid, start, dur, "graphics", z))


SCENES = [("stage", S0 - 0.4, S1 - S0 + 0.4, "graphics", 3)]
simple("hook", 0.8, 6.0, f'''    <div class="tags"><span class="p" id="h1" style="background:{SAGE_D}">Same $1,000,000</span>
      <span class="p" id="h2" style="background:{CHAR}">Same $60,000 / year</span></div>''', [("#h1", 1.0), ("#h2", 2.1)])
simple("cta", 56.5, END0 - 56.5, f'''    <div class="tags"><span class="p" id="d1" style="background:{SAGE_D}; font-size:52px; padding:18px 38px">DM me &ldquo;INCOME&rdquo;</span>
      <span class="p" id="d2" style="background:{CHAR}">I&rsquo;ll stress-test your plan</span></div>''', [("#d1", 57.5), ("#d2", 59.6)])
simple("endcard", END0, TOTAL - END0, f'''    <div id="eb" style="position:absolute; inset:0; background: radial-gradient(120% 80% at 50% 25%, #2E3440 0%, {CHAR} 60%, #14171D 100%);
       display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:#fff">
      <div id="e1" style="font-weight:500; font-size:34px; letter-spacing:.1em; text-transform:uppercase; color:{SAGE_L}">Same $1M &middot; Same income</div>
      <div id="e2" style="font-weight:800; font-size:118px; letter-spacing:-.03em; margin-top:18px">Different plan.</div>
      <div id="e3" class="p" style="background:{SAGE_D}; margin-top:44px; font-size:46px">DM &ldquo;INCOME&rdquo;</div>
      <div id="e4" style="margin-top:28px; font-size:34px"><b>Finance Keem</b> &middot; FK Management</div>
      <div id="e5" style="position:absolute; left:80px; right:80px; bottom:110px; font-size:21px; color:rgba(255,255,255,0.55)">Hypothetical example for illustration only; not investment advice.
        Returns are not guaranteed. &ldquo;Private pension account&rdquo; refers to a lifetime income product issued by an insurance company; payouts vary by age,
        product and insurer, and guarantees depend on the issuer&rsquo;s claims-paying ability.</div></div>''',
       [("#e1", END0 + 0.2), ("#e2", END0 + 0.35), ("#e3", END0 + 0.6), ("#e4", END0 + 0.8), ("#e5", END0 + 0.9)], z=9)

groups, cur = [], []
for w in words:
    if w["start"] >= END0: continue
    if cur and (w["start"] - cur[-1]["end"] >= 0.2 or len(cur) >= 4):
        groups.append(cur); cur = []
    cur.append(w)
    if w["text"].endswith((".", "?", "!", ",")):
        groups.append(cur); cur = []
if cur: groups.append(cur)
KEY = {"$1", "million,", "$60,000", "6%", "15%,", "10,", "5.", "$575,000.", "$500,000", "6.5%.", "$32,500", "$27,500", "9%", "6.6%,", "26,",
       "completely.", "paycheck.", "first.", "INCOME,", "life,", "life.", "VOO,"}
items = []
for k, g in enumerate(groups):
    s = max(0.05, g[0]["start"] - 0.03)
    nxt = groups[k + 1][0]["start"] - 0.03 if k + 1 < len(groups) else END0
    e = min(max(g[-1]["end"] + 0.12, s + 0.4), nxt, END0)
    st = S0 <= s < S1
    items.append((s, e - s, " ".join(f"<i>{html.escape(w['text'])}</i>" if w["text"] in KEY else html.escape(w["text"]) for w in g), st))
with open(os.path.join(HF, "compositions", "captions.html"), "w") as f:
    f.write(f"""<template>
  <style>
    #root {{ position: absolute; inset: 0; font-family: {FONT}; }}
    .cap {{ position: absolute; left: 0; right: 0; top: 1290px; text-align: center; }}
    .cap.s {{ top: 1160px; }}
    .cap span {{ display: inline-block; padding: 12px 28px; border-radius: 24px; background: rgba(32,36,45,0.9); color: #fff; font-weight: 700;
                 font-size: 50px; white-space: nowrap; box-shadow: 0 10px 26px rgba(0,0,0,0.25); }}
    .cap i {{ font-style: normal; color: {SUN}; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}">
{chr(10).join(f'    <div class="cap clip{" s" if st else ""}" id="cap{k}" data-start="{s:.3f}" data-duration="{d:.3f}" data-track-index="0"><span id="capt{k}">{t}</span></div>' for k, (s, d, t, st) in enumerate(items))}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(f'    tl.fromTo("#capt{k}", {{ opacity: 0, y: 10 }}, {{ opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }}, {s:.3f});' for k, (s, d, t, st) in enumerate(items))}
    window.__timelines["captions"] = tl;
  </script>
</template>
""")
SCENES.append(("captions", 0, TOTAL, "captions", 7))

# ---------------------------------------------------------------- root
p = PIP
full_clip = f"circle(1500px at {p['face_x']}px {p['face_y']}px)"
pip_clip = f"circle({p['r']}px at {p['cx']}px {p['cy']}px)"
dy = p["cy"] - p["face_y"]
morph = [
    f'      tl.fromTo("#vstage", {{ clipPath: "{full_clip}" }}, {{ clipPath: "{pip_clip}", duration: 0.6, ease: "power3.inOut" }}, {S0 - 0.3:.2f});',
    f'      tl.fromTo("#cam", {{ scale: 1, y: 0 }}, {{ scale: {p["scale"]}, y: {dy}, duration: 0.6, ease: "power3.inOut" }}, {S0 - 0.3:.2f});',
    f'      tl.fromTo("#ring", {{ opacity: 0, scale: 0.6 }}, {{ opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }}, {S0 + 0.1:.2f});',
    f'      tl.to("#ring", {{ opacity: 0, duration: 0.2 }}, {S1 - 0.35:.2f});',
    f'      tl.to("#vstage", {{ clipPath: "{full_clip}", duration: 0.6, ease: "power3.inOut" }}, {S1 - 0.3:.2f});',
    f'      tl.to("#cam", {{ scale: 1, y: 0, duration: 0.6, ease: "power3.inOut" }}, {S1 - 0.3:.2f});',
    '      tl.set("#cam", { scale: 1.12 }, 4.2);', '      tl.set("#cam", { scale: 1.0 }, 6.3);',
    '      tl.set("#cam", { scale: 1.1 }, 57.5);',
]
SFX = [("pop", 1.0), ("whoosh-short", 6.7), ("pop", 7.1), ("click", 14.15), ("click", 15.65), ("click", 16.75), ("sparkle", 17.6), ("whoosh-short", 21.95),
       ("pop", 25.25), ("pop", 26.95), ("chime", 31.9), ("pop", 35.85), ("pop", 43.4), ("pop", 48.2), ("chime", 50.3), ("pop", 57.5), ("chime", END0 + 0.1)]
json.dump(SFX, open(os.path.join(EDIT, "sfx_cues.json"), "w"))
hosts = "\n".join(
    f'      <div id="{c}" data-composition-id="{c}" data-composition-src="compositions/{c}.html" data-start="{s:.3f}" data-duration="{d:.3f}" '
    f'data-track-index="{2 if k == "captions" else (3 if c == "stage" else 1)}" data-track-kind="{k}" data-width="{W}" data-height="{H}" style="z-index:{z}"></div>'
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
      #vstage {{ position: absolute; inset: 0; overflow: hidden; z-index: 4; clip-path: {full_clip}; }}
      #cam {{ position: absolute; inset: 0; transform-origin: {p['face_x']}px {p['face_y']}px; }}
      #footage {{ position: absolute; left: 0; top: 0; width: {W}px; height: {H}px; object-fit: cover; }}
      #ring {{ position: absolute; left: {p['cx'] - p['r'] - 8}px; top: {p['cy'] - p['r'] - 8}px; width: {2 * p['r'] + 16}px; height: {2 * p['r'] + 16}px;
               border-radius: 50%; border: 8px solid {SAGE}; box-shadow: 0 20px 50px rgba(32,36,45,0.3); z-index: 5; opacity: 0; pointer-events: none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
      <div id="vstage" data-layout-allow-overflow><div id="cam">
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
