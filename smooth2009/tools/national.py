import sys, colorsys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA'); px = im.load(); w,h = im.size
NAVY=(11,42,91); SILVER=(214,219,228)
for y in range(h):
    for x in range(w):
        r,g,b,a = px[x,y]
        if a==0: continue
        hh,ss,vv = colorsys.rgb_to_hsv(r/255,g/255,b/255)
        if ss<0.25: continue
        t = min(1,(ss-0.25)/0.35)
        tgt = NAVY if 0.5<hh<0.75 else SILVER
        # keep shading: scale target by value relative to typical
        k = vv/ (0.64 if tgt is NAVY else 0.91)
        c = tuple(min(255,int(v*min(k,1.15))) for v in tgt)
        px[x,y] = tuple(int(o*(1-t)+n*t) for o,n in zip((r,g,b),c))+(a,)
im.save(sys.argv[2])
