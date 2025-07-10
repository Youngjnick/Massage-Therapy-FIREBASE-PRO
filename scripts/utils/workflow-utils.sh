

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

# Prompt user for branches interactively (modularized, zsh-idiomatic)
prompt_for_branches() {
  # Show all local branches, numbered, with current branch highlighted and colored
  local all_branches current_branch idx status_color branch
  all_branches=($(git for-each-ref --format='%(refname:short)' refs/heads/))
  current_branch=$(git symbolic-ref --short HEAD)
  idx=1
  local branch_list=()
  local found_current=false
  for branch in "${all_branches[@]}"; do
    local branch_trimmed current_trimmed
    branch_trimmed="${branch//[[:space:]]/}"
    current_trimmed="${current_branch//[[:space:]]/}"
    if [[ "$branch_trimmed" == "$current_trimmed" ]]; then
      found_current=true
    fi
    branch_list+=("$branch")
  done
  # If current branch is not in the list, add it at the top
  if [[ "$found_current" == false ]]; then
    branch_list=("$current_branch" "${branch_list[@]}")
  fi
  print -P "%B%F{yellow}No target branches specified. Please select from the list below:%f%b"
  print -P "%BAvailable branches:%b"
  for branch in "${branch_list[@]}"; do
    local branch_trimmed current_trimmed
    branch_trimmed="${branch//[[:space:]]/}"
    current_trimmed="${current_branch//[[:space:]]/}"
    if [[ "$branch_trimmed" == "$current_trimmed" ]]; then
      if [[ -n $(git status --porcelain) ]]; then
        status_color="%F{yellow}"
      else
        status_color="%F{green}"
      fi
      print -P "  ${(l:2::0:)$idx}) ${status_color}* $branch%f"
    else
      print -P "  ${(l:2::0:)$idx})   $branch"
    fi
    ((idx++))
  done
  print -P "%BType branch numbers separated by space (e.g. 1 3 5), or '+' to add a new branch. Press 'Enter' when done:%b "
  read -r branch_nums
  if [[ -z "$branch_nums" ]]; then
    print -P "%B%F{red}No branches selected. Exiting.%f%b"
    return 1
  fi
  typeset -a selected
  local branch_count=${#branch_list[@]}
  for num in ${(z)branch_nums}; do
    if [[ "$num" =~ ^[0-9]+$ ]] && (( num >= 1 && num <= branch_count )); then
      selected+=("${branch_list[$((num-1))]}")
    fi
  done
  # Remove duplicates and preserve order
  local seen=()
  branches=()
  for b in "${selected[@]}"; do
    if [[ -z "${seen[(r)$b]}" ]]; then
      branches+=("$b")
      seen+=("$b")
    fi
  done
  show_selected_branches
  confirm_selected_branches || return 1
  write_selected_branches_to_file
# Show selected branches to the user
show_selected_branches() {
  print -P "%BYou have selected the following branches:%b"
  for b in "${branches[@]}"; do
    print -P "  - $b"
  done
}

# Confirm selection with the user
confirm_selected_branches() {
  print -P "%BConfirm selection? (y/N):%b "
  read -r confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    print -P "%F{red}Aborted by user.%f"
    branches=()
    return 1
  fi
  return 0
}

## Write selected branches to a temp file for main orchestrator to source
write_selected_branches_to_file() {
  local tmp_branches_file="/tmp/git_sync_selected_branches.$USER.$$.zsh"
  print -l -- "${branches[@]}" > "$tmp_branches_file"
  export GIT_SYNC_SELECTED_BRANCHES_FILE="$tmp_branches_file"
}

# Remove the temp file after use
cleanup_selected_branches_file() {
  if [[ -n "$GIT_SYNC_SELECTED_BRANCHES_FILE" && -f "$GIT_SYNC_SELECTED_BRANCHES_FILE" ]]; then
    rm -f "$GIT_SYNC_SELECTED_BRANCHES_FILE"
    unset GIT_SYNC_SELECTED_BRANCHES_FILE
  fi
}
}

# Validate and prompt for branches, including interactive input if needed
validate_and_prompt_branches() {
  ensure_git_repo
  validate_branches
  # Robust check: always prompt if branches is empty or unset
  if [[ -z "${branches+x}" || ${#branches[@]} -eq 0 ]]; then
    prompt_for_branches || return 1
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
