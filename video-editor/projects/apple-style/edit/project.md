## Session 1 — 2026-11-17

**Strategy:** Single-take talking head ("Funnel Intro", 55s, 1044×1414) cut as a modern Apple-style spot: tightened pauses (~0.24s kept), alternating wide/medium/close digital framings at every cut to fake a two-camera shoot, bright neutral grade, three full-frame soft-white title cards, top-left name super, sage CTA pill, end card, soft original piano bed ducked under voice. Output 1080×1440 (3:4) @30, 52.7s.

**Decisions:**
- Brand: FinanceKeem palette from `financekeem-vercel-ready/tailwind.config.js` — charcoal #20242D, sage #5CA581, platinum #C1C4C8, soft white #F6F7F9. Inter 700. (Canva only had an unrelated "OverFlow Capital" kit.)
- Transcription: local faster-whisper small.en (`video-editor/tools/transcribe_local.py`), no ElevenLabs. Fixed mishears: "hope"→"help", "set them down"→"sat them down".
- Cards: "Clear on your money." (payoff on spoken "money"), "Life happens.", "No pressure. / No judgment." (grey→ink per spoken word). Captions hidden during cards.
- Name super moved from bottom-left to top-left (hands covered it), role on two lines to clear the hair.
- Music: original numpy piano (`video-editor/tools/soft_piano.py`, 76 BPM, Cmaj9–Am7–Fmaj7–Gsus), +9 dB, sidechain-ducked; ~13 dB under speech, ~7 dB under on end card. Final −14.1 LUFS, −1.4 dBTP.

**Rebuild:** `render.py edl.json -o base.mp4` → re-encode to `animations/hf/assets/footage.mp4` (1080×1462, -g 30, no audio) → `python -I animations/build_hf.py` → `hyperframes render` → `graphics.mp4` → audio mix (see session commands) → `final.mp4`.

**Outstanding:** 9:16 version not requested. Music is synthesized — swap in a licensed track if preferred.
