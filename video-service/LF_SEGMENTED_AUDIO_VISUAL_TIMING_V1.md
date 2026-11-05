# AmpCoreX LF — segmented audio + measured visual timing contract (2026-10-28)

## Audio Agent V3 (no voice setting change)
- Make 3_Audio Agent V3 sends each full approved Chapters!C chapter to `POST /audio/generate-chapter` on **ax-longform-assembly**, authorized with existing `x-api-key` plus `xi-api-key` for ElevenLabs.
- Backend splits approved narration into <=700-character speech segments at punctuation/word boundaries (ideally ~400–700), losslessly.
- Each ElevenLabs Multilingual v2 `with-timestamps` generation uses `previous_text` and `next_text` context.
- Decode each MP3 to 44.1kHz PCM WAV, measure real decoded segment duration, concatenate WAVs in order, encode **one** full-chapter MP3. Do not repeat MP3 encoder gaps at joins; no silence/crossfade is deliberately added.
- Shift ElevenLabs measured character times by cumulative **decoded** segment seconds, convert to word timings. No word-count-based guessed times.
- Return final MP3 base64, actual final duration, compact prepared `WordTimings.json` base64, segment counts and lengths. Make uploads MP3 first, then calls `/subtitle/prepare-chapter` with prepared sidecar plus uploaded MP3 ID; store completed sidecar Drive ID at Chapters!R.
- Preserve Chapter status, one-MP3-per-narrative-chapter, SRT and P1/P2 renderer contracts.

## Visual Agent measured input
- **Before** Visual Agent plans each narrative chapter, read Columns A (chapter), C (approved narration), D (MP3 Drive ID), E (measured MP3 seconds), R (`subtitle_alignment_file_id`) of Chapters in the **same per-video Visual workbook**.
- Call `POST /visual/timing-context` on **ax-longform-assembly** with `video_id`, `chapter`, `narration`, and `subtitle_alignment_file_id` from Chapters!R.
- Endpoint verifies sidecar's video/chapter + approved narration SHA256, then returns actual `sentence_cues` with `start_seconds` / `end_seconds` relative to the **entire chapter MP3** (0-based). Each cue retains spoken text.
- Send **all** measured `sentence_cues` to the LF Visual Agent alongside the chapter narration and asset catalog. Choose visuals and beat boundaries by what is *actually spoken when*, not word-count estimates. Full-chapter duration is still measured MP3 length. Preserve Visual_Plan A:G, integer 30fps beat durations, and the <=55s P1/P2 split constraints.
- If R is missing or the endpoint reports bad cue/audio source identity, stop measured-timing claims and mark that chapter Needs Timing; never synthesize fake timestamps. For legacy audio, backfill via authorized forced alignment before activation.
- The LF Visual Agent instruction document **VISUAL AGENT** was updated with this source/timing requirement. Its separate Make blueprint was **not available** in this session and must be patched wherever the active chapter prompt is constructed.

## Make HTTP module to insert before the visual prompt / per chapter
POST `https://ax-longform-assembly-641336008675.europe-west1.run.app/visual/timing-context`
Header: `x-api-key` = same Assembly service key as the existing LF Make flow
Body (Make expressions are examples; replace module numbers with the Visual Agent scenario's actual chapter-reader number):
```json
{
  "video_id":"{{VIDEO_ID}}",
  "chapter":"{{CHAPTER_NUMBER}}",
  "narration":"{{escapeJSON(CHAPTER_NARRATION)}}",
  "subtitle_alignment_file_id":"{{CHAPTER_R_FILE_ID}}"
}
```
Then include the response's `sentence_cues`, `audio_duration_seconds`, and `source` in the **actual prompt input** (not only in a status check).

## Deployment and tests
- Backend route additions currently live on QA branch `fix/lf-gcs-delivery-make-contract-20261027`; deploy `ax-longform-assembly` from a verified commit before importing V3 Make blueprint.
- Tests: `node --test server/segmented-tts.test.mjs server/subtitles.test.mjs`; CI also typechecks and builds the production image.
- No production or Shorts changes are implied by a git merge. Do not claim actual ElevenLabs-audio quality improved until a fresh MP3 is generated and volume-tested.
