#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-$(pwd)}"
DB_FILE="${DB_FILE:-$APP_DIR/prisma/dev.db}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_FILE" ]; then
  echo "Database file not found: $DB_FILE" >&2
  exit 1
fi

cp "$DB_FILE" "$BACKUP_DIR/dev-$STAMP.db"
find "$BACKUP_DIR" -name "dev-*.db" -type f -mtime +14 -delete

echo "Backup created: $BACKUP_DIR/dev-$STAMP.db"
