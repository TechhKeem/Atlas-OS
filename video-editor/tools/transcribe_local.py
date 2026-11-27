"""Free local word-level transcription (faster-whisper) -> Scribe-compatible JSON for video-use.

Usage: python transcribe_local.py <video> <edit_dir>/transcripts/<name>.json
Setup: uv venv && uv pip install faster-whisper   (needs huggingface.co hosts allowed)
Run with HF_HUB_DISABLE_XET=1 if the xet CAS hosts are blocked.
"""
import json, sys
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
m = WhisperModel("small.en", device="cpu", compute_type="int8")
# verbatim prompt nudges Whisper to keep fillers
import subprocess, numpy as np
audio = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout, np.float32)
segs, info = m.transcribe(audio, word_timestamps=True, language="en", vad_filter=False,
    initial_prompt="Umm, uh, so, like, you know, I mean... okay.")
words=[]; prev=0.0
for s in segs:
    for w in s.words:
        if w.start > prev: words.append({"type":"spacing","text":" ","start":round(prev,3),"end":round(w.start,3),"speaker_id":"speaker_0"})
        words.append({"type":"word","text":w.word.strip(),"start":round(w.start,3),"end":round(w.end,3),"speaker_id":"speaker_0","p":round(w.probability,2)})
        prev=w.end
json.dump({"language_code":"en","text":" ".join(x["text"] for x in words if x["type"]=="word"),"words":words}, open(out,"w"), indent=1)
print(len([x for x in words if x["type"]=="word"]), "words")
