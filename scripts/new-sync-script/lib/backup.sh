#!/usr/bin/env bash
# sync-branches-simple.sh: Enhanced backup management utilities

info() {
  echo "[INFO] $*"
}

error() {
  echo "[ERROR] $*" >&2
}

# Backup and restore helpers
backup_before_sync_modular() {
  echo "[INFO] Backing up working directory before sync..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would backup to sync_tmp_backups/"; return 0; fi
  mkdir -p sync_tmp_backups
  backup_name="backup_$(date +%Y%m%d_%H%M%S)"
  rsync -a --exclude 'sync_tmp_backups' ./ sync_tmp_backups/$backup_name/
  echo "[INFO] Backup created: $backup_name"
}

list_backups() {
  info "Available backups:"
  ls -1 sync_tmp_backups/
}

restore_backup() {
  list_backups
  read "?Enter backup name to restore: " backup
  if [[ -d sync_tmp_backups/$backup ]]; then
    info "Restoring backup $backup..."
    cp -r sync_tmp_backups/$backup/* .
  else
    error "Backup not found."
  fi
}

delete_backup() {
  list_backups
  read "?Enter backup name to delete: " backup
  if [[ -d sync_tmp_backups/$backup ]]; then
    info "Deleting backup $backup..."
    rm -rf sync_tmp_backups/$backup
  else
    error "Backup not found."
  fi
}
