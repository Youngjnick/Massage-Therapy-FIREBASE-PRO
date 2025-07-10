

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
  print -P "%B%F{yellow}No branches specified. Please enter the branches you want to sync to (space-separated or one per line):%f%b"
  print -P "%B%F{green}When you are done, press Enter twice to finish entering branch names.%f%b"
  local branch_input=""
  local first_entry=true
  while IFS= read -r line; do
    [[ -z "$line" ]] && break
    branch_input+=" $line"
    if [[ $first_entry == false ]]; then
      print -P "%B%F{green}If you are done, press Enter again to finish entering branch names.%f%b"
    fi
    first_entry=false
  done
  if [[ -z "$branch_input" ]]; then
    print -P "%B%F{red}No branches entered. Exiting.%f%b"
    return 1
  fi
  # Split branch_input on commas and whitespace (zsh compatible), trim, and only add non-empty
  typeset -a branch_array
  branch_array=(${(s:,:)branch_input// /,})
  for b in "${branch_array[@]}"; do
    local b_trimmed="${b//[[:space:]]/}"
    if [[ -n "$b_trimmed" ]]; then
      branches+=("$b_trimmed")
    fi
  done
}

# Validate and prompt for branches, including interactive input if needed
validate_and_prompt_branches() {
  ensure_git_repo
  validate_branches
  if [[ ${#branches[@]} -eq 0 ]]; then
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
