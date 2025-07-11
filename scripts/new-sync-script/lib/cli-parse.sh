#!/bin/zsh
# cli-parse.sh: Robust CLI argument parsing for sync scripts

# Usage: source this file, then call parse_cli_args "$@"
# Sets global variables: DRY_RUN, AUTO_COMMIT, DEBUG, NO_VERIFY, NO_LINT, NO_TESTS, CONFIG_FILE, BRANCH, REBASE, LIST_BACKUPS, RESTORE_BACKUP, DELETE_BACKUP, TARGET_BRANCHES, REMOTES

show_help() {
  local SCRIPT_BASENAME
  if [[ -n "$SCRIPT_PATH" ]]; then
    SCRIPT_BASENAME="$(basename -- "$SCRIPT_PATH")"
  else
    SCRIPT_BASENAME="sync-branches-simple.sh"
  fi
  echo "Usage: $SCRIPT_BASENAME [options] [branch1 branch2 ...]"
  echo ""
  echo "A script to synchronize files from the current working branch to other branches."
  echo ""
  echo "Options:"
  echo "  --remote <name ...>   Specify remote(s) to sync to (default: origin)."
  echo "  --dry-run             Preview all actions without making changes."
  echo "  --auto-commit         Auto-commit unstaged changes before syncing."
  echo "  --debug               Enable debug output."
  echo "  --no-verify           Skip all git hooks."
  echo "  --no-lint             Skip linting/formatting."
  echo "  --no-tests            Skip running tests."
  echo "  --config <file>       Use custom config file."
  echo "  --branch <name>       Specify branch for sync."
  echo "  --rebase              Use rebase instead of merge."
  echo "  --list-backups        List available backups."
  echo "  --restore-backup      Restore a backup interactively."
  echo "  --delete-backup       Delete a backup interactively."
  echo "  --help, --docs        Show this help message."
  echo ""
  echo "Examples:"
  echo "  $SCRIPT_BASENAME --dry-run --remote origin main develop"
  echo "  $SCRIPT_BASENAME --auto-commit --no-tests feature/xyz"
}

parse_cli_args() {
  # Defaults
  DRY_RUN=0; AUTO_COMMIT=0; DEBUG=1; NO_VERIFY=0; NO_LINT=0; NO_TESTS=0; CONFIG_FILE=""; BRANCH=""; REBASE=0
  LIST_BACKUPS=0; RESTORE_BACKUP=0; DELETE_BACKUP=0
  TARGET_BRANCHES=()
  REMOTES=(origin)

  while [[ $# -gt 0 ]]; do
    case $1 in
      --dry-run) DRY_RUN=1 ;;
      --auto-commit) AUTO_COMMIT=1 ;;
      --debug) DEBUG=1 ;;
      --no-verify) NO_VERIFY=1 ;;
      --no-lint) NO_LINT=1 ;;
      --no-tests) NO_TESTS=1 ;;
      --config) CONFIG_FILE="$2"; shift ;;
      --branch) BRANCH="$2"; shift ;;
      --rebase) REBASE=1 ;;
      --list-backups) LIST_BACKUPS=1 ;;
      --restore-backup) RESTORE_BACKUP=1 ;;
      --delete-backup) DELETE_BACKUP=1 ;;
      --remote)
        shift
        REMOTES=()
        while [[ $# -gt 0 && ! "$1" =~ ^- ]]; do
          REMOTES+=("$1")
          shift
        done
        continue
        ;;
      --help|--docs)
        show_help
        exit 0
        ;;
      -*)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
      *)
        TARGET_BRANCHES+=("$1")
        ;;
    esac
    shift
  done
}

cli_handle_drag_and_drop() {
  # Placeholder: handle drag-and-drop files/branches
  echo "Drag-and-drop not implemented in CLI mode." >&2
}

export -f show_help
export -f parse_cli_args
export -f cli_handle_drag_and_drop
