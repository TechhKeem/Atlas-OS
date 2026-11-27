"""For each raw library video: probe, 6-frame contact sheet, and a word transcript (faster-whisper) if it has speech.
Writes review/<name>.jpg, review/<name>.json and review/summary.tsv. Re-runnable (skips done files)."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
D = os.path.dirname(os.path.abspath(__file__)); RAW = os.path.join(D, "raw"); OUT = os.path.join(D, "review"); os.makedirs(OUT, exist_ok=True)
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
rows = []
for f in sorted(os.listdir(RAW)):
    p = os.path.join(RAW, f); base = os.path.splitext(f)[0]
    if os.path.getsize(p) < 100000: continue
    pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height", "-of", "json", p], capture_output=True, text=True).stdout or "{}")
    dur = float(pr.get("format", {}).get("duration", 0) or 0)
    vs = [s for s in pr.get("streams", []) if s.get("codec_type") == "video"]
    if not vs or dur <= 0: continue
    js = os.path.join(OUT, base + ".json")
    if not os.path.exists(js):
        tiles = []
        for k in range(6):
            t = dur * (k + 0.5) / 6
            r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", p, "-frames:v", "1", "-vf", "scale=180:320:force_original_aspect_ratio=decrease,pad=180:320:(ow-iw)/2:(oh-ih)/2", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
            tmp = os.path.join(OUT, "_t.png"); open(tmp, "wb").write(r.stdout)
            try: tiles.append(Image.open(tmp).copy())
            except Exception: tiles.append(Image.new("RGB", (180, 320)))
        s = Image.new("RGB", (180 * 6, 340), "black"); d = ImageDraw.Draw(s)
        for k, t in enumerate(tiles): s.paste(t, (k * 180, 20))
        d.text((4, 4), f"{base[34:] if '__' in base else base} {dur:.1f}s", fill="yellow"); s.save(os.path.join(OUT, base + ".jpg"))
        words = []
        has_audio = any(s.get("codec_type") == "audio" for s in pr.get("streams", []))
        if has_audio:
            import numpy as np
            a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
            if len(a):
                segs, _ = m.transcribe(a, word_timestamps=True, language="en", vad_filter=True)
                for sg in segs:
                    for w in sg.words: words.append({"text": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2), "p": round(w.probability, 2)})
        json.dump({"file": f, "dur": dur, "w": vs[0].get("width"), "h": vs[0].get("height"), "words": words}, open(js, "w"))
    j = json.load(open(js))
    rows.append((f, f"{j['dur']:.1f}", " ".join(w["text"] for w in j["words"])[:400]))
    print(rows[-1][0][34:] if "__" in rows[-1][0] else rows[-1][0], rows[-1][1], "|", rows[-1][2][:160], flush=True)
with open(os.path.join(OUT, "summary.tsv"), "w") as fh:
    for r in rows: fh.write("\t".join(r) + "\n")
