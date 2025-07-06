#!/bin/zsh
# Usage: ./adv_fixing_run_playwright_and_capture_output.sh [--debug]
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

OUTPUT_FILE="scripts/playwright-output.txt"
HISTORY_FILE="scripts/playwright-output-history.txt"

trap 'append_history_summary; open_html_report' EXIT INT

# Function to extract failed test files from the last Playwright run output
get_failed_test_files() {
  # Only look for lines with '✘' (failures) and extract the test file path
  if [[ -f "$OUTPUT_FILE" ]]; then
    grep -E '^\s*✘' "$OUTPUT_FILE" | \
      sed -E 's/.* ([^ ]+\.spec\.[tj]s):[0-9]+:[0-9]+.*/\1/' | \
      sort -u
  fi
}

# 1. Check for Playwright installation
if ! command -v npx &>/dev/null || ! npx --no-install playwright --version &>/dev/null; then
  echo "[ERROR] Playwright is not installed. Please run: npm install --save-dev @playwright/test"
  exit 1
fi

# 2. Lint and typecheck before prompting for test mode, with spinner only (no extra progress bar from npm)
show_spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\\'
  while kill -0 $pid 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

echo "[INFO] Running lint and typecheck before showing test menu (this may take a few seconds)..."
(
  npx eslint . --ext .js,.jsx,.ts,.tsx && npx tsc --noEmit
) &
spinner_pid=$!
show_spinner $spinner_pid
wait $spinner_pid
if [[ $? -ne 0 ]]; then
  echo "[ERROR] Lint or typecheck failed. Aborting test run."
  exit 1
fi

# Improved menu prompt for test options
show_menu_and_get_choice() {
  echo "\nWhich tests do you want to run?"
  echo "  1) [a]ll             - Run all Playwright tests (default)"
  echo "  2) [f]ailed          - Run last failed tests (rerun, CI, debug, bisect, failed-lines)"
  echo "  3) [s]elect          - Run by file, pattern, tag, or description (e.g.@fast)"
  echo "  4) [u]ntested        - Run only untested test files"
  echo "  5) [c]hanged         - Run tests for changed or staged files (since last commit)"
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
    5|c*) choice="changed" ;;
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

# Replace old prompt with improved menu
show_menu_and_get_choice
choice=$choice

# If running all tests, clear last failing file at the start
if [[ "$choice" == "a"* ]]; then
  # Run all tests and exit immediately after
  PW_HEADLESS=0 npx playwright test --headed --reporter=list | tee "$OUTPUT_FILE"
  sync
  exit 0
fi

# [f]ailed mode: run only last-failing test files (now from OUTPUT_FILE)
if [[ "$choice" == "f"* ]]; then
  failed_files=( $(get_failed_test_files) )
  if [[ ${#failed_files[@]} -eq 0 ]]; then
    echo "[INFO] No last-failing test files found in $OUTPUT_FILE."
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
        PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${failed_lines[@]}" | tee "$OUTPUT_FILE"
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
  if [[ "$failed_mode" == "4" || "$failed_mode" == "fl"* ]]; then
    first_failed=$(grep -m1 '✘' "$OUTPUT_FILE" | grep -Eo 'e2e/[^ >]*\.spec\.[tj]s')
    if [[ -n "$first_failed" ]]; then
      echo "[INFO] Running Playwright bisect mode on: $first_failed"
      npx playwright test --bisect "$first_failed"
    else
      echo "[INFO] No failed test found in output."
    fi
    exit 0
  fi
  if [[ "$failed_mode" == "3" ]]; then
    first_failed=$(grep -m1 '✘' "$OUTPUT_FILE" | grep -Eo 'e2e/[^ >]*\.spec\.[tj]s')
    if [[ -n "$first_failed" ]]; then
      echo "[INFO] First failed test file: $first_failed"
      PWDEBUG=1 npx playwright test --headed --reporter=list "$first_failed"
    else
      echo "[INFO] No failed test found in output."
    fi
    exit 0
  fi
  if [[ "$failed_mode" == "2" ]]; then
    echo "[INFO] Running last-failing test files in CI mode: ${failed_files[*]}"
    PW_HEADLESS=1 npx playwright test --reporter=list --project="Desktop Chrome" "${failed_files[@]}" | tee "$OUTPUT_FILE"
    status=$?
    echo "\n[CI SUMMARY]"
    grep -E '^[✓✘]' "$OUTPUT_FILE" || true
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
  PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" $extra_args "${failed_files[@]}" | tee "$OUTPUT_FILE"
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
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${untested_files[@]}"
    sync
    exit 0
  else
    echo "[INFO] No untested test files detected."
    exit 0
  fi
fi

# [update-snapshots] mode
if [[ "$choice" == "update-snapshots"* ]]; then
  echo "[INFO] Running tests with --update-snapshots."
  PW_HEADLESS=0 npx playwright test --update-snapshots --headed --reporter=list --project="Desktop Chrome"
  sync
  exit 0
fi

# [coverage] mode
if [[ "$choice" == "coverage"* ]]; then
  echo "[INFO] Running tests with code coverage enabled."
  echo "[NOTE] Playwright/Vite code coverage is not yet fully set up. You must configure vite-plugin-istanbul in vite.config.ts and ensure coverage is collected and reported. See project docs."
  PW_HEADLESS=0 npx playwright test --coverage --headed --reporter=list --project="Desktop Chrome"
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
      PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${failed_lines[@]}" | tee "$OUTPUT_FILE"
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
  echo "Enter the test file path to debug (e.g. e2e/your-test.spec.ts), or leave blank for last failed: "
  read -r debug_file
  if [[ -z "$debug_file" && -s "$LAST_FAILING_FILE" ]]; then
    debug_file=$(head -n1 "$LAST_FAILING_FILE" | cut -d: -f1)
  fi
  if [[ -n "$debug_file" ]]; then
    echo "[INFO] Debugging test file: $debug_file"
    PWDEBUG=1 npx playwright test --headed --reporter=list "$debug_file"
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
  PW_HEADLESS=0 npx playwright test --watch --headed --reporter=list --project="Desktop Chrome"
  exit 0
fi

# If no valid option was selected, default to running all tests
PW_HEADLESS=0 npx playwright test --headed --reporter=list | tee "$OUTPUT_FILE"
sync
