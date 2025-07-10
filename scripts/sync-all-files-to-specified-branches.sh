#!/bin/zsh
# sync-all-files-to-specified-branches.sh



# --- Modularization: Source utility scripts (must be at the top) ---
if [[ -n "$BASH_SOURCE" ]]; then
  export SCRIPT_PATH="${BASH_SOURCE[0]}"
elif [[ -n "$ZSH_VERSION" ]]; then
  export SCRIPT_PATH="$0"
else
  export SCRIPT_PATH="$0"
fi
export SCRIPT_PATH
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
export SCRIPT_DIR
UTILS_DIR="$SCRIPT_DIR/utils"
# Source git-utils.sh first
if [[ -f "$UTILS_DIR/git-utils.sh" ]]; then
  source "$UTILS_DIR/git-utils.sh"
fi
# Source all other utils except git-utils.sh
if [[ -d "$UTILS_DIR" ]]; then
  for util in "$UTILS_DIR"/*.sh; do
    [[ "$util" == "$UTILS_DIR/git-utils.sh" ]] && continue
    source "$util"
  done
fi



# Enable error handling (DISABLED for troubleshooting)
# set -euo pipefail


# --- DEBUGGING FLAG ---
DEBUG_MODE=${DEBUG_MODE:-false}

debug() {
  if [[ "$DEBUG_MODE" == "true" ]]; then
    echo "[DEBUG] $1"
  fi
}



# Color definitions
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
BLUE='\033[1;34m'
NC='\033[0m'



# --- Robust script directory detection for bash and zsh (always set and export at the top) ---
if [[ -n "$BASH_SOURCE" ]]; then
  SCRIPT_PATH="${BASH_SOURCE[0]}"
elif [[ -n "$ZSH_VERSION" ]]; then
  SCRIPT_PATH="$0"
else
  SCRIPT_PATH="$0"
fi
export SCRIPT_PATH
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
export SCRIPT_DIR
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export REPO_ROOT

# --- DEBUGGING: Show script path and working directory (after path variables are set) ---
echo "[DEBUG] Script invoked as: $0"
echo "[DEBUG] SCRIPT_PATH=$SCRIPT_PATH"
echo "[DEBUG] SCRIPT_DIR=$SCRIPT_DIR"
echo "[DEBUG] REPO_ROOT=$REPO_ROOT"
echo "[DEBUG] Current working directory: $(pwd)"
cd "$REPO_ROOT" || exit 1
echo "[DEBUG] After cd, working directory: $(pwd)"

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

  # Ensure main branch exists and is checked out
  if ! git show-ref --verify --quiet refs/heads/main; then
    git checkout -b main
  else
    git checkout main
  fi
}



# No longer need local fallback definitions; all helpers are now in utils/*.sh

# --- Remove any stray or unmatched fi statements left from fallback removal ---
# (This is a direct fix for parse errors after modularization.)

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
if [[ -d "$GIT_CACHE_DIR/objects" ]]; then
  export GIT_OBJECT_DIRECTORY="$GIT_CACHE_DIR/objects"
fi

# Fast mode optimizations
if [[ "$FAST_MODE" == true ]]; then
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'gc.auto=0' 'gc.autoPackLimit=0'"
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'core.compression=0'"
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'pack.compression=0'"
  export GIT_CONFIG_PARAMETERS="$GIT_CONFIG_PARAMETERS 'pack.deltaCacheSize=0'"
fi



# (All legacy/duplicate RAM disk setup code fully removed)

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
# Now sourced from utils/summary-utils.sh



# Display help message
# Now sourced from utils/cli-utils.sh
# Enhanced argument parsing
# Now sourced from utils/cli-utils.sh



# --- MAIN SCRIPT EXECUTION ---
parse_arguments "$@"
ensure_git_repo
validate_and_prompt_branches
construct_targets
confirm_sync
commit_and_push_with_prompt

    # ...existing code...

# --- END OF SCRIPT ---