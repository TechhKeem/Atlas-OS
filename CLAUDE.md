# Atlas-OS: video editor

The video editor lives in `video-editor/` (see `video-editor/README.md`).

## When a video is finished: hand it to Connie

Connie (Hakeem's content teammate in Runway) writes his captions, LinkedIn
posts and weekly blog from what he says in each video. She reads two things
from his Google Drive folder **Video Edits / Launch Video**:

1. The finished video itself (`<Title>.mp4`).
2. Its transcript, saved next to it as **`<Title>.transcript.json`**, using the
   exact same title as the video file. Example:
   `Coworker Retiring.mp4` and `Coworker Retiring.transcript.json`.

So, as the last step of every finished edit:

- Upload `edit/final.mp4` to **Video Edits / Launch Video** under the video's
  title, if it is not there already.
- Upload the transcript JSON the edit used (`edit/transcripts/<name>.json`, the
  Scribe-compatible file from `video-editor/tools/transcribe_local.py` or
  ElevenLabs Scribe) to the same folder as `<Title>.transcript.json`, with
  content type `application/json` and no conversion to a Google Doc.
- Tell Hakeem in one line that both are in the folder.

If the transcript was made from the raw footage rather than the final cut,
that is fine; Connie only needs to know what he said.

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
  `#20242D` gradient at **60% opacity** on the side holding the text, fading
  out toward the subject, so the text stands out. The cover photo has no
  gradient, only a thin top band so the brand mark reads.
- Gradient glass cards (sage → charcoal, frosted blur, white hairline border),
  FK brand colours: charcoal `#20242D`, sage `#5CA581`, platinum `#C1C4C8`,
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
- Keep an index of what's in each folder at `video-editor/broll-index.md` (filename, type, length/size, a one-line description of the shot) once files have been reviewed, so later edits can pick clips without re-downloading.
- HEIC photos: convert to JPG with ffmpeg before use. iPhone .MOV is fine (HEVC); re-encode to H.264 with `-g 30` before putting it in a HyperFrames project.
