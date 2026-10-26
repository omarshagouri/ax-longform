# AmpCoreX Phase 2 + 3 — Visual Directing QA

This is an **independent QA toolset**, not a new rendering endpoint, a Make scenario, or an automatic score generator. Visual Planning still writes the same `Visual_Plan!A:G`.

## Phase 2: editorial knowledge in the live catalog

The existing **AmpCoreX LF Visual Dataset** (Cards, Animations, Clips; no Backgrounds) now contains three appended optional columns on each tab:

- `Editorial_job`: why a YouTube editor would use the shot.
- `Visible_story_and_motion`: actual renderer-layout behavior where verified, otherwise clearly labeled catalog descriptions.
- `Evidence_limitations`: prevents the agent from inferring uninspected clip contents, motion or nonexistent source metrics.

The original 10/6/10 columns, duration caps, IDs, File_IDs and names are unchanged. A separate `_V2` copy was made before edits. Clips have **not** been visually inspected frame-by-frame; don't claim otherwise. Animation `VA-LF-010` means HEAT PROPAGATION when cooling is false; `VA-LF-012` depicts BMS sensor-to-action logic even when a custom title implies research. These are not interchangeable generic science illustrations.

## Phase 2: true narration alignment protocol

`server/visual-word-alignment.mjs` accepts measured per-word start/end times **only from a real ASR or forced-alignment run on the source MP3**. It requires exact spoken word coverage, monotonically increasing cue times and known MP3 Drive ID. It compares every planned beat boundary to actual words and reports maximum timing drift. No estimate based only on word counts can become 'verified'.

Optional sidecar format:

```json
{
  "chapters": {
    "1": {
      "method": "actual forced-alignment provider and version",
      "cues": [
        {"word": "Real", "start": 0.12, "end": 0.34},
        {"word": "spoken", "start": 0.35, "end": 0.72}
      ]
    }
  }
}
```

This is a **schema example**, not actual AX-LF-006 alignment evidence. No real word timestamps have been produced. Never synthesize them merely to satisfy a 0.75-second sync threshold.

## Phase 3: deterministic QA + independent editorial gate

Run in `video-service` with Node 22 and Google ADC that can READ both native spreadsheets:

```bash
node server/visual-plan-validator.mjs --live \
  1-soN3grzRjvGPWJsT8UCg8Hq0O7kOWa6_PSAVlqRn3c \
  1n_BoKTFc1EUIVjNPU5hRhGo2FJ3uZfVqoTf2CPjhf78 > visual-qa-report.json
```

Or offline with an authorized JSON snapshot:

```bash
node server/visual-plan-validator.mjs --input qa-snapshot.json
node server/visual-plan-validator.mjs --input qa-snapshot.json --review editorial-review.json
node server/visual-plan-validator.mjs --input qa-snapshot.json --alignment measured-word-cues.json
```

`qa-snapshot.json` has `chapters`, `visualPlan`, and `catalog: { Cards, Animations, Clips }`, each as 2D spreadsheet value arrays including header rows. Live calls are read-only. Exit status 0 indicates checked structural hard gates passed; status 2 means a hard gate or supplied review failed; status 1 means data access or script error.

What is checked: 5–7 coherent chapters, first 2s `VC-LF-018`, exact chapter titles, approved catalog IDs and Ready statuses, correct per-asset 30fps duration cap, two footage beats in each chapter, exact live Drive File_ID/filename match, at least one VA, speech-text coverage, audio frame totals, and a legal <=55s two-part split with one clip on either side. Includes conservative warnings for repetitive templates, source-unsuitable built-in labels, unverified real clip MP4 duration/motion, and unverified actual word alignment. **Do not approve a final publish based solely on structuralPass/technicalPass or absence of warnings.** Human/AI editor must assess actual visual quality and correct unresolved warnings.

Editorial ratings are separate: six scores, maxima `relevance:25`, `pacing:25`, `flow:20`, `variety:10`, `readability:10`, `payoff:10`. Each category needs specific chapter/beat evidence. Require viewer-suitability confirmation, >=95 points, and hard-rule pass. No program invents 95 points, and no false claim of having watched a rendered preview. This tool **never** changes any cell, source MP3, Render 5 endpoint, Make scenario or Final Assembly.

## Pilot validation

AX-LF-006 previously saved 90 beats and was kept `Recorded` / `Needs Revision`; the new read-only audit will not promote that draft. To complete a genuine quality assessment, the Visual Agent must rebuild scenes with narrative-specific assets, verify clips' actual footage, then rerun checks and independently evaluate the finished visual storyboard. If a preview or true alignment is unavailable, identify limitations and do not overstate validation.

Tests:

```bash
node --test server/visual-plan-validator.test.mjs server/visual-word-alignment.test.mjs
```
