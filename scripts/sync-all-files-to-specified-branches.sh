#!/bin/zsh
# sync-all-files-to-branches.sh
# Usage: ./scripts/sync-all-files-to-branches.sh [--remote remote1 remote2 ...] [--skip-tests] branch1 branch2 ...
# Example: ./scripts/sync-all-files-to-branches.sh --remote origin your-fork main main2

remotes=(origin)
branches=()
LOG_FILE="$(dirname "$0")/sync-history.log"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"
SKIP_TESTS=false

# Parse arguments for --remote, --skip-tests, --auto-commit-wip, and --commit-current-branch-only
AUTO_COMMIT_WIP=false
COMMIT_CURRENT_BRANCH_ONLY=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --remote)
      shift
      remotes=()
      while [[ $# -gt 0 && $1 != --* && $1 != -* ]]; do
        remotes+=$1
        shift
      done
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --auto-commit-wip)
      AUTO_COMMIT_WIP=true
      shift
      ;;
    --commit-current-branch-only)
      COMMIT_CURRENT_BRANCH_ONLY=true
      shift
      ;;
    --*)
      # Ignore unknown options
      shift
      ;;
    -*)
      # Ignore unknown short options
      shift
      ;;
    *)
      # Only add as branch if it does not start with -- or -
      if [[ $1 != --* && $1 != -* ]]; then
        branches+=$1
      fi
      shift
      ;;
  esac
done

# Prompt for branches if not provided
if [[ ${#branches[@]} -eq 0 ]]; then
  GREEN='\033[32m'
  NC='\033[0m'
  echo "No branches specified. Please enter the branches you want to sync to (space-separated or one per line):"
  echo -e "${GREEN}When you are done, press Enter twice to finish entering branch names.${NC}"
  branch_input=""
  first_entry=true
  while IFS= read -r line; do
    [[ -z "$line" ]] && break
    branch_input+=" $line"
    if [[ $first_entry == false ]]; then
      echo -e "${GREEN}If you are done, press Enter again to finish entering branch names.${NC}"
    fi
    first_entry=false
  done
  if [[ -z "$branch_input" ]]; then
    echo "No branches entered. Exiting."
    exit 1
  fi
  # Split branch_input on whitespace (spaces, tabs, newlines)
  for b in $branch_input; do
    branches+=("$b")
  done
fi

# Accept any entry as a remote branch by default (origin/branch)
# Combine remotes and branches into a single targets array (only valid remote/branch pairs)
all_targets=()
for remote in $remotes; do
  # Only add if remote is a real git remote
  if git remote | grep -qx "$remote"; then
    for branch in $branches; do
      all_targets+="$remote/$branch"
    done
  fi
  # Do NOT treat branch names as remotes
  # This prevents invalid targets like branch/branch
  # Only valid remote/branch pairs are added
done
# Remove duplicates
all_targets=($(printf "%s\n" "${all_targets[@]}" | awk '!seen[$0]++'))

# Detect if in detached HEAD state and get current ref/commit info
CURRENT_BRANCH=$(git symbolic-ref --short -q HEAD)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
if [[ -z "$CURRENT_BRANCH" ]]; then
  REF_DESC="detached HEAD at $CURRENT_COMMIT"
else
  REF_DESC="branch $CURRENT_BRANCH ($CURRENT_COMMIT)"
fi

# Show confirmation with explicit target list
if [[ ${#all_targets[@]} -gt 0 ]]; then
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
fi

# --- ALWAYS COMMIT ALL CHANGES BEFORE SYNC ---

show_stash_and_precommit_summary() {
  # --- ENHANCED PRE-COMMIT SUMMARY ---
  PRECOMMIT_SUMMARY=""

  # 1. Show last 1-3 commit messages
  printf "\n\033[1;34m==== Last 3 commit messages ====\033[0m\n"
  git log -3 --oneline --decorate --color=always | tee >(cat >> "$LOG_FILE")
  PRECOMMIT_SUMMARY+="==== Last 3 commit messages ===="
  PRECOMMIT_SUMMARY+="\n$(git log -3 --oneline --decorate)\n"

  # 2. Show last lint/type/test/E2E status (colorized, with error/warning counts)
  LINT_SUMMARY=""
  TS_SUMMARY=""
  JEST_SUMMARY=""
  PW_SUMMARY=""
  GREEN='\033[32m'
  RED='\033[31m'
  YELLOW='\033[33m'
  NC='\033[0m'
  if [[ -f scripts/eslint-output.txt ]]; then
    ERRORS=$(grep -c 'error' scripts/eslint-output.txt)
    WARNINGS=$(grep -c 'warning' scripts/eslint-output.txt)
    if [[ $ERRORS -gt 0 ]]; then
      LINT_SUMMARY="${RED}Lint: $ERRORS errors, $WARNINGS warnings${NC}"
    elif [[ $WARNINGS -gt 0 ]]; then
      LINT_SUMMARY="${YELLOW}Lint: 0 errors, $WARNINGS warnings${NC}"
    else
      LINT_SUMMARY="${GREEN}Lint: 0 errors, 0 warnings${NC}"
    fi
  fi
  if [[ -f scripts/ts-output.txt ]]; then
    ERRORS=$(grep -c 'error TS' scripts/ts-output.txt)
    if [[ $ERRORS -gt 0 ]]; then
      TS_SUMMARY="${RED}Type: $ERRORS errors${NC}"
    else
      TS_SUMMARY="${GREEN}Type: 0 errors${NC}"
    fi
  fi
  if [[ -f scripts/test-output.txt ]]; then
    FAILS=$(grep -E '^Tests:' scripts/test-output.txt | grep -o '[0-9]* failed' | awk '{s+=$1} END {print s+0}')
    if [[ $FAILS -gt 0 ]]; then
      JEST_SUMMARY="${RED}Jest: $FAILS failed${NC}"
    else
      JEST_SUMMARY="${GREEN}Jest: 0 failed${NC}"
    fi
  fi
  if [[ -f scripts/playwright-output.txt ]]; then
    PW_FAILS=$(grep -Eo '[0-9]+ failed' scripts/playwright-output.txt | awk '{s+=$1} END {print s+0}')
    if [[ $PW_FAILS -gt 0 ]]; then
      PW_SUMMARY="${RED}E2E: $PW_FAILS failed${NC}"
    else
      PW_SUMMARY="${GREEN}E2E: 0 failed${NC}"
    fi
  fi
  printf "\n\033[1;34m==== Last Lint/Type/Test/E2E Status ====\033[0m\n"
  echo "$LINT_SUMMARY"
  echo "$TS_SUMMARY"
  echo "$JEST_SUMMARY"
  echo "$PW_SUMMARY"
  PRECOMMIT_SUMMARY+="==== Last Lint/Type/Test/E2E Status ===="
  PRECOMMIT_SUMMARY+="\n$LINT_SUMMARY\n$TS_SUMMARY\n$JEST_SUMMARY\n$PW_SUMMARY\n"

  # 3. Warn if uncommitted changes in other branches, offer to stash/pop
  if [[ -n $(git stash list) ]]; then
    printf '\n\033[1;33mWARNING: You have stashed (uncommitted) changes in other branches!\033[0m\n'
    git stash list | tee >(cat >> "$LOG_FILE")
    PRECOMMIT_SUMMARY+="WARNING: You have stashed (uncommitted) changes in other branches!\n$(git stash list)\n"
    echo "Do you want to pop a stash now? (y/n): "
    read pop_stash
    if [[ "$pop_stash" == "y" ]]; then
      git stash list
      echo "Enter the stash number to pop (e.g., 0 for the top stash), or leave blank to skip:"
      read stash_num
      if [[ -n "$stash_num" ]]; then
        git stash pop stash@{$stash_num}
      fi
    fi
  fi
}

# Always stage and commit all changes if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  # Remove prompt for a detailed commit summary
  user_summary=""
  DEFAULT_SUMMARY=""

  echo "How do you want to commit these changes? (commit/WIP/abort): "
  read commit_mode
  # Auto-generate changed files and diffstat info
  CHANGED_FILES=$(git status --short)
  DIFF_STAT=$(git diff --cached --stat)
  COMMIT_AUTOINFO="\n\n--- Changed files ---\n$CHANGED_FILES\n\n--- Diff summary ---\n$DIFF_STAT"

  if [[ "$commit_mode" == "abort" ]]; then
    echo "Aborted by user. No changes committed."
    exit 1
  fi
  commit_msg=""
  if [[ "$commit_mode" == "WIP" || "$commit_mode" == "wip" ]]; then
    # WIP mode: skip all test/lint/type logic, go directly to commit
    WIP_EXTRA="\n[WIP MODE: Tests/lint/type checks skipped]"
    if [[ -f scripts/eslint-output.txt ]]; then
      WIP_EXTRA+="\n\n--- Last ESLint Output ---\n$(tail -20 scripts/eslint-output.txt)"
    fi
    if [[ -f scripts/ts-output.txt ]]; then
      WIP_EXTRA+="\n\n--- Last TypeScript Output ---\n$(tail -20 scripts/ts-output.txt)"
    fi
    if [[ -f scripts/test-output.txt ]]; then
      WIP_EXTRA+="\n\n--- Last Jest Output ---\n$(tail -20 scripts/test-output.txt)"
    fi
    if [[ -f scripts/playwright-output.txt ]]; then
      WIP_EXTRA+="\n\n--- Last Playwright Output ---\n$(tail -20 scripts/playwright-output.txt)"
    fi
    commit_msg="WIP: auto-commit before sync-all-files-to-specified-branches.sh\n\n$DEFAULT_SUMMARY$WIP_EXTRA$COMMIT_AUTOINFO"
    echo -e "\n\033[1;36m--- Commit message preview ---\033[0m\n$commit_msg\n"
    echo "Do you want to edit the WIP commit message? (y/n): "
    read edit_wip_choice
    if [[ "$edit_wip_choice" == "y" ]]; then
      echo "Enter your WIP commit message. The generated summary is shown above. (End with an empty line):"
      commit_msg=""
      while IFS= read -r line; do
        commit_msg+="$line\n"
      done
    fi
    git add -A
    git commit -m "$commit_msg"
    # Open GitHub page for the branch if remote is origin
    if [[ "origin" == "origin" && -n "$CURRENT_BRANCH" ]]; then
      open "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$CURRENT_BRANCH"
    fi
    show_stash_and_precommit_summary
    # No continue here; just return to main flow
    return
  fi
  commit_msg="sync-all-files-to-specified-branches.sh\n\n$DEFAULT_SUMMARY$COMMIT_AUTOINFO"
  echo -e "\n\033[1;36m--- Commit message preview ---\033[0m\n$commit_msg\n"
  echo "Do you want to edit the commit message? (y/n): "
  read edit_commit_choice
  if [[ "$edit_commit_choice" == "y" ]]; then
    echo "Enter your commit message. The generated summary is shown above. (End with an empty line):"
    while IFS= read -r line; do
      [[ -z "$line" ]] && break
      commit_msg+="$line\n"
    done
  fi
  git add -A
  git commit -m "$commit_msg"
  # Open GitHub page for the branch if remote is origin
  if [[ "origin" == "origin" && -n "$CURRENT_BRANCH" ]]; then
    open "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$CURRENT_BRANCH"
  fi
  show_stash_and_precommit_summary
else
  echo -e "${GREEN}No uncommitted changes to auto-commit.${NC}"
  show_stash_and_precommit_summary
fi

# Only run tests if not in WIP mode
if [[ "$SKIP_TESTS" = false ]]; then
  # --- TEST & LINT SECTION ---
  # Always run: ESLint -> TypeScript -> Jest -> Playwright (in this order)
  # If any fail, prompt for fix/wip/abort, but always allow WIP and always push/force-push unless abort

  WIP_MODE=false
  TEST_SUMMARY=""
  PW_SUMMARY=""

  if [[ "$SKIP_TESTS" = false ]]; then
    # 1. ESLint
    echo "Running ESLint..."
    npx eslint . | tee scripts/eslint-output.txt
    if grep -q "error" scripts/eslint-output.txt; then
      echo -e "${RED}Lint errors detected.${NC}"
      grep -E '^[^ ]+\.(ts|tsx|js|jsx):[0-9]+:[0-9]+' scripts/eslint-output.txt | while read -r line; do
        echo -e "${RED}$line${NC}"
      done
      echo "What do you want to do? (fix/wip/abort): "
      read lint_decision
      if [[ "$lint_decision" == "fix" ]]; then
        $SHELL
        exit 1
      elif [[ "$lint_decision" == "wip" ]]; then
        WIP_MODE=true
      else
        echo "Aborted due to lint errors."
        exit 1
      fi
    fi
    rm -f scripts/eslint-output.txt

    # 2. TypeScript
    echo "Running TypeScript type check..."
    npx tsc --noEmit | tee scripts/ts-output.txt
    if [[ $? -ne 0 ]]; then
      echo -e "${RED}TypeScript errors detected.${NC}"
      grep -E '^[^ ]+\.(ts|tsx|js|jsx):[0-9]+:[0-9]+' scripts/ts-output.txt | while read -r line; do
        echo -e "${RED}$line${NC}"
      done
      echo "What do you want to do? (fix/wip/abort): "
      read ts_decision
      if [[ "$ts_decision" == "fix" ]]; then
        $SHELL
        exit 1
      elif [[ "$ts_decision" == "wip" ]]; then
        WIP_MODE=true
      else
        echo "Aborted due to TypeScript errors."
        exit 1
      fi
    fi
    rm -f scripts/ts-output.txt

    # 3. Jest
    echo "Running Jest tests..."
    npm test -- --reporter=default | tee scripts/test-output.txt

    # Parse Jest output for summary and failing test names
    TEST_SUMMARY=""
    if grep -q "failing" scripts/test-output.txt; then
      # Get summary line (e.g. 'Tests: 2 failed, 38 passed, 40 total')
      SUMMARY_LINE=$(grep -E '^Tests:' scripts/test-output.txt | tail -1)
      # Get failing test suite names (e.g. 'FAIL  src/__tests__/SomeTest.test.tsx')
      FAILING_TESTS=$(grep '^FAIL ' scripts/test-output.txt | awk '{print $2}' | xargs)
      if [[ -n "$SUMMARY_LINE" ]]; then
        TEST_SUMMARY="$SUMMARY_LINE\nFailing: $FAILING_TESTS"
      fi
      echo -e "${RED}Jest tests failed.${NC}"
      echo "What do you want to do? (fix/wip/abort): "
      read jest_decision
      if [[ "$jest_decision" == "fix" ]]; then
        $SHELL
        exit 1
      elif [[ "$jest_decision" == "wip" ]]; then
        WIP_MODE=true
      else
        echo "Aborted due to Jest failures."
        exit 1
      fi
    else
      # If all tests pass, still include summary
      SUMMARY_LINE=$(grep -E '^Tests:' scripts/test-output.txt | tail -1)
      if [[ -n "$SUMMARY_LINE" ]]; then
        TEST_SUMMARY="$SUMMARY_LINE"
      fi
    fi
    rm -f scripts/test-output.txt

    # 4. Playwright/E2E (always after Jest)
    if [[ -f playwright.config.ts ]]; then
      echo "Starting dev server for E2E..."
      npm run dev > scripts/dev-server-e2e.log 2>&1 &
      DEV_SERVER_PID=$!
      sleep 5
      echo "Running Playwright E2E (advanced script)..."
      ./scripts/adv_fixing_run_playwright_and_capture_output.sh
      # Parse Playwright output for summary and failing test names
      PW_SUMMARY=""
      # Try to extract summary line (e.g. '1 failed, 10 passed, 11 total')
      PW_SUMMARY_LINE=$(grep -Eo '[0-9]+ failed, [0-9]+ passed, [0-9]+ total' scripts/playwright-output.txt | tail -1)
      # Get failing test file names (e.g. 'FAIL  e2e/critical-ui-accessibility.spec.ts')
      PW_FAILING_TESTS=$(grep '^FAIL ' scripts/playwright-output.txt | awk '{print $2}' | xargs)
      if [[ -n "$PW_SUMMARY_LINE" ]]; then
        PW_SUMMARY="E2E: $PW_SUMMARY_LINE"
        if [[ -n "$PW_FAILING_TESTS" ]]; then
        fi
      fi
      if grep -q "failed" scripts/playwright-output.txt; then
        echo -e "${RED}Playwright E2E failed.${NC}"
        echo "\n--- Playwright Failure Details ---" | tee -a scripts/playwright-output.txt
        awk '/^\s*[0-9]+\) /,/^\s*$/' scripts/playwright-output.txt | tee -a scripts/playwright-output.txt
        echo "What do you want to do? (fix/wip/abort): "
        read pw_decision
        if [[ "$pw_decision" == "fix" ]]; then
          kill $DEV_SERVER_PID 2>/dev/null
          $SHELL
          exit 1
        elif [[ "$pw_decision" == "wip" ]]; then
          WIP_MODE=true
        else
          kill $DEV_SERVER_PID 2>/dev/null
          echo "Aborted due to Playwright failures."
          exit 1
        fi
      fi
      rm -f scripts/playwright-output.txt
      kill $DEV_SERVER_PID 2>/dev/null
    fi
  fi
fi

# --- ENHANCED PRE-COMMIT SUMMARY ---

show_precommit_summary_and_stash_prompt() {
# 1. Show last 1-3 commit messages
printf "\n\033[1;34m==== Last 3 commit messages ====\033[0m\n"
git log -3 --oneline --decorate --color=always | tee >(cat >> "$LOG_FILE")
PRECOMMIT_SUMMARY+="==== Last 3 commit messages ===="
PRECOMMIT_SUMMARY+="\n$(git log -3 --oneline --decorate)\n"

# 2. Show last lint/type/test/E2E status (colorized, with error/warning counts)
LINT_SUMMARY=""
TS_SUMMARY=""
JEST_SUMMARY=""
PW_SUMMARY=""
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
NC='\033[0m'
if [[ -f scripts/eslint-output.txt ]]; then
  ERRORS=$(grep -c 'error' scripts/eslint-output.txt)
  WARNINGS=$(grep -c 'warning' scripts/eslint-output.txt)
  if [[ $ERRORS -gt 0 ]]; then
    LINT_SUMMARY="${RED}Lint: $ERRORS errors, $WARNINGS warnings${NC}"
  elif [[ $WARNINGS -gt 0 ]]; then
    LINT_SUMMARY="${YELLOW}Lint: 0 errors, $WARNINGS warnings${NC}"
  else
    LINT_SUMMARY="${GREEN}Lint: 0 errors, 0 warnings${NC}"
  fi
fi
if [[ -f scripts/ts-output.txt ]]; then
  ERRORS=$(grep -c 'error TS' scripts/ts-output.txt)
  if [[ $ERRORS -gt 0 ]]; then
    TS_SUMMARY="${RED}Type: $ERRORS errors${NC}"
  else
    TS_SUMMARY="${GREEN}Type: 0 errors${NC}"
  fi
fi
if [[ -f scripts/test-output.txt ]]; then
  FAILS=$(grep -E '^Tests:' scripts/test-output.txt | grep -o '[0-9]* failed' | awk '{s+=$1} END {print s+0}')
  if [[ $FAILS -gt 0 ]]; then
    JEST_SUMMARY="${RED}Jest: $FAILS failed${NC}"
  else
    JEST_SUMMARY="${GREEN}Jest: 0 failed${NC}"
  fi
fi
if [[ -f scripts/playwright-output.txt ]]; then
  PW_FAILS=$(grep -Eo '[0-9]+ failed' scripts/playwright-output.txt | awk '{s+=$1} END {print s+0}')
  if [[ $PW_FAILS -gt 0 ]]; then
    PW_SUMMARY="${RED}E2E: $PW_FAILS failed${NC}"
  else
    PW_SUMMARY="${GREEN}E2E: 0 failed${NC}"
  fi
fi
printf "\n\033[1;34m==== Last Lint/Type/Test/E2E Status ====\033[0m\n"
echo "$LINT_SUMMARY"
echo "$TS_SUMMARY"
echo "$JEST_SUMMARY"
echo "$PW_SUMMARY"
PRECOMMIT_SUMMARY+="==== Last Lint/Type/Test/E2E Status ===="
PRECOMMIT_SUMMARY+="\n$LINT_SUMMARY\n$TS_SUMMARY\n$JEST_SUMMARY\n$PW_SUMMARY\n"

# 3. Warn if uncommitted changes in other branches, offer to stash/pop
if [[ -n $(git stash list) ]]; then
  printf '\n\033[1;33mWARNING: You have stashed (uncommitted) changes in other branches!\033[0m\n'
  git stash list | tee >(cat >> "$LOG_FILE")
  PRECOMMIT_SUMMARY+="WARNING: You have stashed (uncommitted) changes in other branches!\n$(git stash list)\n"
  echo "Do you want to pop a stash now? (y/n): "
  read pop_stash
  if [[ "$pop_stash" == "y" ]]; then
    git stash list
    echo "Enter the stash number to pop (e.g., 0 for the top stash), or leave blank to skip:"
    read stash_num
    if [[ -n "$stash_num" ]]; then
      git stash pop stash@{$stash_num}
    fi
  fi
fi

# 4. Show staged vs. unstaged changes, and deleted/renamed files separately
printf "\n\033[1;34m==== Staged Changes ====\033[0m\n"
git diff --cached --name-status | tee >(cat >> "$LOG_FILE")
PRECOMMIT_SUMMARY+="==== Staged Changes ===="
PRECOMMIT_SUMMARY+="\n$(git diff --cached --name-status)\n"
printf "\n\033[1;34m==== Unstaged Changes ====\033[0m\n"
git diff --name-status | tee >(cat >> "$LOG_FILE")
PRECOMMIT_SUMMARY+="==== Unstaged Changes ===="
PRECOMMIT_SUMMARY+="\n$(git diff --name-status)\n"

# 5. Show deleted and renamed files separately, prompt for critical deletions
printf '\n\033[1;34m==== Deleted Files (staged) ====\033[0m\n'
DELETED_FILES=($(git diff --cached --name-status | awk '$1=="D"{print $2}'))
for f in "${DELETED_FILES[@]}"; do
  echo "$f"
  # If critical, prompt for confirmation
  if [[ "$f" == "serviceAccountKey.json" || "$f" == "firebase.json" || "$f" == "playwright.config.ts" || "$f" == src/* || "$f" == e2e/* || "$f" == public/* || "$f" == scripts/* ]]; then
    echo "\033[1;31mWARNING: You are deleting a critical file: $f\033[0m"
    echo "Are you sure you want to delete this file? (yes/no): "
    read confirm_delete
    if [[ "$confirm_delete" != "yes" ]]; then
      git restore --staged "$f"
      echo "File $f was unstaged from deletion."
    fi
  fi
  PRECOMMIT_SUMMARY+="Deleted: $f\n"
done
printf '\n\033[1;34m==== Renamed Files (staged) ====\033[0m\n'
git diff --cached --name-status | awk '$1 ~ /^R/ {print $2 " -> " $3}' | tee >(cat >> "$LOG_FILE")
PRECOMMIT_SUMMARY+="==== Renamed Files (staged) ===="
PRECOMMIT_SUMMARY+="\n$(git diff --cached --name-status | awk '$1 ~ /^R/ {print $2 " -> " $3}')\n"

# 6. File type and directory summary (staged changes)
printf '\n\033[1;34m==== File Type Summary (staged) ====\033[0m\n'
git diff --cached --name-only | awk -F. '{print $NF}' | sort | uniq -c | sort -nr | tee >(cat >> "$LOG_FILE")
PRECOMMIT_SUMMARY+="==== File Type Summary (staged) ===="
PRECOMMIT_SUMMARY+="\n$(git diff --cached --name-only | awk -F. '{print $NF}' | sort | uniq -c | sort -nr)\n"
printf '\n\033[1;34m==== Directory Summary (staged) ====\033[0m\n'
git diff --cached --name-only | awk -F/ '{print $1}' | sort | uniq -c | sort -nr | tee >(cat >> "$LOG_FILE")
PRECOMMIT_SUMMARY+="==== Directory Summary (staged) ===="
PRECOMMIT_SUMMARY+="\n$(git diff --cached --name-only | awk -F/ '{print $1}' | sort | uniq -c | sort -nr)\n"

# 7. Prompt to stage unstaged files
UNSTAGED=$(git diff --name-only)
if [[ -n "$UNSTAGED" ]]; then
  echo "\nYou have unstaged changes. Do you want to stage all unstaged changes? (y/n): "
  read stage_all
  if [[ "$stage_all" == "y" ]]; then
    git add -A
  else
    echo "Select files to stage (enter numbers separated by space, or leave blank to skip):"
    IFS=$'\n' read -rd '' -a unstaged_files <<<"$(git diff --name-only)"
    for i in "${!unstaged_files[@]}"; do
      printf "%2d) %s\n" $((i+1)) "${unstaged_files[$i]}"
    done
    read -a file_nums
    for num in "${file_nums[@]}"; do
      idx=$((num-1))
      if [[ $idx -ge 0 && $idx -lt ${#unstaged_files[@]} ]]; then
        git add "${unstaged_files[$idx]}"
      fi
    done
  fi
fi

# 8. Optionally open changed files in editor
CHANGED_FILES_LIST=($(git diff --cached --name-only))
echo "\nDo you want to open any staged changed files in your editor for review? (y/n): "
read open_files
if [[ "$open_files" == "y" ]]; then
  echo "Select files to open (enter numbers separated by space, or leave blank to skip):"
  for i in "${!CHANGED_FILES_LIST[@]}"; do
    printf "%2d) %s\n" $((i+1)) "${CHANGED_FILES_LIST[$i]}"
  done
  read -a open_nums
  for num in "${open_nums[@]}"; do
    idx=$((num-1))
    if [[ $idx -ge 0 && $idx -lt ${#CHANGED_FILES_LIST[@]} ]]; then
      open "${CHANGED_FILES_LIST[$idx]}"
    fi
  done
fi

# Save pre-commit summary to log file
if [[ -w "$LOG_FILE" ]]; then
  echo -e "\n==== Pre-commit summary ($(date '+%Y-%m-%d %H:%M:%S %Z')) ====" >> "$LOG_FILE"
  echo -e "$PRECOMMIT_SUMMARY" >> "$LOG_FILE"
fi

# --- ALWAYS PUSH/UPLOAD SECTION ---
# If WIP_MODE is set, commit as WIP, otherwise normal commit
# Always push/force-push to all specified branches/remotes

# If only committing to current branch, skip remote sync and exit
if [[ "$COMMIT_CURRENT_BRANCH_ONLY" = true ]]; then
  echo -e "${GREEN}Committed changes to current branch only. Skipping remote sync as requested.${NC}"
  echo "Committed changes to current branch only. Skipped remote sync." >> "$LOG_FILE"
  # Optionally print last sync time
  if [[ -w "$LOG_FILE" ]]; then
    echo "Last commit-only sync: $(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$LOG_FILE"
  fi
  exit 0
fi

summary_table=()

for target in $all_targets; do
  # Split target into remote and branch (format: remote/branch)
  remote="${target%%/*}"
  branch="${target#*/}"
  if [[ -z "$remote" || -z "$branch" || "$remote" == "$branch" ]]; then
    echo "Skipping invalid target: $target"
    continue
  fi
  echo "\n--- Syncing all files to $remote/$branch ---"
  echo "\n--- Syncing all files to $remote/$branch ---" >> "$LOG_FILE"
  # Add and commit all changes
  git add -A
  if git diff --cached --quiet; then
    echo "No changes to commit for $remote/$branch. Creating empty commit to update timestamp."
    echo "No changes to commit for $remote/$branch. Creating empty commit to update timestamp." >> "$LOG_FILE"
    if $WIP_MODE; then
      COMMIT_MSG="WIP: sync (force empty commit, tests/type/lint/e2e failing or skipped)\n\nNo file changes.\n$TEST_SUMMARY$TS_SUMMARY$ESLINT_SUMMARY$PW_SUMMARY\n\nAutomated sync script. Ensures all files in the current branch are present and up to date on all listed branches and remotes. Overwrites remote state."
    else
      COMMIT_MSG="chore(sync): force empty commit to $remote/$branch\n\nNo file changes.\n$TEST_SUMMARY$TS_SUMMARY$ESLINT_SUMMARY$PW_SUMMARY\n\nAutomated sync script. Ensures all files in the current branch are present and up to date on all listed branches and remotes. Overwrites remote state."
    fi
    git commit --allow-empty -m "$COMMIT_MSG"
  else
    CHANGED=$(git status --short)
    echo "\nChanged files for $remote/$branch:"
    if [[ -n "$CHANGED" ]]; then
      echo "$CHANGED" | while read -r line; do
        echo -e "${GREEN}$line${NC}"
      done
    fi
    echo "\nChanged files for $remote/$branch:" >> "$LOG_FILE"
    echo "$CHANGED" >> "$LOG_FILE"
    if $WIP_MODE; then
      COMMIT_MSG="WIP: sync (tests/type/lint/e2e failing or skipped)\n\nFiles affected:\n$CHANGED\n$TEST_SUMMARY$TS_SUMMARY$ESLINT_SUMMARY$PW_SUMMARY\n\nAutomated sync script. Ensures all files in the current branch are present and up to date on all listed branches and remotes. Overwrites remote state."
    else
      COMMIT_MSG="chore(sync): auto-sync all files to $remote/$branch\n\nFiles affected:\n$CHANGED\n$TEST_SUMMARY$TS_SUMMARY$ESLINT_SUMMARY$PW_SUMMARY\n\nAutomated sync script. Ensures all files in the current branch are present and up to date on all listed branches and remotes. Overwrites remote state."
    fi
    git commit -m "$COMMIT_MSG"
  fi
  # Print message before pushing
  echo "Pushing to $remote/$branch..."
  # Push to remote/branch
  if git push $remote HEAD:$branch; then
    PUSH_MODE="normal"
    PUSH_SUCCESS=true
  else
    echo "${RED}Normal push failed for $remote/$branch. The remote branch may have diverged.${NC}"
    echo "Normal push failed for $remote/$branch. The remote branch may have diverged." >> "$LOG_FILE"
    echo "Automatically force pushing to overwrite remote history..."
    echo "Force pushing to $remote/$branch..."
    if git push --force $remote HEAD:$branch; then
      PUSH_MODE="force"
      PUSH_SUCCESS=true
    else
      PUSH_MODE="force"
      PUSH_SUCCESS=false
    fi
  fi
  LOCAL_HASH=$(git rev-parse HEAD)
  REMOTE_HASH=$(git ls-remote $remote $branch | awk '{print $1}')
  if [[ "$PUSH_SUCCESS" = true && "$LOCAL_HASH" == "$REMOTE_HASH" ]]; then
    echo -e "${GREEN}✅ $remote/$branch is up to date with local commit $LOCAL_HASH (push: $PUSH_MODE)${NC}"
    echo "✅ $remote/$branch is up to date with local commit $LOCAL_HASH (push: $PUSH_MODE)" >> "$LOG_FILE"
    summary_table+="$remote/$branch: $LOCAL_HASH (OK, $PUSH_MODE)\n"
  elif [[ "$PUSH_SUCCESS" = true ]]; then
    echo -e "${YELLOW}⚠️  $remote/$branch pushed, but commit hash mismatch (local: $LOCAL_HASH, remote: $REMOTE_HASH, push: $PUSH_MODE)${NC}"
    echo "⚠️  $remote/$branch pushed, but commit hash mismatch (local: $LOCAL_HASH, remote: $REMOTE_HASH, push: $PUSH_MODE)" >> "$LOG_FILE"
    summary_table+="$remote/$branch: $LOCAL_HASH (WARNING! remote has $REMOTE_HASH, $PUSH_MODE)\n"
  else
    echo -e "${RED}❌ WARNING: $remote/$branch did NOT update to $LOCAL_HASH (remote has $REMOTE_HASH, push: $PUSH_MODE)${NC}"
    echo "❌ WARNING: $remote/$branch did NOT update to $LOCAL_HASH (remote has $REMOTE_HASH, push: $PUSH_MODE)" >> "$LOG_FILE"
    summary_table+="$remote/$branch: $LOCAL_HASH (MISMATCH! remote has $REMOTE_HASH, $PUSH_MODE)\n"
  fi
  if [[ "$remote" == "origin" ]]; then
    echo "View branch on GitHub: https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$branch"
    echo "View branch on GitHub: https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$branch" >> "$LOG_FILE"
    open "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$branch"
  fi
  # CI/CD: Trigger GitHub Actions workflow_dispatch if .github/workflows/ci.yml exists
  if [[ -f .github/workflows/ci.yml ]]; then
    echo "Triggering CI/CD for $remote/$branch (if configured on remote)."
    echo "Triggering CI/CD for $remote/$branch (if configured on remote)." >> "$LOG_FILE"
    # Optionally, you can use gh CLI to trigger workflow_dispatch if you have permissions
    # gh workflow run ci.yml --ref $branch
  fi
  # Optional: Deploy to gh-pages if branch is gh-pages
  if [[ "$branch" == "gh-pages" ]]; then
    echo "\nYou just updated gh-pages. Do you want to build and deploy the latest dist to gh-pages? (yes/no): "
    echo "\nYou just updated gh-pages. Do you want to build and deploy the latest dist to gh-pages? (yes/no): " >> "$LOG_FILE"
    read deploy_decision
    if [[ "$deploy_decision" == "yes" ]]; then
      echo "Running npm run build..."
      echo "Running npm run build..." >> "$LOG_FILE"
      npm run build
      echo "Deploying dist/ to gh-pages using npx gh-pages -d dist ..."
      echo "Deploying dist/ to gh-pages using npx gh-pages -d dist ..." >> "$LOG_FILE"
      npx gh-pages -d dist
      echo "Deployed to https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/"
      echo "Deployed to https://youngjnick.github.io/Massage-Therapy-FIREBASE-PRO/" >> "$LOG_FILE"
    else
      echo "Skipped deploy to gh-pages."
      echo "Skipped deploy to gh-pages." >> "$LOG_FILE"
    fi
  fi
  echo "Done with $remote/$branch."
  echo "Done with $remote/$branch." >> "$LOG_FILE"
done

# Update last sync time in log file (guarded)
if [[ -w "$LOG_FILE" ]]; then
  echo "Last sync: $(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$LOG_FILE"
fi

echo "\nAll specified branches and remotes have been updated with all files from the current branch."
echo "\nSummary of updates:"
# Print summary table with color: green for OK, yellow for WARNING, red for MISMATCH
IFS=$'\n'
for line in $(echo -e "$summary_table"); do
  if [[ "$line" == *"OK"* ]]; then
    echo -e "${GREEN}$line${NC}"
  elif [[ "$line" == *"WARNING"* ]]; then
    echo -e "${YELLOW}$line${NC}"
  elif [[ "$line" == *"MISMATCH"* ]]; then
    echo -e "${RED}$line${NC}"
  else
    echo "$line"
  fi
done
unset IFS
# Guard all log writes
if [[ -w "$LOG_FILE" ]]; then
  echo "\nSummary of updates:" >> "$LOG_FILE"
  echo "$summary_table" >> "$LOG_FILE"
fi

# (Commented out) Seeding script call. Manual seeding is now required before running this sync script.
# echo "Seeding Firestore questions..."
# node scripts/upload_questions_to_firestore_2.js e
