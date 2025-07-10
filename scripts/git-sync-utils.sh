# --- Open GitHub Branch Page Utility ---
open_github_branch_page() {
    local branch="$1"
    local remote="${2:-origin}"
    local remote_url repo_path url
    remote_url=$(git remote get-url "$remote" 2>/dev/null)
    if [[ -z "$remote_url" ]]; then
        log_warning "Could not get remote URL for '$remote'. Skipping browser open."
        return 1
    fi
    if [[ "$remote_url" == git@github.com:* ]]; then
        repo_path="${remote_url#git@github.com:}"
        repo_path="${repo_path%.git}"
    elif [[ "$remote_url" == https://github.com/* ]]; then
        repo_path="${remote_url#https://github.com/}"
        repo_path="${repo_path%.git}"
    else
        log_warning "Remote URL '$remote_url' is not a recognized GitHub URL. Skipping browser open."
        return 1
    fi
    url="https://github.com/${repo_path}/tree/${branch}"
    log_info "Opening GitHub branch page: $url"
    if command -v open >/dev/null 2>&1; then
        open "$url"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$url"
    elif command -v start >/dev/null 2>&1; then
        start "$url"
    else
        log_warning "Could not find a command to open the browser. Please visit: $url"
        return 1
    fi
    return 0
}
#!/bin/zsh
# git-sync-utils.sh
# Utility functions for git sync scripts (zsh compatible)

# --- Logging Functions ---
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1" >&2
}

# --- Verbosity and Debug Logging ---
: ${GIT_SYNC_VERBOSE:=0}
log_debug() {
    if [[ "$GIT_SYNC_VERBOSE" == 1 ]]; then
        echo -e "\033[36m[DEBUG]\033[0m $1"
    fi
}

# --- Error Codes ---
GIT_SYNC_ERR_TEST=2
GIT_SYNC_ERR_GIT=3

# --- Prompt for Branches (zsh compatible, reusable) ---
prompt_for_branches() {
    unset user_input; unset -m 'user_input*';
    log_info "No target branches specified. Please select from the list below:" >&2
    log_debug "[prompt_for_branches] Entered function." >&2
    if [[ ! -t 0 ]]; then
        log_error "[prompt_for_branches] Not running in an interactive terminal (no TTY). Aborting." >&2
        exit 1
    fi
    local current_branch
    current_branch=$(git symbolic-ref --short HEAD)
    log_debug "[prompt_for_branches] Current branch: $current_branch" >&2
    typeset -a branches
    branches=()
    while IFS= read -r branch; do
        log_debug "[prompt_for_branches] Found branch: $branch" >&2
        [[ "$branch" == "$current_branch" ]] && continue
        branches+=("$branch")
    done < <(git for-each-ref --format='%(refname:short)' refs/heads/)
    log_debug "[prompt_for_branches] Branches array: ${branches[@]}" >&2
    if [[ ${#branches[@]} -eq 0 ]]; then
        log_warning "No local branches found to select from. You must create a branch." >&2
    fi
    local selected_branches=()
    while true; do
        echo "Available branches:" >&2
        local idx=1
        for branch in "${branches[@]}"; do
            printf "  %2d) %s\n" $idx "$branch" >&2
            ((idx++))
        done
        log_debug "[prompt_for_branches] About to prompt for branch selection." >&2
        printf "Type branch numbers separated by space (e.g. 1 3 5), or '+' to add a new branch. Press 'Enter' when done: " >&2
        local user_input=""
        read user_input
        log_debug "[prompt_for_branches] User input: $user_input" >&2
        if [[ -z "$user_input" ]]; then
            log_debug "[prompt_for_branches] User pressed Enter with no input." >&2
            break
        elif [[ "$user_input" == "+" ]]; then
            printf "Enter new branch name: " >&2
            read new_branch
            log_debug "[prompt_for_branches] New branch input: $new_branch" >&2
            if [[ -z "$new_branch" ]]; then
                log_warning "No branch name entered. Skipping add." >&2
                continue
            fi
            if git show-ref --verify --quiet refs/heads/"$new_branch"; then
                log_warning "Branch '$new_branch' already exists. Adding to selection." >&2
                selected_branches+=("$new_branch")
            else
                if git branch "$new_branch"; then
                    log_info "Branch '$new_branch' created from current branch." >&2
                    selected_branches+=("$new_branch")
                else
                    log_error "Failed to create branch '$new_branch'. Not adding." >&2
                    continue
                fi
            fi
            # Immediately select the new branch and finish
            echo "${selected_branches[@]}"
            return 0
        else
            # Remove any accidental variable assignment from input (e.g. user_input=17)
            local -a selection
            selection=(${(z)${user_input//user_input=}})
            log_debug "[prompt_for_branches] Selection array: ${selection[@]}" >&2
            local handled=false
            local -a preview_branches=()
            for num in $selection; do
                if [[ "$num" == <-> ]] && (( num >= 1 && num <= ${#branches[@]} )); then
                    preview_branches+=("${branches[$num]}")
                    handled=true
                fi
            done
            if [[ "$handled" == false && -n "$user_input" ]]; then
                log_warning "Invalid input: '$user_input'. Please enter valid branch numbers or '+'." >&2
            elif [[ "$handled" == true ]]; then
                echo "You have selected the following branches:" >&2
                for b in "${preview_branches[@]}"; do
                    echo "  - $b" >&2
                done
                echo -n "Confirm selection? (y/N): " >&2
                read confirm_selection
                if [[ "$confirm_selection" =~ ^[yY](es)?$ ]]; then
                    selected_branches+=("${preview_branches[@]}")
                    break
                else
                    log_info "Selection cancelled. Please select again." >&2
                    continue
                fi
            fi
        fi
        log_debug "[prompt_for_branches] End of loop, selected_branches so far: ${selected_branches[@]}" >&2
        sleep 0.2
    done
    # Filter out empty strings, duplicates, and any accidental env var assignments
    local -A seen
    local -a filtered_branches=()
    for b in "${selected_branches[@]}"; do
        # Only allow valid branch names (no =, no spaces, not empty)
        if [[ -n "$b" && -z "${seen[$b]}" && "$b" != *=* && "$b" != user_input ]]; then
            filtered_branches+=("$b")
            seen[$b]=1
        fi
    done
    log_debug "[prompt_for_branches] Filtered branches: ${filtered_branches[@]}" >&2
    if [[ ${#filtered_branches[@]} -eq 0 ]]; then
        log_error "No branches selected. Aborting." >&2
        exit 1
    fi
    log_debug "[prompt_for_branches] About to echo to stdout: ${filtered_branches[@]}" >&2
    # Only print the result to stdout, everything else to stderr
    echo "${filtered_branches[@]}"
}

# --- Argument Parsing Utility (no nameref) ---
# Sets global variables: PARSED_TARGET_BRANCHES, PARSED_REMOTE, PARSED_SKIP_TESTS, PARSED_FAST_MODE, PARSED_STASH_CHANGES, PARSED_DRY_RUN, PARSED_MAX_PARALLEL
parse_sync_args() {
    PARSED_TARGET_BRANCHES=()
    PARSED_REMOTE="origin"
    PARSED_SKIP_TESTS=false
    PARSED_FAST_MODE=false
    PARSED_STASH_CHANGES=false
    PARSED_DRY_RUN=false
    PARSED_MAX_PARALLEL=4
    while [[ "$#" -gt 0 ]]; do
        case "$1" in
            --remote) PARSED_REMOTE="$2"; shift ;;
            --skip-tests) PARSED_SKIP_TESTS=true ;;
            --fast|--dev) PARSED_FAST_MODE=true; PARSED_SKIP_TESTS=true ;;
            --stash) PARSED_STASH_CHANGES=true ;;
            --dry-run) PARSED_DRY_RUN=true ;;
            --help) show_help; exit 0 ;;
            -*) log_error "Unknown option: $1"; show_help; exit 1 ;;
            *) PARSED_TARGET_BRANCHES+=("$1") ;;
        esac
        shift
    done
}

# --- Worktree Sync Utility ---
sync_branch_worktree() {
    local branch="$1"
    local original_branch="$2"
    local sync_source_dir="$3"
    local REMOTE="$4"
    local FAST_MODE="$5"
    log_info "--- Starting sync for branch: $branch ---"
    log_debug "[sync_branch_worktree] original_branch='$original_branch', branch='$branch', sync_source_dir='$sync_source_dir', REMOTE='$REMOTE', FAST_MODE='$FAST_MODE'" >&2

    # Always add branch to deferred delete prompt using a temp file (robust across subshells)
    if [[ -z "$GIT_SYNC_DEFERRED_DELETE_FILE" ]]; then
        export GIT_SYNC_DEFERRED_DELETE_FILE="/tmp/git-sync-deferred-branches-$$.txt"
        : > "$GIT_SYNC_DEFERRED_DELETE_FILE"  # Truncate or create
    fi
    echo "$branch" >> "$GIT_SYNC_DEFERRED_DELETE_FILE"

    # --- Always auto-commit all uncommitted changes in the main working directory before syncing ---
    while [[ -n $(git status --porcelain) ]]; do
        log_info "Auto-committing all uncommitted changes in the main working directory before syncing..."
        git add -A
        if git commit -m "Auto-commit before sync to $branch ($(date +'%Y-%m-%d %H:%M:%S'))"; then
            log_info "Auto-commit successful."
        else
            log_warning "Auto-commit failed or nothing to commit."
            break
        fi
    done
    if [[ -z $(git status --porcelain) ]]; then
        log_info "No uncommitted changes to auto-commit before syncing."
    fi
    local worktree_dir
    worktree_dir=$(mktemp -d -t "sync-worktree-$branch.XXXXXX")
    WORKTREES_TO_CLEAN+=("$worktree_dir")
    if [[ -z "$branch" ]]; then
        log_error "Empty branch name passed to sync_branch_worktree. Skipping."
        return $GIT_SYNC_ERR_GIT
    fi
    # Check if branch exists on remote BEFORE creating worktree
    if ! git ls-remote --exit-code --heads "$REMOTE" "$branch" >/dev/null 2>&1; then
        log_info "Remote branch '$branch' does not exist. Creating and pushing to '$REMOTE' before worktree add."
        if ! git push -u "$REMOTE" "$branch"; then
            log_error "Failed to push new branch '$branch' to remote '$REMOTE'. Skipping."
            return $GIT_SYNC_ERR_GIT
        fi
    fi
    if ! git worktree add -f "$worktree_dir" "$branch"; then
        log_error "Failed to create worktree for branch '$branch'. It might not exist locally. Skipping."
        return $GIT_SYNC_ERR_GIT
    fi
    local sync_success=0
    (
        cd "$worktree_dir"
        log_debug "[sync_branch_worktree] worktree_dir='$(pwd)'" >&2
        log_debug "[sync_branch_worktree] Listing files in worktree before rsync:" >&2
        ls -al >&2
        if [ "$FAST_MODE" = false ]; then
            log_info "Pulling latest changes for '$branch' from remote '${REMOTE}'..."
            if ! git pull "$REMOTE" "$branch"; then
                log_error "Failed to pull from remote for branch '$branch'. There might be merge conflicts. Skipping."
                exit $GIT_SYNC_ERR_GIT
            fi
        fi
        log_info "Syncing files from '${original_branch}' to '${branch}' in worktree..."
        rsync -av --delete --checksum --exclude='.git' --exclude='.git/*' "$sync_source_dir/" .

        log_debug "After rsync, worktree directory listing:" >&2
        ls -l >&2
        log_debug "After rsync, git status:" >&2
        git status >&2
        log_debug "[sync_branch_worktree] diff -ruN $sync_source_dir . (after rsync):" >&2
        diff -ruN "$sync_source_dir" . >&2 || true

        # Always auto-stage and commit all changes in the worktree for each target branch (no prompt)
        if [[ -n $(git status --porcelain) ]]; then
            log_info "Auto-staging and committing all changes in the worktree for '$branch'..."
            git add -A
            log_debug "After git add -A, git status:" >&2
            git status >&2
            if git diff-index --quiet --cached HEAD --; then
                log_warning "No changes to commit for branch '$branch'. (If you expected changes, check rsync source/dest and excludes.)"
                exit 0
            fi
            if git commit -m "Sync from ${original_branch}"; then
                if [ "$FAST_MODE" = true ]; then
                    log_info "Fast mode enabled, skipping remote push for '$branch'."
                else
                    log_info "Pushing '$branch' to remote '${REMOTE}'..."
                    if ! git push "$REMOTE" "$branch"; then
                        log_error "Failed to push to branch '$branch'."
                        exit $GIT_SYNC_ERR_GIT
                    fi
                fi
            else
                log_warning "Commit failed for branch '$branch', though changes were detected."
                exit 1
            fi
        else
            log_info "No changes to commit for branch '$branch' after rsync."
        fi

        log_info "Committing changes in worktree for '$branch'..."
        git add -A
        log_debug "After git add -A, git status:" >&2
        git status >&2
        if git diff-index --quiet --cached HEAD --; then
            log_warning "No changes to commit for branch '$branch'. (If you expected changes, check rsync source/dest and excludes.)"
            exit 0
        fi
        if git commit -m "Sync from ${original_branch}"; then
            if [ "$FAST_MODE" = true ]; then
                log_info "Fast mode enabled, skipping remote push for '$branch'."
            else
                log_info "Pushing '$branch' to remote '${REMOTE}'..."
                if ! git push "$REMOTE" "$branch"; then
                    log_error "Failed to push to branch '$branch'."
                    exit $GIT_SYNC_ERR_GIT
                fi
            fi
        else
            log_warning "Commit failed for branch '$branch', though changes were detected."
            exit 1
        fi
        sync_success=1
        exit 0
    )
    local subshell_exit_code=$?
    log_info "Cleaning up worktree for '$branch'..."
    git worktree remove "$worktree_dir" --force
    if [ $subshell_exit_code -eq 0 ]; then
        log_info "--- Successfully finished sync for branch: $branch ---"
        open_github_branch_page "$branch" "$REMOTE"
    else
        log_error "--- Sync failed for branch: $branch ---"
    fi
    # (No longer needed here, handled at the top of the function)
    return $subshell_exit_code
}

# --- Final Branch Delete Prompt Utility ---
prompt_for_final_branch_deletes() {
    echo "[DEBUG] prompt_for_final_branch_deletes called. GIT_SYNC_DEFERRED_DELETE_FILE='$GIT_SYNC_DEFERRED_DELETE_FILE'" >&2
    local REMOTE="${1:-origin}"
    local branches=""
    if [[ -n "$GIT_SYNC_DEFERRED_DELETE_FILE" && -f "$GIT_SYNC_DEFERRED_DELETE_FILE" ]]; then
        branches=$(cat "$GIT_SYNC_DEFERRED_DELETE_FILE" | tr '\n' ' ')
    fi
    log_debug "[prompt_for_final_branch_deletes] Called. branches='$branches'" >&2
    if [[ -z "$branches" ]]; then
        log_debug "[prompt_for_final_branch_deletes] No branches to prompt for deletion." >&2
        return
    fi
    echo
    echo "Sync complete."
    echo "You may now delete any synced branches from local or remote."
    for branch in $branches; do
        echo -n "Do you want to delete the branch '$branch' from local after sync? (y/N): "
        read delete_branch
        if [[ "$delete_branch" =~ ^[yY](es)?$ ]]; then
            if git branch -D "$branch"; then
                log_info "Branch '$branch' deleted from local."
            else
                log_warning "Failed to delete branch '$branch' from local."
            fi
        else
            log_info "Branch '$branch' was not deleted from local."
        fi
    done
    # Ask if user wants to delete any other branches (local or remote)
    echo -n "Do you want to delete any other branches from local or remote? (y/N): "
    read delete_others
    if [[ "$delete_others" =~ ^[yY](es)?$ ]]; then
        while true; do
            echo -n "Enter branch name to delete (or just press Enter to finish): "
            read branch_to_delete
            if [[ -z "$branch_to_delete" ]]; then
                break
            fi
            echo -n "Delete '$branch_to_delete' from (l)ocal, (r)emote, or (b)oth? [l/r/b]: "
            read del_where
            if [[ "$del_where" =~ ^[lL]$ ]]; then
                if git branch -D "$branch_to_delete"; then
                    log_info "Branch '$branch_to_delete' deleted from local."
                else
                    log_warning "Failed to delete branch '$branch_to_delete' from local."
                fi
            elif [[ "$del_where" =~ ^[rR]$ ]]; then
                if git push "$REMOTE" --delete "$branch_to_delete"; then
                    log_info "Branch '$branch_to_delete' deleted from remote '$REMOTE'."
                else
                    log_warning "Failed to delete branch '$branch_to_delete' from remote '$REMOTE'."
                fi
            elif [[ "$del_where" =~ ^[bB]$ ]]; then
                local del_local=0 del_remote=0
                if git branch -D "$branch_to_delete"; then
                    log_info "Branch '$branch_to_delete' deleted from local."
                    del_local=1
                else
                    log_warning "Failed to delete branch '$branch_to_delete' from local."
                fi
                if git push "$REMOTE" --delete "$branch_to_delete"; then
                    log_info "Branch '$branch_to_delete' deleted from remote '$REMOTE'."
                    del_remote=1
                else
                    log_warning "Failed to delete branch '$branch_to_delete' from remote '$REMOTE'."
                fi
                if [[ $del_local -eq 0 && $del_remote -eq 0 ]]; then
                    log_warning "Failed to delete branch '$branch_to_delete' from both local and remote."
                fi
            else
                log_warning "Invalid choice. Please enter 'l', 'r', or 'b'."
            fi
        done
    fi
    # Clean up temp file
    if [[ -n "$GIT_SYNC_DEFERRED_DELETE_FILE" && -f "$GIT_SYNC_DEFERRED_DELETE_FILE" ]]; then
        rm -f "$GIT_SYNC_DEFERRED_DELETE_FILE"
        unset GIT_SYNC_DEFERRED_DELETE_FILE
    fi
}

# --- Cleanup Utility (no nameref) ---
# Expects global array WORKTREES_TO_CLEAN
setup_cleanup_trap() {
    trap 'log_info "Cleaning up temporary files..."; rm -rf "${WORKTREES_TO_CLEAN[@]}"' EXIT
}

# --- Test Running Utility ---
run_pre_sync_tests() {
    local SKIP_TESTS=$1
    local DRY_RUN=$2
    if [ "$SKIP_TESTS" = false ]; then
        log_info "Running tests before sync..."
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY RUN] Would run tests via 'npm test'."
        elif ! npm test; then
            log_error "Tests failed. Aborting sync."
            exit $GIT_SYNC_ERR_TEST
        else
            log_info "Tests passed successfully."
        fi
    else
        log_info "Skipping tests."
    fi
    return 0
}

# --- Stash Handling Utilities ---
handle_stash() {
    local STASH_CHANGES=$1
    local DRY_RUN=$2
    if [ "$STASH_CHANGES" = true ]; then
        log_info "Stashing uncommitted changes..."
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY RUN] Would run: git stash push -m 'sync-script-stash'"
        elif ! git diff-index --quiet HEAD --; then
            git stash push -m "sync-script-stash"
        else
            log_info "No changes to stash."
        fi
    fi
}

pop_stash_if_needed() {
    local STASH_CHANGES=$1
    if [ "$STASH_CHANGES" = true ] && git stash list | grep -q 'sync-script-stash'; then
        git stash pop
    fi
}

# --- Confirmation Prompt Utility ---
confirm_sync() {
    local DRY_RUN=$1
    if [ "$DRY_RUN" = false ]; then
        echo -n "Proceed with sync? (y/N): "
        read confirm
        if [[ ! "$confirm" =~ ^[yY](es)?$ ]]; then
            log_warning "Sync cancelled by user."
            return 1
        fi
    fi
    return 0
}
