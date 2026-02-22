#!/bin/bash
# S3 Backup Script for Kitty Agent
# Usage: bash backup.sh
# Backs up databases, logs, workspace, and scripts to S3

set -euo pipefail

AWS="/home/mani/.local/bin/aws"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)
BUCKET="s3://kitty-openclaw-backups/daily-backups/${DATE}"
DATA_DIR="/home/mani/kitty-data"
WORKSPACE_DIR="/home/mani/.openclaw/workspace-dev"
LOG_FILE="${DATA_DIR}/logs/backup-${DATE}.log"

log() {
    echo "[${TIMESTAMP}] $1" | tee -a "$LOG_FILE"
}

# Ensure log directory exists
mkdir -p "${DATA_DIR}/logs"

log "Starting backup to ${BUCKET}"

# 1. Back up SQLite databases (use .backup for safe copy)
log "Backing up databases..."
for db in crm.db metrics.db usage.db; do
    if [ -f "${DATA_DIR}/${db}" ]; then
        BACKUP_FILE="/tmp/kitty-backup-${db}"
        sqlite3 "${DATA_DIR}/${db}" ".backup '${BACKUP_FILE}'" 2>/dev/null || cp "${DATA_DIR}/${db}" "${BACKUP_FILE}"
        $AWS s3 cp "${BACKUP_FILE}" "${BUCKET}/databases/${db}" --quiet
        rm -f "${BACKUP_FILE}"
        log "  OK: ${db}"
    else
        log "  SKIP: ${db} (not found)"
    fi
done

# 2. Back up logs
log "Backing up logs..."
if [ -d "${DATA_DIR}/logs" ]; then
    $AWS s3 sync "${DATA_DIR}/logs/" "${BUCKET}/logs/" --quiet --exclude "backup-*.log"
    log "  OK: logs/"
fi

# 3. Back up workspace files
log "Backing up workspace..."
if [ -d "${WORKSPACE_DIR}" ]; then
    $AWS s3 sync "${WORKSPACE_DIR}/" "${BUCKET}/workspace/" --quiet
    log "  OK: workspace/"
fi

# 4. Back up scripts
log "Backing up scripts..."
if [ -d "${DATA_DIR}/scripts" ]; then
    $AWS s3 sync "${DATA_DIR}/scripts/" "${BUCKET}/scripts/" --quiet
    log "  OK: scripts/"
fi

# 5. Back up openclaw.json (config)
log "Backing up config..."
if [ -f "/home/mani/.openclaw-dev/openclaw.json" ]; then
    $AWS s3 cp "/home/mani/.openclaw-dev/openclaw.json" "${BUCKET}/config/openclaw.json" --quiet
    log "  OK: openclaw.json"
fi

# 6. Verify upload
log "Verifying backup..."
FILE_COUNT=$($AWS s3 ls "${BUCKET}/" --recursive | wc -l)
log "  Files uploaded: ${FILE_COUNT}"

if [ "$FILE_COUNT" -gt 0 ]; then
    log "SUCCESS: Backup completed (${FILE_COUNT} files)"
    echo "SUCCESS: Backup completed to ${BUCKET} (${FILE_COUNT} files)"
else
    log "ERROR: No files were uploaded"
    echo "ERROR: Backup failed - no files uploaded"
    exit 1
fi
