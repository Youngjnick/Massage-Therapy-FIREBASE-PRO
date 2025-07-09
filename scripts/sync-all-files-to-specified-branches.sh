#!/bin/zsh
# sync-all-files-to-branches.sh

# --- Setup and Configuration ---

# Set script to exit on error
set -euo pipefail

# --- Globals ---
# Color definitions for logging
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
BLUE='\033[1;34m'
NC='\033[0m'

# --- Function Definitions ---

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Function to display help message
show_help() {
  echo "Usage: $(basename "$0") [options] [branch1 branch2 ...]"
  echo ""
  echo "A script to synchronize files from the current working branch to other branches."
  echo ""
  echo "Options:"
  echo "  --remote <name>      Specify remote(s) to sync to (default: origin)."
  echo "  --skip-tests         Skip running tests before syncing."
  echo "  --fast, --dev        Enable fast mode for rapid development (skips tests, backups, uses faster git/rsync operations)."
  echo "  --stash              Automatically stash uncommitted changes before sync and pop after."
  echo "  --dry-run            Show what commands would be executed without actually running them."
  echo "  --help               Display this help message and exit."
  echo ""
  echo "Examples:"
  echo "  # Sync to 'main' and 'develop' branches"
  echo "  $(basename "$0") main develop"
  echo ""
  echo "  # Fast sync to a feature branch, stashing current changes"
  echo "  $(basename "$0") --fast --stash feature/new-thing"
  echo ""
  echo "  # Dry run of a sync to a remote staging branch"
  echo "  $(basename "$0") --dry-run --remote staging main"
}

# Function to prompt user to select branches
prompt_for_branches() {
    log_info "No target branches specified. Please select from the list below:"
    
    # Get local branches
    local branches
    branches=($(git for-each-ref --format='%(refname:short)' refs/heads/))
    
    if [ ${#branches[@]} -eq 0 ]; then
        log_error "No local branches found to select from."
        exit 1
    fi

    # Display branches in a numbered list
    for i in "${!branches[@]}"; do
        echo "  $((i+1))) ${branches[$i]}"
    done

    # Prompt for selection
    read -p "Enter the numbers of the branches to sync (e.g., 1 3 4): " -r selection
    
    local selected_branches=()
    for num in $selection; do
        # Check if input is a valid number
        if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le "${#branches[@]}" ]; then
            selected_branches+=("${branches[$((num-1))]}")
        else
            log_warning "Invalid selection: '$num'. Ignoring."
        fi
    done

    if [ ${#selected_branches[@]} -eq 0 ]; then
        log_error "No valid branches were selected. Aborting."
        exit 1
    fi
    
    # Return the selected branches
    echo "${selected_branches[@]}"
}

# Function to perform the sync for a single branch using a worktree
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

    if ! git worktree add -f "$worktree_dir" "$branch"; then
        log_error "Failed to create worktree for branch '$branch'. It might not exist locally. Skipping."
        return 1
    fi

    # --- Sync Logic within the Worktree ---
    (
        cd "$worktree_dir"
        
        # Pull latest changes from remote to avoid push conflicts
        if [ "$FAST_MODE" = false ]; then
            log_info "Pulling latest changes for '$branch' from remote '${REMOTE}'..."
            if ! git pull "$REMOTE" "$branch"; then
                log_error "Failed to pull from remote for branch '$branch'. There might be merge conflicts. Skipping."
                exit 1
            fi
        fi

        log_info "Syncing files from '${original_branch}' to '${branch}' in worktree..."
        rsync -av --delete --checksum --exclude=".git/" "$sync_source_dir/" .

        log_info "Committing changes in worktree for '$branch'..."
        git add -A
        if git diff-index --quiet --cached HEAD --; then
            log_warning "No changes to commit for branch '$branch'."
            exit 0 # Success, no changes
        fi
        
        if git commit -m "Sync from ${original_branch}"; then
            if [ "$FAST_MODE" = true ]; then
                log_info "Fast mode enabled, skipping remote push for '$branch'."
            else
                log_info "Pushing '$branch' to remote '${REMOTE}'..."
                if ! git push "$REMOTE" "$branch"; then
                    log_error "Failed to push to branch '$branch'."
                    exit 1
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

# --- Main Script Logic ---

main() {
    # --- Argument Parsing ---
    local TARGET_BRANCHES=()
    local REMOTE="origin"
    local SKIP_TESTS=false
    local FAST_MODE=false
    local STASH_CHANGES=false
    local DRY_RUN=false
    local MAX_PARALLEL=4 # Number of parallel sync jobs

    # Use a more robust argument parsing loop
    while [[ "$#" -gt 0 ]]; do
        case "$1" in
            --remote) REMOTE="$2"; shift ;;
            --skip-tests) SKIP_TESTS=true ;;
            --fast|--dev) FAST_MODE=true; SKIP_TESTS=true ;;
            --stash) STASH_CHANGES=true ;;
            --dry-run) DRY_RUN=true ;;
            --help) show_help; exit 0 ;;
            -*) log_error "Unknown option: $1"; show_help; exit 1 ;;
            *) TARGET_BRANCHES+=("$1") ;;
        esac
        shift
    done

    # --- Environment and Cleanup Setup ---
    cd "$(git rev-parse --show-toplevel)" || { log_error "Not a git repository. Aborting."; exit 1; }
    log_info "Running in repository root: $(pwd)"

    # Global array to track worktrees for cleanup
    declare -gA WORKTREES_TO_CLEAN=()
    trap 'log_info "Cleaning up temporary files..."; rm -rf "${WORKTREES_TO_CLEAN[@]}"' EXIT

    # If no target branches are provided after parsing, prompt the user
    if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
        TARGET_BRANCHES=($(prompt_for_branches))
        if [ ${#TARGET_BRANCHES[@]} -eq 0 ]; then
            exit 1
        fi
    fi

    # --- Pre-sync Setup ---
    local original_branch
    original_branch=$(git symbolic-ref --short HEAD)
    log_info "Current branch is '${original_branch}'."

    if [[ " ${TARGET_BRANCHES[*]} " =~ " ${original_branch} " ]]; then
        log_error "Cannot sync to the current active branch ('${original_branch}'). Please remove it from the target list."
        exit 1
    fi

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

    # --- Pre-sync Tests ---
    if [ "$SKIP_TESTS" = false ]; then
        log_info "Running tests before sync..."
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY RUN] Would run tests via 'npm test'."
        elif ! npm test; then
            log_error "Tests failed. Aborting sync."
            if [ "$STASH_CHANGES" = true ] && git stash list | grep -q 'sync-script-stash'; then
                git stash pop
            fi
            exit 1
        else
            log_info "Tests passed successfully."
        fi
    else
        log_info "Skipping tests."
    fi

    # --- Confirmation Prompt ---
    log_info "Will sync from '${original_branch}' to the following branches: ${BLUE}${TARGET_BRANCHES[*]}${NC}"
    log_info "Remote: ${REMOTE}, Fast Mode: ${FAST_MODE}, Stash: ${STASH_CHANGES}, Dry Run: ${DRY_RUN}"
    
    if [ "$DRY_RUN" = false ]; then
        read -p "Proceed with sync? (y/N): " -r confirm
        if [[ ! "$confirm" =~ ^[yY](es)?$ ]]; then
            log_warning "Sync cancelled by user."
            # Pop stash if we created one
            if [ "$STASH_CHANGES" = true ] && git stash list | grep -q 'sync-script-stash'; then
                git stash pop
            fi
            exit 0
        fi
    fi

    # --- Dry Run Check ---
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] The following branches would be synced in parallel: ${TARGET_BRANCHES[*]}"
        log_info "[DRY RUN] Operations: git worktree, rsync, git commit, git push."
        # Cleanup and exit dry run
        if [ "$STASH_CHANGES" = true ] && git stash list | grep -q 'sync-script-stash'; then
            git stash pop
        fi
        exit 0
    fi

    # --- Prepare Sync Source ---
    local sync_source_dir
    sync_source_dir=$(mktemp -d -t sync-src.XXXXXX)
    WORKTREES_TO_CLEAN+=("$sync_source_dir") # Also clean up the source dir
    
    log_info "Exporting content of '${original_branch}' to a temporary directory for sync..."
    if ! git archive "$original_branch" | tar -x -C "$sync_source_dir"; then
        log_error "Failed to archive source branch '${original_branch}'. Aborting."
        exit 1
    fi

    # --- Sync Loop (Parallelized) ---
    local pids=()
    for branch in "${TARGET_BRANCHES[@]}"; do
        # Run the sync function in the background
        sync_branch_worktree "$branch" "$original_branch" "$sync_source_dir" "$REMOTE" "$FAST_MODE" &
        pids+=($!)
        
        # Limit parallel jobs
        if ((${#pids[@]} >= MAX_PARALLEL)); then
            wait "${pids[0]}"
            pids=("${pids[@]:1}")
        fi
    done

    # Wait for all remaining background jobs to finish and check for failures
    local any_failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            log_warning "Sync job with PID $pid failed."
            any_failed=1
        fi
    done

    # --- Post-sync Cleanup ---
    log_info "All branches synced. Performing final cleanup."
    # The trap will handle removing temp directories

    if [ "$STASH_CHANGES" = true ]; then
        log_info "Popping stashed changes..."
        if git stash list | grep -q 'sync-script-stash'; then
            git stash pop
        else
            log_warning "No stash created by this script was found to pop."
        fi
    fi

    if [ "$any_failed" -eq 1 ]; then
        log_error "One or more sync jobs failed. Please review the logs."
        exit 1
    fi

    log_info "${GREEN}All sync operations complete successfully.${NC}"
}

# --- Script Entry Point ---
# Pass all script arguments to the main function
main "$@"