import sys, colorsys
from PIL import Image, ImageFilter
from collections import deque, Counter
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); w,h = im.size; px = im.load()
def bg(p, t):  # near-white, low saturation
    r,g,b,_ = p; return min(r,g,b) >= t and max(r,g,b)-min(r,g,b) < 18
seen = bytearray(w*h); q = deque()
for x in range(w): q += [(x,0),(x,h-1)]
for y in range(h): q += [(0,y),(w-1,y)]
mask = Image.new('L',(w,h),255); m = mask.load()
while q:
    x,y = q.popleft()
    if x<0 or y<0 or x>=w or y>=h or seen[y*w+x]: continue
    seen[y*w+x]=1
    if not bg(px[x,y], 228): continue
    m[x,y]=0
    q += [(x+1,y),(x-1,y),(x,y+1),(x,y-1)]
mask = mask.filter(ImageFilter.GaussianBlur(0.8))
im.putalpha(mask)
bbox = mask.point(lambda v:255 if v>20 else 0).getbbox(); im = im.crop(bbox)
im.save(dst)
# dominant saturated colours
small = Image.open(src).convert('RGB').resize((200,200)); c = Counter()
for p in small.getdata():
    hh,ss,vv = colorsys.rgb_to_hsv(*[v/255 for v in p])
    if ss>0.45 and vv>0.35: c[(round(hh*24)%24)] += 1
for hb,_ in c.most_common(3):
    pts=[p for p in small.getdata() if (lambda t:(t[1]>0.45 and t[2]>0.35 and round(t[0]*24)%24==hb))(colorsys.rgb_to_hsv(*[v/255 for v in p]))]
    avg=tuple(sorted(ch)[len(ch)//2] for ch in zip(*pts))
    print(dst.split('/')[-1], '#%02x%02x%02x'%avg, len(pts))
