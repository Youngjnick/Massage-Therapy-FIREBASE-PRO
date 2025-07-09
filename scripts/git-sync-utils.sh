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
    echo "[DEBUG] Entered prompt_for_branches function" >&2
    log_info "No target branches specified. Please select from the list below:"
    if [[ ! -t 0 ]]; then
        log_warning "Not running in an interactive terminal. Input may not work!"
    fi
    local current_branch
    current_branch=$(git symbolic-ref --short HEAD)
    typeset -a branches
    branches=()
    while IFS= read -r branch; do
        [[ "$branch" == "$current_branch" ]] && continue
        branches+=("$branch")
    done < <(git for-each-ref --format='%(refname:short)' refs/heads/)
    if [[ ${#branches[@]} -eq 0 ]]; then
        log_error "No local branches found to select from."
        exit 1
    fi
    local selected_branches=()
    while true; do
        echo "Available branches:"
        local idx=1
        for branch in "${branches[@]}"; do
            echo "  $idx) $branch"
            ((idx++))
        done
        printf "Enter branch numbers separated by space (e.g. 1 3 5), or '+' to add a new branch. Press 'Enter' when done: "
        local input
        read input
        echo "[DEBUG] User entered: $input" >&2
        if [[ -z "$input" ]]; then
            break
        elif [[ "$input" == "+" ]]; then
            printf "Enter new branch name: "
            read new_branch
            echo "[DEBUG] User entered new branch: $new_branch" >&2
            if [[ -z "$new_branch" ]]; then
                log_warning "No branch name entered. Skipping add."
                continue
            fi
            # Check if branch already exists
            if git show-ref --verify --quiet refs/heads/"$new_branch"; then
                log_warning "Branch '$new_branch' already exists. Adding to selection."
                selected_branches+=("$new_branch")
            else
                # Create the new branch from the current branch
                if git branch "$new_branch"; then
                    log_info "Branch '$new_branch' created from current branch."
                    selected_branches+=("$new_branch")
                else
                    log_error "Failed to create branch '$new_branch'. Not adding."
                    continue
                fi
            fi
            current_branch="$new_branch"
            branches=()
            while IFS= read -r branch; do
                [[ "$branch" == "$current_branch" ]] && continue
                branches+=("$branch")
            done < <(git for-each-ref --format='%(refname:short)' refs/heads/)
        else
            local -a selection
            selection=(${(z)input})
            local handled=false
            for num in $selection; do
                if [[ "$num" == <-> ]] && (( num >= 1 && num <= ${#branches[@]} )); then
                    selected_branches+=("${branches[$((num-1))]}")
                    handled=true
                fi
            done
            if [[ "$handled" == false && -n "$input" ]]; then
                log_warning "Invalid input: '$input'. Please enter valid branch numbers or '+'."
            fi
        fi
    done
    # Filter out empty strings and duplicates
    local -A seen
    local -a filtered_branches=()
    for b in "${selected_branches[@]}"; do
        if [[ -n "$b" && -z "${seen[$b]}" ]]; then
            filtered_branches+=("$b")
            seen[$b]=1
        fi
    done
    if [[ ${#filtered_branches[@]} -eq 0 ]]; then
        log_error "No branches selected. Aborting."
        exit 1
    fi
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
    local worktree_dir
    worktree_dir=$(mktemp -d -t "sync-worktree-$branch.XXXXXX")
    WORKTREES_TO_CLEAN+=("$worktree_dir")
    if [[ -z "$branch" ]]; then
        log_error "Empty branch name passed to sync_branch_worktree. Skipping."
        return $GIT_SYNC_ERR_GIT
    fi
    if ! git worktree add -f "$worktree_dir" "$branch"; then
        log_error "Failed to create worktree for branch '$branch'. It might not exist locally. Skipping."
        return $GIT_SYNC_ERR_GIT
    fi
    (
        cd "$worktree_dir"
        if [ "$FAST_MODE" = false ]; then
            log_info "Pulling latest changes for '$branch' from remote '${REMOTE}'..."
            if ! git pull "$REMOTE" "$branch"; then
                log_error "Failed to pull from remote for branch '$branch'. There might be merge conflicts. Skipping."
                exit $GIT_SYNC_ERR_GIT
            fi
        fi
        log_info "Syncing files from '${original_branch}' to '${branch}' in worktree..."
        rsync -av --delete --checksum --exclude=".git/" "$sync_source_dir/" .
        log_info "Committing changes in worktree for '$branch'..."
        git add -A
        if git diff-index --quiet --cached HEAD --; then
            log_warning "No changes to commit for branch '$branch'."
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
    )
    local subshell_exit_code=$?
    log_info "Cleaning up worktree for '$branch'..."
    git worktree remove "$worktree_dir" --force
    if [ $subshell_exit_code -eq 0 ]; then
        log_info "--- Successfully finished sync for branch: $branch ---"
    else
        log_error "--- Sync failed for branch: $branch ---"
    fi
    return $subshell_exit_code
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
