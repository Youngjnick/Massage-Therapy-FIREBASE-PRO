#!/bin/zsh
# sync-branches-simple.sh

# Source all modular libraries at the top for global function availability
for lib in lib/colors.sh lib/hooks.sh lib/branch-protection.sh lib/conflict-resolution.sh lib/remote-sync.sh lib/cicd.sh lib/partial-commit.sh lib/backup.sh lib/cli-parse.sh; do
  libpath="$(dirname "$0")/$lib"
  [ -f "$libpath" ] && source "$libpath"
done

# =====================================================================
# SYNC SCRIPT FLOW OVERVIEW (UI/USER FLOW ORDER)
# =====================================================================

# 1. Drag-and-Drop Support
#    - Detect if script is invoked via drag-and-drop (quoted path).
#    - Re-execute itself with correct path/arguments if needed.

# 2. Pre-Sync Checks & Setup
#    - Ensure script is run inside a git repository.
#    - Parse command-line arguments:
#        --dry-run         Show what would happen without making changes.
#        --auto-commit     Automatically commit unstaged changes before syncing.
#        --debug           Show detailed logs for troubleshooting.
#        --no-verify       Skip pre-commit and pre-push git hooks (skips all git hooks, not just tests; use with caution).
#        --no-lint         Skip linting and formatting checks.
#        --no-tests        Skip running tests before syncing.
#        --no-playwright   Skip Playwright E2E tests only.
#        --config <file>   Use a custom config file for default/toggleable options.
#        --branch <name>   Use a specific branch as source/target for syncing.
#        ...add others as needed for your workflow.
#    - Check for clean working directory (or handle with auto-commit/stash if enabled).
#    - Load config file if present (toggleable default options).

# 3. Interactive Branch Selection
#    - List all local branches, ordered by most recent commit (most recent at the bottom).
#    - Print debug/info messages in the following format by default:
#        [DEBUG] <message>
#        [INFO] <message>
#    - Example:
#        [DEBUG] Running main() in sync-all-files-to-specified-branches.sh
#        [INFO] Running in repository root: /path/to/repo
#        [INFO] Cleaning up temporary files...
#        [INFO] No target branches specified. Please select from the list below:
#    - Number each branch for selection.
#    - Highlight the current branch:
#        * Green asterisk (*) if working directory is clean.
#        * Yellow asterisk (*) if there are unstaged/uncommitted changes.
#    - Prompt user to "Type branch numbers separated by space (e.g. 1 3 5), or '+' to add a new branch. Press 'Enter' when done:"
#    - Option to create a new branch by entering "+".
#    - Validate input and map numbers to branch names.

# 4. Pre-commit Linting/Formatting (toggleable)
#    - Optionally run lint (e.g., npm run lint) and/or formatting checks before auto-commit or sync.
#    - Check for TypeScript errors (e.g., npx tsc --noEmit) and abort or warn if any are found.
#    - Check for ESLint errors (e.g., npx eslint .) and abort or warn if any are found.
#    - Warn if there are lint errors. Ask if the user wants to automatically fix lint errors (e.g., run npm run lint -- --fix or similar).
#    - If user agrees, attempt to fix and re-check; otherwise, abort or continue based on user choice.

# 5. Pre-push Hook Simulation (toggleable)
#    - Optionally run any scripts you have in .husky/pre-push or similar, to catch issues before pushing.

# 6. Auto-commit Flow (if enabled)
#    - Detect if there are any unstaged or uncommitted changes in the working directory.
#    - If changes are present:
#        - Automatically generate a high-quality commit summary using:
#            - Current branch name
#            - List of changed files
#            - Diff summary (git diff --stat)
#            - Test results (Jest, Playwright, etc.) if available
#            - Pre-filled template for Summary, Purpose, Change Details, Diff Summary, Test Results, References
#        - Prompt the user to review, edit, or accept the commit message (optionally open in $EDITOR)
#        - Use the result for the commit
#        - Confirm to the user that the auto-commit was made.
#    - If no changes are present:
#        - Inform the user that the working directory is clean and skip the auto-commit step.

# (Example commit message template moved to documentation or multi-line comment below)
: <<'END_COMMIT_DOC'
Summary:
Sync feature/login-refactor into main: Unify authentication logic and update tests

Purpose:
- Merge recent authentication improvements from feature/login-refactor into main.
- Ensure all login flows use the new unified logic for better maintainability and test coverage.

Change Details:
- Branch: feature/login-refactor
- Files changed:
  src/auth/session.ts
  src/auth/handlers.ts
  tests/auth.spec.ts
- Resolved merge conflicts in src/auth/session.ts (kept new session validation, removed legacy fallback).
- Updated related unit and e2e tests for new login flow.

Diff Summary:
 src/auth/session.ts      |  45 +++++++++++++++-----
 src/auth/handlers.ts     |  12 +++---
 tests/auth.spec.ts       |  20 ++++++---
 3 files changed, 55 insertions(+), 22 deletions(-)

Test Results:
Jest: All tests passed (112/112), coverage 98%.
Playwright: All e2e login and profile tests passed.
Manual: Verified login/logout and session persistence in local dev.
END_COMMIT_DOC

# 8. Run Jest/Playwright/Other Tests (toggleable)
#    - Run Jest, Playwright, or other tests on the current branch after auto-commit (if enabled).
#    - If tests pass:
#        - Proceed to branch selection and sync/merge.
#    - If tests fail:
#        - Abort the sync, inform the user, and allow them to fix issues before continuing.

# 8. Stash Flow (if enabled)
#    - If you do NOT want to commit your current changes but still want to sync:
#        - Stash any uncommitted changes before syncing (temporarily save and hide them).
#        - Perform the sync/merge operations on the committed state only.
#        - After syncing is complete, restore the stashed changes to your working directory.
#    - This allows you to sync branches without including your current uncommitted work.

# 9. Backup/Restore (sync_tmp_backups/)
#    - Before major syncs/merges, back up the working directory or branch to sync_tmp_backups/.
#    - Only keep the most recent necessary backups, delete old ones to save space.
#    - Allow easy restore if needed.

# 10. Sync/Merge Flow (toggleable parallel)
#    - For each selected target branch (in parallel if enabled):
#        - Checkout target branch.
#        - Merge current branch into target.
#        - Handle merge conflicts interactively (offer to open conflicted files in editor).
#        - Prompt for/edit commit message if needed (show diff summary and allow editing).
#        - Push to remote.
#        - Log/report success or failure.

# 11. Sync/Push Summary Table
#    - After all syncs, print a summary table showing which branches were updated, pushed, or had errors.

# 12. Post-Sync Actions
#    - Return to original branch.
#    - Show post-sync diff summary (e.g., git diff --stat).
#    - Cleanup any temporary state.

# 13. Open GitHub Page After Upload
#    - After a successful push to remote, automatically open the corresponding GitHub page for the branch in the default browser.
#    - Inform the user that the page is being opened.

# 14. Branch Cleanup (Optional)
#    - After syncing, provide an option to delete unneeded branches.
#        - Allow deletion of local branches.
#        - Allow deletion of remote branches (with confirmation).
#    - Confirm branch deletion actions with the user before proceeding.

# 15. Error Handling & Logging
#    - Log all major actions and errors.
#    - Abort on critical errors, continue with others if possible.
#    - Provide clear user feedback at each step.

# 16. Partial Commit/Stash (Optional)
#    - Allow user to perform partial commit (git add -p) or partial stash (git stash -p) as an option before sync/merge.
#    - Useful for syncing only selected changes.

# 17. Pre-flight Remote Status Check
#    - Before merging/pushing, check if the local branch is behind/diverged from remote and prompt the user to pull/rebase if needed.

# 18. CI/CD Status Awareness (Optional)
#    - After push (or before merge), check CI/CD status for the branch and warn if the last build failed. Make this toggleable.

# 19. User Confirmation for Destructive Actions
#    - Before deleting branches (local or remote), always prompt for confirmation and clearly explain the consequences.

# 20. Clear Success/Failure Feedback
#    - After each major step (commit, test, merge, push), print a clear success or failure message, and if failed, suggest next actions.

# 21. Help/Docs Accessibility
#    - Make sure the help/docs output is accessible from anywhere in the flow (e.g., allow --help at any prompt).

# 22. Restore/Abort Safety
#    - If a step fails (e.g., merge conflict, test failure), offer to restore from backup or stash, and clearly explain how to recover.

# 23. Partial Commit/Stash UX
#    - If partial commit/stash is chosen, make it clear in the UI what is being included/excluded, and confirm before proceeding.

# 24. Config/Defaults Feedback
#    - If a config file is loaded, print which options are being overridden for transparency.

# 25. Logging/Debug Output
#    - If debug is enabled, print all relevant variables and decisions at each step for troubleshooting.

# 26. Multi-branch Sync Parallelism
#    - If syncing to multiple branches in parallel, print progress and results for each branch separately, and summarize at the end.

# 27. Editor Integration
#    - If $EDITOR is not set, default to vi or prompt the user to set it.

# 28. Accessibility
#    - Use clear color coding and avoid color-only cues for important warnings (for accessibility).

# 29. Exit Codes
#    - Use meaningful exit codes for automation (e.g., 0=success, 1=abort, 2=conflict, etc.).

# 30. Optional: Undo Last Action
#    - After a destructive action (delete, force push), offer a quick “undo” if possible (e.g., git reflog for branch recovery).

# Note: Each major step should check the DRY_RUN flag and print what would happen instead of making changes if enabled.
# =====================================================================
# ADVANCED FEATURES
# =====================================================================
# - All features above should be implemented as toggleable where noted.
# - Backup files should be managed in sync_tmp_backups/ as described.
# - Config file support for default/toggleable options.
# - Debug mode for troubleshooting.
# - Dry run enhancements for previewing all actions.
# =====================================================================
# (Implementation starts below)

# =====================================================================
# UTILITY: Colorized Output
# =====================================================================
color_info="\033[1;34m"   # Blue
color_warn="\033[1;33m"   # Yellow
color_error="\033[1;31m"  # Red
color_success="\033[1;32m" # Green
color_reset="\033[0m"

info()    { echo -e "${color_info}[INFO] $*${color_reset}"; }
warn()    { echo -e "${color_warn}[WARN] $*${color_reset}"; }
error()   { echo -e "${color_error}[ERROR] $*${color_reset}"; }
success() { echo -e "${color_success}[SUCCESS] $*${color_reset}"; }
debug()   { [[ "$DEBUG" == "1" ]] && echo -e "[DEBUG] $*"; }

# =====================================================================
# UTILITY: Print Help/Docs
# =====================================================================
print_help() {
  cat <<EOF
Usage: $0 [options]

Options:
  --dry-run         Preview all actions without making changes
  --auto-commit     Auto-commit unstaged changes before syncing
  --debug           Enable debug output
  --no-verify       Skip all git hooks
  --no-lint         Skip linting/formatting
  --no-tests        Skip running all tests
  --no-playwright   Skip Playwright E2E tests only
  --config <file>   Use custom config file
  --branch <name>   Specify branch for sync
  --rebase          Use rebase instead of merge
  --list-backups    List available backups
  --restore-backup  Restore a backup interactively
  --delete-backup   Delete a backup interactively
  --help, --docs    Show this help message
EOF
}

# =====================================================================
# UTILITY: Modular Hooks
# =====================================================================
run_hook() {
  local hook_name="$1"
  local config_file="$CONFIG_FILE"
  [[ -z "$config_file" ]] && config_file=".sync-branches.conf"
  if [[ -f "$config_file" ]]; then
    local hook_cmd=$(grep "^$hook_name=" "$config_file" | cut -d'=' -f2-)
    if [[ -n "$hook_cmd" ]]; then
      info "Running $hook_name hook: $hook_cmd"
      eval "$hook_cmd"
    fi
  fi
}

# =====================================================================
# UTILITY: Branch Protection Awareness
# =====================================================================
is_protected_branch() {
  local branch="$1"
  [[ "$branch" =~ ^(main|master|production|release)$ ]] && return 0 || return 1
}

# =====================================================================
# UTILITY: Interactive Conflict Resolution
# =====================================================================
resolve_conflicts() {
  if command -v fzf >/dev/null 2>&1; then
    info "Launching fzf for conflict resolution..."
    git status --porcelain | grep '^UU' | cut -c4- | fzf --multi --prompt="Select files to resolve: "
  elif command -v gitui >/dev/null 2>&1; then
    info "Launching gitui for conflict resolution..."
    gitui
  else
    warn "No TUI found. Opening conflicted files in \"$EDITOR\"."
    for file in $(git status --porcelain | grep '^UU' | cut -c4-); do
      "$EDITOR" "$file"
    done
  fi
}

# =====================================================================
# UTILITY: Pre-flight Remote Sync Check
# =====================================================================
check_remote_divergence() {
  local branch="$1"
  git fetch origin "$branch"
  local local_hash=$(git rev-parse "$branch")
  local remote_hash=$(git rev-parse "origin/$branch")
  if [[ "$local_hash" != "$remote_hash" ]]; then
    warn "Remote branch '$branch' has diverged. Please pull/rebase before syncing."
    return 1
  fi
  return 0
}

# =====================================================================
# UTILITY: CI/CD Status Check (stub)
# =====================================================================
check_cicd_status() {
  info "(Stub) Checking CI/CD status for branch $1..."
  # Implement GitHub Actions or CI polling here
}

# =====================================================================
# UTILITY: Partial Stash/Commit
# =====================================================================
partial_commit() {
  info "Starting partial commit (git add -p)..."
  git add -p
  git commit
}
partial_stash() {
  info "Starting partial stash (git stash -p)..."
  git stash -p
}

# =====================================================================
# UTILITY: Enhanced Backup Management
# =====================================================================
list_backups() {
  info "Available backups:"
  ls -1 sync_tmp_backups/
}
restore_backup() {
  list_backups
  read "?Enter backup name to restore: " backup
  if [[ -d sync_tmp_backups/$backup ]]; then
    info "Restoring backup $backup..."
    cp -r sync_tmp_backups/$backup/* .
  else
    error "Backup not found."
  fi
}
delete_backup() {
  list_backups
  read "?Enter backup name to delete: " backup
  if [[ -d sync_tmp_backups/$backup ]]; then
    info "Deleting backup $backup..."
    rm -rf sync_tmp_backups/$backup
  else
    error "Backup not found."
  fi
}

# =====================================================================
# UTILITY: Auto-generate Commit Message and Interactive Review
# =====================================================================
generate_commit_message() {
  local branch_name
  branch_name=$(git rev-parse --abbrev-ref HEAD)
  local changed_files
  changed_files=$(git diff --cached --name-only)
  local diff_stat
  diff_stat=$(git diff --cached --stat)
  local type_of_change
  # Infer type from branch name (feature/, fix/, refactor/, chore/, etc.)
  if [[ "$branch_name" =~ ^feature ]]; then
    type_of_change="feat"
  elif [[ "$branch_name" =~ ^fix ]]; then
    type_of_change="fix"
  elif [[ "$branch_name" =~ ^refactor ]]; then
    type_of_change="refactor"
  elif [[ "$branch_name" =~ ^chore ]]; then
    type_of_change="chore"
  else
    type_of_change="update"
  fi

  # Suggest a concise, imperative title (72 chars max for GitHub)
  local default_title
  default_title="${type_of_change}: $(echo $changed_files | head -n1 | cut -c1-50) [${branch_name}]"
  default_title="${default_title:0:72}"

  # Prompt for title, pre-filled
  echo -n "Enter commit title (max 72 chars): [$default_title] "
  read commit_title
  [[ -z "$commit_title" ]] && commit_title="$default_title"
  if (( ${#commit_title} > 72 )); then
    warn "Title exceeds 72 characters. It will be truncated."
    commit_title="${commit_title:0:72}"
  fi

  # Prompt for body
  echo "Enter commit body (why/how, references, etc.). Press Ctrl+D when done:"
  commit_body=$(cat)
  if (( ${#commit_body} > 65536 )); then
    warn "Body exceeds 65536 characters. It will be truncated."
    commit_body="${commit_body:0:65536}"
  fi

  # Add diff summary and references if available
  local references
  references=$(git log --oneline --decorate | grep -Eo '#[0-9]+' | head -1)
  local commit_message
  commit_message="$commit_title\n\n$commit_body\n\nDiff Summary:\n$diff_stat\n"
  [[ -n "$references" ]] && commit_message+="\nReferences: $references\n"

  # Preview and confirm
  echo "\n----- Commit Preview (truncated if too long) -----"
  if (( ${#commit_message} > 65536 )); then
    echo "$(echo "$commit_message" | head -c 65536)"
    warn "Full commit message exceeds GitHub's 65536 character limit. Preview truncated."
  else
    echo "$commit_message"
  fi
  echo "-------------------------"
  echo -n "Proceed with this commit? (y/n/e=edit): "
  read confirm
  if [[ "$confirm" == "e" ]]; then
    # Open in $EDITOR for review
    tmpfile=$(mktemp)
    echo "$commit_message" > "$tmpfile"
    ${EDITOR:-vi} "$tmpfile"
    commit_message=$(cat "$tmpfile")
    rm "$tmpfile"
    # Enforce limits again after editing
    if (( $(echo "$commit_message" | head -n1 | wc -c) > 73 )); then
      warn "Edited title exceeds 72 characters. It will be truncated."
      commit_title="$(echo "$commit_message" | head -n1 | cut -c1-72)"
      commit_message="$commit_title\n$(echo "$commit_message" | tail -n +2)"
    fi
    if (( ${#commit_message} > 65536 )); then
      warn "Edited commit message exceeds 65536 characters. It will be truncated."
      commit_message="$(echo "$commit_message" | head -c 65536)"
    fi
    echo "\n----- Edited Commit Preview (truncated if too long) -----"
    echo "$commit_message"
    echo "-------------------------"
    echo -n "Proceed with this commit? (y/n): "
    read confirm
  fi
  if [[ "$confirm" == "y" ]]; then
    # Split title/body for git commit
    local title body
    title="$(echo "$commit_message" | head -n1)"
    body="$(echo "$commit_message" | tail -n +2)"
    git commit -m "$title" -m "$body" --edit
    success "Commit created."
  else
    warn "Commit aborted."
    return 1
  fi
}

# =====================================================================
# FUNCTION IMPLEMENTATIONS (modular, can be moved to lib/)
# =====================================================================

handle_drag_and_drop() {
  # Modular: source from lib/cli-parse.sh if available
  if [[ -f "$(dirname "$0")/lib/cli-parse.sh" ]]; then
    source "$(dirname "$0")/lib/cli-parse.sh"
    cli_handle_drag_and_drop "$@"
    return $?
  fi
  # Fallback: no-op
  return 0
}

pre_sync_checks() {
  # Modular: source from lib/cli-parse.sh for CLI parsing, lib/colors.sh for info/error
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would perform pre-sync checks"; return 0; fi
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { error "Not in a git repo"; return 1; }
  if [[ -f "$(dirname "$0")/lib/cli-parse.sh" ]]; then
    source "$(dirname "$0")/lib/cli-parse.sh"
    cli_parse_args "$@"
  fi
  # ...load config, check clean state, etc. (modularize as needed)...
  return 0
}

select_branches() {
  # List all local branches, ordered by most recent commit (most recent at the bottom)
  local branches branch_list branch_count i
  branches=($(git for-each-ref --sort=committerdate refs/heads/ --format='%(refname:short)'))
  branch_count=${#branches[@]}
  echo "\nAvailable branches:" >&2
  for ((i=1; i<=branch_count; i++)); do
    idx=$((i-1))
    bname="${branches[$idx]}"
    mark=" "
    if [[ "$bname" == "$(git rev-parse --abbrev-ref HEAD)" ]]; then
      if git diff --quiet && git diff --cached --quiet; then
        mark="${color_success}*${color_reset}"
      else
        mark="${color_warn}*${color_reset}"
      fi
    fi
    echo -e "  $i. $bname $mark"
  done
  echo -n "\nType branch numbers separated by space (e.g. 1 3 5), or '+' to add a new branch. Press 'Enter' when done: "
  read branch_nums
  if [[ "$branch_nums" == "+" ]]; then
    echo -n "Enter new branch name: "
    read new_branch
    git checkout -b "$new_branch"
    export SYNC_BRANCHES="$new_branch"
    return 0
  fi
  local selected_branches=()
  for num in $branch_nums; do
    if [[ $num =~ ^[0-9]+$ ]] && (( num >= 1 && num <= branch_count )); then
      selected_branches+=("${branches[$((num-1))]}")
    fi
  done
  export SYNC_BRANCHES="${selected_branches[*]}"
  echo "Selected branches: $SYNC_BRANCHES" >&2
}

run_lint_and_format() {
  if [[ $NO_LINT -eq 1 ]]; then info "Linting skipped (--no-lint)"; return 0; fi
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would run lint/format"; return 0; fi
  if [[ -f "$(dirname "$0")/lib/colors.sh" ]]; then source "$(dirname "$0")/lib/colors.sh"; fi
  if [[ -f "$(dirname "$0")/lib/hooks.sh" ]]; then source "$(dirname "$0")/lib/hooks.sh"; fi
  type run_lint &>/dev/null || { warn "run_lint function not found after sourcing hooks.sh"; return 1; }
  run_lint || { warn "Lint failed"; return 1; }
  type run_typescript_check &>/dev/null || { warn "run_typescript_check function not found after sourcing hooks.sh"; return 1; }
  run_typescript_check || { warn "TypeScript errors"; return 1; }
  return 0
}

run_pre_push_hook() {
  if [[ $NO_VERIFY -eq 1 ]]; then info "Pre-push hook skipped (--no-verify)"; return 0; fi
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would run pre-push hook"; return 0; fi
  if [[ -f "$(dirname "$0")/lib/hooks.sh" ]]; then source "$(dirname "$0")/lib/hooks.sh"; fi
  run_pre_push_hook_modular
  return 0
}

auto_commit_flow() {
  if [[ $AUTO_COMMIT -ne 1 ]]; then info "Auto-commit disabled"; return 0; fi
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would auto-commit changes"; return 0; fi
  git diff --quiet && git diff --cached --quiet && { info "No changes to commit"; return 0; }
  git add -A
  if [[ -f "$(dirname "$0")/lib/hooks.sh" ]]; then source "$(dirname "$0")/lib/hooks.sh"; fi
  generate_commit_message_modular || return 1
  return 0
}

run_tests() {
  if [[ $NO_TESTS -eq 1 ]]; then info "Tests skipped (--no-tests)"; return 0; fi
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would run tests"; return 0; fi
  if [[ -f "$(dirname "$0")/lib/hooks.sh" ]]; then source "$(dirname "$0")/lib/hooks.sh"; fi
  run_all_tests || { error "Tests failed"; return 1; }
  return 0
}

handle_stash_flow() {
  # Modular: source from lib/partial-commit.sh
  if [[ -f "$(dirname "$0")/lib/partial-commit.sh" ]]; then
    source "$(dirname "$0")/lib/partial-commit.sh"
    handle_stash_flow_modular
    return $?
  fi
  return 0
}

backup_before_sync() {
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would backup before sync"; return 0; fi
  if [[ -f "$(dirname "$0")/lib/backup.sh" ]]; then
    source "$(dirname "$0")/lib/backup.sh"
    backup_before_sync_modular
    return $?
  fi
  return 0
}

sync_merge_flow() {
  if [[ $DRY_RUN -eq 1 ]]; then info "[DRY RUN] Would sync/merge branches"; return 0; fi
  if [[ -f "$(dirname "$0")/lib/remote-sync.sh" ]]; then
    source "$(dirname "$0")/lib/remote-sync.sh"
    sync_merge_flow_modular
    return $?
  fi
  return 0
}

print_sync_summary() {
  if [[ -f "$(dirname "$0")/lib/remote-sync.sh" ]]; then
    source "$(dirname "$0")/lib/remote-sync.sh"
    print_sync_summary_modular
    return $?
  fi
  return 0
}

post_sync_actions() {
  if [[ -f "$(dirname "$0")/lib/remote-sync.sh" ]]; then
    source "$(dirname "$0")/lib/remote-sync.sh"
    post_sync_actions_modular
    return $?
  fi
  return 0
}

open_github_page() {
  if [[ -f "$(dirname "$0")/lib/remote-sync.sh" ]]; then
    source "$(dirname "$0")/lib/remote-sync.sh"
    open_github_page_modular
    return $?
  fi
  return 0
}

branch_cleanup() {
  if [[ -f "$(dirname "$0")/lib/branch-protection.sh" ]]; then
    source "$(dirname "$0")/lib/branch-protection.sh"
    branch_cleanup_modular
    return $?
  fi
  return 0
}

preflight_remote_status_check() {
  if [[ -f "$(dirname "$0")/lib/remote-sync.sh" ]]; then
    source "$(dirname "$0")/lib/remote-sync.sh"
    preflight_remote_status_check_modular
    return $?
  fi
  return 0
}

check_cicd_status_flow() {
  if [[ -f "$(dirname "$0")/lib/cicd.sh" ]]; then
    source "$(dirname "$0")/lib/cicd.sh"
    check_cicd_status_flow_modular
    return $?
  fi
  return 0
}

# =====================================================================
# MAIN MODULAR SYNC SCRIPT FLOW (CORE FEATURES ONLY)
# =====================================================================

interactive_flag_prompt() {
  # Only prompt if not already processed
  if [[ -z "$INTERACTIVE_FLAGS_PROCESSED" ]]; then
    if (( $# == 0 )); then
      echo "\nSelect options (type numbers separated by space, or press Enter for defaults):"
      echo "  1. --no-tests        (Skip running all tests)"
      echo "  2. --no-lint         (Skip linting/formatting)"
      echo "  3. --no-verify       (Skip all git hooks)"
      echo "  4. --dry-run         (Preview all actions without making changes)"
      echo "  5. --auto-commit     (Auto-commit unstaged changes before syncing)"
      echo "  6. --debug           (Enable debug output)"
      echo "  7. --rebase          (Use rebase instead of merge)"
      echo "  8. --no-playwright   (Skip Playwright E2E tests only)"
      echo "  9. --help            (Show help and exit)"
      echo -n "Your choice(s): "
      read flag_nums
      local new_args=()
      for num in $flag_nums; do
        case $num in
          1) new_args+=(--no-tests) ;;
          2) new_args+=(--no-lint) ;;
          3) new_args+=(--no-verify) ;;
          4) new_args+=(--dry-run) ;;
          5) new_args+=(--auto-commit) ;;
          6) new_args+=(--debug) ;;
          7) new_args+=(--rebase) ;;
          8) new_args+=(--no-playwright) ;;
          9) print_help; exit 0 ;;
        esac
      done
      if [[ ${#new_args[@]} -gt 0 ]]; then
        # Preserve any original positional arguments (like branch names)
        for arg in "$@"; do
          new_args+=("$arg")
        done
        export INTERACTIVE_FLAGS_PROCESSED=1
        exec "$0" "${new_args[@]}"
      fi
    fi
    export INTERACTIVE_FLAGS_PROCESSED=1
  fi
}

main() {
  # 0. Interactive flag prompt (only if not already processed)
  interactive_flag_prompt "$@"
  # 0. Drag-and-Drop Support & CLI Parsing
  handle_drag_and_drop "$@" || return $?
  parse_cli_args "$@"

  # 1. Pre-Sync Checks & Setup
  pre_sync_checks || return $?

  # 2. Interactive Branch Selection
  select_branches || return $?

  # 3. Pre-commit Linting/Formatting
  run_lint_and_format || return $?

  # 4. Auto-commit Flow
  auto_commit_flow || return $?

  # 5. Run Jest/Playwright/Other Tests
  run_tests || return $?

  # 6. Backup/Restore
  backup_before_sync || return $?

  # 7. Sync/Merge Flow
  sync_merge_flow || return $?

  # 8. Sync/Push Summary Table
  print_sync_summary || return $?

  # 9. Post-Sync Actions
  post_sync_actions || return $?
}

main "$@"
