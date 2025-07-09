#!/bin/zsh
# sync-all-files-to-branches.sh

# Enable error handling
set -euo pipefail

# Color definitions
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
BLUE='\033[1;34m'
NC='\033[0m'

# Script directory (zsh compatible)
SCRIPT_DIR="${0:A:h}"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT" || exit 1

# Initialize repository if needed
init_repository() {
  # Ensure we're in the repository root
  cd "$REPO_ROOT"
  
  # Check if git is initialized
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${YELLOW}Git repository not found. Initializing...${NC}"
    git init
    
    # Create default .gitignore if it doesn't exist
    if [[ ! -f .gitignore ]]; then
      cat > .gitignore << EOL
node_modules/
*.log
.DS_Store
/dist
/coverage
.env
.env.local
EOL
    fi
    
    # Initialize repository with main branch
    git add .gitignore
    git commit -m "Initial commit: Add .gitignore" || true
    
    # Create and switch to main branch
    git checkout -b main 2>/dev/null || true
    
    # Add and commit existing files
    git add .
    git commit -m "Initial commit: Project files" || true
    
    # Add origin if it doesn't exist (assuming GitHub repository)
    if ! git remote | grep -q '^origin$'; then
      read -p "Enter GitHub repository URL (or press Enter to skip): " repo_url
      if [[ -n "$repo_url" ]]; then
        git remote add origin "$repo_url"
        git push -u origin main || true
      fi
    fi
    
    echo -e "${GREEN}Repository initialized successfully${NC}"
  fi
  
  # Ensure we're on a branch
  if ! git symbolic-ref -q HEAD > /dev/null; then
    git checkout main 2>/dev/null || git checkout -b main
  fi
}

# Safer git operations with retries
safe_git() {
  local max_retries=3
  local retry_count=0
  local cmd_output
  
  while (( retry_count < max_retries )); do
    if cmd_output=$(command git "$@" 2>&1); then
      echo "$cmd_output"
      return 0
    else
      local exit_code=$?
      ((retry_count++))
      
      if (( retry_count < max_retries )); then
        echo -e "${YELLOW}Git command failed, retrying ($retry_count/$max_retries): git $*${NC}"
        sleep 1
      else
        echo -e "${RED}Git command failed after $max_retries attempts: git $*${NC}"
        echo -e "${RED}Error: $cmd_output${NC}"
        return $exit_code
      fi
    fi
  done
}

# RAM disk setup with better error handling and without sudo requirement
setup_ramdisk() {
  if [[ "$(uname)" == "Darwin" ]]; then
    local temp_dir="/tmp/git-sync-ram-$$"
    mkdir -p "$temp_dir"
    
    # Use memory-backed storage on macOS without requiring sudo
    if mount | grep -q "$temp_dir"; then
      umount "$temp_dir" 2>/dev/null || true
    fi
    
    # Create a temporary workspace without RAM disk if we can't set it up
    echo "Using fast temporary directory at $temp_dir"
    export TMPDIR="$temp_dir"
    export GIT_TMPDIR="$temp_dir"
    
    # Cleanup on script exit
    trap 'rm -rf "$temp_dir" 2>/dev/null || true' EXIT
  fi
}

# Validate git configuration
setup_git_config() {
  # Ensure minimal git config exists
  if ! git config user.name > /dev/null 2>&1; then
    git config user.name "Sync Script"
  fi
  if ! git config user.email > /dev/null 2>&1; then
    git config user.email "sync@example.com"
  fi
  
  # Optimize git for fast operations
  git config --local core.preloadindex true
  git config --local core.fscache true
  git config --local gc.auto 0
  
  if [[ "$FAST_MODE" == "true" ]]; then
    git config --local core.compression 0
    git config --local pack.compression 0
  fi
}

# Default settings
remotes=(origin)
branches=()
LOG_FILE="$(dirname "$0")/sync-history.log"
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"
SKIP_TESTS=false
BACKUP_ENABLED=${BACKUP_ENABLED:-false}  # Disable backups by default for speed
FAST_MODE=false  # New fast mode flag

# Cache directory for git operations
export GIT_CACHE_DIR="$PWD/sync_tmp_backups/.git-cache"
mkdir -p "$GIT_CACHE_DIR"

# Optimize git performance
export GIT_CONFIG_PARAMETERS="'core.preloadindex=true' 'core.fscache=true' 'core.fsmonitor=true'"
export GIT_TRACE_PACKET=0
export GIT_TRACE=0
export GIT_TRACE_PERFORMANCE=0
export GIT_TRACE_PACK_ACCESS=0
export GIT_TRACE_PACK_ACCESS=0
export GIT_OBJECT_DIRECTORY="$GIT_CACHE_DIR/objects"

# Fast mode optimizations
if [[ "$FAST_MODE" == true ]]; then
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'gc.auto=0' 'gc.autoPackLimit=0'"
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'core.compression=0'"
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'pack.compression=0'"
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'pack.deltaCacheSize=0'"
fi

# RAM disk for temporary operations (if available)
setup_ramdisk() {
  if [[ "$(uname)" == "Darwin" && -w "/private/var/tmp" ]]; then
    RAMDISK_SIZE=512  # MB
    RAMDISK_NAME="GitSyncRAM"
    RAMDISK_PATH="/private/var/tmp/git-sync-ram"
    
    # Only attempt RAM disk setup if we have sudo rights
    if [[ -n "$SUDO_USER" || $(id -u) -eq 0 ]]; then
      echo "Setting up RAM disk for faster operations..."
      
      # Clean up any existing failed mounts
      if mount | grep -q "$RAMDISK_PATH"; then
        sudo umount "$RAMDISK_PATH" 2>/dev/null
      fi
      
      # Create mount point if it doesn't exist
      sudo mkdir -p "$RAMDISK_PATH"
      
      # Create and mount RAM disk with error handling
      if DISK_ID=$(hdiutil attach -nobrowse -nomount ram://$((RAMDISK_SIZE * 2048))); then
        DISK_ID=$(echo "$DISK_ID" | tr -d ' ')
        if diskutil erasevolume HFS+ "$RAMDISK_NAME" "$DISK_ID" > /dev/null 2>&1; then
          if mount -t hfs "$DISK_ID" "$RAMDISK_PATH" 2>/dev/null; then
            echo "RAM disk successfully mounted at $RAMDISK_PATH"
            # Set appropriate permissions
            sudo chown $(id -u):$(id -g) "$RAMDISK_PATH"
            sudo chmod 755 "$RAMDISK_PATH"
            export TMPDIR="$RAMDISK_PATH"
            export GIT_TMPDIR="$RAMDISK_PATH"
            return 0
          fi
        fi
        # Cleanup on failure
        hdiutil detach "$DISK_ID" > /dev/null 2>&1
      fi
      echo "RAM disk setup failed, using default temp directory"
    else
      echo "RAM disk setup skipped (requires sudo access)"
    fi
  fi
  # Fallback to regular temp directory
  export TMPDIR="${TMPDIR:-/tmp}"
  export GIT_TMPDIR="${TMPDIR}"
  return 1
}

# Clean up old temp files in the background while the script runs
(
  SYNC_TMP_DIR="$PWD/sync_tmp_backups"
  # Remove temp files older than 1 day
  find "$SYNC_TMP_DIR" -name '.sync-tmp-*' -type f -mtime +1 -delete
  # Remove empty directories
  find "$SYNC_TMP_DIR" -mindepth 1 -type d -empty -delete
) &
CLEANUP_PID=$!

# --- SUMMARY FUNCTION ---
show_stash_and_precommit_summary() {
  # Color definitions
  local GREEN='\033[32m'
  local RED='\033[31m'
  local YELLOW='\033[33m'
  local BLUE='\033[1;34m'
  local PURPLE='\033[1;35m'
  local NC='\033[0m'

  # Get counts for grouping
  local status_output=$(git status --porcelain)
  local modified_count=$(echo "$status_output" | grep -c "^.M")
  local added_count=$(echo "$status_output" | grep -c "^A")
  local deleted_count=$(echo "$status_output" | grep -c "^.D")
  local untracked_count=$(echo "$status_output" | grep -c "^??")
  local deleted_report_count=$(echo "$status_output" | grep -c "playwright-report/data/.*\.zip")
  
  # Prepare title based on what's changing
  local title="Sync project files:"
  [[ $modified_count -gt 0 ]] && title="$title updated files"
  [[ $added_count -gt 0 ]] && title="$title, new additions"
  [[ $deleted_count -gt 0 ]] && title="$title, cleanup"

  echo "${PURPLE}--- Commit message preview ---${NC}"
  if [[ $SKIP_TESTS == true ]]; then
    echo "WIP: $title (tests/lint/type checks skipped)"
  else
    echo "$title"
  fi
  
  # 1. Branch and sync status
  local current_branch=$(git symbolic-ref --short -q HEAD)
  echo "${BLUE}Branch Status${NC}"
  echo "Current branch: ${GREEN}$current_branch${NC}"
  
  # Check if branch is behind/ahead of remote
  if git remote | grep -q .; then
    git fetch -q
    local ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    local behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    if [[ $ahead -gt 0 && $behind -gt 0 ]]; then
      echo "${YELLOW}⚠ Branch is $ahead commits ahead and $behind commits behind remote${NC}"
    elif [[ $ahead -gt 0 ]]; then
      echo "${YELLOW}↑ Branch is $ahead commits ahead of remote${NC}"
    elif [[ $behind -gt 0 ]]; then
      echo "${YELLOW}↓ Branch is $behind commits behind remote${NC}"
    else
      echo "${GREEN}✓ Branch is in sync with remote${NC}"
    fi
  fi
  
  # 2. Last commit details
  echo "\n${BLUE}Recent Changes${NC}"
  git --no-pager log -1 --stat --color
  
  # 3. Modified files summary
  echo "\n${BLUE}--- Changed Files ---${NC}"
  if [[ -n $status_output ]]; then
    # Group changes by type
    echo "\nScript Changes:"
    echo "$status_output" | grep "scripts/" | sed 's/^/  /'
    
    echo "\nTest Changes:"
    echo "$status_output" | grep -E "tests/|e2e/|\.spec\." | sed 's/^/  /'
    
    # If there are many deleted report files, summarize them
    if [[ $deleted_report_count -gt 0 ]]; then
      echo "\nCleanup:"
      echo "  Removed $deleted_report_count old test report files"
    fi
    
    # Show other changes
    echo "\nOther Changes:"
    echo "$status_output" | grep -vE "scripts/|tests/|e2e/|\.spec\.|playwright-report/data/.*\.zip" | sed 's/^/  /'
    
    # Show totals
    echo "\nSummary:"
    [[ $modified_count -gt 0 ]] && echo "  ${YELLOW}Modified: $modified_count${NC}"
    [[ $added_count -gt 0 ]] && echo "  ${GREEN}Added: $added_count${NC}"
    [[ $deleted_count -gt 0 ]] && echo "  ${RED}Deleted: $deleted_count${NC}"
    [[ $untracked_count -gt 0 ]] && echo "  ${YELLOW}Untracked: $untracked_count${NC}"
  else
    echo "${GREEN}✓ Working tree clean${NC}"
  fi
  
  # 4. Stash information with count
  local stash_count=$(git stash list | wc -l | tr -d '[:space:]')
  if [[ $stash_count -gt 0 ]]; then
    echo "\n${BLUE}Stashed Changes${NC}"
    echo "${YELLOW}Found $stash_count stashed change(s):${NC}"
    git --no-pager stash list --pretty=format:"%C(yellow)%gd%C(reset): %C(green)%cr%C(reset) - %s"
  fi
  
  # 5. Conflict detection
  if git ls-files -u | grep -q '^'; then
    echo "\n${RED}⚠ MERGE CONFLICTS DETECTED${NC}"
    echo "The following files have conflicts:"
    git diff --name-only --diff-filter=U
  fi
  
  echo "\n${PURPLE}═════════════════════════════════════${NC}"
}

# Enhanced branch validation and handling
validate_branches() {
  local has_valid_branches=false
  local valid_branches=()
  
  # Create default branch if repository is empty
  if ! safe_git rev-parse --verify HEAD >/dev/null 2>&1; then
    echo -e "${YELLOW}Empty repository detected. Creating main branch...${NC}"
    safe_git checkout -b main
    touch .gitkeep
    safe_git add .gitkeep
    safe_git commit -m "Initialize main branch" || true
  fi
  
  # If branches were provided as arguments
  if [[ ${#branches[@]} -gt 0 ]]; then
    for branch in "${branches[@]}"; do
      if safe_git rev-parse --verify "$branch" >/dev/null 2>&1 || \
         safe_git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
        valid_branches+=("$branch")
        has_valid_branches=true
      else
        # Create branch if it doesn't exist and user confirms
        echo -e "${YELLOW}Branch '$branch' not found. Create it? [y/N]${NC}"
        read -r create_branch
        if [[ "$create_branch" =~ ^[Yy]$ ]]; then
          safe_git checkout -b "$branch"
          safe_git checkout -
          valid_branches+=("$branch")
          has_valid_branches=true
        fi
      fi
    done
  fi
  
  # If no valid branches, show available ones and prompt
  if [[ "$has_valid_branches" = false ]]; then
    echo -e "\n${BLUE}Available branches:${NC}"
    echo -e "${GREEN}Local branches:${NC}"
    safe_git branch --list | sed 's/^../  /'
    
    if safe_git remote | grep -q .; then
      echo -e "\n${GREEN}Remote branches:${NC}"
      safe_git branch -r | grep -v '\->' | sed 's/^../  /'
    fi
    
    echo -e "\n${YELLOW}Enter branches to sync (space-separated or one per line):${NC}"
    echo "When done, press Enter twice."
    
    valid_branches=()
    while IFS= read -r line; do
      [[ -z "$line" ]] && break
      for branch in ${(s:,:)${line// /,}}; do
        branch="${branch##[[:space:]]}"
        branch="${branch%%[[:space:]]}"
        if [[ -n "$branch" ]]; then
          valid_branches+=("$branch")
        fi
      done
    done
  fi
  
  if [[ ${#valid_branches[@]} -eq 0 ]]; then
    echo -e "${RED}Error: No valid branches specified.${NC}"
    exit 1
  fi
  
  branches=("${valid_branches[@]}")
  echo -e "\n${GREEN}Will sync to the following branches:${NC}"
  printf "  %s\n" "${branches[@]}"
}

# Display help message
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

# Enhanced argument parsing
parse_arguments() {
  branches=()
  remotes=(origin)
  SKIP_TESTS=false
  FAST_MODE=false
  STASH_CHANGES=false
  DRY_RUN=false

  while [[ $# -gt 0 ]]; do
    case $1 in
      --remote)
        shift
        remotes=()
        while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
          remotes+=("$1")
          shift
        done
        ;;
      --skip-tests)
        SKIP_TESTS=true
        shift
        ;;
      --fast|--dev)
        FAST_MODE=true
        SKIP_TESTS=true
        shift
        ;;
      --stash)
        STASH_CHANGES=true
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        echo -e "${YELLOW}*** Dry Run Mode Enabled ***${NC}"
        shift
        ;;
      --help)
        show_help
        exit 0
        ;;
      -*)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
      *)
        branches+=("$1")
        shift
        ;;
    esac
  done
}

# Main script execution
parse_arguments "$@"
validate_branches

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
  # Split branch_input on commas and whitespace (zsh compatible), trim, and only add non-empty
  branch_array=(${(s:,:)branch_input// /,})
  for b in "${branch_array[@]}"; do
    b_trimmed="${b//[[:space:]]/}"
    if [[ -n "$b_trimmed" ]]; then
      branches+=("$b_trimmed")
    fi
  done
fi

# Accept any entry as a remote branch by default (origin/branch)
# Combine remotes and branches into a single targets array (only valid remote/branch pairs)
all_targets=()
for remote in $remotes; do
  # Only add if remote is a real git remote
  if git remote | grep -qx "$remote"; then
    for branch in $branches; do
      # Only add if branch is non-empty and not just whitespace
      branch_trimmed="${branch//[[:space:]]/}"
      if [[ -n "$branch_trimmed" ]]; then
        all_targets+=("$remote/$branch_trimmed")
      fi
    done
  fi
  # Do NOT treat branch names as remotes
  # This prevents invalid targets like branch/branch
  # Only valid remote/branch pairs are added
  # Never add origin/ or main4 alone
done
# Remove duplicates and filter out any invalid targets (must match remote/branch)
all_targets=($(printf "%s\n" "${all_targets[@]}" | grep -E '^[^/]+/.+$' | awk '!seen[$0]++'))

# Diagnostic: print all_targets before confirmation
if [[ ${#all_targets[@]} -eq 0 ]]; then
  echo "\033[1;31mERROR: No valid remote/branch targets found. Exiting.\033[0m"
  exit 1
fi
printf "\n\033[1;34m[DIAG] Final sync targets:\033[0m\n"
for t in "${all_targets[@]}"; do
  echo "  $t"
done

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

# --- ALWAYS COMMIT ALL CHANGES BEFORE SYNC ---

# Skip interactive prompts in fast mode
if [[ "$FAST_MODE" == true ]]; then
  if [[ -n $(git status --porcelain) ]]; then
    git add -A
    git commit -m "Fast sync: Updated files (dev mode)" || true
    if [[ "$COMMIT_MODE" != "local" ]]; then
      git push -f origin HEAD
    fi
  fi
else
  # --- INTERACTIVE COMMIT MODE PROMPT ---
  COMMIT_MODE="commit"
  if [[ -n $(git status --porcelain) ]]; then
    echo -e "\nChoose commit mode:"
    echo "  1) commit  - Normal commit and push to remote (default)"
    echo "  2) wip     - WIP commit and push to remote"
    echo "  3) local   - Commit locally only, do NOT push to remote"
    echo "  4) abort   - Abort and exit"
    echo -n "Enter choice [commit/wip/local/abort]: "
    read commit_mode_choice
    case "$commit_mode_choice" in
      wip|WIP|2)
        COMMIT_MODE="wip"
        ;;
      local|LOCAL|3)
        COMMIT_MODE="local"
        ;;
      abort|ABORT|4)
        echo "Aborted by user. No changes made."
        exit 1
        ;;
      commit|COMMIT|1|"")
        COMMIT_MODE="commit"
        ;;
      *)
        echo "Invalid choice. Defaulting to 'commit'."
        COMMIT_MODE="commit"
        ;;
    esac
  fi

  # Normalize COMMIT_MODE to lowercase for consistent checks
  eval COMMIT_MODE="\${COMMIT_MODE:l}"

  # Set SKIP_TESTS if WIP mode was selected interactively
  if [[ "$COMMIT_MODE" == "wip" ]]; then
    SKIP_TESTS=true
  fi

  # Always stage and commit all changes if there are uncommitted changes
  if [[ -n $(git status --porcelain) ]]; then
    # Classic commit message preview: WIP/test/lint summaries, changed files, diff summary
    CHANGED_FILES=$(git status --short)
    # Use unstaged diff for preview so user always sees all changes
    DIFF_STAT=$(git diff --stat)
    commit_msg=""
    # Build grouped summary by file type
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
        commit_with_spinner "Applying commit with auto-generated message"
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
    if [[ "$SKIP_TESTS" = false ]]; then
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

# Function to sync a single branch
sync_branch() {
    local branch_name="$1"
    local tmp_dir="$2"
    local log_file="$3"

    log_info "Starting sync for branch: $branch_name"

    # Ensure the temporary directory for the branch exists
    mkdir -p "$tmp_dir"

    # --- BRANCH CREATION & CHECKOUT ---
    # Create and checkout the branch if it doesn't exist
    if ! git rev-parse --verify "$branch_name" >/dev/null 2>&1; then
        log_info "Branch $branch_name does not exist. Creating it..."
        git checkout -b "$branch_name" || {
            log_error "Failed to create and checkout branch $branch_name. Exiting."
            exit 1
        }
    else
        git checkout "$branch_name" || {
            log_error "Failed to checkout branch $branch_name. Exiting."
            exit 1
        }
    fi

    # --- SYNC OPERATION ---
    # Rsync files from the source branch to the target branch
    log_info "Syncing files to branch $branch_name..."
    rsync -a --delete --exclude='.git' "$REPO_ROOT/" "$tmp_dir/" || {
        log_error "Rsync to branch $branch_name failed. Exiting."
        exit 1
    }

    # --- GIT COMMIT & PUSH ---
    # Stage all changes
    git add -A

    # Commit changes with a standard message
    git commit -m "Sync: Update files from $CURRENT_BRANCH" || {
        log_warning "No changes to commit for branch $branch_name."
    }

    # Push changes to the remote branch
    git push -u origin "$branch_name" || {
        log_error "Failed to push changes to remote branch $branch_name. Exiting."
        exit 1
    }

    log_info "Sync process completed for branch $branch_name."
    log_info "Detailed log for $branch_name available at: $log_file"
}

# Function to handle parallel syncing
run_parallel_sync() {
    local current_jobs=0
    local max_jobs=$MAX_PARALLEL
    
    # Increase parallel jobs in fast mode if CPU allows
    if [[ "$FAST_MODE" == true ]]; then
      max_jobs=$((MAX_PARALLEL * 2))
      [[ $max_jobs -gt $AVAILABLE_CORES ]] && max_jobs=$AVAILABLE_CORES
    fi
    
    for remote in "${remotes[@]}"; do
      for branch in "${branches[@]}"; do
        # Wait if we've hit max parallel jobs
        while [[ $current_jobs -ge $max_jobs ]]; do
          for pid in "${!SYNC_JOBS[@]}"; do
            if ! kill -0 $pid 2>/dev/null; then
              local status=$?
              JOB_STATUS[$pid]=$status
              unset SYNC_JOBS[$pid]
              ((current_jobs--))
              
              # Process output of finished job
              if [[ -f "${JOB_OUTPUT[$pid]}" ]]; then
                cat "${JOB_OUTPUT[$pid]}"
                rm "${JOB_OUTPUT[$pid]}"
              fi
            fi
          done
          sleep 0.1
        done
        
        # Start new sync job
        local output_file="$TMPDIR/sync-$remote-$branch-$$"
        (
          sync_branch "$remote" "$branch" > "$output_file" 2>&1
          exit ${PIPESTATUS[0]}
        ) &
        
        local pid=$!
        SYNC_JOBS[$pid]="$remote/$branch"
        JOB_OUTPUT[$pid]="$output_file"
        ((current_jobs++))
      done
    done
    
    # Wait for remaining jobs to complete
    for pid in "${!SYNC_JOBS[@]}"; do
      wait $pid
      local status=$?
      JOB_STATUS[$pid]=$status
    done
    
    # Check job statuses and report
    for pid in "${!SYNC_JOBS[@]}"; do
      if [[ ${JOB_STATUS[$pid]} -ne 0 ]]; then
        echo -e "${RED}Sync job for ${SYNC_JOBS[$pid]} failed.${NC}"
        cat "${JOB_OUTPUT[$pid]}"
      else
        echo -e "${GREEN}Sync job for ${SYNC_JOBS[$pid]} completed successfully.${NC}"
      fi
    done
}

# Cleanup function to terminate background jobs
cleanup_jobs() {
  # Terminate all background sync jobs
  for pid in "${!SYNC_JOBS[@]}"; do
    kill $pid 2>/dev/null || true
  done
  wait
}

# --- END OF SCRIPT ---