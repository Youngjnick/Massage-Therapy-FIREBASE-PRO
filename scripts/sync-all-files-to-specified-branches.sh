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

    # --- Show all branches, highlight current branch in green and with asterisk ---
    local current_branch
    current_branch=$(git symbolic-ref --short HEAD)
    echo
    echo "Available branches (\033[32m*\033[0m = current):"
    # Check if current branch has uncommitted changes
    local branch_status_color
    if [[ -n $(git status --porcelain) ]]; then
      branch_status_color="\033[33m"  # yellow
    else
      branch_status_color="\033[32m"  # green
    fi
    git for-each-ref --format='%(refname:short)' refs/heads/ | while read branch; do
      if [[ "$branch" == "$current_branch" ]]; then
        # Color and asterisk
        printf "  %b* %s\033[0m\n" "$branch_status_color" "$branch"
      else
        printf "    %s\n" "$branch"
      fi
    done
    echo


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
        log_info "No target branches specified. Prompting for branch selection..."
        # Use zsh array capture for robust multi-branch selection
        TARGET_BRANCHES=(${(z)$(prompt_for_branches)})
        log_info "User selected branches: ${TARGET_BRANCHES[*]}"
        if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
            log_error "No branches selected. Exiting."
            exit 1
        fi
    fi

    local original_branch
    original_branch=$(git symbolic-ref --short HEAD)
    log_info "Current branch is '${original_branch}'."

    if [[ " ${TARGET_BRANCHES[*]} " =~ " ${original_branch} " ]]; then
        log_error "Cannot sync to the current active branch ('${original_branch}'). Please remove it from the target list."
        exit 1
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