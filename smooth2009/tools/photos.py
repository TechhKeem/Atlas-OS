from PIL import Image, ImageOps, ImageEnhance
# Run from the smooth2009 folder. Originals go in assets/src/ (not in the repo; ask for them).
S='assets/src/'; O='site/images/'
# (src, dst, box(x0,y0,w,h) in source px, out size)
jobs=[
 ('group-msu.jpg','section-msu.jpg',(152,0,2272,1932),(1200,1020)),
 ('group-csu.jpg','section-csu.jpg',(0,0,1242,1056),(1200,1020)),
 ('tu-group-formal.jpg','section-tu.jpg',(175,110,963,819),(1200,1020)),
 ('group-tu.jpg','gallery-tu-jerseys.jpg',(212,0,818,1091),(900,1200)),
 ('tu-rooftop.jpg','gallery-tu-rooftop.jpg',(0,0,1149,1532),(900,1200)),
 ('tu-hug.jpg','program-rules.jpg',(220,0,955,1400),(900,1320)),
 ('tu-flag.jpg','program-service.jpg',(256,0,928,1360),(900,1320)),
 ('grad-csu.jpg','program-leadership.jpg',(0,0,1042,1528),(900,1320)),
 ('grad-msu.jpg','donate.jpg',(0,120,1242,532),(2100,900)),
 ('msu-holmes.jpg','hero.jpg',(0,500,1320,660),(2400,1200)),
 ('msu-pumpkins.jpg','program-jrsmooth.jpg',(330,0,669,981),(900,1320)),
 ('msu-court.jpg','program-smoothweek.jpg',(6,0,885,1298),(900,1320)),
 ('msu-stairs.jpg','gallery-stairs.jpg',(192,230,935,1247),(900,1200)),
 ('msu-certificates.jpg','gallery-certificates.jpg',(155,0,649,865),(900,1200)),
 ('msu-stadium.jpg','gallery-stadium.jpg',(360,0,614,818),(900,1200)),
 ('group-msu.jpg','gallery-officers.jpg',(560,0,1449,1932),(900,1200)),
]
for src,dst,(x,y,w,h),size in jobs:
    im=ImageOps.exif_transpose(Image.open(S+src)).convert('RGB').crop((x,y,x+w,y+h))
    im=ImageEnhance.Contrast(im).enhance(1.04)
    im.resize(size,Image.LANCZOS).save(O+dst,quality=86,optimize=True,progressive=True)
    print(dst,size)
