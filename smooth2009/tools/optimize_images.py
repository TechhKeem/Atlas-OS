"""Compress site images for the web.

Run from the smooth2009 folder:  python3 tools/optimize_images.py
- Photos (.jpg): re-saved as optimized progressive JPEG, plus a .webp copy.
- Crests (.png): scaled to 360px tall, saved as optimized PNG, plus a .webp copy.
Safe to re-run: it skips files whose .webp is newer than the source.
Keep the originals elsewhere; this overwrites the .jpg/.png in site/images.
"""
import os, sys
from PIL import Image

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site', 'images')
CREST_H = 360
JPEG_Q, WEBP_Q = 82, 80

def kb(p): return os.path.getsize(p) // 1024

for name in sorted(os.listdir(DIR)):
    src = os.path.join(DIR, name)
    base, ext = os.path.splitext(name)
    webp = os.path.join(DIR, base + '.webp')
    if ext not in ('.jpg', '.png') or name == 'og-image.png':
        continue
    if os.path.exists(webp) and os.path.getmtime(webp) >= os.path.getmtime(src) and '--force' not in sys.argv:
        continue
    before = kb(src)
    im = Image.open(src)
    if ext == '.png':
        im = im.convert('RGBA')
        if im.height > CREST_H:
            im = im.resize((round(im.width * CREST_H / im.height), CREST_H), Image.LANCZOS)
        im.save(src, optimize=True)
        im.save(webp, quality=90, method=6)
    else:
        im = im.convert('RGB')
        im.save(src, quality=JPEG_Q, optimize=True, progressive=True)
        im.save(webp, quality=WEBP_Q, method=6)
    print(f'{name:28s} {before:5d} KB -> {kb(src):4d} KB  (webp {kb(webp):4d} KB)  {im.size[0]}x{im.size[1]}')
