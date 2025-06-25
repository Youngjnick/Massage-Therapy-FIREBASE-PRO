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
    *)
      branches+=$1
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
  # Split on any whitespace (spaces, tabs, newlines)
  for b in ${(z)branch_input}; do
    branches+=$b
  done
fi

# Show confirmation with explicit branch list
if [[ ${#branches[@]} -gt 0 ]]; then
  echo "\nYou are about to sync ALL FILES from the current branch to the following remotes/branches:"
  for remote in $remotes; do
    for branch in $branches; do
      echo "  $remote/$branch"
    done
  done
  echo "\nThis will OVERWRITE the state of these branches/remotes with your current branch's files."
  echo "Type 'yes' to continue, or anything else to abort: "
  read answer
  if [[ "$answer" != "yes" ]]; then
    echo "Aborted. No changes made."
    exit 1
  fi
fi

# Run all tests once before syncing branches
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
NC='\033[0m' # No Color
TEST_SUMMARY=""
PW_SUMMARY=""
WIP_MODE=false

if [[ "$SKIP_TESTS" = false ]]; then
  # 1. Run lint
  echo "Running ESLint..."
  echo "Running ESLint..." >> "$LOG_FILE"
  npx eslint . | tee scripts/eslint-output.txt
  if grep -q "error" scripts/eslint-output.txt; then
    echo -e "${RED}Lint errors detected. Please fix them before syncing.${NC}"
    # Print only error lines with file and line info
    grep -E '^[^ ]+\.(ts|tsx|js|jsx):[0-9]+:[0-9]+' scripts/eslint-output.txt | while read -r line; do
      echo -e "${RED}$line${NC}"
    done
    echo "What do you want to do? (fix/wip/abort): "
    read lint_decision
    if [[ "$lint_decision" == "fix" ]]; then
      echo "Opening a shell for you to fix errors. Type 'exit' when done."
      $SHELL
      exit 1
    elif [[ "$lint_decision" == "wip" ]]; then
      WIP_MODE=true
    else
      echo "Aborted sync due to lint errors."
      exit 1
    fi
  fi
  rm -f scripts/eslint-output.txt

  # 2. Run TypeScript type check
  echo "Running TypeScript type check..."
  echo "Running TypeScript type check..." >> "$LOG_FILE"
  npx tsc --noEmit | tee scripts/ts-output.txt
  if [[ $? -ne 0 ]]; then
    echo -e "${RED}TypeScript type errors detected. Please fix them before syncing.${NC}"
    # Print only error lines with file and line info
    grep -E '^[^ ]+\.(ts|tsx|js|jsx):[0-9]+:[0-9]+' scripts/ts-output.txt | while read -r line; do
      echo -e "${RED}$line${NC}"
    done
    echo "What do you want to do? (fix/wip/abort): "
    read ts_decision
    if [[ "$ts_decision" == "fix" ]]; then
      echo "Opening a shell for you to fix errors. Type 'exit' when done."
      $SHELL
      exit 1
    elif [[ "$ts_decision" == "wip" ]]; then
      WIP_MODE=true
    else
      echo "Aborted sync due to TypeScript errors."
      exit 1
    fi
  fi
  rm -f scripts/ts-output.txt

  # 3. Run Jest/unit tests with progress
  echo "Running npm test (Jest) for all branches..."
  echo "Running npm test (Jest) for all branches..." >> "$LOG_FILE"
  npm test -- --reporter=default | tee scripts/test-output.txt
  # Colorize Jest output
  awk '{
    if ($0 ~ /[0-9]+ passing/) {print "\033[32m" $0 "\033[0m"} \
    else if ($0 ~ /skipped|flaky|pending|todo/) {print "\033[33m" $0 "\033[0m"} \
    else if ($0 ~ /failing|failed|FAIL/) {print "\033[31m" $0 "\033[0m"} \
    else {print $0}
  }' scripts/test-output.txt
  if grep -q "failing" scripts/test-output.txt; then
    FAILS=$(grep -A 1000 "failing" scripts/test-output.txt | grep -E '^[0-9]+\) ')
    TEST_SUMMARY="\n${RED}Test results: FAIL${NC}\n$FAILS"
    echo -e "${RED}The following tests failed:${NC}"
    echo "$FAILS" | while read -r fail_line; do
      echo -e "${RED}$fail_line${NC}"
    done
    grep -Eo 'at [^ ]+\.test\.[jt]s[x]?:[0-9]+:[0-9]+' scripts/test-output.txt | awk '{print $2}' | sort | uniq > scripts/last-failing-jest-files.txt
    echo -e "\n${RED}Failing Jest test files saved to scripts/last-failing-jest-files.txt${NC}"
    echo "To re-run only failing tests: npx jest $(cat scripts/last-failing-jest-files.txt | xargs)"
    echo "\nTests are failing. What do you want to do? (fix/wip/abort): "
    read commit_decision
    if [[ "$commit_decision" == "fix" ]]; then
      echo "Opening a shell for you to fix errors. Type 'exit' when done."
      $SHELL
      exit 1
    elif [[ "$commit_decision" == "wip" ]]; then
      WIP_MODE=true
    else
      echo "Aborted sync due to failing tests."
      exit 1
    fi
  elif grep -q "passing" scripts/test-output.txt; then
    PASS_COUNT=$(grep -o '[0-9]\+ passing' scripts/test-output.txt | head -1)
    TEST_SUMMARY="\nTest results: PASS ($PASS_COUNT)"
  else
    TEST_SUMMARY="\nTest results: UNKNOWN"
  fi
  rm -f scripts/test-output.txt

  # 4. Run Playwright E2E in headed mode
  if [[ -f playwright.config.ts && "$SKIP_ALL" = false ]]; then
    echo "Starting dev server for E2E tests..."
    echo "Starting dev server for E2E tests..." >> "$LOG_FILE"
    npm run dev > scripts/dev-server-e2e.log 2>&1 &
    DEV_SERVER_PID=$!
    sleep 5
    echo "Running npm run test:e2e:headed (Playwright E2E tests in headed mode)..."
    echo "Running npm run test:e2e:headed (Playwright E2E tests in headed mode)..." >> "$LOG_FILE"
    npm run test:e2e:headed | tee scripts/playwright-output.txt
    # Enhanced Playwright output colorization
    awk '{
      if ($0 ~ /\bpassed\b|✓/) {print "\033[32m" $0 "\033[0m"} \
      else if ($0 ~ /skipped|flaky|pending|todo|\bexpected to fail\b/) {print "\033[33m" $0 "\033[0m"} \
      else if ($0 ~ /failed|✖|FAILED|FAIL/) {print "\033[31m" $0 "\033[0m"} \
      else {print $0}
    }' scripts/playwright-output.txt
    if grep -q "failed" scripts/playwright-output.txt; then
      PW_ERRORS=$(cat scripts/playwright-output.txt)
      PW_SUMMARY="\nPlaywright E2E errors:\n$PW_ERRORS"
      # Print failed E2E tests in red
      echo -e "${RED}The following Playwright E2E tests failed:${NC}"
      grep -E '^\s*✖|FAILED' scripts/playwright-output.txt | while read -r fail_line; do
        echo -e "${RED}$fail_line${NC}"
      done
      grep -E '^e2e/[^ ]+\.spec\.[jt]s[x]? +.*FAILED' scripts/playwright-output.txt | awk '{print $1}' | sort | uniq > scripts/last-failing-playwright-files.txt
      echo "\nFailing Playwright test files saved to scripts/last-failing-playwright-files.txt"
      echo "To re-run only failing tests: npm run test:e2e:headed -- $(cat scripts/last-failing-playwright-files.txt | xargs)"
      echo "\nPlaywright E2E tests failed. What do you want to do? (fix/wip/abort): "
      read pw_decision
      if [[ "$pw_decision" == "fix" ]]; then
        echo "Opening a shell for you to fix errors. Type 'exit' when done."
        $SHELL
        kill $DEV_SERVER_PID 2>/dev/null
        exit 1
      elif [[ "$pw_decision" == "wip" ]]; then
        WIP_MODE=true
      else
        echo "Aborted sync due to Playwright E2E failures."
        kill $DEV_SERVER_PID 2>/dev/null
        exit 1
      fi
    elif grep -q "passed" scripts/playwright-output.txt; then
      PW_SUMMARY="\nPlaywright E2E: PASS"
    else
      PW_SUMMARY="\nPlaywright E2E: UNKNOWN"
    fi
    rm -f scripts/playwright-output.txt
    kill $DEV_SERVER_PID 2>/dev/null
  fi
fi

# Auto-commit WIP if requested
if [[ "$AUTO_COMMIT_WIP" = true ]]; then
  if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Auto-committing all uncommitted changes as WIP before sync...${NC}"
    git add -A
    git commit -m "WIP: auto-commit before sync-all-files-to-specified-branches.sh"
  else
    echo -e "${GREEN}No uncommitted changes to auto-commit.${NC}"
  fi
fi

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

for remote in $remotes; do
  for branch in $branches; do
    worktree_dir="tmp-worktree-$remote-$branch"
    echo "\n--- Syncing all files to $remote/$branch ---"
    echo "\n--- Syncing all files to $remote/$branch ---" >> "$LOG_FILE"
    # Remove temp worktree dir if it exists and prune stale worktrees
    if [[ -d "$worktree_dir" ]]; then
      echo "Removing existing worktree directory $worktree_dir..."
      git worktree remove --force "$worktree_dir" 2>/dev/null || rm -rf "$worktree_dir"
    fi
    git worktree prune
    # Check if branch exists on remote, create if not
    if ! git ls-remote --exit-code --heads $remote $branch > /dev/null; then
      echo "Branch $branch does not exist on $remote. Creating it from current HEAD."
      git push $remote HEAD:$branch
    fi
    git worktree add -B $branch $worktree_dir $remote/$branch || continue
    # Progress bar for rsync (showing file copy progress, compatible with old rsync)
    echo "Syncing files to $worktree_dir (progress bar below):"
    rsync -a --progress --delete --exclude='.git' --exclude='tmp-worktree-*' --exclude='node_modules' ./ $worktree_dir/
    cd $worktree_dir
    git add -A
    if git diff --cached --quiet; then
      echo "No changes to commit for $remote/$branch."
      echo "No changes to commit for $remote/$branch." >> "$LOG_FILE"
    else
      # Generate dynamic commit message with file list and test results
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
      # Try fast-forward push first (fix: remove --ff-only for compatibility)
      if git push $remote $branch; then
        PUSH_MODE="normal"
        PUSH_SUCCESS=true
      else
        echo "${RED}Normal push failed for $remote/$branch. The remote branch may have diverged.${NC}"
        echo "Normal push failed for $remote/$branch. The remote branch may have diverged." >> "$LOG_FILE"
        echo "Automatically force pushing to overwrite remote history..."
        if git push --force $remote $branch; then
          PUSH_MODE="force"
          PUSH_SUCCESS=true
        else
          PUSH_MODE="force"
          PUSH_SUCCESS=false
        fi
      fi
      # Post-push verification
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
      # GitHub update notification and open branch page
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
    fi
    cd ..
    git worktree remove $worktree_dir --force
    echo "Done with $remote/$branch."
    echo "Done with $remote/$branch." >> "$LOG_FILE"
  done
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
