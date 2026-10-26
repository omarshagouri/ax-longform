# AmpCoreX coherent long-form chapters and two narrated render parts
Updated 2026-10-26. This supersedes the old 1A/1B pseudo-chapter and 3-second-only VV-LF assumptions. Final Assembly is intentionally outside this document.

## Live flow
Script Agent creates 5–7 coherent *narrative chapters*, one full narration and original MP3 per chapter. Visual Planning creates one continuous timeline per chapter. Renderer 5 splits each at a safe existing beat boundary into **two independently narrated finished MP4s** (each <=55s), and stores both Drive IDs in the chapter row. Do not join in Renderer 5, do not duplicate or re-record narration, do not add new title card at Part2, and do not modify Final Assembly yet.

## Live catalog contract
Visual Agent must read all actual live tabs of the AmpCoreX visual catalog (`Cards`, `Animations`, `Clips`) fresh. `Backgrounds` was deleted. Every chapter begins with 2.000s of `VC-LF-018` using its exact chapter title. Select exactly **two relevant Ready VV-LF clips** from live Clips tab per coherent chapter, one for each render part.

**VV-LF IDs reference real Drive MP4 footage.** The live Clips tab fields `Visual_id`, `Clip_name`, `File_ID`, `Duration_sec` (or explicit maximum) define footage identity and timing. These override the obsolete four synthetic-native VV-LF ID meanings. For each footage beat, `card_id=Visual_id`; `values` JSON contains the current `file_id`, `clip_name`, and `max_duration_sec` copied verbatim from the same catalog row. Renderer 5 fetches that exact Drive file and verifies playable duration via ffprobe. A fallback Sheets lookup by visual ID / filename exists for absent explicit file IDs, subject to service account permission. There is **no universal fixed footage duration**. Different aspect ratios are fit safely. No silent replacement with synthetic animation is allowed.

Cards and animations obey their live per-asset maximum seconds. Never let any screen remain effectively static for >3 seconds. Visual plan must match original MP3 in exact integer 30fps frames. One complete, meaningful VA-LF animation per chapter at minimum; aim for one per part. Two clips per chapter take priority over a forced footage percentage.

## Make and rollout
Current Make Scenario 5 V3 calls `/render-chapter-part` for parts 1 and 2 with `audio_mode:segment`, uploads both MP4s, and records P1/P2 IDs and filenames. No blueprint change is needed to transmit `values.file_id` because Make already sends the entire JSON object. Deploy the current `feature/catalog-vv-drive-clips-20261026` branch to the zero-traffic `paired-qa` tag and check API/service permissions. Deploying service code does not rerender existing outputs or advance pipeline state. The renderer build runs dynamic clip resolver regression tests. The 