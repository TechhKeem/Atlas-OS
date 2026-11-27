## Session 1 — 2026-11-27

**Strategy:** First fully autonomous reel ("create a reel completely on your own"). Cut 1 was text-only (31 s, no voice,
`build_hf_textonly.py`). Hakeem then said to pull audio from his other clips, so cut 2 (final) is a voice-over reel:
his Coworker Retiring story + the INCOME call to action from Retirement Scenes, over B Roll/Authority stills (Ken Burns)
and two Authority clips. FK glass widgets build the "paycheck math" in sync with his words; pill captions below.
1080×1920@30, 44.5 s, SDR.

**Pipeline:** `prep_media.py` (stills: EXIF-upright, 9:16 crop at a focus x, 1350×2400; HLG iPhone clips tone-mapped to
SDR bt709, H.264 -g 30) → `build_vo.py` (word-boundary cuts from the two raw recordings, each loudnorm'd to −16, 0.25 s
gaps → `vo/vo.wav`, `words_out.json`) → `build_hf.py` (hf/index.html + 7 scenes) → `npx hyperframes@0.9.86 render --sdr`
→ `mix.sh` (VO + lo-fi bed sidechain-ducked, two-pass loudnorm −14 LUFS) → mux → `final.mp4`, `final_phone.mp4`.
Sources live in `../photos` and `../clips` (gitignored copies of the Drive files listed in SCRIPT.md).

**Decisions:**
- Widgets in the band above the captions; math card is bottom-anchored and grows upward row by row so faces stay clear.
  Bottom 700 px kept free for Reels UI, right margin 180 px for Shorts.
- Render `--sdr`: the HLG clips otherwise switch the whole render to HDR (washed out on Instagram).
- End card: transparent logo on a soft-white plate, headshot shifted up so the face is clear; CTA matches his spoken
  "DM me the word INCOME". "Licensed fiduciary" on the name card is from his own Funnel Intro.
- Music: original `tools/lofi_coffee.py`, 84 BPM. Final −14.0 LUFS, −1.3 dBTP.
- Index fix: IMG_8140 is mostly a card game at a table (phone only in the first second).

**Outstanding:** Hakeem to review. The voice is from two recordings, so room tone shifts slightly at the CTA (35.25 s).
