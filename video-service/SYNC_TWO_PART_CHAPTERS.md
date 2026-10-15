# Long-form: synchronous paired render parts (restored)
Updated 2026-10-15. Source of the intended design for AmpCoreX long-form rendering.

## Flow: existing scenarios only
2 Script -> 3 Audio -> 4 Visual Plan -> **5 Chapter Renderer (synchronous)** -> 6 Metadata -> 7 Thumbnail -> **8 Final Assembly (last)**.

- Script Agent writes two numerically indexed parts per narrative chapter (A then B) into Chapters. 5–7 narrative chapters give 10, 12 or 14 short rows.
- Every part is recorded into its own MP3, has its own native video/clip/animation timeline, and renders into one MP4.
- Make HTTP calls POST `/render-chapter`, then the Make Drive upload module saves the returned Base64 MP4 to the user's Drive. There is **no async Cloud Tasks submission/collection** in this design.
- No parent status becomes Rendered unless every expected part is Rendered AND has a Drive MP4 file ID and filename.
- Final Assembly is last and is blocked until all expected parts are Rendered, have MP4 IDs/filenames, and are explicitly Approved by the editor.

## Native 3-second VV-LF clips
- `VV-LF-001` battery cell array
- `VV-LF-002` charge transfer
- `VV-LF-003` thermal pack scan (illustrative only)
- `VV-LF-004` pack layers

Each native clip lasts **exactly 90 frames at 30 fps**. It is a Remotion component in `src/clips.tsx`, not an external Drive MP4. Native generated visual scenes are not real measured/filmed engineering data.
`/render-chapter` rejects a part unless it has ≥1 valid VV-LF and ≥1 contextually appropriate VA-LF animation. Clip duration and visual/audio coverage are checked programmatically.
The `AXClipPreview` composition can render a single native clip. CI workflow `qa-native-motion-clips.yml` renders four standalone 1080p MP4 QA files and publishes an Actions artifact.

## Safety and rollout
1. Keep PR #11 as DRAFT until rendered clip QA and server CI pass (both expected).
2. Back up active Make scenarios, per-video workbooks, and the Cloud Run service config.
3. Deploy only `ax-longform-render` from this new branch. Do not modify Shorts or Final Assembly services. The existing long-form API key environment variable remains unchanged.
4. Import the associated numbered Make blueprint files from the private ZIP **as disabled copies**. They intentionally contain the existing credentials; do not commit them to GitHub.
5. Disable both async 5A and 5B before enabling original synchronous 5.
6. Test a fresh complete video: per-part word count, MP3 ID, clip+animation present, 30fps timings exact, Drive MP4 IDs, all-part count guard, editor approval, and last-stage assembly.
7. Only merge and activate on passing end-to-end Make test. Do not retroactively rewrite completed AX-LF-003 or incomplete AX-LF-004 workbooks.

The previous PR #10 is an obsolete async design and should not be merged. Its remote branch may remain temporarily for rollback of the currently deployed revision; closing that PR does not redeploy Cloud Run.
