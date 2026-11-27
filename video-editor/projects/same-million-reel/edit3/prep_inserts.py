"""Cut each library insert to its slot: tone-map HLG, rotate/crop to 1080x1920, house grade; keep natural audio."""
import os, subprocess, sys
E = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, E); from plan import PIC
RAW = os.path.join(os.path.dirname(os.path.dirname(E)), "clip-library", "raw"); A = os.path.join(E, "hf", "assets")
TM = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
GRADE = "eq=contrast=1.04:saturation=1.06:gamma=1.02,colorbalance=rs=0.02:bs=-0.02,fps=30"
for i, (kind, key, a, b, ms, vol) in enumerate(PIC):
    if kind not in ("clip", "end"): continue
    LIB = os.path.dirname(RAW)
    hits = [os.path.join(RAW, x) for x in os.listdir(RAW) if key in x] + [os.path.join(LIB, x) for x in os.listdir(LIB) if key in x and x.endswith(".mov")]
    f = hits[0]
    trc = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "csv=p=0", f], capture_output=True, text=True).stdout.strip().strip(",")
    tm = TM if trc in ("arib-std-b67", "smpte2084") else ""
    d = b - a + 0.1
    if kind == "end":   # slow-motion ramp for the end card (5.4 s clip stretched across the CTA)
        src_d = 3.4; speed = src_d / d
        vf = f"{tm}setpts=PTS/{speed:.4f},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,{GRADE}"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(ms), "-t", str(src_d), "-i", f, "-vf", vf, "-an", "-t", f"{d:.2f}"]
    else:
        vf = f"{tm}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,{GRADE}"
        cmd = ["ffmpeg", "-v", "error", "-y", "-ss", str(ms), "-t", f"{d:.2f}", "-i", f, "-vf", vf] + (["-an"] if kind == "end" else ["-c:a", "aac", "-b:a", "128k", "-ac", "2"])
    cmd += ["-c:v", "libx264", "-crf", "18", "-g", "30", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
            os.path.join(A, f"ins{i:02d}.mp4")]
    subprocess.run(cmd, check=True); print(f"ins{i:02d}", key, f"{d:.2f}s", trc or "sdr")
