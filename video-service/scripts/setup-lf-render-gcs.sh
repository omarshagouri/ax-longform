#!/usr/bin/env bash
# AmpCoreX: provision private, temporary GCS delivery only for the long-form
# paired-qa renderer. Run from the repository root of the tested Git commit.
# This script does not move normal production traffic or modify Shorts.
set -euo pipefail

PROJECT="ampcorex"
REGION="europe-west1"
SERVICE="ax-longform-render"
if [[ ! -f "./video-service/server/render-delivery.mjs" ]]; then
  echo "ERROR: Run from the checked-out ax-longform repository root containing server/render-delivery.mjs." >&2
  exit 1
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format="value(projectNumber)")"
BUCKET="ampcorex-lf-renders-${PROJECT_NUMBER}"
gcloud services enable storage.googleapis.com iamcredentials.googleapis.com --project="$PROJECT"

RUNTIME_SA="$(gcloud run services describe "$SERVICE" --project="$PROJECT" --region="$REGION" \
  --format='value(spec.template.spec.serviceAccountName)')"
if [[ -z "$RUNTIME_SA" ]]; then
  RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi
echo "LF service identity: $RUNTIME_SA"
echo "Private output bucket: gs://$BUCKET"

if ! gcloud storage buckets describe "gs://$BUCKET" --project="$PROJECT" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$BUCKET" --project="$PROJECT" \
    --location="$REGION" --uniform-bucket-level-access
fi

LIFECYCLE_FILE="$(mktemp)"
trap 'rm -f "$LIFECYCLE_FILE"' EXIT
cat > "$LIFECYCLE_FILE" <<'JSON'
{"rule":[{"action":{"type":"Delete"},"condition":{"age":7}}]}
JSON
gcloud storage buckets update "gs://$BUCKET" --lifecycle-file="$LIFECYCLE_FILE"

# Object-level access inside this one private bucket; no project-wide Storage Admin.
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" \
  --member="serviceAccount:$RUNTIME_SA" --role="roles/storage.objectAdmin"

# Needed for 1-hour V4 signed URL generation via IAM signBlob.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --project="$PROJECT" --member="serviceAccount:$RUNTIME_SA" \
  --role="roles/iam.serviceAccountTokenCreator"

echo "Deploying paired-qa only; live production revision traffic will remain unchanged."
gcloud run deploy "$SERVICE" \
  --source ./video-service \
  --project="$PROJECT" \
  --region="$REGION" \
  --no-traffic \
  --tag paired-qa \
  --update-env-vars="AXLF_RENDER_GCS_BUCKET=$BUCKET,AXLF_SIGNER_SERVICE_ACCOUNT_EMAIL=$RUNTIME_SA"

gcloud run services describe "$SERVICE" \
  --project="$PROJECT" --region="$REGION" \
  --format="yaml(status.latestReadyRevisionName,status.traffic)"
echo "READY: paired-qa endpoint remains https://paired-qa---ax-longform-render-e3ahsi7uaa-ew.a.run.app"
echo 'NEXT: Add "delivery":"gcs" to the Make render-chapter-part JSON; map download_url to HTTP Get a file and then Google Drive upload.'
