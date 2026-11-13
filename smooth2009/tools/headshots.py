from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import sys
S='/home/claude/smooth2009/assets/src/'; O='/home/claude/smooth2009/images/'
W,H=800,1000
# (file, face-centre x as fraction, crop top y as fraction, crop width as fraction of image width)
jobs=[('flowers.png','founder-flowers.jpg',0.53,0.012,None),
      ('hooker.jpg','founder-hooker.jpg',0.47,0.075,0.80),
      ('lawrence.png','founder-lawrence.jpg',0.50,0.0,None),
      ('watkins.png','founder-watkins.jpg',0.53,0.0,None)]
for src,dst,cx,ty,cw in jobs:
    im=ImageOps.exif_transpose(Image.open(S+src)).convert('RGB'); w,h=im.size
    if cw is None:  # use full height, 4:5 width
        ch=h-int(ty*h); cwpx=int(ch*W/H)
    else:
        cwpx=int(cw*w); ch=int(cwpx*H/W)
    x0=max(0,min(w-cwpx,int(cx*w-cwpx/2))); y0=int(ty*h)
    im=im.crop((x0,y0,x0+cwpx,y0+ch))
    g=ImageOps.grayscale(im)
    g=ImageOps.autocontrast(g,cutoff=(0.5,0.5))
    g=ImageEnhance.Contrast(g).enhance(1.08)
    g=g.resize((W,H),Image.LANCZOS)
    if cw is None: g=g.filter(ImageFilter.UnsharpMask(radius=1.6,percent=60,threshold=2))
    g.convert('RGB').save(O+dst,quality=90,optimize=True,progressive=True)
    print(dst, (x0,y0,cwpx,ch), 'from', (w,h))
