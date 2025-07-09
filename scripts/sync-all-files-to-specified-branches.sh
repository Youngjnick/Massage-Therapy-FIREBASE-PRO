#!/bin/zsh
# sync-all-files-to-specified-branches.sh

# --- Source Utility Functions ---
source "$(dirname "$0")/git-sync-utils.sh"

main() {
    # --- Argument Parsing ---
    parse_sync_args "$@"
    TARGET_BRANCHES=("${PARSED_TARGET_BRANCHES[@]}")
    REMOTE="$PARSED_REMOTE"
    SKIP_TESTS="$PARSED_SKIP_TESTS"
    FAST_MODE="$PARSED_FAST_MODE"
    STASH_CHANGES="$PARSED_STASH_CHANGES"
    DRY_RUN="$PARSED_DRY_RUN"
    MAX_PARALLEL="$PARSED_MAX_PARALLEL"

    cd "$(git rev-parse --show-toplevel)" || { log_error "Not a git repository. Aborting."; exit 1; }
    log_info "Running in repository root: $(pwd)"

    # Global array to track worktrees for cleanup
    WORKTREES_TO_CLEAN=()
    setup_cleanup_trap

    # If no target branches are provided after parsing, prompt the user
    if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
        TARGET_BRANCHES=($(prompt_for_branches))
        if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
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
    if [ "$any_failed" -eq 1 ]; then
        log_error "One or more sync jobs failed. Please review the logs."
        exit 1
    fi
    log_info "All sync operations complete successfully."
}

main "$@"