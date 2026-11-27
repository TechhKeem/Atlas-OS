---
name: fk-reel
description: Make a Finance Keem (FK Management) Instagram/TikTok reel end to end — script, format choice, b-roll from Hakeem's Authority/B Roll library, Outfit captions, FK glass widgets, CTA end card, render and delivery to Drive. Use whenever Hakeem asks for a reel, short, video edit, or "create a video", from raw footage, an old recording, or nothing at all. Load before video-use/hyperframes; it decides WHAT to make, they do the HOW.
---

# FK Reel — how Hakeem's reels are made

Distilled from three reference reels Hakeem picked (Drive **Video Edits / Launch Video / Content Examples**,
`1yiXEaNbAH6Xb11VduRUs3UMsA2ltRtJG`; breakdown in `references/examples.md`) plus the house rules in the repo's
`CLAUDE.md` (fonts, colours, Drive folders). The working reference build is
`video-editor/projects/same-million-reel/` (first reel made with this skill) — copy its `edit/*.py` / `finish.sh`.

## Hard rules (always)

1. **No music by default.** Add a bed only when Hakeem asks for one (then: `video-editor/tools/*.py`, ducked
   ~12 dB under voice, `mix.sh` pattern).
2. **Every word on screen is Outfit** (Hakeem's "Deco"). Titles 600, captions 600, body 300–400, numbers 700.
3. **Brand colours exactly:** sage `#5CA581`, charcoal `#20252D`, white `#FFFFFF` (tints: platinum `#C1C4C8`,
   soft white `#F6F7F9`).
4. **Captions always on**, in a `#20252D` rounded box, white text, **one keyword per caption in sage `#5CA581`**.
   Titles / step labels use the same box style.
5. **CTA is "Comment <WORD>"**, never "DM me" (comments boost reach). Freebie = the free retirement quiz at
   **hello.financekeem.com**. Keyword is **PLAN** (Hakeem’s choice) unless he names another for a specific reel.
6. **Proof only from the approved list** (below). Never invent stats, clients, results or credentials.
7. **Faces stay clear** of every card, caption and widget. Text lives in the safe band: nothing in the bottom
   700 px (Reels UI) or the right 180 px (Shorts UI) of a 1080×1920 frame.
8. **Compliance:** use "private pension account", never "annuity". Hypothetical numbers carry "Hypothetical
   example for illustration only. Not investment advice." Anything implying guaranteed income adds "Guarantees are
   subject to the claims-paying ability of the issuing insurer." Flag the reel for compliance review in the
   hand-off message.
9. **Render SDR** (`hyperframes render --sdr`); tone-map iPhone HLG clips to bt709 first.
10. **Deliver** per `CLAUDE.md`: final → Finished Reels (`<Title>.mp4`; > ~3 MB → Hakeem uploads), transcript →
    Transcripts (`<Title>.transcript.json`, application/json, no conversion).

## Approved proof lines (for hooks, name cards, end cards)

- Licensed fiduciary
- 6 years in business
- Over 200 families helped
- Spoken at major conferences and on panels (e.g. Wealth Summit "Assets vs Liabilities" panel, Operation HOPE panel)
- Owner of FK Management ("Finance Keem")

## 1. Pick the format (one per reel, from what exists)

| Format | When | Backbone | B-roll role |
|---|---|---|---|
| **A. Talking head + proof inserts** | Hakeem recorded himself to camera | His face, ~70–75 % of screen time | 2–6 s inserts that SHOW the noun he's saying, then cut back |
| **B. Voice-over + process b-roll** | He filmed himself *doing* the thing (meeting, whiteboard, laptop) | The action, narrated | Every sentence acted out literally |
| **C. Voice-over + lifestyle/authority b-roll** | No new footage: VO from an old recording (or a new VO-only take) | Library stills/clips (Ken Burns) | Literal where possible, otherwise aspirational/credibility (stage, panels, family, lifestyle) |

Formats mix: A with a C-style hook, or C with a few talking-head seconds. Glass widgets work in all three.

## 2. Script — the formula all three references share

Target **55–75 s**, ~150–190 words. Write it before touching footage (or map an existing recording onto it).

1. **Proof hook (0–7 s)** — personal proof before advice, from the approved list, said fast:
   "I'm a licensed fiduciary. In six years I've helped over 200 families retire…". Show each claim as it's said
   (Authority stage/panel shots).
2. **Bridge (1 line)** — the promise: "Here are 3 things…", "If you do these 3 steps…", "Let me show you how."
3. **Three named items** — each gets a 1–3-word label ("Track it", "Number two: insurance") + ONE concrete action
   or number ("download your last 3 statements", "$10,000 earns $1 vs $400").
4. **One relatable/funny line** somewhere in the middle (the "Italy vs Illinois" moment).
5. **CTA** — "Comment PLAN and I'll send you my free retirement quiz" (link is hello.financekeem.com — the
   automation or Hakeem sends it). Show the freebie on screen (quiz card / page) while he says it.
6. **Quotable closer** — one line people screenshot ("It's not about what you have, it's what it pays you").

Teleprompter version = plain paragraphs (Hakeem reads from a teleprompter). Shooting notes go separately:
**one location per section if he can** (hook / item 1 / item 2 / item 3+CTA); if not, I cover each section with
b-roll from a distinct setting so sections still feel different.

## 3. Picture — b-roll rules

- **Search the shot index first** (`video-editor/broll-index.md` / Sheet "B-Roll Index"). `[Authority]` + `Top` rows
  for who-he-is/why-trust moments; B Roll for general cutaways. Download small files with the Drive connector
  (≤ 10 MB); larger ones need the folder shared "Anyone with the link".
- **Match the line, in this order of preference:** (1) literal — shows the exact thing said; (2) proof — his real
  stuff (his laptop, sheet, stage, clients, family), never stock; (3) aspirational — the life the advice leads to.
- **Hold the hook shot** up to ~6–9 s only if it's a walk-in/talking-head that carries the hook; after that **a
  visual change every 2–3 s** (cut, insert, punch-in or widget beat). Hard cuts only; at most two soft flashes at
  act breaks.
- **Openers that work:** walking toward camera, writing the title on a whiteboard/notepad, walking into a room.
  **Endings:** a natural exit (walking out, walking away) under the CTA, or the end card.
- Talking head: remove every breath/pause (no gaps > ~0.3 s), punch in 1.1–1.25× on emphasis lines.

## 4. On-screen text (three layers, nothing more)

1. **Title** (hook only, top third, ~y 300–520): `#20252D` box, white Outfit 600 ~56 px, 1–2 lines
   ("Retirement Paycheck · 3 Steps"). Stays up through the hook.
2. **Step label** (same spot/style): "1. COVER THE BASICS" etc.; then "Comment PLAN" through the CTA.
3. **Captions** (chest height, bottom of box at y ≈ 1220): 2–4 words, white Outfit 600 ~52 px in a `#20252D` box
   (~88–100 % opacity), keyword in `#5CA581`. Group at punctuation; never over the end card.

## 5. Glass widgets (Hakeem's signature — use 1–3 per reel)

Sage→charcoal gradient glass, frosted blur, white hairline border, Outfit. Use them only where a number, equation
or comparison needs to be *seen*: the math ("pension + Social Security − expenses"), before/after ("$1 vs $400"),
a 3-step summary. Time every row to the spoken word (`words_out.json`); grow cards row by row (height reveal, no
margin tweens); anchor them so faces stay clear (bottom-anchored above the captions works).

## 6. End card / CTA (last 6–9 s)

Headshot (Authority WSL-22 or similar) shifted so the face is clear, charcoal gradient, transparent logo
(Logos `3-Picsart-BackgroundRemover.png`) on a soft-white plate, glass CTA card: "Comment **PLAN**" + "for my free
retirement quiz" + `hello.financekeem.com`, disclaimer ≥ 28 px held ≥ 4 s. For reach, open the CTA with a one-word
question viewers can answer in the comments ("James or Carol?") — it doubles as comment bait. If Hakeem never says the
CTA in the source audio, keep it on screen only and suggest a 4 s re-record line in the hand-off.

## 7. Pipeline (reuse `video-editor/projects/paycheck-reel/edit/`)

1. Footage in → transcribe (`video-editor/tools/transcribe_local.py`, faster-whisper; `HF_HUB_DISABLE_XET=1`).
2. Plan → write `SCRIPT.md` (VO lines with times, shot per line, widgets) and **confirm with Hakeem** unless he said
   "make it on your own".
3. `prep_media.py` — stills EXIF-upright + 9:16 crop at a focus x (1350×2400 for Ken Burns); clips tone-mapped to
   SDR, H.264 `-g 30`.
4. Talking head: cut with video-use (`.claude/skills/video-use`). VO from old recordings: `build_vo.py`
   (word-boundary cuts, each loudnorm −16, 0.25 s gaps) → `words_out.json`.
5. `build_hf.py` → HyperFrames project; `npx --yes hyperframes@0.9.86 check` until clean (ignore TikTok-only safe-zone
   warnings); `snapshot --at …` and **look at every frame** for faces under text, empty cards, unreadable words.
6. `render --sdr` → mux voice (no music unless asked): upmix the mono VO to stereo first, measure, apply gain to −14 LUFS
   + `alimiter` at −1.5 dBTP (see `same-million-reel/edit/finish.sh`; linear loudnorm under-shoots on peaky VO) →
   `final.mp4` (H.264 CRF 18, bt709, faststart) + `final_phone.mp4` (720p) → send the phone copy to Hakeem.
7. Deliver (Hard rule 10), write `edit/project.md`, commit sources (never renders/caches: see `video-editor/.gitignore`).

## Hand-off message

Short: what the reel is, length, format used, which library shots, CTA keyword, anything needing his action
(upload > 3 MB file, compliance review, a re-record that would improve it), and where the files are.
