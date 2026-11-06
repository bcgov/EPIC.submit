#!/usr/bin/env bash
# GitHub-hosted Ubuntu runner entry point; every run owns a fresh Compose project.
set -euo pipefail
cd "$(dirname "$0")/../.."
source ci/e2e/versions.env
export COMPOSE_PROJECT_NAME="submit-e2e-${GITHUB_RUN_ID:-pilot}-${GITHUB_RUN_ATTEMPT:-1}"
compose=(docker compose -f ci/e2e/compose.yml)
mkdir -p .e2e-deps .e2e-runtime/certs e2e-artifacts
cleanup() {
  result=$?
  trap - EXIT
  "${compose[@]}" logs --no-color > e2e-artifacts/services.log 2>&1 || true
  "${compose[@]}" ps -a > e2e-artifacts/services.txt 2>&1 || true
  "${compose[@]}" exec -T fakes python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8090/messages').read().decode())" > e2e-artifacts/emails.json 2>/dev/null || true
  "${compose[@]}" down --volumes --remove-orphans || true
  exit "$result"
}
trap cleanup EXIT
checkout_dependency() {
  local repository=$1 revision=$2 target=$3
  if [[ ! -d "$target/.git" ]]; then git init "$target"; fi
  git -C "$target" fetch --depth=1 "https://github.com/bcgov/$repository.git" "$revision"
  git -C "$target" checkout --detach FETCH_HEAD
  test "$(git -C "$target" rev-parse HEAD)" = "$revision"
}
checkout_dependency EPIC.common "$COMMON_REF" .e2e-deps/common
checkout_dependency EPIC.document "$DOCUMENT_REF" .e2e-deps/document
openssl req -x509 -nodes -newkey rsa:2048 -days 2 \
  -keyout .e2e-runtime/certs/private.key -out .e2e-runtime/certs/public.crt \
  -subj '/CN=storage' -addext 'subjectAltName=DNS:storage' 2>/dev/null
chmod 644 .e2e-runtime/certs/*
# Build with network access, then run on an internal network with no external services.
"${compose[@]}" --profile test build
"${compose[@]}" --profile test pull --ignore-buildable
"${compose[@]}" up --detach --wait --wait-timeout 360
"${compose[@]}" run --rm tests
# Capture is observed before the worker commits SENT; allow that transaction to finish.
for attempt in $(seq 1 15); do
  state=$("${compose[@]}" exec -T db psql -U e2e -d submit_e2e -Atc "SELECT count(*) = 5 AND bool_and(status = 'SENT') FROM email_queue")
  if [[ "$state" == t ]]; then exit 0; fi
  sleep 1
done
echo 'Expected all five workflow emails to be marked SENT' >&2
exit 1
