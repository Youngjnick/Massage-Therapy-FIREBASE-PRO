#!/bin/zsh
# prompt-utils.sh: Interactive prompt helpers for sync/commit workflow



# --- Prompt for branch selection ---
prompt_for_branch_selection() {
  local branches=("$@")
  local current_branch
  current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
  # Try fzf if available
  if command -v fzf >/dev/null 2>&1; then
    print -P "%F{cyan}Use arrow keys and space to select branches. Enter to confirm.%f"
    local selected
    selected=$(printf "%s\n" "${branches[@]}" | \
      fzf --multi --prompt="Select branches: " --header="Current: $current_branch" --preview="git log -1 --oneline {}" --bind "ctrl-a:select-all,ctrl-d:deselect-all")
    if [[ -n "$selected" ]]; then
      # Only keep lines that exactly match a branch in the list
      local valid=()
      local b branch
      for b in ${(f)selected}; do
        for branch in "${branches[@]}"; do
          if [[ "$b" == "$branch" ]]; then
            valid+="$b"
            break
          fi
        done
      done
      # Remove duplicates
      typeset -A seen
      local unique=()
      for b in $valid; do
        [[ -z "${seen[$b]:-}" ]] && unique+="$b" && seen[$b]=1
      done
      print -P "%F{green}Selected branches:%f ${unique[*]}"
      echo "${unique[@]}"
      return 0
    fi
  fi
  # Fallback: manual multi-select by number or name
  print -P "%F{cyan}Available branches:%f"
  local i=1
  for b in "${branches[@]}"; do
    if [[ "$b" == "$current_branch" ]]; then
      print -P "  $i) %F{yellow}* $b%f"
    else
      print -P "  $i)   $b"
    fi
    ((i++))
  done
  print -P "%F{cyan}Type branch numbers or names separated by space (e.g. 1 3 main), then press Enter:%f"
  read -r input
  local selected=()
  local token
  for token in ${(z)input}; do
    if [[ "$token" =~ '^[0-9]+$' ]] && (( token >= 1 && token <= ${#branches[@]} )); then
      selected+="${branches[$((token-1))]}"
    else
      # Only accept if token matches a branch exactly
      local found=0
      for b in "${branches[@]}"; do
        if [[ "$b" == "$token" ]]; then
          selected+="$b"
          found=1
          break
        fi
      done
      # If not found, ignore
    fi
  done
  # Remove duplicates
  typeset -A seen
  local unique=()
  for b in $selected; do
    [[ -z "${seen[$b]:-}" ]] && unique+="$b" && seen[$b]=1
  done
  print -P "%F{green}Selected branches:%f ${unique[*]}"
  echo "${unique[@]}"
}

# --- Prompt for fix/wip/abort ---
prompt_for_fix_wip_abort() {
  print -P "%F{yellow}Tests or lint failed. What would you like to do?%f"
  select choice in "Fix and continue" "Mark as WIP and continue" "Abort"; do
    case $REPLY in
      1) echo "fix"; break;;
      2) echo "wip"; break;;
      3) echo "abort"; break;;
    esac
  done
}

# --- Prompt for commit message ---
prompt_for_commit_message() {
  print -P "%F{cyan}Enter commit message (leave blank for default):%f"
  read commit_msg
  echo "$commit_msg"
}

# Export functions
export -f prompt_for_branch_selection
export -f prompt_for_fix_wip_abort
export -f prompt_for_commit_message
