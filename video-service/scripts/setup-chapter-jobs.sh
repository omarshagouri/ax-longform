#!/usr/bin/env bash
# Configure ONLY asynchronous long-form chapter rendering.
set -euo pipefail
PROJECT=ampcorex
REGION=europe-west1
SERVICE=ax-longform-render
QUEUE=axlf-chapter-render
NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
BUCKET="ampcorex-lf-assembly-${NUMBER}"
RUNTIME_SA="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(spec.template.spec.serviceAccountName)')"
if [[ -z "$RUNTIME_SA" ]]; then RUNTIME_SA="${NUMBER}-compute@developer.gserviceaccount.com"; fi
SERVICE_URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')"
if [[ -z "$SERVICE_URL" ]]; then echo 'Cannot determine Cloud Run service URL' >&2; exit 1; fi
if [[ ! -f ./video-service/server/chapter-jobs.mjs ]]; then echo 'Run from the updated ax-longform repo root' >&2; exit 1; fi

echo "Configuring Cloud Tasks and private chapter storage in $PROJECT/$REGION"
gcloud services enable cloudtasks.googleapis.com storage.googleapis.com iamcredentials.googleapis.com --project "$PROJECT"
if ! gcloud tasks queues describe "$QUEUE" --location="$REGION" --project="$PROJECT" >/dev/null 2>&1; then
 gcloud tasks queues create "$QUEUE" --location="$REGION" --project="$PROJECT" --max-concurrent-dispatches=1 --max-attempts=3
fi
if ! gcloud storage buckets describe "gs://$BUCKET" --project="$PROJECT" >/dev/null 2>&1; then
 gcloud storage buckets create "gs://$BUCKET" --project="$PROJECT" --location="$REGION" --uniform-bucket-level-access
fi
LIFECYCLE_FILE="$(mktemp)"; trap 'rm -f "$LIFECYCLE_FILE"' EXIT
printf '%s\n' '{"rule":[{"action":{"type":"Delete"},"condition":{"age":7}}]}' > "$LIFECYCLE_FILE"
gcloud storage buckets update "gs://$BUCKET" --lifecycle-file="$LIFECYCLE_FILE"
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET" --member="serviceAccount:$RUNTIME_SA" --role=roles/storage.objectAdmin
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --project="$PROJECT" --member="serviceAccount:$RUNTIME_SA" --role=roles/iam.serviceAccountTokenCreator
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$RUNTIME_SA" --role=roles/cloudtasks.enqueuer --condition=None >/dev/null

echo "Deploying ONLY $SERVICE; existing LONGFORM_RENDER_API_KEY is preserved."
gcloud run deploy "$SERVICE" --source ./video-service --project="$PROJECT" --region="$REGION" \
  --cpu=4 --memory=8Gi --timeout=900 --service-account="$RUNTIME_SA" \
  --update-env-vars="AXLF_ASSEMBLY_GCS_BUCKET=$BUCKET,AXLF_RENDER_PROJECT=$PROJECT,AXLF_RENDER_REGION=$REGION,AXLF_RENDER_TASK_QUEUE=$QUEUE,AXLF_RENDER_WORKER_URL=$SERVICE_URL/render-chapter-worker,AXLF_SIGNER_SERVICE_ACCOUNT_EMAIL=$RUNTIME_SA"
echo "Submit endpoint: $SERVICE_URL/render-chapter-submit"
echo "Status endpoint: $SERVICE_URL/render-chapter-status"
echo 'Do not enable Make schedules before one end-to-end test.'
