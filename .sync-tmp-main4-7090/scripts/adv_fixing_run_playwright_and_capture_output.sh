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

# Function to print color-coded summary from output file
print_playwright_summary() {
  local output_file="$1"
  local passed failed flaky total
  passed=$(grep -E '^✓' "$output_file" | wc -l | xargs)
  failed=$(grep -E '^✘' "$output_file" | wc -l | xargs)
  flaky=$(grep -E '\[flaky\]' "$output_file" | wc -l | xargs)
  total=$((passed + failed))
  GREEN='\033[32m'
  RED='\033[31m'
  YELLOW='\033[33m'
  NC='\033[0m'
  printf "\n[SUMMARY] %b%d passed%b, %b%d failed%b, %b%d flaky%b, %d total\n" \
    "$GREEN" "$passed" "$NC" \
    "$RED" "$failed" "$NC" \
    "$YELLOW" "$flaky" "$NC" \
    "$total"
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
  local delay=0.1
  local spinstr='◐◓◑◒'
  while kill -0 $pid 2>/dev/null; do
    local temp=${spinstr#?}
    printf " [%c]  " "$spinstr"
    spinstr=$temp${spinstr%"$temp"}
    sleep $delay
    printf "\b\b\b\b\b\b"
  done
  printf "    \b\b\b\b"
}

# Start lint/typecheck in background
(npx eslint . --ext .js,.jsx,.ts,.tsx && npx tsc --noEmit) &
lint_pid=$!

# Show menu immediately
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

show_menu_and_get_choice
choice=$choice

# Prompt for headed or headless mode
run_mode=""
PW_HEADLESS_VALUE=""
while [[ -z "$run_mode" ]]; do
  echo "\nRun in which mode? [1] Headed (UI, default) or [2] Headless (faster, no UI)? [1/2]: "
  read -r mode_choice
  mode_choice=${mode_choice:-1}
  case $mode_choice in
    1|h|H|headed|Headed|ui|UI) run_mode="headed"; PW_HEADLESS_VALUE="0" ;;
    2|headless|Headless|n|N) run_mode="headless"; PW_HEADLESS_VALUE="1" ;;
    *) echo "[WARN] Invalid selection. Defaulting to headed mode."; run_mode="headed"; PW_HEADLESS_VALUE="0" ;;
  esac
  # Do NOT export PW_HEADLESS
  # Only set PW_HEADLESS inline for each Playwright invocation
done

# Prompt for number of workers (parallelism)
MAX_WORKERS=$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
DEFAULT_WORKERS=1
if [[ $MAX_WORKERS -gt 4 ]]; then
  MAX_WORKERS=4
fi
WORKERS=""
while [[ -z "$WORKERS" ]]; do
  echo "\nHow many Playwright workers (parallel test runners) do you want to use? [1-$MAX_WORKERS] (default: $DEFAULT_WORKERS): "
  read -r workers_choice
  workers_choice=${workers_choice:-$DEFAULT_WORKERS}
  if [[ "$workers_choice" =~ ^[1-4]$ ]] && [[ $workers_choice -le $MAX_WORKERS ]]; then
    WORKERS=$workers_choice
  elif [[ "$workers_choice" == "max" ]]; then
    WORKERS=$MAX_WORKERS
  else
    echo "[WARN] Invalid selection. Please enter a number between 1 and $MAX_WORKERS, or 'max'."
  fi
done

WORKERS_FLAG="--workers=$WORKERS"

# Wait for lint/typecheck to finish before running tests
if kill -0 $lint_pid 2>/dev/null; then
  echo "[INFO] Waiting for lint and typecheck to finish..."
  show_spinner $lint_pid
  wait $lint_pid
fi
if [[ $? -ne 0 ]]; then
  echo "[ERROR] Lint or typecheck failed. Aborting test run."
  exit 1
fi

# Replace all Playwright invocations:
#   PW_HEADLESS=$PW_HEADLESS npx playwright test ...
# with:
#   PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test ...
#
# Example:
# If running all tests, clear last failing file at the start
if [[ "$choice" == "a"* ]]; then
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $WORKERS_FLAG --reporter=list | tee "$OUTPUT_FILE"
  print_playwright_summary "$OUTPUT_FILE"
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
        PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list --project="Desktop Chrome" "${failed_lines[@]}" | tee "$OUTPUT_FILE"
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
      PWDEBUG=1 PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list "$first_failed"
    else
      echo "[INFO] No failed test found in output."
    fi
    python3 scripts/playwright_history_report.py
    exit 0
  fi
  if [[ "$failed_mode" == "2" ]]; then
    echo "[INFO] Running last-failing test files in CI mode: ${failed_files[*]}"
    PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list --project="Desktop Chrome" "${failed_files[@]}" | tee "$OUTPUT_FILE"
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
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list --project="Desktop Chrome" $extra_args "${failed_files[@]}" | tee "$OUTPUT_FILE"
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
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test $WORKERS_FLAG --reporter=list --project="Desktop Chrome" $selection | tee "$OUTPUT_FILE"
  print_playwright_summary "$OUTPUT_FILE"
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
    PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list --project="Desktop Chrome" "${untested_files[@]}" | tee "$OUTPUT_FILE"
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
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --update-snapshots --reporter=list --project="Desktop Chrome" | tee "$OUTPUT_FILE"
  python3 scripts/playwright_history_report.py
  sync
  exit 0
fi

# [coverage] mode
if [[ "$choice" == "coverage"* ]]; then
  echo "[DEBUG] COVERAGE=\033[32m$COVERAGE\033[0m"
  echo "[DEBUG] PW_HEADLESS=\033[32m$PW_HEADLESS_VALUE\033[0m"
  echo "[INFO] Running tests with code coverage enabled."
  echo "[NOTE] Code coverage is enabled via COVERAGE=true and vite-plugin-istanbul. See project docs for details."
  COVERAGE=true PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list --project="Desktop Chrome" | tee "$OUTPUT_FILE"
  python3 scripts/playwright_history_report.py
  # Automatically generate HTML coverage report if .nyc_output exists
  if [[ -d ".nyc_output" ]]; then
    echo "[INFO] Generating HTML coverage report..."
    npx nyc report --reporter=html
    if [[ -f "coverage/index.html" ]]; then
      echo "[INFO] Coverage report generated: coverage/index.html"
      # Optionally open the report on macOS
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open coverage/index.html
      fi
    else
      echo "[WARN] Coverage report not found after generation."
    fi
    echo "[INFO] Coverage summary (console):"
    npx nyc report --reporter=text-summary
  else
    echo "[WARN] No .nyc_output directory found. No coverage data to report."
  fi
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
      PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list --project="Desktop Chrome" "${failed_lines[@]}" | tee "$OUTPUT_FILE"
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
    PWDEBUG=1 PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list "$debug_file"
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
  PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --watch --reporter=list --project="Desktop Chrome"
  exit 0
fi

# If no valid option was selected, default to running all tests
PW_HEADLESS=$PW_HEADLESS_VALUE npx playwright test --reporter=list | tee "$OUTPUT_FILE"
python3 scripts/playwright_history_report.py
sync
