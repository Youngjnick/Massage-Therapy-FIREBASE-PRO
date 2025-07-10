#!/bin/zsh
# cli-utils.sh: CLI argument parsing and help for sync scripts



show_help() {
  local SCRIPT_BASENAME
  if [[ -n "$SCRIPT_PATH" ]]; then
    SCRIPT_BASENAME="$(basename -- "$SCRIPT_PATH")"
  else
    SCRIPT_BASENAME="sync-all-files-to-specified-branches.sh"
  fi
  echo "Usage: $SCRIPT_BASENAME [options] [branch1 branch2 ...]"
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
  echo "  $SCRIPT_BASENAME main develop"
  echo ""
  echo "  # Fast sync to a feature branch, stashing current changes"
  echo "  $SCRIPT_BASENAME --fast --stash feature/new-thing"
  echo ""
  echo "  # Dry run of a sync to a remote staging branch"
  echo "  $SCRIPT_BASENAME --dry-run --remote staging main"
}

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
        echo "%F{yellow}*** Dry Run Mode Enabled ***%f"
        shift
        ;;
      --help)
        show_help
        exit 0
        ;;
      -* )
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
      * )
        branches+=("$1")
        shift
        ;;
    esac
  done
}
export -f show_help
export -f parse_arguments
