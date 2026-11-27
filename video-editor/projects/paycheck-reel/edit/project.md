## Session 1 — 2026-11-27

**Strategy:** First fully autonomous reel (Hakeem: "create a reel completely on your own"). No talking head exists for it,
so it is text-led: kinetic Outfit headlines + FK glass step cards over library stills (slow Ken Burns) and two short
Authority clips; a cut every 2–3.5 s plus two soft-white flashes at act breaks (12.0 s, 22.5 s). 1080×1920@30, 31 s.

**Pipeline:** `prep_media.py` (EXIF-upright, 9:16 crop at a focus x, 1350×2400 stills; clips → H.264 -g 30) →
`build_hf.py` (writes `hf/index.html` + 9 scene compositions) → `npx hyperframes@0.9.86 render` → `final.mp4`.
Sources live in `../photos` and `../clips` (gitignored; copies of the Drive files listed in SCRIPT.md).

**Decisions:**
- Text sits in the lower-middle band (bottom 700 px reserved for Reels UI, right margin 180 px for Shorts), faces kept clear;
  60 % charcoal gradient on the text side (FK rule). Swapped 8770/8718 so the long "start asking" line doesn't cover a face.
- End card: transparent logo (Logos/3-Picsart-BackgroundRemover.png) on a soft-white plate, headshot shifted up so the face is clear.
- Music: original `tools/lofi_coffee.py` at 84 BPM, faded, mixed to −14 LUFS.
- Compliance: "private pension account" wording, claims-paying-ability disclaimer held 4.5 s.
- Index fix: B Roll/Authority IMG_8140 is mostly playing cards at a table (phone only in the first second).

**Outstanding:** Hakeem to review; checklist for the PAYCHECK keyword doesn't exist yet (offer to make it as a carousel/PDF).
