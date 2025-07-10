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
    commit_msg=""
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
        # Optionally, add a spinner or progress indicator here
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
export -f commit_and_push_with_prompt
#!/bin/zsh
# commit-utils.sh: Commit message helpers and interactive commit prompt

build_commit_message() {
  local SKIP_TESTS="$1"
  local COMMIT_MODE="$2"
  local CHANGED_FILES="$3"
  local DIFF_STAT="$4"
  local SCRIPTS_LIST="$5"
  local LOGS_LIST="$6"
  local OTHER_LIST="$7"

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

  local PURPOSE_MSG=""
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
  commit_msg+="\n\n--- Changed Files ---\n$CHANGED_FILES\n"

  local DIFF_STAT_DASHED=""
  local DIFF_STAT_SUMMARY=""
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
  echo -e "\n\033[1;36m--- Commit message preview ---\033[0m\n$commit_msg\n"
  echo "Do you want to (e)dit, (a)ccept, or (q)uit? [a/e/q]: "
  read commit_msg_action
  case "$commit_msg_action" in
    e|E)
      # Open in $EDITOR or fallback to nano
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
