# Long-form final assembly: private GCS staging -> Make -> personal My Drive

**Active architecture (October 2026).** This supersedes `DRIVE_OAUTH_SETUP.md`.
Do not use personal-user OAuth tokens for this pipeline.

## Scope and isolation

Only the **Final Assembly** Make scenario calls the new Cloud Run service:
`ax-longform-assembly`. The existing `ax-longform-render` service is not
reconfigured or deployed. No Shorts services are modified. All source code
continues to live in GitHub `omarshagouri/ax-longform`.

Flow:
1. Make selects video, collects all chapter file IDs and approvals.
2. Make sends `video_id`, `folder_id`, `chapters`,
   `thumbnail_file_id`, and `end_clip_file_id` to
   `ax-longform-assembly/assemble-video`.
3. The service concatenates the 1-second silent thumbnail, approved chapters
   in numeric order, and the end clip.
4. Instead of base64 or a My Drive API upload, the service uploads the final
   MP4 into a **private, dedicated Cloud Storage bucket** using its Cloud Run
   service account.
5. The service generates a **1-hour signed GET URL**, returning JSON containing
   `status`, `filename`, `size_bytes`, `download_url`,
   `download_expires_at` and `storage_object`.
6. Make `HTTP > Get a file` downloads the MP4 and the existing
   `Google Drive > Upload a file` module uploads it to the target
   `folder_id` in the user's personal My Drive.
7. Only after Drive upload succeeds does Make write the final Drive file ID
   into the tracking spreadsheets.

The bucket objects are automatically deleted after **7 days**, whether Make
completes or fails. The bucket is not public. The signed URL grants temporary
read access only to that specific object.

## One-time Cloud Shell setup and deployment

From the existing Cloud Shell `~/ax-longform` repository:

```bash
cd ~/ax-longform
git pull --ff-only origin main
bash video-service/scripts/setup-lf-assembly-gcs.sh
```

The script enables `storage.googleapis.com` and
`iamcredentials.googleapis.com`, creates a dedicated bucket
`ampcorex-lf-assembly-<PROJECT_NUMBER>`, sets a 7-day delete rule, grants
bucket-level object access to the existing long-form service identity, grants
that identity self-signing permission needed for signed URLs, and deploys
**only** `ax-longform-assembly` with the new environment settings.

It reuses the existing long-form API key without printing it.
The script prints the exact assembly endpoint once deployment succeeds. Copy
that URL into Make HTTP module 4 if it differs from the template.

## Make blueprint

Import `8_LF_Final_Assembly_GCS_TO_MY_DRIVE.blueprint.json`:

- Module 4 (HTTP POST) must target the new `ax-longform-assembly` URL.
- Module 12 (HTTP Get a file): URL `{{4.data.download_url}}`.
- Module 5 (Google Drive Upload a file): data `{{12.data}}`,
  filename `{{4.data.filename}}`, destination folder `{{1.\`5\`}}`.
- Downstream tracking IDs come from `{{5.id}}`, **not** the Cloud Run response.
- Existing chapter approval safeguards remain intact.

Importing a Make blueprint does not automatically replace an active Make scenario.
Confirm the correct connection for the Google Drive upload module and run it once
manually before enabling automation.

## Make plan limit

Make has maximum file sizes per plan (currently Free: 5 MB, Core: 100 MB,
Pro: 250 MB, Teams: 500 MB, Enterprise: 1000 MB; verify with your actual plan).
A final MP4 larger than the allowed Make file size will fail to transfer.
This implementation does **not** compress the video or bypass that limit.

## Troubleshooting

View errors from **the new service**, not the old chapter renderer:

```bash
gcloud logging read \
'resource.type="cloud_run_revision" AND resource.labels.service_name="ax-longform-assembly" AND logName="projects/ampcorex/logs/run.googleapis.com%2Fstderr"' \
--project=ampcorex --freshness=1h --limit=30 \
--format='value(timestamp,textPayload)'
```

- HTTP 401: Make's API key does not match the cloned service configuration.
- HTTP 503: missing assembly bucket environment config.
- HTTP 403 from Storage: missing bucket object access for runtime identity.
- IAM `signBlob` 403: runtime identity lacks Token Creator permission on itself.
- HTTP Get File 403: compare signed URL, expiry, IAM signing settings.
- Make file transfer fails: check file size limit and Drive connection.

No end-to-end production assembly has been executed as part of this code change.
