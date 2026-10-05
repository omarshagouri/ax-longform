# Deploy — long-form only

These commands create NEW Cloud Run services. They do not update the Shorts services.

## 1. Card Lab — deploy this first

From the repo root:

```bash
cd card-service

gcloud run deploy ax-longform-card \
  --source . \
  --project ampcorex \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars GH_USER=omarshagouri,GH_REPO=ax-longform,GH_BRANCH=main,CARDS_DIR=video-service/Cards \
  --set-env-vars LONGFORM_RENDER_API_KEY=REPLACE_ME,GITHUB_TOKEN=REPLACE_ME
```

If the GitHub repo is public, `GITHUB_TOKEN` can be omitted.

Then point the existing Card Builder HTTP module to the NEW service URL and keep using:

`POST /render-beat`

Header:

`x-api-key: <LONGFORM_RENDER_API_KEY>`

Example body:

```json
{
  "video_id": "AX-LF-TEST-001",
  "beat": 1,
  "card_id": "VC-LF-001",
  "duration": 3,
  "values": {
    "KICKER": "BATTERY HEALTH",
    "NUM": "87",
    "PCT": "%"
  }
}
```

Expected output: 1920x1080 MP4.

## 2. Video renderer — later, after cards are locked

```bash
cd ../video-service

gcloud run deploy ax-longform-video \
  --source . \
  --project ampcorex \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 4 \
  --timeout 900 \
  --service-account ax-render@ampcorex.iam.gserviceaccount.com \
  --set-env-vars LONGFORM_RENDER_API_KEY=REPLACE_ME
```

Do not reuse a Shorts service name in either command.
