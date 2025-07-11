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
  echo "Stashing uncommitted changes..." >&2
  git stash push -u -m "sync-script-stash"
  return 0
}
