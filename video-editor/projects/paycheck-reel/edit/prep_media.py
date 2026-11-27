"""HLG iPhone clips are tone-mapped to SDR bt709 so the render stays SDR.
Prep stills (EXIF-upright, 9:16 crop at a focus x, 1350x2400 for Ken Burns headroom) and clips (H.264 1080x1920, -g 30)."""
import os, subprocess
from PIL import Image, ImageOps
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(P, "edit", "hf", "assets")
STILLS = {  # name: focus x (0-1)
    "8720_sunset": 0.58, "8718_phone": 0.5, "6364_courtyard": 0.44, "8770_profile": 0.52,
    "6425_handshake": 0.47, "7105_hillside": 0.6, "7358_hope_speaking": 0.6, "wsl22_headshot": 0.5, "wsl6_portrait": 0.5,
}
for n, fx in STILLS.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(P, "photos", n + ".jpg"))).convert("RGB")
    w, h = im.size
    cw = min(w, round(h * 9 / 16)); ch = round(cw * 16 / 9)
    x = min(max(0, round(fx * w - cw / 2)), w - cw); y = (h - ch) // 2
    im.crop((x, y, x + cw, y + ch)).resize((1350, 2400), Image.LANCZOS).save(os.path.join(A, n + ".jpg"), quality=90)
    print(n, im.size, "->", (cw, ch))
logo = Image.open(os.path.join(P, "photos", "logo_transparent.png"))
logo.crop(logo.getbbox()).save(os.path.join(A, "logo.png"))
CLIPS = {"8752_camera_crew": (1.5, 2.2), "0985_stage": (0.6, 3.8)}  # (start, dur)
for n, (s, d) in CLIPS.items():
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s), "-t", str(d), "-i", os.path.join(P, "clips", n + ".mov"),
                    "-vf", "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,scale=1080:1920:flags=lanczos,eq=saturation=1.12:contrast=1.04:brightness=0.02,fps=30", "-an", "-c:v", "libx264",
                    "-preset", "medium", "-crf", "18", "-g", "30", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", os.path.join(A, n + ".mp4")], check=True)
    print(n, "ok")
