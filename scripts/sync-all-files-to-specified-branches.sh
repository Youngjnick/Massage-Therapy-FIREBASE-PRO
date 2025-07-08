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

# --- SUMMARY FUNCTION ---
show_stash_and_precommit_summary() {
  # Color definitions
  local GREEN='\033[32m'
  local RED='\033[31m'
  local YELLOW='\033[33m'
  local BLUE='\033[1;34m'
  local PURPLE='\033[1;35m'
  local NC='\033[0m'

  # Get counts for grouping
  local status_output=$(git status --porcelain)
  local modified_count=$(echo "$status_output" | grep -c "^.M")
  local added_count=$(echo "$status_output" | grep -c "^A")
  local deleted_count=$(echo "$status_output" | grep -c "^.D")
  local untracked_count=$(echo "$status_output" | grep -c "^??")
  local deleted_report_count=$(echo "$status_output" | grep -c "playwright-report/data/.*\.zip")
  
  # Prepare title based on what's changing
  local title="Sync project files:"
  [[ $modified_count -gt 0 ]] && title="$title updated files"
  [[ $added_count -gt 0 ]] && title="$title, new additions"
  [[ $deleted_count -gt 0 ]] && title="$title, cleanup"

  echo "${PURPLE}--- Commit message preview ---${NC}"
  if [[ $SKIP_TESTS == true ]]; then
    echo "WIP: $title (tests/lint/type checks skipped)"
  else
    echo "$title"
  fi
  
  # 1. Branch and sync status
  local current_branch=$(git symbolic-ref --short -q HEAD)
  echo "${BLUE}Branch Status${NC}"
  echo "Current branch: ${GREEN}$current_branch${NC}"
  
  # Check if branch is behind/ahead of remote
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
  
  # 2. Last commit details
  echo "\n${BLUE}Recent Changes${NC}"
  git --no-pager log -1 --stat --color
  
  # 3. Modified files summary
  echo "\n${BLUE}--- Changed Files ---${NC}"
  if [[ -n $status_output ]]; then
    # Group changes by type
    echo "\nScript Changes:"
    echo "$status_output" | grep "scripts/" | sed 's/^/  /'
    
    echo "\nTest Changes:"
    echo "$status_output" | grep -E "tests/|e2e/|\.spec\." | sed 's/^/  /'
    
    # If there are many deleted report files, summarize them
    if [[ $deleted_report_count -gt 0 ]]; then
      echo "\nCleanup:"
      echo "  Removed $deleted_report_count old test report files"
    fi
    
    # Show other changes
    echo "\nOther Changes:"
    echo "$status_output" | grep -vE "scripts/|tests/|e2e/|\.spec\.|playwright-report/data/.*\.zip" | sed 's/^/  /'
    
    # Show totals
    echo "\nSummary:"
    [[ $modified_count -gt 0 ]] && echo "  ${YELLOW}Modified: $modified_count${NC}"
    [[ $added_count -gt 0 ]] && echo "  ${GREEN}Added: $added_count${NC}"
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
  # Split branch_input on commas and whitespace (zsh compatible), trim, and only add non-empty
  branch_array=(${(s:,:)branch_input// /,})
  for b in "${branch_array[@]}"; do
    b_trimmed="${b//[[:space:]]/}"
    if [[ -n "$b_trimmed" ]]; then
      branches+=("$b_trimmed")
    fi
  done
fi

# Accept any entry as a remote branch by default (origin/branch)
# Combine remotes and branches into a single targets array (only valid remote/branch pairs)
all_targets=()
for remote in $remotes; do
  # Only add if remote is a real git remote
  if git remote | grep -qx "$remote"; then
    for branch in $branches; do
      # Only add if branch is non-empty and not just whitespace
      branch_trimmed="${branch//[[:space:]]/}"
      if [[ -n "$branch_trimmed" ]]; then
        all_targets+=("$remote/$branch_trimmed")
      fi
    done
  fi
  # Do NOT treat branch names as remotes
  # This prevents invalid targets like branch/branch
  # Only valid remote/branch pairs are added
  # Never add origin/ or main4 alone
done
# Remove duplicates and filter out any invalid targets (must match remote/branch)
all_targets=($(printf "%s\n" "${all_targets[@]}" | grep -E '^[^/]+/.+$' | awk '!seen[$0]++'))

# Diagnostic: print all_targets before confirmation
if [[ ${#all_targets[@]} -eq 0 ]]; then
  echo "\033[1;31mERROR: No valid remote/branch targets found. Exiting.\033[0m"
  exit 1
fi
printf "\n\033[1;34m[DIAG] Final sync targets:\033[0m\n"
for t in "${all_targets[@]}"; do
  echo "  $t"
done

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

# --- INTERACTIVE COMMIT MODE PROMPT ---
COMMIT_MODE="commit"
if [[ -n $(git status --porcelain) ]]; then
  echo -e "\nChoose commit mode:"
  echo "  1) commit  - Normal commit and push to remote (default)"
  echo "  2) wip     - WIP commit and push to remote"
  echo "  3) local   - Commit locally only, do NOT push to remote"
  echo "  4) abort   - Abort and exit"
  echo -n "Enter choice [commit/wip/local/abort]: "
  read commit_mode_choice
  case "$commit_mode_choice" in
    wip|WIP|2)
      COMMIT_MODE="wip"
      ;;
    local|LOCAL|3)
      COMMIT_MODE="local"
      ;;
    abort|ABORT|4)
      echo "Aborted by user. No changes made."
      exit 1
      ;;
    commit|COMMIT|1|"")
      COMMIT_MODE="commit"
      ;;
    *)
      echo "Invalid choice. Defaulting to 'commit'."
      COMMIT_MODE="commit"
      ;;
  esac
fi

# Normalize COMMIT_MODE to lowercase for consistent checks
eval COMMIT_MODE="\${COMMIT_MODE:l}"

# Set SKIP_TESTS if WIP mode was selected interactively
if [[ "$COMMIT_MODE" == "wip" ]]; then
  SKIP_TESTS=true
fi

# Always stage and commit all changes if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  # Classic commit message preview: WIP/test/lint summaries, changed files, diff summary
  CHANGED_FILES=$(git status --short)
  # Use unstaged diff for preview so user always sees all changes
  DIFF_STAT=$(git diff --stat)
  commit_msg=""
  # Build grouped summary by file type
  SCRIPTS_LIST=""
  LOGS_LIST=""
  OTHER_LIST=""
  while read -r line; do
    STATUS=$(echo "$line" | awk '{print $1}')
    FILE=$(echo "$line" | awk '{print $2}')
    if [[ "$STATUS" == D ]]; then
      if [[ "$FILE" == scripts/*.sh ]]; then
        SCRIPTS_LIST+="-Deleted $FILE\n"
      elif [[ "$FILE" == *.log ]]; then
        LOGS_LIST+="-Deleted $FILE\n"
      elif [[ -n "$FILE" ]]; then
        OTHER_LIST+="-Deleted $FILE\n"
      fi
    else
      if [[ "$FILE" == scripts/*.sh ]]; then
        SCRIPTS_LIST+="-Updated $FILE\n"
      elif [[ "$FILE" == *.log ]]; then
        LOGS_LIST+="-Updated $FILE\n"
      elif [[ -n "$FILE" ]]; then
        OTHER_LIST+="-Updated $FILE\n"
      fi
    fi
  done <<< "$CHANGED_FILES"
  SUMMARY_OVERVIEW=""
  [[ -n "$SCRIPTS_LIST" ]] && SUMMARY_OVERVIEW+=" Scripts:\n$SCRIPTS_LIST"
  [[ -n "$LOGS_LIST" ]] && SUMMARY_OVERVIEW+=" Logs:\n$LOGS_LIST"
  [[ -n "$OTHER_LIST" ]] && SUMMARY_OVERVIEW+=" Other:\n$OTHER_LIST"
  SUMMARY_OVERVIEW+="-Improved sync or automation scripts."

  # --- Commit Message Title ---
  # Build a descriptive, purpose-driven title
  TITLE="Sync project files: updated scripts and logs"
  if [[ "$SKIP_TESTS" = true ]]; then
    TITLE+=" (tests/lint/type checks skipped)"
  fi
  if [[ "$COMMIT_MODE" == "wip" ]]; then
    TITLE="WIP: $TITLE"
  elif [[ "$COMMIT_MODE" == "commit" ]]; then
    TITLE="Commit: $TITLE"
  fi
  commit_msg="$TITLE\n"
  commit_msg+="\n--- Summary ---\n$SUMMARY_OVERVIEW\n"
  # --- Purpose Section (dynamic) ---
  PURPOSE_MSG=""
  if [[ -n "$SCRIPTS_LIST" && -n "$LOGS_LIST" ]]; then
    SCRIPTS_FILES=$(echo "$SCRIPTS_LIST" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    LOGS_FILES=$(echo "$LOGS_LIST" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    PURPOSE_MSG="Synchronized automation script ($SCRIPTS_FILES) and updated log file ($LOGS_FILES) to maintain up-to-date automation and accurate history."
  elif [[ -n "$SCRIPTS_LIST" ]]; then
    SCRIPTS_FILES=$(echo "$SCRIPTS_LIST" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    PURPOSE_MSG="Updated automation script ($SCRIPTS_FILES) to improve project workflow."
  elif [[ -n "$LOGS_LIST" ]]; then
    LOGS_FILES=$(echo "$LOGS_LIST" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    PURPOSE_MSG="Archived recent log activity ($LOGS_FILES) for traceability."
  elif [[ -n "$OTHER_LIST" ]]; then
    OTHER_FILES=$(echo "$OTHER_LIST" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    PURPOSE_MSG="Updated project files ($OTHER_FILES) as part of routine maintenance."
  else
    PURPOSE_MSG="Project sync and maintenance."
  fi
  commit_msg+="\n--- Purpose ---\n$PURPOSE_MSG"

  # --- Changed Files Section ---
  commit_msg+="\n\n--- Changed Files ---\n$CHANGED_FILES\n"
  # --- Diff Summary Section ---
  # Prefix each diffstat line with a dash (no space), preserve alignment, and add a blank line before the summary
  DIFF_STAT_DASHED=""
  DIFF_STAT_SUMMARY=""
  while IFS= read -r line; do
    if [[ "$line" =~ files?\ changed ]]; then
      DIFF_STAT_SUMMARY="$line"
    elif [[ -n "$line" ]]; then
      DIFF_STAT_DASHED+="-$line\n"
    fi
  done <<< "$DIFF_STAT"
  if [[ -n "$DIFF_STAT_DASHED" ]]; then
    commit_msg+="\n--- Diff Summary ---\n${DIFF_STAT_DASHED%\\n}\n"
  else
    commit_msg+="\n--- Diff Summary ---\n"
  fi
  if [[ -n "$DIFF_STAT_SUMMARY" ]]; then
    commit_msg+="\n$DIFF_STAT_SUMMARY"
  fi

  # --- Purpose Section (dynamic) ---
  # --- Purpose Section (dynamic) ---
  if [[ "$SKIP_TESTS" = true ]]; then
    commit_msg+="\n--- Test Results ---\nTests skipped."
  fi
  commit_msg+="\n\nSync performed: $(date -u '+%Y-%m-%d %H:%M UTC')\n"
  commit_msg+="\n--- Reviewer Notes ---\nNo manual testing required; automation only."
  # Show the preview in the terminal
  echo -e "\n\033[1;36m--- Commit message preview ---\033[0m\n$commit_msg\n"
  echo "Do you want to (e)dit, (a)ccept, or (q)uit? [a/e/q]: "
  read commit_msg_action
  case "$commit_msg_action" in
    e|E)
      TMP_COMMIT_MSG_FILE=$(mktemp)
      echo "$commit_msg" > "$TMP_COMMIT_MSG_FILE"
      ${EDITOR:-nano} "$TMP_COMMIT_MSG_FILE"
      commit_msg=$(cat "$TMP_COMMIT_MSG_FILE")
      rm -f "$TMP_COMMIT_MSG_FILE"
      ;;
    q|Q)
      echo "Aborted by user before commit."
      exit 1
      ;;
    a|A|"")
      echo -e "\n${GREEN}Committing changes...${NC}"
      commit_with_spinner "Applying commit with auto-generated message"
      ;;
    *)
      ;;
  esac
  git add -A
  # Write commit message to a temp file for reuse in worktree
  TMP_COMMIT_MSG_FILE=$(mktemp)
  echo "$commit_msg" > "$TMP_COMMIT_MSG_FILE"
  git commit -F "$TMP_COMMIT_MSG_FILE"

  # Always show stash and precommit summary after commit (all modes except abort)
  show_stash_and_precommit_summary

  if [[ "$COMMIT_MODE" == "local" ]]; then
    echo -e "\n\033[1;33mCommitted locally only. No push to remote performed.\033[0m"
    exit 0
  fi
  if [[ "origin" == "origin" && -n "$CURRENT_BRANCH" ]]; then
    open "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$CURRENT_BRANCH"
  fi
  # Only run tests for normal commit mode
  if [[ "$SKIP_TESTS" = false ]]; then
    # --- TEST & LINT SECTION ---
    # Always run: ESLint -> TypeScript -> Jest -> Playwright (in this order)
    # If any fail, prompt for fix/wip/abort, but always allow WIP and always push/force-push unless abort
    WIP_MODE=false
    TEST_SUMMARY=""
    PW_SUMMARY=""
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
    TEST_SUMMARY=""
    if grep -q "failing" scripts/test-output.txt; then
      SUMMARY_LINE=$(grep -E '^Tests:' scripts/test-output.txt | tail -1)
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
      PW_SUMMARY=""
      PW_SUMMARY_LINE=$(grep -Eo '[0-9]+ failed' scripts/playwright-output.txt | awk '{s+=$1} END {print s+0}')
      PW_FAILING_TESTS=$(grep '^FAIL ' scripts/playwright-output.txt | awk '{print $2}' | xargs)
      if [[ -n "$PW_SUMMARY_LINE" ]]; then
        PW_SUMMARY="E2E: $PW_SUMMARY_LINE"
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
else
  echo -e "${GREEN}No uncommitted changes to auto-commit.${NC}"
  show_stash_and_precommit_summary
fi

# If local mode, skip all push logic and exit after commit
if [[ "$COMMIT_MODE" == "local" ]]; then
  echo -e "\n${YELLOW}Local commit only: No remote branches will be updated.${NC}"
  exit 0
fi

# --- ALWAYS PUSH/UPLOAD SECTION ---
# Always push/force-push to all specified branches/remotes

# Save the current branch to return to it later
ORIGINAL_BRANCH=$(git symbolic-ref --short -q HEAD)
ORIGINAL_COMMIT=$(git rev-parse HEAD)
REPO_ROOT=$(git rev-parse --show-toplevel)

for target in $all_targets; do
  remote="${target%%/*}"
  branch="${target#*/}"
  if [[ -z "$remote" || -z "$branch" || "$remote" == "$branch" ]]; then
    echo "Skipping invalid target: $target"
    continue
  fi

  # Progress indicator before syncing
  echo -e "\n\033[1;33m[INFO] Preparing to sync all files to $remote/$branch...\033[0m"
  sleep 0.5
  echo -ne "[INFO] Setting up worktree and copying files... "
  # The next echo will overwrite this line
  echo -e "\n--- Syncing all files to $remote/$branch ---"
  echo -e "\n--- Syncing all files to $remote/$branch ---" >> "$LOG_FILE"

  # Create a temporary worktree for the target branch
  TMP_WORKTREE="$REPO_ROOT/.sync-tmp-$branch-$$"
  git worktree remove --force "$TMP_WORKTREE" 2>/dev/null
  if git show-ref --verify --quiet refs/heads/$branch; then
    git worktree add "$TMP_WORKTREE" $branch
  else
    git worktree add -b $branch "$TMP_WORKTREE" $ORIGINAL_COMMIT
  fi

  # Copy all files from the current working tree to the worktree (excluding .git and node_modules)
  rsync -a --exclude='.git' --exclude='node_modules' --exclude='.sync-tmp-*' "$REPO_ROOT/" "$TMP_WORKTREE/"

  # Ensure .sync-tmp files are copied to sync_tmp_backups automatically
  BACKUP_TMP="$REPO_ROOT/sync_tmp_backups/.sync-tmp-$branch-$$"
  mkdir -p "$BACKUP_TMP"
  rsync -a --exclude='.git' --exclude='node_modules' --exclude='.sync-tmp-*' "$REPO_ROOT/" "$BACKUP_TMP/"

  # Commit and push in the worktree
  pushd "$TMP_WORKTREE" > /dev/null
  git add -A
  if git diff --cached --quiet; then
    echo "No changes to commit for $remote/$branch. Creating empty commit to update timestamp."
    echo "No changes to commit for $remote/$branch. Creating empty commit to update timestamp." >> "$LOG_FILE"
    commit_with_spinner "Creating empty timestamp commit for $remote/$branch"
  else
    CHANGED=$(git status --short)
    echo "\nChanged files for $remote/$branch:"
    if [[ -n "$CHANGED" ]]; then
      echo "$CHANGED" | while read -r line; do
        echo -e "${GREEN}$line${NC}"
      done
    fi
    printf "\nChanged files for %s:\n" "$remote/$branch" >> "$LOG_FILE"
    echo "$CHANGED" >> "$LOG_FILE"
    commit_with_spinner "Committing changes for $remote/$branch"
  fi

  # Push to the correct remote/branch
  echo "Pushing to $remote/$branch..."
  PUSH_OUTPUT=""
  PUSH_EXIT=0
  PUSH_MODE="normal"
  PUSH_SUCCESS=false
  {
    PUSH_OUTPUT=$(git push $remote $branch 2>&1)
    PUSH_EXIT=$?
  } &
  spinner $! "Pushing changes to $remote/$branch"
  wait
  echo "[DIAG] git push $remote $branch exit code: $PUSH_EXIT"
  printf "[DIAG] git push output:\n%s\n" "$PUSH_OUTPUT"
  if [[ $PUSH_EXIT -eq 0 ]]; then
    PUSH_MODE="normal"
    PUSH_SUCCESS=true
  else
    echo -e "${RED}Normal push failed for $remote/$branch. The remote branch may have diverged.${NC}"
    echo "Normal push failed for $remote/$branch. The remote branch may have diverged." >> "$LOG_FILE"
    echo "Automatically force pushing to overwrite remote history..."
    echo "Force pushing to $remote/$branch..."
    {
      FORCE_PUSH_OUTPUT=$(git push --force $remote $branch 2>&1)
      FORCE_PUSH_EXIT=$?
    } &
    spinner $! "Force pushing changes to $remote/$branch"
    wait
    echo "[DIAG] git push --force $remote $branch exit code: $FORCE_PUSH_EXIT"
    printf "[DIAG] git push --force output:\n%s\n" "$FORCE_PUSH_OUTPUT"
    if [[ $FORCE_PUSH_EXIT -eq 0 ]]; then
      PUSH_MODE="force"
      PUSH_SUCCESS=true
    else
      PUSH_MODE="force"
      PUSH_SUCCESS=false
    fi
  fi

  LOCAL_HASH=$(git rev-parse HEAD)
  REMOTE_HASH=$(git ls-remote $remote $branch | awk '{print $1}')
  # --- Auto-check: verify local commit exists on remote branch ---
  if git ls-remote $remote $branch | grep -q "$LOCAL_HASH"; then
    echo -e "${GREEN} Verified: commit $LOCAL_HASH exists on $remote/$branch${NC}"
    echo " Verified: commit $LOCAL_HASH exists on $remote/$branch" >> "$LOG_FILE"
  else
    echo -e "${RED} WARNING: commit $LOCAL_HASH does NOT exist on $remote/$branch!${NC}"
    echo " WARNING: commit $LOCAL_HASH does NOT exist on $remote/$branch!" >> "$LOG_FILE"
    echo -e "${YELLOW}Troubleshooting: Try running 'git fetch $remote' and 'git ls-remote $remote $branch' manually.${NC}"
    echo "[DIAG] git ls-remote $remote $branch output:"
    git ls-remote $remote $branch
  fi

  # --- Post-push: fetch and compare local and remote branch refs ---
  echo -e "[DIAG] Fetching $remote/$branch after push for direct ref comparison..."
  git fetch $remote $branch
  LOCAL_BRANCH_HASH=$(git rev-parse HEAD)
  REMOTE_BRANCH_HASH=$(git rev-parse $remote/$branch 2>/dev/null)
  SUMMARY_STATUS=""
  if [[ "$LOCAL_BRANCH_HASH" == "$REMOTE_BRANCH_HASH" && -n "$REMOTE_BRANCH_HASH" ]]; then
    echo -e "${GREEN} Local branch and remote branch $remote/$branch are in sync: $LOCAL_BRANCH_HASH${NC}"
    echo " Local branch and remote branch $remote/$branch are in sync: $LOCAL_BRANCH_HASH" >> "$LOG_FILE"
    SUMMARY_STATUS="$remote/$branch: $LOCAL_BRANCH_HASH (OK, $PUSH_MODE, refs match)"
  else
    echo -e "${RED} Local branch and remote branch $remote/$branch are NOT in sync!${NC}"
    echo -e "  Local:  $LOCAL_BRANCH_HASH"
    echo -e "  Remote: $REMOTE_BRANCH_HASH"
    echo " Local branch and remote branch $remote/$branch are NOT in sync!" >> "$LOG_FILE"
    echo "  Local:  $LOCAL_BRANCH_HASH" >> "$LOG_FILE"
    echo "  Remote: $REMOTE_BRANCH_HASH" >> "$LOG_FILE"
    SUMMARY_STATUS="$remote/$branch: $LOCAL_BRANCH_HASH (MISMATCH! refs differ, $PUSH_MODE)"
  fi
  summary_table+=("$SUMMARY_STATUS")
  if [[ "$PUSH_SUCCESS" = true && "$LOCAL_HASH" == "$REMOTE_HASH" ]]; then
    echo -e "${GREEN} $remote/$branch is up to date with local commit $LOCAL_HASH (push: $PUSH_MODE)${NC}"
    echo " $remote/$branch is up to date with local commit $LOCAL_HASH (push: $PUSH_MODE)" >> "$LOG_FILE"
    summary_table+=("$remote/$branch: $LOCAL_HASH (OK, $PUSH_MODE)")
  elif [[ "$PUSH_SUCCESS" = true ]]; then
    echo -e "${YELLOW}  $remote/$branch pushed, but commit hash mismatch (local: $LOCAL_HASH, remote: $REMOTE_HASH, push: $PUSH_MODE)${NC}"
    echo "  $remote/$branch pushed, but commit hash mismatch (local: $LOCAL_HASH, remote: $REMOTE_HASH, push: $PUSH_MODE)" >> "$LOG_FILE"
    summary_table+=("$remote/$branch: $LOCAL_HASH (WARNING! remote has $REMOTE_HASH, $PUSH_MODE)")
  else
    echo -e "${RED} WARNING: $remote/$branch did NOT update to $LOCAL_HASH (remote has $REMOTE_HASH, push: $PUSH_MODE)${NC}"
    echo " WARNING: $remote/$branch did NOT update to $LOCAL_HASH (remote has $REMOTE_HASH, push: $PUSH_MODE)" >> "$LOG_FILE"
    summary_table+=("$remote/$branch: $LOCAL_HASH (MISMATCH! remote has $REMOTE_HASH, $PUSH_MODE)")
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

  # Show commit message used for this sync
  echo -e "\n\033[1;36mCommit message for $remote/$branch:\033[0m"
  echo -e "$COMMIT_MSG\n"
  echo "Commit message for $remote/$branch:" >> "$LOG_FILE"
  echo "$COMMIT_MSG" >> "$LOG_FILE"
  echo "Done with $remote/$branch."
  echo "Done with $remote/$branch." >> "$LOG_FILE"

  popd > /dev/null
  git worktree remove --force "$TMP_WORKTREE"
  # Clean up temp commit message file after last use
  rm -f "$TMP_COMMIT_MSG_FILE"
done

# Update last sync time in log file (guarded)
if [[ -w "$LOG_FILE" ]]; then
  echo "Last sync: $(date '+%Y-%m-%d %H:%M:%S %Z')" >> "$LOG_FILE"
fi

echo
echo "All specified branches and remotes have been updated with all files from the current branch."
echo
echo "Summary of updates:"
# Print summary table with color: green for OK, yellow for WARNING, red for MISMATCH
for line in "${summary_table[@]}"; do
  if [[ "$line" == *"OK"* ]]; then
    printf "%b\n" "${GREEN}${line}${NC}"
  elif [[ "$line" == *"WARNING"* ]]; then
    printf "%b\n" "${YELLOW}${line}${NC}"
  elif [[ "$line" == *"MISMATCH"* ]]; then
    printf "%b\n" "${RED}${line}${NC}"
  else
    echo "$line"
  fi
done
unset IFS
if [[ -w "$LOG_FILE" ]]; then
  echo "" >> "$LOG_FILE"
  echo "Summary of updates:" >> "$LOG_FILE"
  for line in "${summary_table[@]}"; do
    echo "$line" >> "$LOG_FILE"
  done
fi
# (Commented out) Seeding script call. Manual seeding is now required before running this sync script.
# echo "Seeding Firestore questions..."
# node scripts/upload_questions_to_firestore_2.js e