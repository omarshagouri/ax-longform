# Dashboard slot preview

A single fixed-order, image-backed 1920x1080 Remotion visual. This repository contains **no branded background image** or private credentials.

## Make / Cloud Run test

Deploy the updated `video-service` to the existing video-render service. Then POST to `/render-dashboard` using the existing `x-api-key` header and `Content-Type: application/json`. Use the body in [examples/dashboard.json](examples/dashboard.json), replacing `background_file_id` with the Google Drive ID of your **empty** PNG/JPEG background (the renderer service account must have read access).

Alternatively send `background_base64` (raw base64, or a PNG/JPEG data URL) instead of `background_file_id`. Keep the image off the public repository.

Response fields: `status`, `template_id`, `filename`, `file_base64`, `duration_frames`, `fps`, `width`, `height`. In Make, decode `file_base64` to binary and upload `filename` to Drive.

The component is also registered as `VA-LF-014` and can appear in a normal visual timeline. For that path, pass `values.backgroundFileId` to use the existing renderer's private Drive background loader. The existing `/render-chapter` endpoint still requires narration/audio and its native visual-mix requirements.

## Fixed slot sequence

Title -> subtitle -> optional large value -> animated progress -> detail -> status.

Options: `title` (required, <=22), `subtitle` (<=36), `mainValue` (<=12), `mainUnit` (<=10), `progress` (0–100), `detail` (<=38), `status` (<=24), `duration_sec` (3–15 at 30 fps). All slot positions are local to the empty center screen. Text and figures baked into the background's other panels are **not editable** in this template.

## Local checks

```sh
cd video-service
npm ci
npm run typecheck
```

Preview composition: `AXDashboardPreview`; production visual ID: `VA-LF-014`.
