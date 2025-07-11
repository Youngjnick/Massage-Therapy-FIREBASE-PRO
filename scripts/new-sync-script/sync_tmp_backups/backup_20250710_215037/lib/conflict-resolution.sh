# Interactive conflict resolution utility for sync-branches-simple.sh
resolve_conflicts() {
  if command -v fzf >/dev/null 2>&1; then
    info "Launching fzf for conflict resolution..."
    git status --porcelain | grep '^UU' | cut -c4- | fzf --multi --prompt="Select files to resolve: "
  elif command -v gitui >/dev/null 2>&1; then
    info "Launching gitui for conflict resolution..."
    gitui
  else
    warn "No TUI found. Opening conflicted files in \"$EDITOR\"."
    for file in $(git status --porcelain | grep '^UU' | cut -c4-); do
      "$EDITOR" "$file"
    done
  fi
}

# Modular conflict resolution function
resolve_conflicts_modular() {
  echo "Attempting to auto-resolve conflicts..." >&2
  git status --porcelain | grep '^UU' && {
    echo "Conflicts detected. Please resolve them manually." >&2
    return 1
  }
  return 0
}
