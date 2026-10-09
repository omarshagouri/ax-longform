# AmpCoreX LF assembly: upload final MP4 to personal Google My Drive

> **DEPRECATED — DO NOT FOLLOW FOR CURRENT LF ASSEMBLY.** The active workflow uses private Cloud Storage staging and your existing Make Google Drive connection. See [FINAL_ASSEMBLY_GCS_SETUP.md](FINAL_ASSEMBLY_GCS_SETUP.md). No personal Drive OAuth credentials are required.\n\n## Why this is necessary

Cloud Run's service account can download source chapters, but a service account has no
personal My Drive storage quota. The assembly upload uses an OAuth 2.0 refresh token
belonging to the Google account that owns the target Drive folder.

The final assembly still returns `file_id` and `filename` to the existing Make
`8 LF Final Assembly` scenario. No MP4 data is returned over HTTP.

## 1. Create a user OAuth credential once (do this in your browser)

1. In Google Cloud project `ampcorex`, open Google Auth Platform
   https://console.cloud.google.com/auth/overview?project=ampcorex
2. Configure the consent screen if needed. For a personal Google account, select
   an **External** audience. Add that account as a test user if Testing.
3. For long-lived automation, the OAuth app should be **In production** when
   appropriate. External apps left in Testing normally issue refresh tokens that
   expire after 7 days when requesting Google Drive scopes.
4. Create an OAuth **Web application** client at
   https://console.cloud.google.com/auth/clients?project=ampcorex
   and add this Authorized redirect URI:
   `https://developers.google.com/oauthplayground`
5. Open https://developers.google.com/oauthplayground/
   - Gear icon > **Use your own OAuth credentials**, paste client ID and client
     secret from the web application client.
   - Ensure access type = **Offline**.
   - Under "Input your own scopes" enter:
     `https://www.googleapis.com/auth/drive`
   - **Authorize APIs** and select the Google account that owns your AmpCoreX
     My Drive folder. Then **Exchange authorization code for tokens**.
   - Copy the **refresh token**. Treat it and your client secret as passwords.
   - Do NOT paste those credentials into chat, GitHub, Make, or issue logs.

**Note:** The full Drive scope is powerful: it authorizes this app to access
Google Drive files under the account. Only authorize a project you control.

## 2. Save one OAuth JSON secret in Google Cloud Secret Manager

In Google Cloud Shell, run:

```bash
gcloud services enable secretmanager.googleapis.com --project=ampcorex
umask 077
nano "$HOME/axlf-drive-oauth.json"
```

Paste **your own** values into the file:

```json
{
  "client_id": "YOUR_WEB_OAUTH_CLIENT_ID",
  "client_secret": "YOUR_WEB_OAUTH_CLIENT_SECRET",
  "refresh_token": "YOUR_GOOGLE_USER_REFRESH_TOKEN"
}
```

Back in Cloud Shell:

```bash
if gcloud secrets describe axlf-drive-oauth --project=ampcorex >/dev/null 2>&1; then
  gcloud secrets versions add axlf-drive-oauth --project=ampcorex \
    --data-file="$HOME/axlf-drive-oauth.json"
else
  gcloud secrets create axlf-drive-oauth --project=ampcorex \
    --replication-policy=automatic \
    --data-file="$HOME/axlf-drive-oauth.json"
fi
rm -f "$HOME/axlf-drive-oauth.json"
```

## 3. Allow the Cloud Run runtime account to read this secret

```bash
RUN_SA=$(gcloud run services describe ax-longform-render \
  --project=ampcorex --region=europe-west1 \
  --format='value(spec.template.spec.serviceAccountName)')
if [ -z "$RUN_SA" ]; then
  PROJECT_NO=$(gcloud projects describe ampcorex --format='value(projectNumber)')
  RUN_SA="${PROJECT_NO}-compute@developer.gserviceaccount.com"
fi
gcloud secrets add-iam-policy-binding axlf-drive-oauth \
  --project=ampcorex \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

## 4. Deploy GitHub code with the secret reference

From the `ax-longform` repository root in Cloud Shell:

```bash
git pull --ff-only origin main
gcloud run deploy ax-longform-render \
  --source ./video-service \
  --project=ampcorex \
  --region=europe-west1 \
  --cpu=4 --memory=8Gi --timeout=900 \
  --update-secrets=AXLF_DRIVE_OAUTH_JSON=axlf-drive-oauth:latest
```

Do not pass the credentials as literal environment variables or commit them.
The GitHub repository contains only code and these setup instructions.

## 5. Test

Run `8 LF Final Assembly` in Make with:
- `folder_id` set to the target personal My Drive folder ID
- `thumbnail_file_id` and `end_clip_file_id` set to their actual Drive IDs
- every chapter `review_status` set to `Approved`

Success: the response includes `status: ok`, `file_id`, `filename`,
`drive_url`; Make updates the `Covered` and `Rendered` tabs.

If it fails, query Cloud Run stderr:

```bash
gcloud logging read \
'resource.type="cloud_run_revision" AND resource.labels.service_name="ax-longform-render" AND logName="projects/ampcorex/logs/run.googleapis.com%2Fstderr"' \
--project=ampcorex --freshness=1h --limit=25 \
--format='value(timestamp,textPayload)'
```

Do not send OAuth client secrets, refresh tokens, or a complete secret value.
