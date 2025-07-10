#!/bin/zsh
# sync-all-files-to-specified-branches.sh

# --- Drag-and-drop/quoted path fix: auto-re-exec as a command if needed ---
# Handles both quoted path (drag-and-drop in zsh) and non-executable absolute path
if [[ "$0" =~ ^\'.*\'$ ]]; then
    # $0 is a quoted string (drag-and-drop in zsh), remove quotes and re-exec
    exec zsh "${0:1:-1}" "$@"
elif [[ "$0" == /* ]] && [[ ! -x "$0" ]]; then
    # $0 is an absolute path but not executable (rare), try to exec as a command
    exec zsh "$0" "$@"
fi

# --- Source Utility Functions ---
source "$(dirname "$0")/git-sync-utils.sh"

main() {
    echo "[DEBUG] TARGET_BRANCHES before prompt: '${TARGET_BRANCHES[@]}'" >&2
    echo "[DEBUG] Running main() in sync-all-files-to-specified-branches.sh" >&2
    # --- Option: Push current branch to remote with detailed summary ---
    for arg in "$@"; do
        if [[ "$arg" == "--push-current-with-summary" ]]; then
            local branch
            branch=$(git symbolic-ref --short HEAD)
            local changed_files diff_stat commit_msg
            changed_files=$(git status --short)
            diff_stat=$(git diff --stat)
            commit_msg="Sync: Update $branch\n\n--- Changed Files ---\n${changed_files}\n\n--- Diff Summary ---\n${diff_stat}\n\nSync performed: $(date -u '+%Y-%m-%d %H:%M UTC')"
            echo -e "\n\033[1;36m--- Commit message preview ---\033[0m\n$commit_msg\n"
            # Auto-commit and push without prompt
            git add -A
            git commit -m "$commit_msg"
            git push origin "$branch"
            echo "Pushed to origin/$branch with detailed summary."
            exit 0
        fi
    done
    # --- Optional: Auto-commit before sync if requested ---
    AUTO_COMMIT=false
    for arg in "$@"; do
        if [[ "$arg" == "--auto-commit" ]]; then
            AUTO_COMMIT=true
        fi
    done

    if [ "$AUTO_COMMIT" = true ]; then
        if [[ -n $(git status --porcelain) ]]; then
            echo "You have unstaged or uncommitted changes in '${original_branch}'." >&2
            echo -n "Auto-stage and commit all changes before sync? (y/N): "
            read auto_commit_confirm
            if [[ "$auto_commit_confirm" =~ ^[yY](es)?$ ]]; then
                echo -n "Enter commit message [Auto-commit before sync]: "
                read auto_commit_msg
                if [[ -z "$auto_commit_msg" ]]; then
                    auto_commit_msg="Auto-commit before sync"
                fi
                git add -A && git commit -m "$auto_commit_msg"
            else
                echo "Aborting sync. Please commit or stash your changes manually." >&2
                exit 1
            fi
        fi
    fi
    # --- Ensure running in a real terminal for interactive prompts ---
    if [[ ! -t 0 ]]; then
        log_error "This script must be run from a terminal for interactive prompts."
        exit 1
    fi
    echo "Normalizing line endings for all shell scripts to Unix (LF)..."
    if command -v dos2unix >/dev/null 2>&1; then
      dos2unix scripts/*.sh
    else
      echo "dos2unix not found, using sed fallback."
      for script in scripts/*.sh; do
        sed -i '' $'s/\r$//' "$script"
      done
    fi

    # (Branch list is now only shown in prompt_for_branches)


    # --- Argument Parsing ---
    parse_sync_args "$@"
    TARGET_BRANCHES=("${PARSED_TARGET_BRANCHES[@]}")
    REMOTE="$PARSED_REMOTE"
    SKIP_TESTS="$PARSED_SKIP_TESTS"
    FAST_MODE="$PARSED_FAST_MODE"
    STASH_CHANGES="$PARSED_STASH_CHANGES"
    DRY_RUN="$PARSED_DRY_RUN"
    MAX_PARALLEL="$PARSED_MAX_PARALLEL"

    local repo_root
    repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
    if [[ -z "$repo_root" ]]; then
        log_error "Not a git repository. Please run this script from inside a git project directory. Aborting."
        exit 1
    fi
    cd "$repo_root" || { log_error "Failed to cd to repository root: $repo_root. Aborting."; exit 1; }
    log_info "Running in repository root: $(pwd)"

    # Global array to track worktrees for cleanup
    WORKTREES_TO_CLEAN=()
    setup_cleanup_trap

    # If no target branches are provided after parsing, prompt the user
    if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
        prompt_for_branches
        TARGET_BRANCHES=("${branches[@]}")
        if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
            log_error "No branches selected. Exiting."
            exit 1
        fi
    fi

    local original_branch
    original_branch=$(git symbolic-ref --short HEAD)
    log_info "Current branch is '${original_branch}'."

    # --- If current branch is in the sync list, auto-commit and push it, then remove from sync targets ---
    local current_in_targets=false
    for b in "${TARGET_BRANCHES[@]}"; do
        if [[ "$b" == "$original_branch" ]]; then
            current_in_targets=true
            break
        fi
    done
    if [ "$current_in_targets" = true ]; then
        log_info "Current branch '${original_branch}' is in the sync target list. Auto-committing and pushing before syncing others."
        local changed_files diff_stat commit_msg
        changed_files=$(git status --short)
        diff_stat=$(git diff --stat)
        commit_msg="Sync: Update $original_branch\n\n--- Changed Files ---\n${changed_files}\n\n--- Diff Summary ---\n${diff_stat}\n\nSync performed: $(date -u '+%Y-%m-%d %H:%M UTC')"
        print -P "\n%F{cyan}--- Commit message preview for $original_branch ---\n$commit_msg%f\n"
        git add -A
        if git diff --cached --quiet; then
            log_info "No staged changes to commit on '$original_branch'. Skipping commit."
        else
            git commit -m "$commit_msg"
        fi
        git push "$REMOTE" "$original_branch"
        log_info "Pushed current branch '$original_branch' to '$REMOTE' with detailed summary."
        # Remove current branch from TARGET_BRANCHES
        local new_targets=()
        for b in "${TARGET_BRANCHES[@]}"; do
            if [[ "$b" != "$original_branch" ]]; then
                new_targets+=("$b")
            fi
        done
        TARGET_BRANCHES=("${new_targets[@]}")
        if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
            log_info "No other branches to sync after pushing current branch. Exiting."
            exit 0
        fi
    fi

    handle_stash "$STASH_CHANGES" "$DRY_RUN"

    if ! run_pre_sync_tests "$SKIP_TESTS" "$DRY_RUN"; then
        pop_stash_if_needed "$STASH_CHANGES"
        exit 1
    fi

    log_info "Will sync from '${original_branch}' to the following branches: ${TARGET_BRANCHES[*]}"
    log_info "Remote: ${REMOTE}, Fast Mode: ${FAST_MODE}, Stash: ${STASH_CHANGES}, Dry Run: ${DRY_RUN}"

    # Confirm with user the exact branches to sync to
    echo
    echo "You are about to sync from '${original_branch}' to the following branches:" >&2
    for b in "${TARGET_BRANCHES[@]}"; do
        echo "  - $b" >&2
    done
    echo
    if ! confirm_sync "$DRY_RUN"; then
        pop_stash_if_needed "$STASH_CHANGES"
        exit 0
    fi

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] The following branches would be synced in parallel: ${TARGET_BRANCHES[*]}"
        log_info "[DRY RUN] Operations: git worktree, rsync, git commit, git push."
        pop_stash_if_needed "$STASH_CHANGES"
        exit 0
    fi

    local sync_source_dir
    sync_source_dir=$(mktemp -d -t sync-src.XXXXXX)
    WORKTREES_TO_CLEAN+=("$sync_source_dir")
    log_info "Exporting content of '${original_branch}' to a temporary directory for sync..."
    if ! git archive "$original_branch" | tar -x -C "$sync_source_dir"; then
        log_error "Failed to archive source branch '${original_branch}'. Aborting."
        exit 1
    fi

    log_info "DEBUG: Final TARGET_BRANCHES array: ${TARGET_BRANCHES[@]}"
    for branch in "${TARGET_BRANCHES[@]}"; do
        log_info "DEBUG: Will sync branch: $branch"
    done

    local pids=()
    for branch in "${TARGET_BRANCHES[@]}"; do
        sync_branch_worktree "$branch" "$original_branch" "$sync_source_dir" "$REMOTE" "$FAST_MODE" WORKTREES_TO_CLEAN &
        pids+=($!)
        if (( ${#pids[@]} >= MAX_PARALLEL )); then
            wait "${pids[0]}"
            pids=("${pids[@]:1}")
        fi
    done
    local any_failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            log_warning "Sync job with PID $pid failed."
            any_failed=1
        fi
    done

    log_info "All branches synced. Performing final cleanup."
    pop_stash_if_needed "$STASH_CHANGES"
    # Prompt for branch deletes at the very end
    prompt_for_final_branch_deletes "$REMOTE"

    # --- Optional: Post-sync diff prompt ---
    echo -n "Would you like to see a summary diff between the source branch and each target branch? (y/N): "
    read show_diff
    if [[ "$show_diff" =~ ^[yY](es)?$ ]]; then
        for b in "${TARGET_BRANCHES[@]}"; do
            echo
            echo "==== git diff --stat ${original_branch}..${b} ===="
            git diff --stat "${original_branch}..${b}"
        done
        echo
        echo "To see full diffs, run: git diff <source>..<target>"
    fi
    if [ "$any_failed" -eq 1 ]; then
        log_error "One or more sync jobs failed. Please review the logs."
        exit 1
    fi
    log_info "All sync operations complete successfully."
}

main "$@"