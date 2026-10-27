# Long-form renderer → Make: bounded MP4 delivery

The previous `file_base64` response can exceed Cloud Run's non-streamed HTTP response limit. A more dynamic video may cross that limit even if the exact same chapter was small enough before.

## Paired-qa rollout (safe)

Run `bash video-service/scripts/setup-lf-render-gcs.sh` from the checked-out source root **only after CI passes**. The script provisions a private 7-day lifecycle bucket, grants access only to the existing LF service identity, enables V4 signed downloads, and deploys a `paired-qa` tagged revision at 0% of untagged production traffic. It does not modify Make, Shorts, or the normal revision's traffic.

## API contract

Existing `/render-chapter-part`, `/render-chapter`, `/render-video`, and `/join-chapter` accept one optional request-body field:

```json
"delivery": "gcs"
```

When omitted, `delivery` defaults to `"inline"` to preserve existing Make mappings until migration. **Do not use inline for long MP4s.** GCS mode requires `AXLF_RENDER_GCS_BUCKET`, falling back to `AXLF_ASSEMBLY_GCS_BUCKET`, and service account ability to create objects and sign download URLs.

Example successful `/render-chapter-part` response (other existing split/audio fields remain):

```json
{
  "status": "ok",
  "phase": "completed",
  "job_id": "generated-uuid",
  "video_id": "AX-LF-006_CH5",
  "part": 1,
  "audio_mode": "silent",
  "split_frame": 750,
  "total_frames": 1555,
  "part_frames": 750,
  "delivery": "gcs",
  "filename": "AX-LF-006_CH5_P1.mp4",
  "content_type": "video/mp4",
  "size_bytes": 38000000,
  "storage_bucket": "example-private-bucket",
  "storage_object": "chapter-renders/AX-LF-006_CH5_P1/.../AX-LF-006_CH5_P1.mp4",
  "download_url": "https://storage.googleapis.com/...signed...",
  "download_expires_at": "2026-10-27T14:00:00.000Z"
}
```

Example values above are illustrative, not actual output. A completed response means **render succeeded, Cloud Storage upload succeeded, and a private signed download URL exists**. It is a small JSON response with no `file_base64`. All render requests write structured phase logs keyed by `job_id`.

Error responses are small, with `status: "error"`, `phase: "failed"`, `job_id`, and `error`. Misconfigured GCS delivery fails with **HTTP 503 before fetching clips or rendering**. No response after a transport drop is *unknown*, not success; do not blindly re-run expensive parts without checking logs.

## Minimal Make changes (after paired-qa deployment)

For each **render-chapter-part** module, and for `join-chapter` if used:

1. Keep the original `paired-qa` URL, X-API-Key header and all original request values. Add `"delivery":"gcs"` as an additional top-level JSON field.
2. Add an error route/filter: continue only when HTTP = 200, `status` = `ok`, `phase` = `completed`, `delivery` = `gcs`, and `download_url` exists.
3. In Make **HTTP → Get a file**, use the `download_url` supplied by that exact completed render. It is a temporary signed link; **do not** use a public bucket or extra Authorization header.
4. In **Google Drive → Upload a file**, map the file's binary Data from Get a file and map `filename` from the render response. Record the resulting Drive File ID exactly where the old Base64 upload's File ID was used. This preserves downstream part metadata and the paired join logic.
5. Do not decode `file_base64` on this path (it is intentionally absent).

Keep the `job_id`, `part`, `split_frame`, `total_frames` and uploaded Drive File ID in Make run history for reliable recovery. Never log or publish `download_url` outside the private Make run; it grants temporary read access and expires in one hour. The GCS bucket deletes objects after seven days.

## Scope: full-chapter rendering is a later step

The above is still a **synchronous** render request: Make receives the final response only after render + upload. This solves the oversized HTTP response, but it does not solve upstream HTTP request timeouts for very long chapters.

Before switching Make to one long full-chapter request, implement a **durable, asynchronous job protocol**: POST starts the job and returns `202 + job_id` immediately; a Cloud Run Job or other durable worker does the render; state is persisted outside the HTTP container; Make polls `GET /render-jobs/:job_id` for `queued/running/completed/failed` and only downloads when `completed`. Never rely on detached work inside a Cloud Run request handler; that could stop when the request ends. This is intentionally not part of the paired-qa delivery fix.
