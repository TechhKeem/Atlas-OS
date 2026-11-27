"""v3 A-roll: Hakeem on camera (Retirement Scenes), tight word-boundary cuts (inner pauses > 0.35 s squeezed to 0.12 s),
then the spoken CTA ("...comment PLAN, and I'll reach out to you personally") from another recording, audio only.
Writes hf/assets/aroll.mp4 (video, SDR, light house grade), vo.wav, words_out.json (output timeline, labelled)."""
import json, os, subprocess
E = os.path.dirname(os.path.abspath(__file__)); PR = os.path.dirname(os.path.dirname(E)); A = os.path.join(E, "hf", "assets")
SRC = os.path.join(PR, "sequence-explainer", "retirement_scenes.mp4")
TR = [w for w in json.load(open(os.path.join(PR, "sequence-explainer", "edit", "transcripts", "retirement_scenes.json")))["words"] if w["type"] == "word"]
CTA_SRC = [os.path.join(PR, "clip-library", "raw", f) for f in os.listdir(os.path.join(PR, "clip-library", "raw")) if "F6104414" in f][0]
CTA = json.load(open([os.path.join(PR, "clip-library", "review", f) for f in os.listdir(os.path.join(PR, "clip-library", "review")) if "F6104414" in f and f.endswith(".json")][0]))["words"]
SEGS = [(0.00, 9.50, "hook"), (9.66, 15.42, "james"), (18.50, 24.56, "crash"), (24.86, 32.30, "selling"), (33.76, 34.36, "carol"),
        (35.02, 39.80, "same"), (40.38, 42.72, "income"), (43.10, 47.66, "pension"), (48.48, 54.84, "life"), (86.02, 91.34, "less"),
        (91.78, 98.54, "year26"), (111.84, 120.46, "lesson"), (121.10, 124.90, "closer")]
PAD, GAP = 0.10, 0.12
pieces = []  # (src_in, src_out, label)
for a, b, lab in SEGS:
    ws = [w for w in TR if a - 0.01 <= w["start"] < b]
    cur = a
    for w0, w1 in zip(ws, ws[1:]):
        if w1["start"] - w0["end"] > 0.35:
            pieces.append((cur, min(w0["end"] + PAD, b), lab)); cur = max(w1["start"] - PAD, a)
    pieces.append((cur, b, lab))
words, t, filt, vf = [], 0.0, [], []
for i, (a, b, lab) in enumerate(pieces):
    for w in TR:
        if a - 0.01 <= w["start"] < b:
            words.append({"text": w["text"], "start": round(t + w["start"] - a, 3), "end": round(t + min(w["end"], b) - a, 3), "label": lab})
    vf.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}]")
    filt.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={b - a - 0.02:.3f}:d=0.02[a{i}]")
    t += (b - a)
    if i + 1 < len(pieces) and pieces[i + 1][2] != lab:
        t += 0.0
n = len(pieces)
graph = ";".join(vf + filt) + ";" + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-filter_complex", graph + ";[v]eq=contrast=1.04:saturation=1.06:gamma=1.02,colorbalance=rs=0.02:bs=-0.02,fps=30[vg]",
                "-map", "[vg]", "-c:v", "libx264", "-crf", "17", "-g", "30", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709",
                "-colorspace", "bt709", "-an", os.path.join(A, "aroll.mp4"), "-map", "[a]", "-ac", "1", "-ar", "48000",
                os.path.join(E, "aroll.wav")], check=True)
AR = t
# CTA audio: "So if you're someone who never thought about how to get income after you stop working, comment, plan, and I'll reach out to you personally"
c0, c1 = 26.20, 32.50
cta_start = AR + 0.35
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(c0), "-to", str(c1), "-i", CTA_SRC, "-vn", "-ac", "1", "-ar", "48000", "-af",
                "highpass=f=80,afade=t=in:d=0.02,afade=t=out:st=%.2f:d=0.05" % (c1 - c0 - 0.05), os.path.join(E, "cta.wav")], check=True)
for w in CTA:
    if c0 <= w["start"] < c1:
        words.append({"text": w["text"], "start": round(cta_start + w["start"] - c0, 3), "end": round(cta_start + w["end"] - c0, 3), "label": "cta"})
# match loudness of the two recordings, then lay CTA after the A-roll
def lufs(p):
    o = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float([l for l in o.splitlines() if l.strip().startswith("I:")][-1].split()[1])
g = lufs(os.path.join(E, "aroll.wav")) - lufs(os.path.join(E, "cta.wav"))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(E, "aroll.wav"), "-i", os.path.join(E, "cta.wav"), "-filter_complex",
                f"[1]volume={g:.2f}dB,adelay={int(cta_start * 1000)}|{int(cta_start * 1000)}[c];[0][c]amix=inputs=2:normalize=0,apad=pad_dur=2.5[o]",
                "-map", "[o]", "-ar", "48000", os.path.join(E, "vo.wav")], check=True)
for w in words:
    if w["text"].lower().strip(",.") == "boo": w["text"] = "VOO" + ("," if w["text"].endswith(",") else "")
    if w["text"] == "$6": w["text"] = "6"
    if w["text"] == ".6,": w["text"] = ".6%,"
    if w["label"] == "cta" and w["text"].lower().startswith("plan"): w["text"] = "PLAN,"
json.dump({"aroll_end": round(AR, 3), "cta_start": round(cta_start, 3), "words": words}, open(os.path.join(E, "words_out.json"), "w"), indent=0)
print(f"{n} pieces, A-roll {AR:.2f}s, CTA {cta_start:.2f}-{cta_start + c1 - c0:.2f}s, gain {g:+.1f} dB")
