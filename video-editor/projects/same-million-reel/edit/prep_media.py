"""Stills: EXIF-upright, 9:16 crop at focus x, 1350x2400. Clips: HLG->SDR bt709 tone-map, 1080x1920 H.264 -g 30."""
import os, subprocess
from PIL import Image, ImageOps
P = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); A = os.path.join(P, "edit", "hf", "assets")
STILLS = {"7358_hope_speaking": 0.6, "6405_ws_stage": 0.5, "8770_profile": 0.52, "wsl6_portrait": 0.5, "8718_phone": 0.5,
          "6364_courtyard": 0.44, "7105_hillside": 0.6, "6361_walking": 0.5, "8720_sunset": 0.58, "7356_seated_phone": 0.45,
          "6425_handshake": 0.47, "6751_mug": 0.5, "8793_rooftop": 0.5, "8750_micup": 0.45, "6414_ws_group": 0.2,
          "7020_procon": 0.6, "8739_lounge": 0.5, "6430_posed": 0.5, "wsl22_headshot": 0.5}
for n, fx in STILLS.items():
    im = ImageOps.exif_transpose(Image.open(os.path.join(P, "photos", n + ".jpg"))).convert("RGB")
    w, h = im.size; cw = min(w, round(h * 9 / 16)); ch = round(cw * 16 / 9)
    x = min(max(0, round(fx * w - cw / 2)), w - cw); y = (h - ch) // 2
    im.crop((x, y, x + cw, y + ch)).resize((1350, 2400), Image.LANCZOS).save(os.path.join(A, n + ".jpg"), quality=90)
    print(n, im.size, "crop w", cw)
logo = Image.open(os.path.join(P, "photos", "logo_transparent.png")); logo.crop(logo.getbbox()).save(os.path.join(A, "logo.png"))
TM = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
CLIPS = {"8752_camera_crew": (1.5, 2.6, True), "0985_stage": (0.6, 3.4, True), "5362_cornhole_child": (0.8, 3.3, None)}
for n, (s, d, hlg) in CLIPS.items():
    src = os.path.join(P, "clips", n + ".mov")
    trc = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip()
    tm = TM if trc in ("arib-std-b67", "smpte2084") else ""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s), "-t", str(d), "-i", src, "-vf",
                    tm + "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=saturation=1.1:contrast=1.04,fps=30",
                    "-an", "-c:v", "libx264", "-crf", "18", "-g", "30", "-pix_fmt", "yuv420p", "-color_primaries", "bt709",
                    "-color_trc", "bt709", "-colorspace", "bt709", os.path.join(A, n + ".mp4")], check=True)
    print(n, trc or "sdr", "ok")
