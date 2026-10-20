# Dashboard slot preview

Fixed-order 1920×1080 Remotion visual using the bundled image at `public/dashboard-bg.png`.

## Make test

Deploy the latest video service and POST JSON from [examples/dashboard.json](examples/dashboard.json) to `/render-dashboard`. Use the existing `x-api-key` header and `Content-Type: application/json`.

No Google Drive image ID or image bytes are needed. For compatibility with older Make requests, `background_file_id` is ignored by this endpoint.

Response: `status`, `template_id`, `filename`, `file_base64`, `duration_frames`, `fps`, `width`, `height`. In Make, decode `file_base64` from base64 into binary and upload as `filename`.

The component is also registered as `VA-LF-014` in the long-form timeline and defaults to the same bundled background. Other existing visuals still support separate backgrounds where applicable.

## Fixed slot sequence

Title → subtitle → optional large value → progress → detail → status.

Fields: `title` (required, ≤22), `subtitle` (≤36), `mainValue` (≤12), `mainUnit` (≤10), `progress` (0–100), `detail` (≤38), `status` (≤24), and `duration_sec` (3–15).

The other dashboard readouts are baked into the PNG and are not editable.

## Local verification

```sh
cd video-service
npm ci
npm run typecheck
npx remotion render AXDashboardPreview out/dashboard-smoke.mp4
```

The dashboard asset is included in this public repository at the owner's request. Don't add secrets or private data to the asset.
