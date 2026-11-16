# Video Editor

Give Claude raw footage, get back a finished `final.mp4`, with cuts, color grade, captions, animated overlays and transitions.

It combines two open-source projects. Their skills are installed as **project skills** in [`/.claude/skills/`](../.claude/skills/), so Claude Code loads them automatically in this repo.

| Layer | Source | What it does |
|---|---|---|
| **Editing** | [browser-use/video-use](https://github.com/browser-use/video-use) (MIT) @ `43cfc56` | Transcribe (ElevenLabs Scribe, word-level), pick takes, cut filler/dead air, color grade, 30ms audio fades, burn subtitles, composite overlays, self-check the render |
| **Animation / motion graphics** | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0) @ `c7876f3` | HTML + GSAP → deterministic MP4: titles, lower thirds, kinetic type, charts, shader transitions, about 450 registry blocks |

## Skills installed

- `video-use`: the main editing workflow (`SKILL.md` and `helpers/*.py`), plus a vendored `skills/manim-video` for math/diagram animations
- `hyperframes`: the render contract and work loop for HTML-to-video compositions. Read it first for any animation.
- `hyperframes-cli`: init, lint, snapshot, preview, render
- `hyperframes-registry`: ready-made transitions, overlays, titles, captions, charts (`npx hyperframes add <block>`)
- `media-use`: music, SFX, LUTs/colour looks, voiceover, transcripts, audio ducking
- `motion-doctrine`, `cut-the-curve`, `seam-craft`: transition and motion craft (velocity-matched seams, zoom-throughs, whip cuts, render-safe crossfades)
- `captions-overlay`: caption styling doctrine
- `remotion-to-hyperframes`, `reverse-any-video`, `style-sampling`, `slideshow`, `figma`: extras from the HyperFrames set

## How to use

1. Make a folder per video and drop your footage in it:
   ```
   video-editor/projects/<my-video>/
   ```
   Media files are gitignored. For cloud sessions, upload them or give a URL (`yt-dlp` works).
2. Ask Claude: *"Edit the footage in video-editor/projects/my-video into a 60s launch video with captions and animated titles."*
3. Claude inventories and transcribes the footage, then proposes a plan and **waits for your OK**. It then cuts, grades and builds animations (HyperFrames, one sub-agent per overlay), renders, and self-checks every cut.
4. Output: `video-editor/projects/<my-video>/edit/final.mp4`. `edit/project.md` keeps session memory so you can come back later and iterate.

## Requirements

- `ffmpeg` / `ffprobe` (any build ≥ 4)
- Python ≥ 3.10. Setup: `cd .claude/skills/video-use && uv venv && uv pip install -e .` (the venv is gitignored)
- Node.js ≥ 22. HyperFrames runs via `npx --yes hyperframes …`, with nothing to vendor. Its renderer uses headless Chromium.
- **`ELEVENLABS_API_KEY`** for transcription. Set it in the environment or in `.claude/skills/video-use/.env` (gitignored). Without it, Claude can still cut and animate, but loses word-level cut precision. HyperFrames' local Whisper (`media-use` transcribe) is the fallback.

## Local changes vs. upstream

- `video-use/helpers/render.py`: overlays are trimmed to their slot `duration` before compositing. Upstream, an overlay clip longer than its slot made the final video run long, with a frozen last frame.

## Updating

Re-copy from upstream:
- `video-use` → `.claude/skills/video-use/` (minus `.git`, `static/`)
- `hyperframes/skills/*` and `hyperframes/.claude/skills/{motion-doctrine,cut-the-curve,seam-craft,captions-overlay}` → `.claude/skills/`

Then re-apply the change above.
