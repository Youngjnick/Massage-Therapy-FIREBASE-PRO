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
  # Split on any whitespace (spaces, tabs, newlines)
  for b in ${(z)branch_input}; do
    branches+=$b
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
  if grep -q "failing" scripts/test-output.txt; then
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
  fi
  rm -f scripts/test-output.txt

  # 4. Playwright/E2E (always after Jest)
  if [[ -f playwright.config.ts ]]; then
    echo "Starting dev server for E2E..."
    npm run dev > scripts/dev-server-e2e.log 2>&1 &
    DEV_SERVER_PID=$!
    sleep 5
    echo "Running Playwright E2E..."
    npm run test:e2e:headed | tee scripts/playwright-output.txt
    if grep -q "failed" scripts/playwright-output.txt; then
      echo -e "${RED}Playwright E2E failed.${NC}"
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

# --- ALWAYS PUSH/UPLOAD SECTION ---
# If WIP_MODE is set, commit as WIP, otherwise normal commit
# Always push/force-push to all specified branches/remotes

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
