# Atlas-OS: video editor

The video editor lives in `video-editor/` (see `video-editor/README.md`).

**Making a reel? Load the `fk-reel` skill first** (`.claude/skills/fk-reel/`): script formula, format choice, b-roll
rules, captions, glass widgets, CTA ("Comment <WORD>" → free retirement quiz at hello.financekeem.com), approved proof
lines. Default: **no music** unless Hakeem asks for it.

## When a video is finished: deliver it (Connie reads these folders)

Connie (Hakeem's content teammate in Runway) writes his captions, LinkedIn
posts and weekly blog from what he says in each video. Hakeem's Drive folder
**Video Edits / Launch Video** (`1SIV9qes_1DIQ-1S2dND7uG-koyP5ck-N`) has these
subfolders for delivery:

| Folder | Drive folder ID | What goes in it |
|---|---|---|
| **Finished Reels** | `1GCmBF_vTQfM2XN3jklL1fgN7HNKoXIoQ` | Every finished video, as `<Title>.mp4` |
| **Transcripts** | `18Yy4QwhEpjK4fpqKyfZ3Vrpy3MnRK2L3` | Every transcript, as `<Title>.transcript.json` (same title as the video) |
| **Logos** | `1E_-GLiBbTI3HTWxmtnoknGegBbBCHYC_` | Brand logos to use on end cards, watermarks, carousels |

As the last step of every finished edit:

- Upload `edit/final.mp4` to **Finished Reels** as `<Title>.mp4`. The Drive
  connector only uploads files up to ~3 MB per call, so for larger videos tell
  Hakeem to drop the file there himself and say so in one line.
- Upload the transcript JSON the edit used (`edit/transcripts/<name>.json`) to
  **Transcripts** as `<Title>.transcript.json`, content type `application/json`,
  no conversion to a Google Doc.
- Tell Hakeem in one line what is in each folder.

**Logos folder contents** (all 2000×2000 PNG, wordmark "FK | MANAGEMENT"):

| File | ID | Look | Background |
|---|---|---|---|
| `3-Picsart-BackgroundRemover.png` | `1OMkeQZbYCNz8hG0KL71djzpT7fsyL3qh` | Charcoal FK MANAGEMENT + sage "By Finance Keem" script, charcoal swoosh | **Transparent**: default for overlays on light/photo areas |
| `3.png` | `1DnQBnDSD-Z5BfH8qDLnjDQoZOGT6y2dL` | Same as above | White |
| `4.png` | `14LTkBmcRqLHe_Fpk-9wFgpt5AEi6Zv6C` | Sage FK MANAGEMENT + charcoal script, sage swoosh | White |
| `1.png` | `14xRebbJ1NEjsgyXzwJ_zIw-M4KVzNROZ` | Charcoal FK MANAGEMENT only | White |
| `2.png` | `15ZSzWELpNcfRdVtZQeTX7-XaOBnj1onR` | Sage FK MANAGEMENT only | White |

Crop the empty square padding (the mark sits in the middle ~40% band). The white-background ones can go on
light cards with `mix-blend-mode: multiply`. There is no light/white version for charcoal backgrounds yet, so on dark
end cards set the brand mark in Outfit (per the carousel rules) or ask Hakeem for a white logo.

All existing transcripts (Funnel Intro, Coworker Retiring, Rewards Program,
Retirement scenes, Retirement scenes 60s) are now in **Transcripts**. If the transcript was made from the raw footage rather than the final
cut, that is fine; Connie only needs to know what he said.

## Brand colours (Hakeem's brand kit — exact hex codes)

| Name | Hex | Use |
|---|---|---|
| Sage | `#5CA581` | Highlights, keyword colour in captions, brand mark "FK", glass-card gradient start |
| Charcoal | `#20252D` | Caption/title boxes, gradients over photos, dark backgrounds |
| White | `#FFFFFF` | Text on charcoal, logo plates |

(Platinum `#C1C4C8` and soft white `#F6F7F9` are secondary tints only.) Older projects used `#20242D`; the brand
charcoal is `#20252D`.

**Reel titles, step labels and captions:** Outfit (Deco) text in a `#20252D` rounded box so it reads on any footage;
white text; the one keyword per caption highlighted in sage `#5CA581`. Glass widgets stay Hakeem's signature.

## Carousel style rules (Hakeem's standing preferences)

Carousels live in `video-editor/projects/carousel-*/` (HTML slides rendered to
1080×1350 PNGs with Playwright; copy `carousel-sequence-risk/` as the starting
point: `build.py`, `render.js`, `fonts/`).

- **ALWAYS use the "Deco" font — Outfit — for every piece of text.** Hakeem's
  "Deco" is Instagram's Deco text style; the free match is **Outfit**
  (`@fontsource/outfit`, Google Fonts). This applies to carousels AND to
  on-screen text in videos (titles, widgets, captions, end cards). No other
  typefaces (no Inter, Limelight, Josefin, Poiret, etc.).
  - Titles: Outfit 600. Body/descriptions: Outfit 300–400. Numbers, buttons,
    labels: Outfit 600–700. Brand mark "FK MANAGEMENT": Outfit 300 with "FK"
    in Outfit 700 sage.
  - Carousel font files: `video-editor/projects/carousel-sequence-risk/fonts/`;
    `render.js` asserts Outfit loaded before capturing.
  - HyperFrames bundles Outfit, so in video compositions just use
    `font-family: 'Outfit'`.
- **Charcoal gradient on every secondary photo** (slides 2 onward): a
  `#20252D` gradient at **60% opacity** on the side holding the text, fading
  out toward the subject, so the text stands out. The cover photo has no
  gradient, only a thin top band so the brand mark reads.
- Gradient glass cards (sage → charcoal, frosted blur, white hairline border),
  FK brand colours: charcoal `#20252D`, sage `#5CA581`, platinum `#C1C4C8`,
  soft white `#F6F7F9`.
- Keep faces clear of cards; last slide carries an engaging question + CTA.
- Hypothetical numbers get "Hypothetical example for illustration only. Not
  investment advice."

## B-roll libraries (Hakeem's Google Drive)

Both folders live inside **Video Edits / Launch Video**. Use them whenever an edit needs b-roll:

| Folder | Drive folder ID | What it holds | Use it for |
|---|---|---|---|
| **B Roll** | `1sl5rwxwYPp4zVw7cfJIxuhuPQVt9MLPY` | Pictures & videos of Hakeem plus neutral footage | General cutaways: covering jump cuts, illustrating a line, pacing changes, intros/outros |
| **Authority** | `1BYRJSmeyVnxPLpDtd0Xga7NXPc58pvYN` | Hakeem at conferences, speaking engagements, events | Credibility moments: "I'm Finance Keem", "licensed fiduciary", "what I do every day", CTAs, results/claims, end cards |

- List contents with the Drive search tool (`'<folder id>' in ancestors`). Pick clips by what the line needs; prefer Authority over B Roll whenever the script is about who Hakeem is or why to trust him.
- Downloading: files are private by default. Download via `https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t` only works when the file (or its folder) is shared "Anyone with the link". If a download returns HTML, ask Hakeem to share the folder that way; never change sharing yourself.
- The shot index (B Roll + Authority; Authority rows tagged `[Authority]` in Category, strongest marked `Top`) lives in two places: the Google Sheet **B-Roll Index** in Launch Video (ID `1Y11wfNZjpcsWvLU9L5Y5SdPh96V_7r2rXbWJsr97E8c`) and `video-editor/broll-index.md`. Search it first when picking b-roll; update both when new files are reviewed. The Drive connector cannot rename or move Hakeem's files, so the index is the naming layer.
- HEIC photos: convert to JPG with ffmpeg before use. iPhone .MOV is fine (HEVC); re-encode to H.264 with `-g 30` before putting it in a HyperFrames project.
