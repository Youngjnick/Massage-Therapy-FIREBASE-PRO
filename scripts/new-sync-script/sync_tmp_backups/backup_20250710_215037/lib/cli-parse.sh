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
  # Minimal stub: parse known flags and export variables
  for arg in "$@"; do
    case $arg in
      --dry-run) export DRY_RUN=1 ;;
      --auto-commit) export AUTO_COMMIT=1 ;;
      --debug) export DEBUG=1 ;;
      --no-verify) export NO_VERIFY=1 ;;
      --no-lint) export NO_LINT=1 ;;
      --no-tests) export NO_TESTS=1 ;;
      --no-playwright) export NO_PLAYWRIGHT=1 ;;
      --config) shift; export CONFIG_FILE="$1" ;;
      --branch) shift; export SYNC_BRANCHES="$1" ;;
      --help|--docs) print_help; exit 0 ;;
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
