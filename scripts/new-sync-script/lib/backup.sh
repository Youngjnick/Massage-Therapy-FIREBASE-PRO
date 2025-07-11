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
  local backup_dir=".sync-script-backup-$(date +%s)"
  echo "Backing up working directory to $backup_dir..." >&2
  mkdir -p "$backup_dir"
  git ls-files -z | xargs -0 -I{} cp --parents {} "$backup_dir" 2>/dev/null
  echo "Backup complete: $backup_dir" >&2
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
