# Long Form — Video service

Independent 16:9 Remotion renderer for long-form chapters.

Native format:
- 1920x1080
- 30 fps
- H.264
- cards `VC-LF-*` only

Endpoints:
- `GET /`
- `POST /render-video`
- `POST /build-and-render`
- `POST /render-chapter` (alias)

`/render-chapter` is the future long-form production path: one chapter in, one self-contained MP4 out. Full-video stitching will be added after card design is locked.


## Renderer 5 — live visual-catalog footage (2026-10-26)

The live AmpCoreX visual catalog is Google spreadsheet `1n_BoKTFc1EUIVjNPU5hRhGo2FJ3uZfVqoTf2CPjhf78`, tabs **Cards, Animations, Clips**. The Backgrounds tab no longer exists.

For every Visual_Plan `VV-LF-*` beat, `card_id` is the Clips tab `Visual_id`. The Visual Planning agent writes the exact Drive `File_ID` from the same catalog row into `values`:
```json
{"file_id":"<actual Drive File_ID>","clip_name":"VV-LF-023.mp4","max_duration_sec":4.5}
```
Renderer 5 downloads that real video, validates it with ffprobe, and uses the specified number of frames. When `file_id` is absent, it can resolve the `Visual_id` or exact filename via the live Google Sheets Clips tab, provided the service account has read access. Its runtime needs permission to read the selected Drive MP4 either way. File identifiers and content come from the catalog, never a hardcoded ID-to-clip mapping. A clip beat must fit both the catalog maximum and actual playable MP4 duration. Non-16:9 clips are letterboxed instead of cropped.

**Do not use the old 3-second synthetic VV-LF-001..004 meanings.** The live Clips tab owns all VV-LF IDs, including 001..004 and new additions. The legacy native-motion helpers remain in the repository solely for old QA code; the paired chapter endpoint does not invoke them.

The current Make Scenario 5 blueprint sends the full chapter beats, calls `POST /render-chapter-part` twice with `audio_mode:"segment"`, and uploads the two completed MP4s. Each contains one contiguous segment of the original audio. Full narrative chapter MP3 and narration remain unchanged; each technical part is <=55 seconds. Exactly two approved footage beats are required per coherent chapter, with one on each side of the chosen split. **Renderer 5 does not join.** No Final Assembly changes are part of this rollout.

Deploy the dedicated feature branch to the existing `paired-qa` zero-traffic Cloud Run tag before use, preserving existing project/service credentials. The Dockerfile runs the clip resolver tests during the build; a canary deployment is not by itself an end-to-end video render verification.
