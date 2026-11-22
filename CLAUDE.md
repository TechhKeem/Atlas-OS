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
