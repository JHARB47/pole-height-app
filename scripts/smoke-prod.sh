#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <base_url>"
  exit 2
fi

BASE_URL="${1%/}"

ENDPOINTS=(
  "/health"
  "/api/health"
  "/api/diagnostics/health"
  "/api/diagnostics/system"
)

failures=0

check_endpoint() {
  local path="$1"
  local url="${BASE_URL}${path}"
  local status
  local body

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
  body=$(curl -s "$url" || true)

  if [[ "$status" == "200" && ("$body" == *"{"* || "$body" == *"["* ) ]]; then
    echo "PASS $path (200 + JSON)"
  else
    echo "FAIL $path (status=${status})"
    failures=$((failures + 1))
  fi
}

for endpoint in "${ENDPOINTS[@]}"; do
  check_endpoint "$endpoint"
 done

if [[ $failures -gt 0 ]]; then
  echo "Smoke check failed: ${failures} endpoint(s)"
  exit 1
fi

echo "Smoke check passed"
