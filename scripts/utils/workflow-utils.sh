#!/bin/zsh
# workflow-utils.sh: Orchestration and workflow logic for sync-all-files-to-specified-branches.sh
# Requires: zsh, print -P, and zsh arrays. Sourced by main orchestrator script.

autoload -Uz colors && colors
typeset -ga branches
typeset -ga all_targets



# Show confirmation prompt and summary is now in summary-utils.sh
. "${SCRIPT_DIR:-$(dirname "$0")}/utils/summary-utils.sh"

# Ensure we are in a git repo before any git commands is now in git-utils.sh
. "${SCRIPT_DIR:-$(dirname "$0")}/utils/git-utils.sh"


# --- Branch selection and confirmation now in prompt-utils.sh ---

write_selected_branches_to_file() {
  # Use a session ID that is set by the main orchestrator and exported
  local session_id="${GIT_SYNC_SESSION_ID:-$$}"
  local tmp_branches_file="/tmp/git_sync_selected_branches.$USER.$session_id.zsh"
  print -l -- "${branches[@]}" > "$tmp_branches_file"
  export GIT_SYNC_SELECTED_BRANCHES_FILE="$tmp_branches_file"
}

cleanup_selected_branches_file() {
  local session_id="${GIT_SYNC_SESSION_ID:-$$}"
  local tmp_branches_file="/tmp/git_sync_selected_branches.$USER.$session_id.zsh"
  if [[ -f "$tmp_branches_file" ]]; then
    rm -f "$tmp_branches_file"
  fi
  unset GIT_SYNC_SELECTED_BRANCHES_FILE
}

# Validate and prompt for branches, including interactive input if needed
validate_and_prompt_branches() {
  ensure_git_repo
  validate_branches
  # Robust check: always prompt if branches is empty or unset
  if [[ -z "${branches+x}" || ${#branches[@]} -eq 0 ]]; then
    # Use prompt-utils.sh for branch selection
    local selected_branch
    selected_branch=$(prompt_for_branch_selection "$(git for-each-ref --format='%(refname:short)' refs/heads/)")
    if [[ -z "$selected_branch" ]]; then
      print -P "%B%F{red}No branches selected. Exiting.%f%b"
      return 1
    fi
    branches=("$selected_branch")
    write_selected_branches_to_file
  fi
}

# Construct all_targets array from remotes and branches
construct_targets() {
  all_targets=()
  for remote in "${remotes[@]}"; do
    if git remote | grep -qx "$remote"; then
      for branch in "${branches[@]}"; do
        local branch_trimmed="${branch//[[:space:]]/}"
        if [[ -n "$branch_trimmed" ]]; then
          all_targets+=("$remote/$branch_trimmed")
        fi
      done
    fi
  done
  all_targets=($(printf "%s\n" "${all_targets[@]}" | grep -E '^[^/]+/.+$' | awk '!seen[$0]++'))
  if [[ ${#all_targets[@]} -eq 0 ]]; then
    print -P "%B%F{red}ERROR: No valid remote/branch targets found. Exiting.%f%b"
    return 1
  fi
}
