"""Voice-over from Hakeem's 'Retirement Scenes' recording: word-boundary cuts, level-matched, tight 0.15 s gaps.
Writes vo/vo.wav and words_out.json (output-timeline words, with segment index)."""
import json, os, subprocess
E = os.path.dirname(os.path.abspath(__file__)); PR = os.path.dirname(os.path.dirname(E)); VO = os.path.join(E, "vo")
RS = (os.path.join(PR, "sequence-explainer", "retirement_scenes.mp4"), os.path.join(PR, "sequence-explainer", "edit", "transcripts", "retirement_scenes.json"))
SEGS = [  # (in, out, label)
    (0.00, 9.50, "hook"),        # Two retirees, same $1 million, the same $60,000 a year to live on. One can run out... Here's the difference.
    (9.66, 15.42, "james"),      # Meet James. He puts all of it into the S&P 500 fund, VOO, and takes out 6% a year.
    (18.50, 24.56, "crash"),     # James retires right into a rough market, down 15%, then down 10, then down 5.
    (24.86, 32.30, "selling"),   # But his bills don't stop... In three years, his million is down to $575,000.
    (33.76, 34.36, "carol"),     # meet Carol,
    (38.46, 39.80, "same"),      # same bad start,
    (40.38, 42.72, "income"),    # but this time she buys income first.
    (43.10, 47.66, "pension"),   # She puts $500,000 into a private pension account paying 6.5%.
    (48.48, 54.84, "life"),      # That's $32,500 every year for the rest of her life, no matter what the market does.
    (86.02, 91.34, "less"),      # But if the markets were to average a little less, about 6.6, James runs out of money completely.
    (91.78, 98.54, "year26"),    # In year 26. Carol, she still has money invested, and her $32,500 shows up every year for the rest of her life.
    (121.10, 124.90, "closer"),  # James is hoping that the market cooperates. Carol has a paycheck.
]
GAP = 0.15
words, parts, t = [], [], 0.0
tr = json.load(open(RS[1]))["words"]
for k, (a, b, lab) in enumerate(SEGS):
    out = os.path.join(VO, f"seg{k}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a}", "-to", f"{b}", "-i", RS[0], "-vn", "-ac", "1", "-ar", "48000",
                    "-af", "highpass=f=80,loudnorm=I=-16:TP=-2:LRA=7,afade=t=in:d=0.012,afade=t=out:st=%.3f:d=0.03" % (b - a - 0.03), out], check=True)
    for w in tr:
        if w["type"] == "word" and a - 0.01 <= w["start"] < b:
            words.append({"text": w["text"], "start": round(t + w["start"] - a, 3), "end": round(t + min(w["end"], b) - a, 3), "seg": k, "label": lab})
    parts.append((out, t)); t += (b - a) + GAP
total = t - GAP
inputs, filt = [], []
for i, (p, st) in enumerate(parts):
    inputs += ["-i", p]; filt.append(f"[{i}]adelay={int(st * 1000)}|{int(st * 1000)}[d{i}]")
filt.append("".join(f"[d{i}]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total + 6:.2f}[o]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]", "-ar", "48000", os.path.join(VO, "vo.wav")], check=True)
# transcript fixes: Whisper heard "boo" for VOO and "$6.6" for "6.6"
for w in words:
    if w["text"].lower().strip(",.") == "boo": w["text"] = "VOO,"
    if w["text"].startswith("$6") and ".6" in w["text"]: pass
    if w["text"] == "$6": w["text"] = "6"
    if w["text"] == ".6,": w["text"] = ".6%,"
json.dump(words, open(os.path.join(E, "words_out.json"), "w"), indent=0)
print("voice ends", round(total, 2), "| seg starts:", {lab: round(st, 2) for (_, _, lab), (_, st) in zip(SEGS, parts)})
