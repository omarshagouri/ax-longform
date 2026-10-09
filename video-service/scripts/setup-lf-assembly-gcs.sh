#!/usr/bin/env bash
# Configure ONLY the dedicated AmpCoreX long-form final-assembly service.
# Existing ax-longform-render and every Shorts service are left untouched.
set -euo pipefail

PROJECT="ampcorex"
REGION="europe-west1"
SOURCE_SERVICE="ax-longform-render"
ASSEMBLY_SERVICE="ax-longform-assembly"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
BUCKET="ampcorex-lf-assembly-${PROJECT_NUMBER}"

echo "Project: $PROJECT | Dedicated staging bucket: gs://$BUCKET"
gcloud config set project "$PROJECT" >/dev/null
gcloud services enable storage.googleapis.com iamcredentials.googleapis.com --project="$PROJECT"

# Reuse the existing long-form runtime identity, which can already read the videos
# from the existing Drive folder. Do not change that service's deployment.
RUNTIME_SA="$(gcloud run services describe "$SOURCE_SERVICE" --project="$PROJECT" \
  --region="$REGION" --format='value(spec.template.spec.serviceAccountName)')"
if [[ -z "$RUNTIME_SA" ]]; then
  RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi
echo "Long-form service identity: $RUNTIME_SA"

# Reuse the existing HTTP API key without displaying or writing it to disk.
# The source service uses an environment value; if it is a secret reference,
# fetch it from Secret Manager instead.
SOURCE_CONFIG="$(gcloud run services describe "$SOURCE_SERVICE" --project="$PROJECT" \
  --region="$REGION" --format=json)"
API_KEY="$(printf '%s' "$SOURCE_CONFIG" | python3 -c '
import json,sys
s=json.load(sys.stdin)
env=s.get("spec",{}).get("template",{}).get("spec",{}).get("containers",[{}])[0].get("env",[])
for x in env:
 if x.get("name")=="LONGFORM_RENDER_API_KEY":
  print(x.get("value",""))
  break
')"
if [[ -z "$API_KEY" ]]; then
  echo "ERROR: Cannot copy the existing LONGFORM_RENDER_API_KEY environment value. No services were deployed." >&2
  exit 1
fi
unset SOURCE_CONFIG

if ! gcloud storage buckets describe "gs://$BUCKET" --project="$PROJECT" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --project="$PROJECT" \
    --location="$REGION" --uniform-bucket-level-access
fi

# Use this bucket exclusively for temporary assembly files. Delete after 7 days,
# even if a Make run fails before it can transfer the video.
LIFECYCLE_FILE="$(mktemp)"
trap 'rm -f "$LIFECYCLE_FILE"' EXIT
cat > "$LIFECYCLE_FILE" <<'JSON'
{"rule":[{"action":{"type":"Delete"},"condition":{"age":7}}]}
JSON
gcloud storage buckets update "gs://$BUCKET" --lifecycle-file="$LIFECYCLE_FILE"

# Bucket-level permission only: do not grant broad project-wide Storage Admin.
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$RUNTIME_SA" --role="roles/storage.objectAdmin"

# Needed only to sign temporary, private, read-only GCS download links.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --project="$PROJECT" --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/iam.serviceAccountTokenCreator"

# Safety checks: run from the repository root and use this exact source tree.
if [[ ! -f "./video-service/server/assembly-gcs.mjs" ]]; then
  echo "ERROR: Run from the latest ax-longform GitHub repository root." >&2
  exit 1
fi

echo "Deploying ONLY $ASSEMBLY_SERVICE — not $SOURCE_SERVICE..."
gcloud run deploy "$ASSEMBLY_SERVICE" \
  --source ./video-service \
  --project "$PROJECT" --region "$REGION" \
  --service-account "$RUNTIME_SA" \
  --cpu=4 --memory=8Gi --timeout=900 \
  --allow-unauthenticated \
  --set-env-vars="LONGFORM_RENDER_API_KEY=$API_KEY,AXLF_ASSEMBLY_GCS_BUCKET=$BUCKET,AXLF_SIGNER_SERVICE_ACCOUNT_EMAIL=$RUNTIME_SA"

# Avoid echoing the credential even in shell trace/output.
unset API_KEY
SERVICE_URL="$(gcloud run services describe "$ASSEMBLY_SERVICE" \
  --project="$PROJECT" --region="$REGION" --format='value(status.url)')"
echo
echo "SUCCESS: Deployed separate LF final assembly service."
echo "Make Module 4 URL must be: $SERVICE_URL/assemble-video"
echo "Existing $SOURCE_SERVICE was NOT redeployed."
