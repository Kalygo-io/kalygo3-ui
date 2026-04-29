#!/usr/bin/env bash
#
# Fetches the OpenAPI JSON from the running AI API and saves to public/openapi/.
# Usage: npm run export-openapi
#
# Prerequisites: docker compose services must be running
#   docker compose -f docker-compose.dev.yml up

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../public/openapi"
mkdir -p "$OUT_DIR"

AI_API_URL="${AI_API_URL:-http://localhost:4000}"

printf "Fetching AI API spec from %s/openapi.json ... " "$AI_API_URL"
if curl -sf "$AI_API_URL/openapi.json" -o "$OUT_DIR/ai-api.json"; then
  echo "OK"
else
  echo "FAILED (is the AI API running?)"
  exit 1
fi

echo ""
echo "Spec saved to public/openapi/ai-api.json"
ls -la "$OUT_DIR/ai-api.json"
