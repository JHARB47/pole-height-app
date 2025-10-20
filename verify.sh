#!/usr/bin/env bash
# verify.sh - Project integrity and CI/CD preflight script for PolePlan Pro
# AI: rationale — Automates all quality gates and environment checks for local and CI/CD use.

set -euo pipefail

# 1. Node version check
if ! command -v node >/dev/null 2>&1; then
  echo "[ERROR] Node.js is not installed." >&2
  exit 1
fi
NODE_VERSION=$(node -v)
REQUIRED_NODE="v22.20.0"
if [ "$NODE_VERSION" != "$REQUIRED_NODE" ]; then
  echo "[ERROR] Node.js version $REQUIRED_NODE required, found $NODE_VERSION" >&2
  exit 1
fi

# 2. NPM version check
if ! command -v npm >/dev/null 2>&1; then
  echo "[ERROR] npm is not installed." >&2
  exit 1
fi
NPM_VERSION=$(npm -v)
REQUIRED_NPM="10.0.0"
if [[ "$(printf '%s\n' "$REQUIRED_NPM" "$NPM_VERSION" | sort -V | head -n1)" != "$REQUIRED_NPM" ]]; then
  echo "[ERROR] npm >= $REQUIRED_NPM required, found $NPM_VERSION" >&2
  exit 1
fi

# 3. Dependency install check
if [ ! -d node_modules ]; then
  echo "[INFO] Installing dependencies..."
  npm ci
fi

# 4. Lint
npm run lint

# 5. Format check
npm run format:check || {
  echo "[ERROR] Code is not formatted. Run 'npm run format' to fix." >&2
  exit 1
}

# 6. Build
npm run build

# 7. Test (with coverage)
npm run test:coverage

# 8. Bundle size check
npm run verify || {
  echo "[ERROR] Bundle verification failed." >&2
  exit 1
}

# 9. DB connection check (Neon/Postgres)
if [ -f ./server/test-db-connection.js ]; then
  echo "[INFO] Checking database connection..."
  node ./server/test-db-connection.js || {
    echo "[ERROR] Database connection failed." >&2
    exit 1
  }
fi

# 10. Netlify config check
if [ -f netlify.toml ]; then
  echo "[INFO] Checking Netlify configuration..."
  grep -q 'node_version = "22.20.0"' netlify.toml || {
    echo "[ERROR] Netlify config missing correct node version." >&2
    exit 1
  }
fi

echo "[SUCCESS] All verification steps passed."
