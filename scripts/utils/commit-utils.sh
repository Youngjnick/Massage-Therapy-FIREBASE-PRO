# --- Modular summary section formatting ---
format_commit_summary_section() {
  local label="$1"; local content="$2"
  [[ -n "$content" ]] && echo "\n--- $label ---\n$content"
}

format_commit_purpose() {
  local scripts_list="$1"; local logs_list="$2"; local configs_list="$3"; local docs_list="$4"; local other_list="$5"
  if [[ -n "$scripts_list" && -n "$logs_list" ]]; then
    local scripts_files=$(echo "$scripts_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    local logs_files=$(echo "$logs_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    echo "Synchronized automation script ($scripts_files) and updated log file ($logs_files) to maintain up-to-date automation and accurate history."
  elif [[ -n "$scripts_list" ]]; then
    local scripts_files=$(echo "$scripts_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    echo "Updated automation script ($scripts_files) to improve project workflow."
  elif [[ -n "$logs_list" ]]; then
    local logs_files=$(echo "$logs_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    echo "Archived recent log activity ($logs_files) for traceability."
  elif [[ -n "$configs_list" ]]; then
    local configs_files=$(echo "$configs_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    echo "Updated config files ($configs_files) for environment or build changes."
  elif [[ -n "$docs_list" ]]; then
    local docs_files=$(echo "$docs_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    echo "Updated documentation ($docs_files) for clarity or accuracy."
  elif [[ -n "$other_list" ]]; then
    local other_files=$(echo "$other_list" | sed 's/-Updated //g' | tr '\n' ',' | sed 's/,$//' | sed 's/,$//')
    echo "Updated project files ($other_files) as part of routine maintenance."
  else
    echo "Project sync and maintenance."
  fi
}

# --- Modular temp file commit logic ---
commit_with_tempfile() {
  local commit_msg="$1"
  local tmpfile; tmpfile=$(make_tmpfile)
  echo "$commit_msg" > "$tmpfile"
  git commit -F "$tmpfile"
}

# --- Modular branch deduplication ---
deduplicate_branches() {
  typeset -A seen; local unique=();
  for b in "$@"; do
    [[ -z "${seen[$b]:-}" ]] && unique+=("$b") && seen[$b]=1
  done
  echo "${unique[@]}"
}

# --- Modular repo state check ---
ensure_git_repo_ready() {
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    log_error "Not a git repository. Please initialize a new repository or run this script from the root of a git project."
    exit 1
  fi
  if ! git rev-parse --verify HEAD > /dev/null 2>&1; then
    log_info "Empty repository detected. Creating initial commit on 'main' branch..."
    git checkout -b main
    git add -A
    if git diff-index --quiet HEAD; then
      log_info "No changes to commit. Initial commit not created."
    else
      git commit -m "Initial commit"
    fi
  fi
  local current_branch; current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [[ -z "$current_branch" ]]; then
    log_error "Could not determine the current branch. Please check your git repository status."
    exit 1
  fi
  log_info "Running on branch: $current_branch"
}

# --- Modular summary printing ---
print_commit_summary() {
  local commit_msg="$1"
  print -P "\n%F{cyan}--- Commit message preview ---\n$commit_msg%f\n"
}

# --- Modular all checks orchestrator ---
run_all_checks_and_handle_errors() {
  run_lint_and_handle_errors || return $?
  run_typescript_and_handle_errors || return $?
  local jest_summary; jest_summary=$(run_jest_and_handle_errors) || return $?
  local pw_summary; pw_summary=$(run_playwright_and_handle_errors) || return $?
  print_commit_summary "$jest_summary\n$pw_summary"
}


# commit-utils.sh: Commit message and prompt helpers for sync scripts
# All functions are zsh-native. Only export those needed externally.
#
# Exports:
#   run_lint_and_handle_errors
#   run_typescript_and_handle_errors
#   run_jest_and_handle_errors
#   run_playwright_and_handle_errors
#   commit_and_push_with_summary
#
# Usage: Source this file in your orchestrator script.

#!/bin/zsh
set -euo pipefail





# --- Configurable output file paths ---
ESLINT_OUTPUT_FILE="scripts/eslint-output.txt"
TS_OUTPUT_FILE="scripts/ts-output.txt"
JEST_OUTPUT_FILE="scripts/test-output.txt"
PW_OUTPUT_FILE="scripts/playwright-output.txt"

# --- Configurable remote ---
GIT_REMOTE="${REMOTE:-origin}"


# --- Logging utilities ---
log_info()    { print -P "%F{cyan}[INFO]%f $*"; }
log_warn()    { print -P "%F{yellow}[WARN]%f $*"; }
log_error()   { print -P "%F{red}[ERROR]%f $*"; }

# --- Temp file helpers ---
_tmpfiles=()
make_tmpfile() {
  local tmpfile; tmpfile=$(mktemp)
  _tmpfiles+="$tmpfile"
  echo "$tmpfile"
}
cleanup_tmpfiles() {
  for f in "${_tmpfiles[@]:-}"; do [[ -f "$f" ]] && rm -f "$f"; done
  _tmpfiles=()
}
trap cleanup_tmpfiles EXIT


# --- Modular prompt for fix/wip/abort now in prompt-utils.sh ---
prompt_fix_wip_abort() {
  local context="$1"
  local decision
  decision=$(prompt_for_fix_wip_abort)
  case "$decision" in
    fix) $SHELL; exit 1 ;;
    wip) return 2 ;;
    *) log_error "Aborted due to $context errors."; exit 1 ;;
  esac
}

# Run ESLint and handle errors (modular, zsh-native)
run_lint_and_handle_errors() {
  print -P "%F{cyan}Running ESLint...%f"
  npx eslint . | tee "$ESLINT_OUTPUT_FILE"
  if grep -q "error" "$ESLINT_OUTPUT_FILE"; then
    print -P "%F{red}Lint errors detected.%f"
    grep -E '^[^ ]+\.(ts|tsx|js|jsx):[0-9]+:[0-9]+' "$ESLINT_OUTPUT_FILE" | while read -r line; do
      print -P "%F{red}$line%f"
    done
    prompt_fix_wip_abort "Lint"
  fi
  rm -f "$ESLINT_OUTPUT_FILE"
  return 0
}

# Run TypeScript and handle errors (modular, zsh-native)
run_typescript_and_handle_errors() {
  print -P "%F{cyan}Running TypeScript type check...%f"
  npx tsc --noEmit | tee "$TS_OUTPUT_FILE"
  if [[ $? -ne 0 ]]; then
    print -P "%F{red}TypeScript errors detected.%f"
    grep -E '^[^ ]+\.(ts|tsx|js|jsx):[0-9]+:[0-9]+' "$TS_OUTPUT_FILE" | while read -r line; do
      print -P "%F{red}$line%f"
    done
    prompt_fix_wip_abort "TypeScript"
  fi
  rm -f "$TS_OUTPUT_FILE"
  return 0
}

# Run Jest and handle errors (modular, zsh-native)
run_jest_and_handle_errors() {
  print -P "%F{cyan}Running Jest tests...%f"
  npm test -- --reporter=default | tee "$JEST_OUTPUT_FILE"
  local test_summary=""
  if grep -q "failing" "$JEST_OUTPUT_FILE"; then
    local summary_line=$(grep -E '^Tests:' "$JEST_OUTPUT_FILE" | tail -1)
    local failing_tests=$(grep '^FAIL ' "$JEST_OUTPUT_FILE" | awk '{print $2}' | xargs)
    if [[ -n "$summary_line" ]]; then
      test_summary="$summary_line\nFailing: $failing_tests"
    fi
    print -P "%F{red}Jest tests failed.%f"
    prompt_fix_wip_abort "Jest"
  else
    local summary_line=$(grep -E '^Tests:' "$JEST_OUTPUT_FILE" | tail -1)
    if [[ -n "$summary_line" ]]; then
      test_summary="$summary_line"
    fi
  fi
  rm -f "$JEST_OUTPUT_FILE"
  echo "$test_summary"
  return 0
}

# Run Playwright and handle errors (modular, zsh-native)
run_playwright_and_handle_errors() {
  [[ ! -f playwright.config.ts ]] && return 0
  print -P "%F{cyan}Starting dev server for E2E...%f"
  npm run dev > scripts/dev-server-e2e.log 2>&1 &
  local dev_server_pid=$!
  sleep 5
  print -P "%F{cyan}Running Playwright E2E (advanced script)...%f"
  ./scripts/adv_fixing_run_playwright_and_capture_output.sh
  local pw_summary=""
  local pw_summary_line=$(grep -Eo '[0-9]+ failed' "$PW_OUTPUT_FILE" | awk '{s+=$1} END {print s+0}')
  local pw_failing_tests=$(grep '^FAIL ' "$PW_OUTPUT_FILE" | awk '{print $2}' | xargs)
  if [[ -n "$pw_summary_line" ]]; then
    pw_summary="E2E: $pw_summary_line"
  fi
  if grep -q "failed" "$PW_OUTPUT_FILE"; then
    print -P "%F{red}Playwright E2E failed.%f"
    print -P "\n--- Playwright Failure Details ---"
    awk '/^\s*[0-9]+\) /,/^\s*$/' "$PW_OUTPUT_FILE"
    prompt_fix_wip_abort "Playwright"
  fi
  rm -f "$PW_OUTPUT_FILE"
  kill $dev_server_pid 2>/dev/null
  echo "$pw_summary"
  return 0
}
# Classify changed files into categories using associative arrays
# Returns: a | delimited string of category lists (scripts|logs|configs|docs|other)
classify_changed_files() {
  local changed_files="$1"
  typeset -A cats
  cats=(
    [scripts]=""
    [logs]=""
    [configs]=""
    [docs]=""
    [other]=""
  )
  while read -r line; do
    local status file
    status=$(echo "$line" | awk '{print $1}')
    file=$(echo "$line" | awk '{print $2}')
    local prefix="-Updated"
    [[ "$status" == D ]] && prefix="-Deleted"
    if [[ "$file" == scripts/*.sh ]]; then
      cats[scripts]+="$prefix $file\n"
    elif [[ "$file" == *.log ]]; then
      cats[logs]+="$prefix $file\n"
    elif [[ "$file" == *.json || "$file" == *.yml || "$file" == *.yaml ]]; then
      cats[configs]+="$prefix $file\n"
    elif [[ "$file" == *.md ]]; then
      cats[docs]+="$prefix $file\n"
    elif [[ -n "$file" ]]; then
      cats[other]+="$prefix $file\n"
    fi
  done <<< "$changed_files"
  echo "${cats[scripts]}|${cats[logs]}|${cats[configs]}|${cats[docs]}|${cats[other]}"
}

# Format diffstat for commit message (utility)
format_diff_summary() {
  local diff_stat="$1"
  local diff_stat_dashed=""
  local diff_stat_summary=""
  while IFS= read -r line; do
    if [[ "$line" =~ files?\ changed ]]; then
      diff_stat_summary="$line"
    elif [[ -n "$line" ]]; then
      diff_stat_dashed+="-$line\n"
    fi
  done <<< "$diff_stat"
  if [[ -n "$diff_stat_dashed" ]]; then
    print -P "--- Diff Summary ---\n${diff_stat_dashed%\\n}\n$diff_stat_summary"
  else
    print -P "--- Diff Summary ---\n$diff_stat_summary"
  fi
}
# Commit and push with detailed summary (for main script use)
# Usage: commit_and_push_with_summary <branch> [prefix]
commit_and_push_with_summary() {
  local branch="$1"
  local prefix="${2:-Sync}"
  local changed_files diff_stat commit_msg
  changed_files=$(git status --short)
  diff_stat=$(git diff --stat)
  commit_msg=$(build_commit_message false "$prefix" "$changed_files" "$diff_stat" "" "" "")
  print -P "\n%F{cyan}--- Commit message preview for $branch ---\n$commit_msg%f\n"
  git add -A
  if git diff --cached --quiet; then
    log_info "No staged changes to commit on '$branch'. Skipping commit."
  else
    git commit -m "$commit_msg"
  fi
  git push "${REMOTE:-origin}" "$branch"
  log_info "Pushed branch '$branch' to '${REMOTE:-origin}' with detailed summary."
}


# Utility: Remove a branch from an array (by name, preserving order)
remove_branch_from_array() {
  local branch_to_remove="$1"
  shift
  local arr=("$@")
  local new_arr=()
  for b in "${arr[@]}"; do
    if [[ "$b" != "$branch_to_remove" ]]; then
      new_arr+=("$b")
    fi
  done
  echo "${new_arr[@]}"
}
#!/bin/zsh
# commit-utils.sh: Commit message and prompt helpers for sync scripts

commit_and_push_with_prompt() {
  COMMIT_MODE="commit"
  if [[ -n $(git status --porcelain) ]]; then
    echo "\nChoose commit mode:"
    echo "  1) commit  - Normal commit and push to remote (default)"
    echo "  2) wip     - WIP commit and push to remote"
    echo "  3) local   - Commit locally only, do NOT push to remote"
    echo "  4) abort   - Abort and exit"
    echo -n "Enter choice [commit/wip/local/abort]: "
    read commit_mode_choice
    case "$commit_mode_choice" in
      wip|WIP|2)
        COMMIT_MODE="wip" ;;
      local|LOCAL|3)
        COMMIT_MODE="local" ;;
      abort|ABORT|4)
        echo "%F{red}Aborted by user. No changes made.%f"
        exit 1 ;;
      commit|COMMIT|1|"")
        COMMIT_MODE="commit" ;;
      *)
        echo "%F{yellow}Invalid choice. Defaulting to 'commit'.%f"
        COMMIT_MODE="commit" ;;
    esac
  fi

  eval COMMIT_MODE="\${COMMIT_MODE:l}"
  if [[ "$COMMIT_MODE" == "wip" ]]; then
    SKIP_TESTS=true
  fi

  if [[ -n $(git status --porcelain) ]]; then
    CHANGED_FILES=$(git status --short)
    DIFF_STAT=$(git diff --stat)
    # Use modular helpers
    IFS='|' read -r SCRIPTS_LIST LOGS_LIST OTHER_LIST <<< "$(classify_changed_files "$CHANGED_FILES")"
    commit_msg=$(build_commit_message "$SKIP_TESTS" "$COMMIT_MODE" "$CHANGED_FILES" "$DIFF_STAT" "$SCRIPTS_LIST" "$LOGS_LIST" "$OTHER_LIST")
    interactive_commit_prompt "$commit_msg"
    git add -A
    TMP_COMMIT_MSG_FILE=$(mktemp)
    echo "$commit_msg" > "$TMP_COMMIT_MSG_FILE"
    git commit -F "$TMP_COMMIT_MSG_FILE"
    show_stash_and_precommit_summary

    if [[ "$COMMIT_MODE" == "local" ]]; then
      echo -e "\n\033[1;33mCommitted locally only. No push to remote performed.${NC}"
      exit 0
    fi
    if [[ "origin" == "origin" && -n "$CURRENT_BRANCH" ]]; then
      open "https://github.com/youngjnick/Massage-Therapy-FIREBASE-PRO/tree/$CURRENT_BRANCH"
    fi
    # Only run tests for normal commit mode
    if [[ "$SKIP_TESTS" == false ]]; then
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

  # Parallel processing configuration
  MAX_PARALLEL=${MAX_PARALLEL:-4}  # Can be overridden by environment
  AVAILABLE_CORES=$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)
  [[ $MAX_PARALLEL -gt $AVAILABLE_CORES ]] && MAX_PARALLEL=$AVAILABLE_CORES

  # Job control arrays
  declare -A SYNC_JOBS
  declare -A JOB_STATUS
  declare -A JOB_OUTPUT

  # Add a trap to clean up background processes on exit
  trap 'cleanup_jobs' EXIT

  # Ensure we are in a git repository
  if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
      log_error "Not a git repository. Please initialize a new repository or run this script from the root of a git project."
      exit 1
  fi

  # Check if the repository is empty (has no commits)
  if ! git rev-parse --verify HEAD > /dev/null 2>&1; then
      log_info "Empty repository detected. Creating initial commit on 'main' branch..."
      git checkout -b main
      git add -A
      if git diff-index --quiet HEAD; then
          log_info "No changes to commit. Initial commit not created."
      else
          git commit -m "Initial commit"
      fi
  fi

  # Validate that current branch can be determined
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ -z "$CURRENT_BRANCH" ]]; then
      log_error "Could not determine the current branch. Please check your git repository status."
      exit 1
  fi
  log_info "Running on branch: $CURRENT_BRANCH"

  # Stash changes if --stash is used
  if [[ "$STASH_CHANGES" = true ]]; then
    echo -e "\n${YELLOW}Stashing changes...${NC}"
    git stash push -m "Auto-stash before sync to ${branches[*]}" --include-untracked
  fi

  # --- SYNC LOGIC ---
  # Sync to each target branch in parallel
  run_parallel_sync
}

# Only export functions needed externally
export run_lint_and_handle_errors
export run_typescript_and_handle_errors
export run_jest_and_handle_errors
export run_playwright_and_handle_errors
export commit_and_push_with_summary
#!/bin/zsh
# commit-utils.sh: Commit message helpers and interactive commit prompt

build_commit_message() {
  local SKIP_TESTS="$1" COMMIT_MODE="$2" CHANGED_FILES="$3" DIFF_STAT="$4" SCRIPTS_LIST="$5" LOGS_LIST="$6" OTHER_LIST="$7"
  local SUMMARY_OVERVIEW=""
  [[ -n "$SCRIPTS_LIST" ]] && SUMMARY_OVERVIEW+=" Scripts:\n$SCRIPTS_LIST"
  [[ -n "$LOGS_LIST" ]] && SUMMARY_OVERVIEW+=" Logs:\n$LOGS_LIST"
  [[ -n "$OTHER_LIST" ]] && SUMMARY_OVERVIEW+=" Other:\n$OTHER_LIST"
  SUMMARY_OVERVIEW+="-Improved sync or automation scripts."
  local TITLE="Sync project files: updated scripts and logs"
  if [[ "$SKIP_TESTS" = true ]]; then
    TITLE+=" (tests/lint/type checks skipped)"
  fi
  if [[ "$COMMIT_MODE" == "wip" ]]; then
    TITLE="WIP: $TITLE"
  elif [[ "$COMMIT_MODE" == "commit" ]]; then
    TITLE="Commit: $TITLE"
  fi
  local commit_msg="$TITLE\n"
  commit_msg+="\n--- Summary ---\n$SUMMARY_OVERVIEW\n"
  commit_msg+="\n--- Purpose ---\n$(format_commit_purpose "$SCRIPTS_LIST" "$LOGS_LIST" "" "" "$OTHER_LIST")"
  commit_msg+="\n\n--- Changed Files ---\n$CHANGED_FILES\n"
  local DIFF_STAT_DASHED="" DIFF_STAT_SUMMARY=""
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
  if [[ "$SKIP_TESTS" = true ]]; then
    commit_msg+="\n--- Test Results ---\nTests skipped."
  fi
  commit_msg+="\n\nSync performed: $(date -u '+%Y-%m-%d %H:%M UTC')\n"
  commit_msg+="\n--- Reviewer Notes ---\nNo manual testing required; automation only."
  echo "$commit_msg"
}

interactive_commit_prompt() {
  local commit_msg="$1"
  print -P "\n%F{cyan}--- Commit message preview ---%f\n$commit_msg\n"
  local action
  print -P "Do you want to (e)dit, (a)ccept, or (q)uit? [a/e/q]: "
  read action
  case "$action" in
    e|E)
      ${EDITOR:-nano} "$TMP_COMMIT_MSG_FILE"
      ;;
    q|Q)
      exit 0
      ;;
    a|A|"")
      ;;
    *)
      ;;
  esac
}
