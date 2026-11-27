"""Voice-over from Hakeem's earlier recordings: cut segments at word boundaries, level-match, join with 0.25 s gaps.
Writes vo/vo.wav and words_out.json (output-timeline words for captions/widgets)."""
import json, os, subprocess
E = os.path.dirname(os.path.abspath(__file__)); PR = os.path.dirname(os.path.dirname(E)); VO = os.path.join(E, "vo")
CW = (os.path.join(PR, "coworker-retiring", "coworker_retiring.mp4"), os.path.join(PR, "coworker-retiring", "edit", "transcripts", "coworker_retiring.json"))
RS = (os.path.join(PR, "sequence-explainer", "retirement_scenes.mp4"), os.path.join(PR, "sequence-explainer", "edit", "transcripts", "retirement_scenes.json"))
SEGS = [  # (source, in, out) — word boundaries from the transcripts
    (CW, 0.00, 6.30),     # So I had a conversation with an old employee of mine... Or at least he thinks.
    (CW, 6.40, 9.10),     # It's my job to figure out and help him see if he's gonna retire.
    (CW, 9.98, 18.20),    # We took the money in his old 401k... private pension... money for him.
    (CW, 18.28, 23.20),   # And then we're gonna add up his social security... monthly expenses.
    (CW, 23.58, 31.45),   # And guess what? If there's a positive number... fix that balance.
    (CW, 31.86, 35.60),   # It's really that simple. This is my job... every single day.
    (RS, 126.72, 133.70), # If you're within 10 years of retirement... DM me the word INCOME... stress test your plan.
]
GAP = 0.25
parts, words, t = [], [], 0.0
for k, ((src, tr), a, b) in enumerate(SEGS):
    out = os.path.join(VO, f"seg{k}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a}", "-to", f"{b}", "-i", src, "-vn", "-ac", "1", "-ar", "48000",
                    "-af", "highpass=f=80,loudnorm=I=-16:TP=-2:LRA=7,afade=t=in:d=0.015,afade=t=out:st=%.3f:d=0.03" % (b - a - 0.03), out], check=True)
    for w in json.load(open(tr))["words"]:
        if w["type"] == "word" and a - 0.01 <= w["start"] < b:
            words.append({"text": w["text"], "start": round(t + w["start"] - a, 3), "end": round(t + min(w["end"], b) - a, 3), "seg": k})
    parts.append((out, t)); t += (b - a) + GAP
total_voice = t - GAP
inputs, filt = [], []
for i, (p, st) in enumerate(parts):
    inputs += ["-i", p]; filt.append(f"[{i}]adelay={int(st * 1000)}|{int(st * 1000)}[d{i}]")
filt.append("".join(f"[d{i}]" for i in range(len(parts))) + f"amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total_voice + 2.5:.2f}[o]")
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]", "-ar", "48000", os.path.join(VO, "vo.wav")], check=True)
json.dump(words, open(os.path.join(E, "words_out.json"), "w"), indent=0)
print("voice ends at", round(total_voice, 2), "s;", len(words), "words; seg starts:", [round(s, 2) for _, s in parts])
