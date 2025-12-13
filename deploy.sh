#!/usr/bin/env bash
set -euo pipefail

# Deployment script (run as app user). Assumes repository already cloned to APP_DIR.
APP_DIR=${APP_DIR:-/opt/erpwhatsapp}
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
BRANCH=${BRANCH:-main}

log() { echo "[+] $*"; }
fail() { echo "[!] $*" >&2; exit 1; }

if [[ ! -d "$APP_DIR/.git" ]]; then
  fail "Repository not found at $APP_DIR"
fi

cd "$APP_DIR"

log "Fetching latest code ($BRANCH)"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

log "Installing backend dependencies"
cd "$BACKEND_DIR"
npm install --production=false

log "Installing frontend dependencies"
cd "$FRONTEND_DIR"
npm install

log "Building frontend"
npm run build

log "Restarting backend via PM2"
cd "$BACKEND_DIR"
pm2 startOrReload "$APP_DIR/ecosystem.config.js"
pm2 save

log "Reloading Nginx"
sudo systemctl reload nginx

log "Deployment complete"
