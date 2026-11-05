#!/usr/bin/env bash
set -euo pipefail

PROJECT="ampcorex"
REGION="europe-west1"
SERVICE="ax-longform-render"
TAG="va009-qa-v3"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
node --test video-service/server/va009-contract.test.mjs
node --check video-service/server/va009-visual-qa.mjs
COMMIT="$(git rev-parse HEAD)"
SOURCE_SHA="$(sha256sum video-service/Animations/continuous.tsx | awk '{print $1}')"

# Docker renders real VA009 frames and fails if any node is missing.
# Keep the new revision out of production until its identity is verified.
gcloud run deploy "$SERVICE" --source ./video-service \
  --project "$PROJECT" --region "$REGION" \
  --update-env-vars "AX_LF_BUILD_SHA=$COMMIT" \
  --no-traffic --tag "$TAG" --quiet

INFO="$(mktemp)"
gcloud run services describe "$SERVICE" \
  --project "$PROJECT" --region "$REGION" --format=json > "$INFO"

readarray -t ADDRESSES < <(python3 - "$INFO" "$TAG" <<'PY'
import json,sys
with open(sys.argv[1],encoding="utf-8") as f: j=json.load(f)
entry=next((t for t in j.get("status",{}).get("traffic",[]) if t.get("tag")==sys.argv[2]),None)
if not entry or not entry.get("url") or not entry.get("revisionName"):
    raise SystemExit("QA-tagged revision unavailable; production unchanged")
print(entry["url"])
print(entry["revisionName"])
print(j["status"]["url"])
PY
)
QA_URL="${ADDRESSES[0]}"
REVISION="${ADDRESSES[1]}"
PROD_URL="${ADDRESSES[2]}"

get_version() {
  local url="$1" output="$2"
  if ! curl -fsS --max-time 30 "${url}/render-version" -o "$output"; then
    local token
    token="$(gcloud auth print-identity-token)"
    curl -fsS --max-time 30 -H "Authorization: Bearer ${token}" \
      "${url}/render-version" -o "$output"
  fi
}
verify() {
  python3 - "$COMMIT" "$SOURCE_SHA" "$1" <<'PY'
import json,sys
commit,digest,p=sys.argv[1:]
with open(p,encoding="utf-8") as f: got=json.load(f)
assert got.get("contract")=="VA009_TOPOLOGY_FIRST_V3",got
assert got.get("build_commit")==commit,"Wrong renderer Git commit"
assert got.get("animation_source_sha256")==digest,"Wrong animation source"
print("PASS: VA009 V3 code and source fingerprint verified")
PY
}
OUT="$(mktemp)"
get_version "$QA_URL" "$OUT"
verify "$OUT"

# Promote ONLY the revision that passed checks, never a moving latest.
gcloud run services update-traffic "$SERVICE" \
  --project "$PROJECT" --region "$REGION" \
  --to-revisions "${REVISION}=100" --quiet
get_version "$PROD_URL" "$OUT"
verify "$OUT"
echo "PRODUCTION REVISION: $REVISION"
echo "MAKE MODULES 5 AND 7: ${PROD_URL}/render-chapter-part"
echo "Existing MP4s are unchanged. Render a new chapter part to see the fix."
