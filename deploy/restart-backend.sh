#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT="${SCRIPT_DIR%/deploy}"
cd "$PROJECT_ROOT"

echo "[deploy] Using PM2 ecosystem config"
pm2 startOrReload ecosystem.config.js --env production

echo "[deploy] Waiting for health check..."
for i in {1..5}; do
  if curl -fsS http://127.0.0.1:5001/api/health >/dev/null; then
    echo "[deploy] Health check passed"
    exit 0
  fi
  echo "[deploy] Health check attempt $i failed; retrying in 3s" >&2
  sleep 3
 done

echo "[deploy] Service did not become healthy" >&2
exit 1
