## Session 1 — 2026-11-27

**Strategy:** First reel built with the `fk-reel` skill, brief "optimised to go viral". Format C: VO cut from Retirement
Scenes (strongest curiosity-gap hook in the library) over Authority/B Roll stills + 3 clips. Three named sections, glass
widgets on the numbers, quotable closer, comment-bait end card. No music. 1080×1920@30, ~68 s, SDR.

**Pipeline:** `prep_media.py` → `build_vo.py` (12 word-boundary cuts, 0.15 s gaps, "boo"→VOO fix) → `build_hf.py` →
`npx hyperframes@0.9.86 render --sdr` → `finish.sh` (voice-only loudnorm −14 LUFS, final + phone copy).

**Decisions:** dropped the Chuck E. Cheese family clip (third-party logo); hook shot swapped from WSL-6 to PROCON so
the title box doesn't touch his face; the $27,500 VOO half is shown silently in the Carol card to keep it short.

**Limitation:** Hakeem never says "Comment PLAN" in an existing recording, so the CTA is on screen only. A 4 s new
line ("James or Carol? Comment PLAN and I'll send you my free retirement quiz.") would drop straight in at 61.6 s.
