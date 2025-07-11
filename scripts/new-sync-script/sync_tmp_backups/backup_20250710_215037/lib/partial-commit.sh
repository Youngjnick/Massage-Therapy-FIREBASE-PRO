# Partial commit and stash utilities for sync-branches-simple.sh
partial_commit() {
  info "Starting partial commit (git add -p)..."
  git add -p
  git commit
}
partial_stash() {
  info "Starting partial stash (git stash -p)..."
  git stash -p
}

handle_stash_flow_modular() {
  echo "[INFO] Handling stash flow (modular)..."
  if [[ "$DRY_RUN" == "1" ]]; then echo "[DRY RUN] Would stash and restore changes"; return 0; fi
  git stash push -u -m "sync-script-stash"
  # ...sync/merge logic would go here...
  git stash pop || echo "[WARN] No stash to pop."
}
