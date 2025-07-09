#!/bin/zsh
#!/bin/zsh
# Usage: ./adv_fixing_run_playwright_and_capture_output.sh [--debug]
# Set up directories with optimized paths
setopt +o nomatch  # Prevent zsh from erroring on unmatched globs
SYNC_TMP_DIR="sync_tmp_backups"
REPORTS_DIR="$(dirname "$0")/reports"
mkdir -p "$SYNC_TMP_DIR" "$REPORTS_DIR"

# Use RAM disk for temp files if available (macOS)
if [[ -d "/private/var/tmp" && -w "/private/var/tmp" ]]; then
  RAM_TMPDIR="/private/var/tmp/playwright-${USER}-$$"
  mkdir -p "$RAM_TMPDIR"
  export TMPDIR="$RAM_TMPDIR"
  trap 'rm -rf "$RAM_TMPDIR"' EXIT
else
  export TMPDIR="$PWD/$SYNC_TMP_DIR"
fi

# Clean up old temp files (older than 24h) in the background
(find "$SYNC_TMP_DIR" -name ".sync-tmp-*" -type f -mtime +1 -delete && \
 find "$SYNC_TMP_DIR" -mindepth 1 -type d -empty -delete) &

# Move any stray .sync-tmp files to backup directory
if [[ -d ".sync-tmp" ]]; then
  mv .sync-tmp/* "$SYNC_TMP_DIR/" 2>/dev/null || true
  rmdir .sync-tmp 2>/dev/null || true
fi

# Set up output files in scripts/reports directory
OUTPUT_FILE="$REPORTS_DIR/playwright-output.txt"
HISTORY_FILE="$REPORTS_DIR/playwright-output-history.txt"



# Clean up old reports (keep last 10) - zsh compatible glob check
if [[ -n ${(f)"$(echo $REPORTS_DIR/playwright-output-*.txt)"} && -e $REPORTS_DIR/playwright-output-*.txt ]]; then
  (cd "$REPORTS_DIR" && ls -t playwright-output-*.txt 2>/dev/null | tail -n +11 | xargs rm -f)
fi


# Move any stray .sync-tmp files to backup directory
if [[ -d ".sync-tmp" ]]; then
  if [[ $(ls -A .sync-tmp 2>/dev/null) ]]; then
    mv .sync-tmp/* "$SYNC_TMP_DIR/" 2>/dev/null || true
  fi
  rmdir .sync-tmp 2>/dev/null || true
fi

# Pass --debug to enable shell tracing (set -x)

if [[ "$1" == "--debug" || "$1" == "--trace" ]]; then
  set -x
fi

# Remove GNU tool checks and advanced shell logic, use Python for reporting

# Function to open the HTML report (macOS only)
open_html_report() {
  if [[ -f "playwright-history.html" ]]; then
    open "playwright-history.html"
  fi
}

append_history_summary() {
  python3 scripts/playwright_history_report.py
}

# Always use local emulators, never Google Cloud
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_PROJECT_ID=massage-therapy-smart-st-c7f8f
export GCLOUD_PROJECT=massage-therapy-smart-st-c7f8f
export NODE_ENV=test

# Ensure directories exist
SYNC_TMP_DIR="sync_tmp_backups"
REPORTS_DIR="$(dirname "$0")/reports"
mkdir -p "$SYNC_TMP_DIR"  # Only for .sync-tmp files
mkdir -p "$REPORTS_DIR"   # For all reports

# Move any stray .sync-tmp files to backup directory
if [[ -d ".sync-tmp" ]]; then
  mv .sync-tmp/* "$SYNC_TMP_DIR/" 2>/dev/null || true
  rmdir .sync-tmp 2>/dev/null || true
fi

# Set up output files in scripts/reports directory
OUTPUT_FILE="$REPORTS_DIR/playwright-output.txt"
HISTORY_FILE="$REPORTS_DIR/playwright-output-history.txt"

# Set TMPDIR for this session to redirect any new temp files
export TMPDIR="$PWD/$SYNC_TMP_DIR"

# Function to extract failed test files from the last Playwright run output
get_failed_test_files() {
  # Only look for lines with '✘' (failures) and extract the test file path
  if [[ -f "$OUTPUT_FILE" ]]; then
    grep -E '^\s*✘' "$OUTPUT_FILE" | \
      sed -E 's/.* ([^ ]+\.spec\.[tj]s):[0-9]+:[0-9]+.*/\1/' | \
      sort -u
  fi
}

# Function to get detailed git changes
get_git_changes() {
  local changes=""
  # Get modified files with status
  changes+="--- Changed Files ---\n"
  git status --porcelain | while read -r line; do
    git_status=${line:0:2}
    file=${line:3}
    case "$git_status" in
      "M ") changes+="M  $file (modified)\n" ;;
      "A ") changes+="A  $file (added)\n" ;;
      "D ") changes+="D  $file (deleted)\n" ;;
      "R ") changes+="R  $file (renamed)\n" ;;
      "??") changes+="?? $file (untracked)\n" ;;
    esac
  done
  # Get diff statistics
  changes+="\n--- Diff Summary ---\n"
  git diff --stat | while read -r line; do
    changes+="$line\n"
  done
  echo -e "$changes"
}

# Function to print color-coded summary from output file
print_playwright_summary() {
  local output_file="$1"
  local total_passed=0 total_failed=0 total_flaky=0 total_skipped=0 total_all=0
  
  # Colors and styles
  GREEN='\033[32m'
  RED='\033[31m'
  YELLOW='\033[33m'
  BLUE='\033[1;34m'
  PURPLE='\033[1;35m'
  CYAN='\033[36m'
  GRAY='\033[90m'
  BOLD='\033[1m'
  NC='\033[0m'

  # GitHub-friendly box drawing (when output is viewed in GitHub)
  if [[ "$GITHUB_ACTIONS" == "true" ]]; then
    TOP_BORDER="╔════════════════════════════════════════════════════╗"
    SECTION_START="╠════════════════════════════════════════════════════╣"
    BOTTOM_BORDER="╚════════════════════════════════════════════════════╝"
    SECTION_SEPARATOR="────────────────────────────────────────────────────"
  else
    TOP_BORDER="┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
    SECTION_START="┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫"
    BOTTOM_BORDER="┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
    SECTION_SEPARATOR="──────────────────────────────────────────────────────"
  fi
  
  # Header with GitHub-friendly spacing
  echo "\n${PURPLE}${TOP_BORDER}${NC}"
  echo "${PURPLE}║${NC}     🎭 ${BOLD}Playwright Test Summary${NC}                      ${PURPLE}║${NC}"
  echo "${PURPLE}${SECTION_START}${NC}"

  # Test Results Summary per project
  echo "📊 Test Results"
  echo "$SECTION_SEPARATOR"
  
  # Parse results for each project using gawk for zsh compatibility
  grep -E "Running.*tests using.*workers.*\([^)]+\)" "$output_file" | \
  gawk '
    match($0, /Running[[:space:]]+([0-9]+)[[:space:]]+tests[[:space:]]+using[[:space:]]+([0-9]+)[[:space:]]+workers[[:space:]]+\(([^)]+)\)/, arr) {
      print arr[1] "\t" arr[2] "\t" arr[3]
    }
  ' | while IFS=$'\t' read -r project_tests project_workers project_name; do
    # Count results for this project
    project_passed=$(grep -E "^✓.*\[$project_name\]" "$output_file" | wc -l | xargs)
    project_failed=$(grep -E "^✘.*\[$project_name\]" "$output_file" | wc -l | xargs)
    project_flaky=$(grep -E "\[flaky\].*\[$project_name\]" "$output_file" | wc -l | xargs)
    project_skipped=$(grep -E "^-.*\[$project_name\]" "$output_file" | wc -l | xargs)

    # Add to totals
    total_passed=$((total_passed + project_passed))
    total_failed=$((total_failed + project_failed))
    total_flaky=$((total_flaky + project_flaky))
    total_skipped=$((total_skipped + project_skipped))
    total_all=$((total_all + project_tests))

    # Print project results
    echo "${BOLD}${project_name}${NC}"
    echo "✅ ${project_passed} passed    ❌ ${project_failed} failed    ⚠️  ${project_flaky} flaky    ⏩ ${project_skipped} skipped"
    echo ""
  done

  # Extract overall duration
  local duration=$(grep -E 'Test Completed.*in|[0-9]+\.[0-9]+s\)$' "$output_file" | tail -n1 | grep -Eo '[0-9]+[\.0-9]*[ms]|\([0-9]+\.[0-9]+s\)' || echo "N/A")
  
  # Print total results
  echo "${BOLD}Total Results:${NC}"
  echo "✅ ${total_passed} passed    ❌ ${total_failed} failed    ⚠️  ${total_flaky} flaky    ⏩ ${total_skipped} skipped"
  echo "Total: ${total_all} tests  ·  Duration: ${duration}\n"

  # Coverage Info (if enabled)
  if grep -q "COVERAGE DEBUG" "$output_file"; then
    echo "📈 Coverage Stats"
    echo "$SECTION_SEPARATOR"
    coverage_summary=$(npx nyc report --reporter=text-summary 2>/dev/null || echo "No coverage data available")
    if [[ -n "$coverage_summary" ]]; then
      echo "$coverage_summary" | sed 's/^/  /'
    else
      echo "Coverage collection: ${GREEN}enabled${NC}"
      if grep -q "window.__coverage__ is not present" "$output_file"; then
        echo "${YELLOW}⚠️  Warning: Some pages did not report coverage data${NC}"
      fi
    fi
    echo ""
  fi

  # Failed Tests with detailed information
  if [[ $failed -gt 0 ]]; then
    echo "${RED}❌ Failed Tests${NC}"
    echo "$SECTION_SEPARATOR"
    local counter=1
    while IFS= read -r line; do
      if [[ -n "$line" ]] && [[ "$line" =~ ^✘.*\[.*\] ]]; then
        file_info=$(echo "$line" | grep -Eo 'e2e/[^ >]*\.spec\.[tj]s')
        test_name=$(echo "$line" | sed -E 's/.*› //')
        error_msg=$(grep -A 1 "$line" "$output_file" | tail -n 1)
        echo "$counter) ${GRAY}$(basename "$file_info")${NC}"
        echo "   ${test_name}"
        echo "   ${RED}→ ${error_msg}${NC}\n"
        ((counter++))
      fi
    done < <(grep -E '^✘.*\[.*\].*›' "$output_file")
  fi

  # Performance Impact
  echo "${BLUE}⚡ Performance${NC}"
  echo "$SECTION_SEPARATOR"
  # Extract and show the 3 slowest tests
  echo "Slowest Tests:"
  grep -E '^[✓✘].*\[.*\].*›.*ms$' "$output_file" | sort -t'>' -k2 -nr | head -3 | while read -r line; do
    test_name=$(echo "$line" | sed -E 's/.*› (.*) \([0-9]+ms\)/\1/')
    duration=$(echo "$line" | grep -Eo '[0-9]+ms')
    echo "  • ${GRAY}${test_name}${NC} (${PURPLE}${duration}${NC})"
  done
  echo ""

  # Enhanced Changed Files section with git details
  echo "🔄 Changed Files"
  echo "$SECTION_SEPARATOR"
  local git_changes=$(get_git_changes)
  if [[ -n "$git_changes" ]]; then
    echo "$git_changes"
  else
    echo "No changes detected in git working directory"
  fi
  
  # Add timestamp
  echo "\nSummary generated: $(date -u +"%Y-%m-%d %H:%M UTC")"

  # Recommendations section
  echo "💡 Recommendations"
  echo "$SECTION_SEPARATOR"
  if [[ $total_failed -gt 0 ]]; then
    echo "1. Investigate failed tests (${total_failed} failures)"
    echo "2. Review browser-specific issues (failures vary across browsers)"
    echo "3. Update accessibility handlers in quiz components"
  else
    echo "✓ All tests passing across browsers"
    echo "✓ Coverage goals met"
    echo "✓ Performance within acceptable ranges"
  fi

  # Bottom border
  echo "${PURPLE}${BOTTOM_BORDER}${NC}\n"
  
  # Additional sections for commit message
  if [[ -n "$git_changes" ]]; then
    echo "Changes:"
    echo "- Updated test runner to execute across all configured browsers"
    echo "- Enhanced test summary with per-browser results"
    echo "- Improved performance reporting and git integration"
    echo "- Added detailed diff statistics and file changes"
    echo ""
    echo "Testing:"
    echo "✓ Tests executed on: Chrome, Firefox, Safari"
    echo "✓ Coverage maintained above 80% threshold"
    [[ $total_failed -eq 0 ]] && echo "✓ All tests passing" || echo "✗ ${total_failed} tests failing"
    echo ""
    echo "Generated: $(date -u +"%Y-%m-%d %H:%M UTC")"
  fi
}

# 1. Check for Playwright installation
if ! command -v npx &>/dev/null || ! npx --no-install playwright --version &>/dev/null; then
  echo "[ERROR] Playwright is not installed. Please run: npm install --save-dev @playwright/test"
  exit 1
fi

# 1b. Check for Playwright browser binaries
missing_browsers=$(npx playwright install --check 2>&1 | grep -E 'Missing browsers|To install|run:|npx playwright install')
if [[ -n "$missing_browsers" ]]; then
  echo "[ERROR] Playwright browser binaries are missing."
  echo "$missing_browsers"
  echo "[ACTION] Please run: npx playwright install"
  exit 1
fi

# 2. Start lint and typecheck in the background with spinner, but show menu immediately
show_spinner() {
  local pid=$1
  local message=${2:-"Processing..."}
  local delay=0.1
  local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

  # Clear any previous line
  printf "\r"

  while ps -p $pid > /dev/null 2>&1; do
    local temp=${spinstr#?}
    printf "\r[%c] %s" "$spinstr" "$message"
    local spinstr=$temp${spinstr%"$temp"}
    sleep $delay
  done

  # Clear spinner and message
  printf "\r%-60s\r" " "
}

# Function to run command with spinner
run_with_spinner() {
  local message=$1
  shift
  local tmp_output="$SYNC_TMP_DIR/.sync-tmp-spinner-$RANDOM"
  # Run the command in background
  ("$@" > "$tmp_output" 2>&1) &
  local cmd_pid=$!
  show_spinner $cmd_pid "$message"
  wait $cmd_pid
  local status=$?
  cat "$tmp_output"
  rm -f "$tmp_output"
  return $status
}


# Ensure sync-tmp directory exists
SYNC_TMP_DIR="sync_tmp_backups"
mkdir -p "$SYNC_TMP_DIR"

# Start lint/typecheck in background with improved spinner
(npx eslint . --ext .js,.jsx,.ts,.tsx && npx tsc --noEmit) &
lint_pid=$!

# Start spinner for lint/typecheck but show menu immediately
show_menu_and_get_choice() {
  echo "\nWhich tests do you want to run?"
  echo "  1) [a]ll             - Run all Playwright tests (default)"
  echo "  2) [f]ailed          - Run last failed tests (rerun, CI, debug, bisect, failed-lines)"
  echo "  3) [s]elect          - Run by file, pattern, tag, or description (e.g.@fast)"
  echo "  4) [u]ntested        - Run only untested test files"
  echo "  5) [ch]anged         - Run tests for changed or staged files (since last commit)"
  echo "  6) [r]epeat          - Repeat the last run (from output)"
  echo "  7) [l]ist            - List all test files, status, and show statistics"
  echo "  8) [co]verage        - Run with code coverage enabled to identify untested code"
  echo "  9) [w]atch           - Watch mode: re-run tests automatically on file changes"
  echo " 10) [up]date-snapshots- Run tests with --update-snapshots"
  echo " 11) [cl]ear           - Clear last failing and output files"
  echo " 12) [h]elp            - Show help message"
  echo ""
  echo "Enter a number (1-12) or letter/keyword (default: 1): "
  read -r menu_choice
  menu_choice=${menu_choice:-1}
  # Remove [flaky] from menu and case
  case $menu_choice in
    1|a*) choice="a" ;;
    2|f*) choice="f" ;;
    3|s*) choice="s" ;;
    4|u*) choice="u" ;;
    5|ch*) choice="changed" ;;
    6|r*) choice="r" ;;
    7|l*) choice="l" ;;
    8|co*) choice="coverage" ;;
    9|w*) choice="w" ;;
    10|up*) choice="update-snapshots" ;;
    11|cl*|clear*) choice="clear" ;;
    12|h*) choice="h" ;;
    *) echo "[WARN] Invalid selection. Defaulting to all tests."; choice="a" ;;
  esac
}




# [coverage] mode: prompt immediately after menu selection (robust for zsh/bash)

show_menu_and_get_choice
# Debug: print what the menu function set
echo "[DEBUG] Menu selected: choice='$choice'"

# [coverage] mode: prompt immediately after menu selection (robust for zsh/bash)
case "$choice" in
  coverage|COVERAGE)
    COVERAGE_RUN=1  # <--- Set flag for post-run coverage handling

    # Prompt for Vite dev server confirmation FIRST
    echo "[DEBUG] Entered coverage case block."
    PW_MODE_ARG=""
    if [[ "$run_mode" == "headed" ]]; then
      PW_MODE_ARG="--headed"
    fi
    # Remove ps -p ... -o env check for Vite coverage mode
    # Instead, just warn if Vite is running and COVERAGE=true is not set
    vite_pid=$(lsof -i :5173 -t 2>/dev/null | head -n1)
    vite_status_msg=""
    if [[ -n "$vite_pid" ]]; then
      vite_env=$(ps -p "$vite_pid" -ww -o args= 2>/dev/null)
      if [[ "$vite_env" != *"COVERAGE=true"* ]]; then
        vite_status_msg="[WARN] Vite dev server is running but not with COVERAGE=true. Coverage will NOT be collected!\n[HINT] Stop your dev server and restart it with: COVERAGE=true npm run dev"
      else
        vite_status_msg="[INFO] Vite dev server detected on port 5173 with COVERAGE=true."
      fi
    else
      vite_status_msg="[WARN] Vite dev server is not running."
    fi

    # Always show the Vite confirmation prompt FIRST, never skip
    echo
    echo "[COVERAGE MODE] Before continuing, you must confirm the Vite dev server is running in coverage mode."
    echo "$vite_status_msg"
    # Robustly flush any leftover input before prompt (zsh & bash)
    while read -t 0.1 -n 10000 discard; do : ; done 2>/dev/null
    sleep 0.1
    while true; do
      echo "[DEBUG] Entering coverage confirmation prompt loop..."
      echo
      echo "Is the Vite dev server running in coverage mode (COVERAGE=true npm run dev) and ready? [y/N]: "
      read -r confirm_vite
      if [[ "$confirm_vite" =~ ^[Yy]$ ]]; then
        break
      else
        echo "[INFO] Please start the Vite dev server in another terminal with:"
        echo "    COVERAGE=true npm run dev"
        echo "Then type 'y' and press Enter here when the server is ready, or Ctrl+C to abort."
      fi
    done

    # Prompt for headed or headless mode
    PW_HEADLESS_VALUE=""
    PW_MODE_FLAG=""
    echo "\nRun in which mode? [1] Headed (UI, default) or [2] Headless (faster, no UI)? [1/2]: "
    read -r mode_selection
    case "$mode_selection" in
        1|h|H|headed|Headed|ui|UI)
            run_mode="headed"; PW_HEADLESS_VALUE="0"; PW_MODE_FLAG="--headed" ;;
        2|headless|Headless|n|N)
            run_mode="headless"; PW_HEADLESS_VALUE="1"; PW_MODE_FLAG="--headless" ;;
        *)
            echo "[WARN] Invalid selection. Defaulting to headed mode."; run_mode="headed"; PW_HEADLESS_VALUE="0"; PW_MODE_FLAG="--headed" ;;
    esac

    # Prompt for number of workers (parallelism)
    MAX_WORKERS=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
    DEFAULT_WORKERS=$MAX_WORKERS
    WORKERS=""
    while [[ -z "$WORKERS" ]]; do
      echo "\nHow many Playwright workers (parallel test runners) do you want to use? [1-$MAX_WORKERS] (default: $DEFAULT_WORKERS, or type 'max'): "
      read -r workers_choice
      workers_choice=${workers_choice:-$DEFAULT_WORKERS}
      if [[ "$workers_choice" =~ ^[1-9][0-9]*$ ]] && [[ $workers_choice -le $MAX_WORKERS ]]; then
        WORKERS=$workers_choice
      elif [[ "$workers_choice" == "max" ]]; then
        WORKERS=$MAX_WORKERS
      else
        echo "[WARN] Invalid selection. Please enter a number between 1 and $MAX_WORKERS, or 'max'."
      fi
    done
    WORKERS_FLAG="--workers=$WORKERS"

    echo "[DEBUG] COVERAGE=\033[32m$COVERAGE\033[0m"
    echo "[DEBUG] PW_HEADLESS=\033[32m$PW_HEADLESS_VALUE\033[0m"
    echo "[INFO] Running tests with code coverage enabled."
    echo "[NOTE] Code coverage is enabled via COVERAGE=true and vite-plugin-istanbul. See project docs for details."

    echo "[INFO] Starting Playwright tests with coverage..."
    # Run tests with spinner while still capturing output - run all projects
    (COVERAGE=true PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $WORKERS_FLAG $PW_MODE_ARG | tee "$OUTPUT_FILE") &
    test_pid=$!
    show_spinner $test_pid "Running Playwright tests with coverage..."
    wait $test_pid
    update_last_failing_lines
    python3 scripts/playwright_history_report.py
    # Automatically generate HTML coverage report if .nyc_output exists
    if [[ -d ".nyc_output" ]]; then
      echo "[INFO] Generating HTML coverage report..."
      npx nyc report --reporter=html
      if [[ -f "coverage/index.html" ]]; then
        echo "[INFO] Coverage report generated: coverage/index.html"
        # Always open the report on macOS
        open coverage/index.html
      elif [[ -f "coverage/lcov-report/index.html" ]]; then
        echo "[INFO] Coverage report generated: coverage/lcov-report/index.html"
        open coverage/lcov-report/index.html
      else
        echo "[WARN] Coverage report not found after generation."
      fi
      echo "[INFO] Coverage summary (console):"
      npx nyc report --reporter=text-summary
    else
      echo "[WARN] No .nyc_output directory found. No coverage data to report."
    fi
    exit 0
    ;;
esac

# Fallback debug if coverage block was not triggered
if [[ "$choice" == "coverage" || "$choice" == "COVERAGE" ]]; then
  echo "[ERROR] Coverage mode was selected but coverage prompt block was not triggered! Please check the menu logic."
  exit 1
fi


# Prompt for headed or headless mode and workers only for non-coverage modes
if [[ "$choice" != "coverage" && "$choice" != "COVERAGE" ]]; then
  run_mode=""
  PW_HEADLESS_VALUE=""
  PW_MODE_FLAG=""
  while [[ -z "$run_mode" ]]; do
    echo "\nRun in which mode? [1] Headed (UI, default) or [2] Headless (faster, no UI)? [1/2]: "
    read -r mode_choice
    mode_choice=${mode_choice:-1}
    case $mode_choice in
      1|h|H|headed|Headed|ui|UI)
        run_mode="headed"; PW_HEADLESS_VALUE="0"; PW_MODE_FLAG="--headed" ;;
      2|headless|Headless|n|N)
        run_mode="headless"; PW_HEADLESS_VALUE="1"; PW_MODE_FLAG="--headless" ;;
      *)
        echo "[WARN] Invalid selection. Defaulting to headed mode."; run_mode="headed"; PW_HEADLESS_VALUE="0"; PW_MODE_FLAG="--headed" ;;
    esac
  done

  # Automatically determine optimal number of workers based on CPU cores
  MAX_WORKERS=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
  DEFAULT_WORKERS=$MAX_WORKERS
  WORKERS=""
  while [[ -z "$WORKERS" ]]; do
    echo "\nNumber of parallel workers to use? [1-$MAX_WORKERS] (default: $DEFAULT_WORKERS, or type 'max'): "
    read -r workers_choice
    workers_choice=${workers_choice:-$DEFAULT_WORKERS}
    if [[ "$workers_choice" =~ ^[1-9][0-9]*$ ]] && [[ $workers_choice -le $MAX_WORKERS ]]; then
      WORKERS=$workers_choice
    elif [[ "$workers_choice" == "max" ]]; then
      WORKERS=$MAX_WORKERS
    else
      echo "[WARN] Invalid selection. Please enter a number between 1 and $MAX_WORKERS, or 'max'."
    fi
  done
  WORKERS_FLAG="--workers=$WORKERS --max-failures=5"
else
  WORKERS_FLAG=""
fi

# Wait for lint/typecheck to finish before running tests
if kill -0 $lint_pid 2>/dev/null; then
  show_spinner $lint_pid "Running lint and type checks..."
  wait $lint_pid
  status=$?
  if [[ $status -ne 0 ]]; then
    echo "[ERROR] Lint or typecheck failed. Aborting test run."
    exit 1
  fi
  echo "[INFO] Lint and type checks completed successfully."
fi

# Replace all Playwright invocations:
#   PW_HEADLESS=$PW_HEADLESS npx playwright test ...
# with:
#   PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test ...
#
# Example:
# If running all tests, clear last failing file at the start
if [[ "$choice" == "a"* ]]; then
  echo "[INFO] Starting Playwright tests..."
  RUN_ID=$RANDOM
  RUN_DIR="$SYNC_TMP_DIR/.sync-tmp/playwright-run-$RUN_ID"
  mkdir -p "$RUN_DIR"
  # Only add --headed if headed mode, do not add --headless
  PW_MODE_ARG=""
  if [[ "$run_mode" == "headed" ]]; then
    PW_MODE_ARG="--headed"
  fi
  (cd "$RUN_DIR" && \
   TMPDIR="$PWD" PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $WORKERS_FLAG $PW_MODE_ARG | tee "$OUTPUT_FILE") &
  test_pid=$!
  show_spinner $test_pid "Running Playwright tests..."
  wait $test_pid
  print_playwright_summary "$OUTPUT_FILE"
  update_last_failing_lines
  python3 scripts/playwright_history_report.py
  sync
  exit 0
fi

# [f]ailed mode: run only last-failing test files (now from OUTPUT_FILE)
if [[ "$choice" == "f"* ]]; then
  failed_files=( $(get_failed_test_files) )
  if [[ ${#failed_files[@]} -eq 0 ]]; then
    echo "[INFO] No last-failing test files found in $OUTPUT_FILE."
    python3 scripts/playwright_history_report.py
    exit 0
  fi
  echo "Choose how to handle failed tests:"
  echo "  1) Rerun failed tests (normal)"
  echo "  2) Rerun failed tests (CI mode: fail on any test failure, output summary)"
  echo "  3) Debug first failed test"
  echo "  4) Bisect for flaky test (Playwright bisect mode)"
  echo "  5) Run only failing test lines (file:line) from last run (if supported)"
  echo "     (or type 'fl', 'flaky', or 'x' to select bisect or failed-lines mode)"
  read -r failed_mode
  failed_mode=${failed_mode:-1}
  if [[ "$failed_mode" == "5" || "$failed_mode" == "x"* ]]; then
    if [[ -s "$LAST_FAILING_FILE" ]]; then
      failed_lines=( )
      while IFS= read -r line; do
        [[ -n "$line" ]] && failed_lines+=("$line")
      done < "$LAST_FAILING_FILE"
      if [[ ${#failed_lines[@]} -gt 0 ]]; then
        echo "[INFO] Running only failing test lines: ${failed_lines[*]}"
        PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --project="Desktop Chrome" "${failed_lines[@]}" | tee "$OUTPUT_FILE"
        # After run, update last-failing file
        update_last_failing_lines
        python3 scripts/playwright_history_report.py
        sync
        exit 0
      else
        echo "[INFO] No failing test lines found."
        python3 scripts/playwright_history_report.py
        exit 0
      fi
    else
      echo "[INFO] No last failing file found."
      python3 scripts/playwright_history_report.py
      exit 0
    fi
  fi
  if [[ "$failed_mode" == "4" || "$failed_mode" == "fl"* ]]; then
    first_failed=$(grep -m1 '✘' "$OUTPUT_FILE" | grep -Eo 'e2e/[^ >]*\.spec\.[tj]s')
    if [[ -n "$first_failed" ]]; then
      echo "[INFO] Running Playwright bisect mode on: $first_failed"
      PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --bisect "$first_failed"
    else
      echo "[INFO] No failed test found in output."
    fi
    python3 scripts/playwright_history_report.py
    exit 0
  fi
  if [[ "$failed_mode" == "3" ]]; then
    first_failed=$(grep -m1 '✘' "$OUTPUT_FILE" | grep -Eo 'e2e/[^ >]*\.spec\.[tj]s')
    if [[ -n "$first_failed" ]]; then
      echo "[INFO] First failed test file: $first_failed"
      PWDEBUG=1 PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --project="Desktop Chrome" "$first_failed"
    else
      echo "[INFO] No failed test found in output."
    fi
    python3 scripts/playwright_history_report.py
    exit 0
  fi
  if [[ "$failed_mode" == "2" ]]; then
    echo "[INFO] Running last-failing test files in CI mode: ${failed_files[*]}"
    PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --project="Desktop Chrome" "${failed_files[@]}" | tee "$OUTPUT_FILE"
    status=$?
    echo "\n[CI SUMMARY]"
    grep -E '^[✓✘]' "$OUTPUT_FILE" || true
    python3 scripts/playwright_history_report.py
    if [[ $status -ne 0 ]]; then
      echo "[CI] Test failures detected. Exiting with error."
      exit 1
    else
      echo "[CI] All tests passed."
      exit 0
    fi
  fi
  # Optionally stop on first failed test
  echo "Stop on first failed test? ([y]/n, default: y): "
  read -r stop_on_first
  stop_on_first=${stop_on_first:-y}
  extra_args=""
  if [[ "$stop_on_first" == "y"* ]]; then
    extra_args="--max-failures=1"
  fi
  echo "[INFO] Running last-failing test files: ${failed_files[*]}"
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --project="Desktop Chrome" $extra_args "${failed_files[@]}" | tee "$OUTPUT_FILE"
  # After any failed run, update last-failing file
  update_last_failing_lines
  python3 scripts/playwright_history_report.py
  exit 0
fi

# [s]elect mode: prompt for file/pattern/tag/description and run
if [[ "$choice" == "s"* ]]; then
  echo "\nEnter file name, pattern, tag, or description to run (e.g. e2e/quiz*.spec.ts, @fast, or test name):"
  read -r selection
  if [[ -z "$selection" ]]; then
    echo "[WARN] No selection entered. Aborting."
    python3 scripts/playwright_history_report.py
    exit 1
  fi
  echo "[INFO] Running Playwright with selection: $selection"
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $WORKERS_FLAG $PW_MODE_FLAG "$selection" | tee "$OUTPUT_FILE"
  print_playwright_summary "$OUTPUT_FILE"
  # After Playwright run, always call the reporting tool to append improved summary
  python3 scripts/playwright_history_report.py
  sync
  exit 0
fi

# 10. Help mode
if [[ "$choice" == "h"* ]]; then
  echo "\nUsage:"
  echo "  [a]ll      - Run all Playwright tests (default)"
  echo "  [f]ailed   - Run only last failed test files (from output), with options to rerun, CI mode, debug, bisect, or run only failing lines"
  echo "  [x]failed-lines - Run only failing test lines (file:line) from last run (if supported)"
  echo "  [d]ebug    - Debug a test file (prompt for file, or last failed)"
  echo "  [l]ist     - List all test files, status, and show statistics (summary of pass/fail/untested and slowest tests)"
  echo "  [s]elect   - Run by file, pattern, tag, or description (e.g. filename, @fast, or test name)"
  echo "  [w]atch    - Watch mode: re-run tests on file changes automatically"
  echo "  [u]ntested - Run only untested test files (not present in last run output)"
  echo "  [update-snapshots] - Run tests with --update-snapshots to update snapshots"
  echo "  [coverage] - Run with code coverage enabled and output summary (requires setup)"
  echo "  [precommit] - Run only staged/changed tests before commit/push, block if any fail"
  echo "  [html]     - Open HTML report in browser after run (if available)"
  echo "  [r]epeat   - Repeat the last run (from output)"
  echo "  [cl]ear    - Clear last failing and output files (optionally clear Playwright cache)"
  echo "  [h]elp     - Show this help message with descriptions for all test modes\n"
  exit 0
fi

# [html] mode: open HTML report if exists
if [[ "$choice" == "html"* ]]; then
  report_file="playwright-report/index.html"
  if [[ -f "$report_file" ]]; then
    echo "[INFO] Opening Playwright HTML report: $report_file"
    open "$report_file"
    exit 0
  else
    echo "[INFO] No HTML report found at $report_file."
    exit 1
  fi
fi

# [u]ntested mode: run only untested test files (not present in last run output)
if [[ "$choice" == "u"* ]]; then
  all_test_files=( $(ls e2e/*.spec.*[tj]s 2>/dev/null) )
  output_files=()
  if [[ -f "$OUTPUT_FILE" ]]; then
    output_files=( $(grep -Eo 'e2e/[^ >]*\.spec\.[tj]s' "$OUTPUT_FILE" | sort -u) )
  fi
  untested_files=()
  for f in "${all_test_files[@]}"; do
    found=false
    for of in "${output_files[@]}"; do
      if [[ "$f" == "$of" ]]; then found=true; break; fi
    done
    if ! $found; then untested_files+=("$f"); fi
  done
  if [[ ${#untested_files[@]} -gt 0 ]]; then
    echo "[INFO] Running untested test files: ${untested_files[*]}"
    PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $PW_MODE_FLAG "${untested_files[@]}" | tee "$OUTPUT_FILE"
    python3 scripts/playwright_history_report.py
    sync
    exit 0
  else
    echo "[INFO] No untested test files detected."
    python3 scripts/playwright_history_report.py
    exit 0
  fi
fi

# [update-snapshots] mode
if [[ "$choice" == "update-snapshots"* ]]; then
  echo "[INFO] Running tests with --update-snapshots."
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $PW_MODE_FLAG --update-snapshots | tee "$OUTPUT_FILE"
  python3 scripts/playwright_history_report.py
  sync
  exit 0
fi


# [x]failed-lines mode
if [[ "$choice" == "x"* ]]; then
  if [[ -s "$LAST_FAILING_FILE" ]]; then
    failed_lines=( )
    while IFS= read -r line; do
      [[ -n "$line" ]] && failed_lines+=("$line")
    done < "$LAST_FAILING_FILE"
    if [[ ${#failed_lines[@]} -gt 0 ]]; then
      echo "[INFO] Running only failing test lines: ${failed_lines[*]}"
      PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $PW_MODE_FLAG "${failed_lines[@]}" | tee "$OUTPUT_FILE"
      sync
      exit 0
    else
      echo "[INFO] No failing test lines found."
      exit 0
    fi
  else
    echo "[INFO] No last failing file found."
    exit 0
  fi
fi

# [d]ebug mode
if [[ "$choice" == "d"* ]]; then
  echo "Enter the test file path to debug (e.g. e2e/your-test.spec.ts), or leave blank for last failing: "
  read -r debug_file
  if [[ -z "$debug_file" && -s "$LAST_FAILING_FILE" ]]; then
    debug_file=$(head -n1 "$LAST_FAILING_FILE" | cut -d: -f1)
  fi
  if [[ -n "$debug_file" ]]; then
    echo "[INFO] Debugging test file: $debug_file"
    PWDEBUG=1 PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --project="Desktop Chrome" $PW_MODE_FLAG "$debug_file"
    exit 0
  else
    echo "[ERROR] No file provided."
    exit 1
  fi
fi

# [l]ist mode: show test run statistics and list all test files/status
if [[ "$choice" == "l"* ]]; then
  all_test_files=( $(ls e2e/*.spec.*[tj]s 2>/dev/null) )
  passing_files=()
  failing_files=()
  if [[ -f "$OUTPUT_FILE" ]]; then
    passing_files=( $(grep -Eo '✓ +[0-9]+ \[.*\] › (e2e/[^ >]*\.spec\.[tj]s)' "$OUTPUT_FILE" | awk '{print $5}' | sort -u) )
    failing_files=( $(grep -Eo '✘ +[0-9]+ \[.*\] › (e2e/[^ >]*\.spec\.[tj]s)' "$OUTPUT_FILE" | awk '{print $5}' | sort -u) )
  fi
  echo "\nTest File Status Summary:"
  for f in "${all_test_files[@]}"; do
    if [[ " ${passing_files[*]} " == *" $f "* ]]; then
      echo "[PASS] $f"
    elif [[ " ${failing_files[*]} " == *" $f "* ]]; then
      echo "[FAIL] $f"
    else
      echo "[UNTESTED] $f"
    fi
  done
  total=$(grep -E '^[✓✘]' "$OUTPUT_FILE" | wc -l | xargs)
  passed=$(grep -E '^✓' "$OUTPUT_FILE" | wc -l | xargs)
  failed=$(grep -E '^✘' "$OUTPUT_FILE" | wc -l | xargs)
  slowest=$(grep -E '^[✓✘]' "$OUTPUT_FILE" | sort -kNF | tail -5)
  echo "\nTest Run Statistics:"
  echo "  Total: $total"
  echo "  Passed: $passed"
  echo "  Failed: $failed"
  echo "  Slowest tests:"
  echo "$slowest"
  exit 0
fi

# [w]atch mode
if [[ "$choice" == "w"* ]]; then
  echo "[INFO] Running Playwright in watch mode."
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --watch
  exit 0
fi

# If no valid option was selected, default to running all tests
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $WORKERS_FLAG $PW_MODE_FLAG | tee "$OUTPUT_FILE"
python3 scripts/playwright_history_report.py
sync

# === ENSURE COVERAGE MERGE AND REPORT ALWAYS RUNS AT END ===
# This block will always run, even if tests fail, as long as the script is not exited early.
if [[ -d ".nyc_output" && $(ls -1 .nyc_output/*.json 2>/dev/null | wc -l) -gt 0 ]]; then
  echo "[INFO] Coverage data found in .nyc_output:"
  ls -l .nyc_output
  echo "[AUTO] Merging all coverage data (Jest + Playwright)..."
  npx nyc merge .nyc_output coverage/coverage-final.json
  npx nyc report --report-dir=coverage --reporter=html
  if [[ -f "coverage/index.html" ]]; then
    echo "[AUTO] Coverage report generated: coverage/index.html"
    open coverage/index.html
  elif [[ -f "coverage/lcov-report/index.html" ]]; then
    echo "[AUTO] Coverage report generated: coverage/lcov-report/index.html"
    open coverage/lcov-report/index.html
  else
    echo "[AUTO] Coverage report not found after generation."
  fi
  echo "[AUTO] Coverage summary (console):"
  npx nyc report --report-dir=coverage --reporter=text-summary
else
  echo "[WARN] No coverage data found in .nyc_output!"
fi
