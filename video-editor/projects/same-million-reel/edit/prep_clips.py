"""Cut each video shot from the clip library to hf/assets/shotNN.mp4 (exact length, HLG->SDR, 1080x1920 cover crop, -g 30)."""
import json, os, subprocess, sys
E = os.path.dirname(os.path.abspath(__file__)); LIB = os.path.join(os.path.dirname(os.path.dirname(E)), "clip-library"); A = os.path.join(E, "hf", "assets")
sys.path.insert(0, E); from shots import shots
words = json.load(open(os.path.join(E, "words_out.json"))); S = {}
for w in words: S.setdefault(w["label"], w["start"])
SH = shots(S); total = max(w["end"] for w in words) + 0.15 + 6.8
TM = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
for i, (src, ms, st, *_ ) in enumerate(SH):
    if src.endswith(".jpg"): continue
    d = (SH[i + 1][2] if i + 1 < len(SH) else total) - st + 0.1
    f = os.path.join(LIB, src + ".mov")
    trc = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "csv=p=0", f], capture_output=True, text=True).stdout.strip().strip(",")
    tm = TM if trc in ("arib-std-b67", "smpte2084") else ""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ms), "-t", f"{d:.2f}", "-i", f, "-vf",
                    tm + "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=saturation=1.08:contrast=1.03,fps=30",
                    "-an", "-c:v", "libx264", "-crf", "18", "-g", "30", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709",
                    "-colorspace", "bt709", os.path.join(A, f"shot{i + 1:02d}.mp4")], check=True)
    print(f"shot{i + 1:02d}", src, ms, f"{d:.2f}s", trc or "sdr")
