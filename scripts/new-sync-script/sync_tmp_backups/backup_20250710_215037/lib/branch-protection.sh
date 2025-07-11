#!/usr/bin/env bash
# branch-protection.sh: Branch selection and protection helpers

# Branch protection utility for sync-branches-simple.sh
is_protected_branch() {
  local branch="$1"
  [[ "$branch" =~ ^(main|master|production|release)$ ]] && return 0 || return 1
}

select_branches_interactive() {
  local branches selected
  branches=$(git branch --format='%(refname:short)')
  echo "Available branches:" >&2
  echo "$branches" | nl -w2 -s'. '
  echo "Enter branch numbers to sync (comma-separated, e.g. 1,3,5):" >&2
  read -r nums
  selected=$(echo "$branches" | awk 'NR==1{split("'$nums'",a,",");for(i in a)print a[i]}' | xargs)
  export SYNC_BRANCHES="$selected"
  echo "Selected branches: $SYNC_BRANCHES" >&2
}

branch_cleanup_modular() {
  echo "[INFO] Running branch cleanup (modular)..."
  # Placeholder for branch cleanup logic
}
