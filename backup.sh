#!/usr/bin/env bash
set -euo pipefail

# Daily backup script for ERP WhatsApp
# Suggested cron (as root):
# 0 2 * * * /opt/erpwhatsapp/backup.sh >> /var/log/erpwhatsapp/backup.log 2>&1

APP_DIR=${APP_DIR:-/opt/erpwhatsapp}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/erpwhatsapp}
DB_NAME=${DB_NAME:-erpwhatsapp}
DB_USER=${DB_USER:-erpwhatsapp}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
RETENTION_DAYS=${RETENTION_DAYS:-30}
FILES_TO_BACKUP=${FILES_TO_BACKUP:-"$APP_DIR/.env $APP_DIR/backend $APP_DIR/frontend/dist"}

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_FILE="$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
FILES_FILE="$BACKUP_DIR/files_${TIMESTAMP}.tar.gz"

log() { echo "[+] $*"; }
fail() { echo "[!] $*" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"

log "Backing up PostgreSQL database $DB_NAME"
PGPASSWORD=${DB_PASSWORD:-} pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$DB_FILE"

log "Backing up files"
tar -czf "$FILES_FILE" $FILES_TO_BACKUP

log "Removing backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -name '*.gz' -print -delete

log "Backup complete"
