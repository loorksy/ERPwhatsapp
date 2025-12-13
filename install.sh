#!/usr/bin/env bash
set -euo pipefail

# Automated installer for ERP WhatsApp system on Ubuntu (tested on 20.04/22.04)
# Run as root: sudo bash install.sh

# --- Configuration (override via environment variables) ---
APP_USER=${APP_USER:-erpwhatsapp}
APP_DIR=${APP_DIR:-/opt/erpwhatsapp}
REPO_URL=${REPO_URL:-https://github.com/example/ERPwhatsapp.git}
DB_NAME=${DB_NAME:-erpwhatsapp}
DB_USER=${DB_USER:-erpwhatsapp}
DB_PASSWORD=${DB_PASSWORD:-changeme}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
REDIS_PORT=${REDIS_PORT:-6379}
NODE_VERSION=${NODE_VERSION:-lts/*}

# --- Helpers ---
log() { echo "[+] $*"; }
fail() { echo "[!] $*" >&2; exit 1; }

require_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    fail "Please run as root (sudo)."
  fi
}

command_exists() { command -v "$1" >/dev/null 2>&1; }

# --- Steps ---
require_root

log "Updating system packages"
apt-get update -y
apt-get upgrade -y

log "Installing prerequisites"
apt-get install -y curl gnupg ca-certificates lsb-release software-properties-common git ufw unzip

log "Installing Node.js ${NODE_VERSION}"
if ! command_exists node; then
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
  apt-get install -y nodejs
else
  log "Node.js already installed"
fi

log "Installing PM2 globally"
npm install -g pm2

log "Installing PostgreSQL"
apt-get install -y postgresql postgresql-contrib

log "Installing Redis"
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server

log "Installing Nginx"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

log "Installing Certbot (Let's Encrypt)"
apt-get install -y certbot python3-certbot-nginx

# --- Application user and directories ---
log "Ensuring application user ${APP_USER} exists"
if ! id -u "$APP_USER" >/dev/null 2>&1; then
  adduser --system --group --home "$APP_DIR" "$APP_USER"
fi
mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

# --- Database setup ---
log "Configuring PostgreSQL"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\";"

# --- Clone repository (if not present) ---
if [[ ! -d "$APP_DIR/.git" ]]; then
  log "Cloning repository"
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
else
  log "Repository already present at $APP_DIR"
fi

log "Applying schema"
if [[ -f "$APP_DIR/backend/db/schema.sql" ]]; then
  sudo -u postgres psql -d "$DB_NAME" -f "$APP_DIR/backend/db/schema.sql"
else
  log "schema.sql not found at $APP_DIR/backend/db/schema.sql; skipping apply"
fi

# --- Environment setup ---
log "Preparing environment file"
if [[ ! -f "$APP_DIR/.env" ]]; then
  if [[ -f "$APP_DIR/.env.example" ]]; then
    sudo -u "$APP_USER" cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    sudo -u "$APP_USER" sed -i "s/^DB_NAME=.*/DB_NAME=${DB_NAME}/" "$APP_DIR/.env"
    sudo -u "$APP_USER" sed -i "s/^DB_USER=.*/DB_USER=${DB_USER}/" "$APP_DIR/.env"
    sudo -u "$APP_USER" sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" "$APP_DIR/.env"
    sudo -u "$APP_USER" sed -i "s/^REDIS_PORT=.*/REDIS_PORT=${REDIS_PORT}/" "$APP_DIR/.env"
  else
    log "No .env.example found; please create $APP_DIR/.env manually"
  fi
else
  log ".env already exists; leaving untouched"
fi

log "Installation complete. Next steps:"
cat <<EONEXT
1) Configure HTTPS via: certbot --nginx -d your.domain.com
2) Review $APP_DIR/.env for correctness (tokens, secrets, origins)
3) Run deployment: sudo -u $APP_USER bash deploy.sh
EONEXT

