#!/bin/zsh
# summary-utils.sh: Commit summary and status display for sync scripts

show_stash_and_precommit_summary() {
  local status_output=$(git status --porcelain)
  local modified_count=$(echo "$status_output" | grep -c "^.M")
  local added_count=$(echo "$status_output" | grep -c "^A")
  local deleted_count=$(echo "$status_output" | grep -c "^.D")
  local untracked_count=$(echo "$status_output" | grep -c "^??")
  local deleted_report_count=$(echo "$status_output" | grep -c "playwright-report/data/.*\.zip")

  local title="Sync project files:"
  [[ $modified_count -gt 0 ]] && title="$title updated files"
  [[ $added_count -gt 0 ]] && title="$title, new additions"
  [[ $deleted_count -gt 0 ]] && title="$title, cleanup"

  echo "%F{magenta}--- Commit message preview ---%f"
  if [[ $SKIP_TESTS == true ]]; then
    echo "WIP: $title (tests/lint/type checks skipped)"
  else
    echo "$title"
  fi

  local current_branch=$(git symbolic-ref --short -q HEAD)
  echo "%F{blue}Branch Status%f"
  echo "Current branch: %F{green}$current_branch%f"

  if git remote | grep -q .; then
    git fetch -q
    local ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    local behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    if [[ $ahead -gt 0 && $behind -gt 0 ]]; then
      echo "%F{yellow}⚠ Branch is $ahead commits ahead and $behind commits behind remote%f"
    elif [[ $ahead -gt 0 ]]; then
      echo "%F{yellow}↑ Branch is $ahead commits ahead of remote%f"
    elif [[ $behind -gt 0 ]]; then
      echo "%F{yellow}↓ Branch is $behind commits behind remote%f"
    else
      echo "%F{green}✓ Branch is in sync with remote%f"
    fi
  fi

  echo "\n%F{blue}Recent Changes%f"
  git --no-pager log -1 --stat --color

  echo "\n%F{blue}--- Changed Files ---%f"
  if [[ -n $status_output ]]; then
    echo "\nScript Changes:"
    echo "$status_output" | grep "scripts/" | sed 's/^/  /'
    echo "\nTest Changes:"
    echo "$status_output" | grep -E "tests/|e2e/|\.spec\." | sed 's/^/  /'
    if [[ $deleted_report_count -gt 0 ]]; then
      echo "\nCleanup:"
      echo "  Removed $deleted_report_count old test report files"
    fi
    echo "\nOther Changes:"
    echo "$status_output" | grep -vE "scripts/|tests/|e2e/|\.spec\.|playwright-report/data/.*\.zip" | sed 's/^/  /'
    echo "\nSummary:"
    [[ $modified_count -gt 0 ]] && echo "  %F{yellow}Modified: $modified_count%f"
    [[ $added_count -gt 0 ]] && echo "  %F{green}Added: $added_count%f"
    [[ $deleted_count -gt 0 ]] && echo "  ${RED}Deleted: $deleted_count${NC}"
    [[ $untracked_count -gt 0 ]] && echo "  ${YELLOW}Untracked: $untracked_count${NC}"
  else
    echo "${GREEN}✓ Working tree clean${NC}"
  fi
  
  # 4. Stash information with count
  local stash_count=$(git stash list | wc -l | tr -d '[:space:]')
  if [[ $stash_count -gt 0 ]]; then
    echo "\n${BLUE}Stashed Changes${NC}"
    echo "${YELLOW}Found $stash_count stashed change(s):${NC}"
    git --no-pager stash list --pretty=format:"%C(yellow)%gd%C(reset): %C(green)%cr%C(reset) - %s"
  fi
  
  # 5. Conflict detection
  if git ls-files -u | grep -q '^'; then
    echo "\n${RED}⚠ MERGE CONFLICTS DETECTED${NC}"
    echo "The following files have conflicts:"
    git diff --name-only --diff-filter=U
  fi
  
  echo "\n${PURPLE}═════════════════════════════════════${NC}"
}
export -f show_stash_and_precommit_summary
#!/bin/zsh
# summary-utils.sh: Summary display helpers for sync scripts

show_stash_and_precommit_summary() {
  local GREEN='\033[32m'
  local RED='\033[31m'
  local YELLOW='\033[33m'
  local BLUE='\033[1;34m'
  local PURPLE='\033[1;35m'
  local NC='\033[0m'

  local status_output=$(git status --porcelain)
  local modified_count=$(echo "$status_output" | grep -c "^.M")
  local added_count=$(echo "$status_output" | grep -c "^A")
  local deleted_count=$(echo "$status_output" | grep -c "^.D")
  local untracked_count=$(echo "$status_output" | grep -c "^??")
  local deleted_report_count=$(echo "$status_output" | grep -c "playwright-report/data/.*\.zip")

  local title="Sync project files:"
  [[ $modified_count -gt 0 ]] && title="$title updated files"
  [[ $added_count -gt 0 ]] && title="$title, new additions"
  [[ $deleted_count -gt 0 ]] && title="$title, cleanup"

  echo "${PURPLE}--- Commit message preview ---${NC}"
  if [[ $SKIP_TESTS == true ]]; ]; then
    echo "WIP: $title (tests/lint/type checks skipped)"
  else
    echo "$title"
  fi

  local current_branch=$(git symbolic-ref --short -q HEAD)
  echo "${BLUE}Branch Status${NC}"
  echo "Current branch: ${GREEN}$current_branch${NC}"

  if git remote | grep -q .; then
    git fetch -q
    local ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    local behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    if [[ $ahead -gt 0 && $behind -gt 0 ]]; then
      echo "${YELLOW}⚠ Branch is $ahead commits ahead and $behind commits behind remote${NC}"
    elif [[ $ahead -gt 0 ]]; then
      echo "${YELLOW}↑ Branch is $ahead commits ahead of remote${NC}"
    elif [[ $behind -gt 0 ]]; then
      echo "${YELLOW}↓ Branch is $behind commits behind remote${NC}"
    else
      echo "${GREEN}✓ Branch is in sync with remote${NC}"
    fi
  fi

  echo "\n${BLUE}Recent Changes${NC}"
  git --no-pager log -1 --stat --color

  echo "\n${BLUE}--- Changed Files ---${NC}"
  if [[ -n $status_output ]]; then
    echo "\nScript Changes:"
    echo "$status_output" | grep "scripts/" | sed 's/^/  /'
    echo "\nTest Changes:"
    echo "$status_output" | grep -E "tests/|e2e/|\.spec\." | sed 's/^/  /'
    if [[ $deleted_report_count -gt 0 ]]; then
      echo "\nCleanup:"
      echo "  Removed $deleted_report_count old test report files"
    fi
    echo "\nOther Changes:"
    echo "$status_output" | grep -vE "scripts/|tests/|e2e/|\.spec\.|playwright-report/data/.*\.zip" | sed 's/^/  /'
    echo "\nSummary:"
    [[ $modified_count -gt 0 ]] && echo "  ${YELLOW}Modified: $modified_count${NC}"
    [[ $added_count -gt 0 ]] && echo "  ${GREEN}Added: $added_count${NC}"
    [[ $deleted_count -gt 0 ]] && echo "  ${RED}Deleted: $deleted_count${NC}"
    [[ $untracked_count -gt 0 ]] && echo "  ${YELLOW}Untracked: $untracked_count${NC}"
  else
    echo "${GREEN}✓ Working tree clean${NC}"
  fi

  local stash_count=$(git stash list | wc -l | tr -d '[:space:]')
  if [[ $stash_count -gt 0 ]]; then
    echo "\n${BLUE}Stashed Changes${NC}"
    echo "${YELLOW}Found $stash_count stashed change(s):${NC}"
    git --no-pager stash list --pretty=format:"%C(yellow)%gd%C(reset): %C(green)%cr%C(reset) - %s"
  fi

  if git ls-files -u | grep -q '^'; then
    echo "\n${RED}⚠ MERGE CONFLICTS DETECTED${NC}"
    echo "The following files have conflicts:"
    git diff --name-only --diff-filter=U
  fi

  echo "\n${PURPLE}═════════════════════════════════════${NC}"
}

# Show confirmation prompt and summary
confirm_sync() {
  CURRENT_BRANCH=$(git symbolic-ref --short -q HEAD)
  CURRENT_COMMIT=$(git rev-parse --short HEAD)
  if [[ -z "$CURRENT_BRANCH" ]]; then
    REF_DESC="detached HEAD at $CURRENT_COMMIT"
  else
    REF_DESC="branch $CURRENT_BRANCH ($CURRENT_COMMIT)"
  fi
  printf "\n\033[1;34m[DIAG] Final sync targets:\033[0m\n"
  for t in "${all_targets[@]}"; do
    echo "  $t"
  done
  echo "\nYou are about to sync ALL FILES from $REF_DESC to the following targets (remotes and/or branches):"
  for target in $all_targets; do
    echo "  $target"
  done
  echo "\nThis will OVERWRITE the state of these branches/remotes with your current files from $REF_DESC."
  echo "Type 'yes' to continue, or anything else to abort: "
  read answer
  if [[ "$answer" != "yes" ]]; then
    echo "Aborted. No changes made."
    exit 1
  fi
}
