#!/bin/zsh
set -x

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

# 2. Clearer User Prompts with default
# Lint and typecheck before prompting for test mode
npm run lint && npx tsc --noEmit
if [[ $? -ne 0 ]]; then
  echo "[ERROR] Lint or typecheck failed. Aborting test run."
  exit 1
fi

echo "Which tests do you want to run? ([a]ll/[f]ailed/[p]riorities/[s]ingle/[r]epeat/[c]lear/[h]elp, default: all): "
read -r choice
echo "[DEBUG] Choice selected: $choice"
choice=${choice:-a}

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
  if [[ ${#failed_files[@]} -gt 0 ]]; then
    echo "[INFO] Running last-failing test files: ${failed_files[*]}"
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${failed_files[@]}" | tee "$OUTPUT_FILE"
    exit 0
  else
    echo "[INFO] No last-failing test files found in $OUTPUT_FILE."
    exit 0
  fi
fi

# 10. Help mode
if [[ "$choice" == "h"* ]]; then
  echo "\nUsage:"
  echo "  [a]ll      - Run all Playwright tests (default)"
  echo "  [f]ailed   - Run only last failed test files (from $OUTPUT_FILE)"
  echo "  [p]riorities - Run prioritized test files (from env or last failed)"
  echo "  [x]failed-lines - Run only failing test lines (file:line) from last run (if supported)"
  echo "  [d]ebug    - Debug a test file (PWDEBUG=1)"
  echo "  [l]ist     - List all test files and their status (pass/fail/untested), warn on new/deleted"
  echo "  [m]atch    - Run tests matching a pattern (substring/regex)"
  echo "  [o]nly     - Run only a specific test name/description (Playwright --grep)"
  echo "  [flaky]    - Run Playwright's bisect mode to find flaky tests"
  echo "  [g]it-diff - Run only changed test files since last commit/branch"
  echo "  [ci]       - CI mode: fail on any test failure, output summary, warn on new/deleted, upload artifacts"
  echo "  [s]tats    - Show test run statistics (total, pass, fail, slowest, etc.)"
  echo "  [q]uick    - Run only @fast-tagged tests"
  echo "  [w]atch    - Watch mode: re-run tests on file changes"
  echo "  [u]ntested - Run only untested test files (not present in last run output)"
  echo "  [update-snapshots] - Run tests with --update-snapshots"
  echo "  [coverage] - Run with code coverage enabled and output summary"
  echo "  [precommit] - Run only staged/changed tests before commit/push, block if any fail"
  echo "  [html]     - Open HTML report in browser after run"
  echo "  [faildebug] - After a failed run, prompt to debug first failed test"
  echo "  [s]ingle   - Run a single test file (prompt for filename)"
  echo "  [r]epeat   - Repeat the last run (from $OUTPUT_FILE)"
  echo "  [c]lear    - Clear last failing and output files (optionally clear Playwright cache)"
  echo "  [h]elp     - Show this help message\n"
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

# [precommit] mode: run only staged/changed tests
if [[ "$choice" == "precommit"* ]]; then
  staged_files=( $(git diff --cached --name-only | grep -E '^e2e/.*\\.spec\\.[tj]s$') )
  changed_files=( $(git diff --name-only HEAD | grep -E '^e2e/.*\\.spec\\.[tj]s$') )
  files=( "${staged_files[@]}" "${changed_files[@]}" )
  unique_files=( $(printf "%s\n" "${files[@]}" | sort -u) )
  if [[ ${#unique_files[@]} -gt 0 ]]; then
    echo "[INFO] Running staged/changed test files: ${unique_files[*]}"
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${unique_files[@]}"
    sync
    if grep -q '✘' "$OUTPUT_FILE"; then
      echo "[ERROR] Pre-commit/push tests failed. Aborting."
      exit 1
    fi
    exit 0
  else
    echo "[INFO] No staged or changed test files detected."
    exit 0
  fi
fi

# [faildebug] mode: after a failed run, prompt to debug first failed test
if [[ "$choice" == "faildebug"* ]]; then
  if grep -q '✘' "$OUTPUT_FILE"; then
    first_failed=$(grep -m1 '✘' "$OUTPUT_FILE" | grep -Eo 'e2e/[^ >]*\.spec\.[tj]s')
    echo "[INFO] First failed test file: $first_failed"
    echo "Do you want to debug it now? ([y]/n): "
    read -r debug_now
    debug_now=${debug_now:-y}
    if [[ "$debug_now" == "y"* ]]; then
      PWDEBUG=1 npx playwright test --headed --reporter=list "$first_failed"
    fi
    exit 0
  else
    echo "[INFO] No failed tests in last run."
    exit 0
  fi
fi

# [l]ist and [ci] warn on new/deleted test files
if [[ "$choice" == "l"* || "$choice" == "ci"* ]]; then
  all_test_files=( $(ls e2e/*.spec.*[tj]s 2>/dev/null) )
  output_files=( $(grep -Eo 'e2e/[^ >]*\.spec\.[tj]s' "$OUTPUT_FILE" | sort -u) )
  for f in "${all_test_files[@]}"; do
    found=false
    for of in "${output_files[@]}"; do
      if [[ "$f" == "$of" ]]; then found=true; break; fi
    done
    if ! $found; then echo "[WARN] New test file never run: $f"; fi
  done
  for of in "${output_files[@]}"; do
    found=false
    for f in "${all_test_files[@]}"; do
      if [[ "$of" == "$f" ]]; then found=true; break; fi
    done
    if ! $found; then echo "[WARN] Test file in output but missing: $of"; fi
  done
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

# [l]ist mode
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
  exit 0
fi

# [m]atch mode
if [[ "$choice" == "m"* ]]; then
  echo "Enter a substring or regex to match test files: "
  read -r pattern
  matched_files=( )
  for f in e2e/*.spec.*[tj]s; do
    if [[ "$f" =~ $pattern ]]; then
      matched_files+=("$f")
    fi
  done
  if [[ ${#matched_files[@]} -gt 0 ]]; then
    echo "[INFO] Running matched test files: ${matched_files[*]}"
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${matched_files[@]}"
    sync
    exit 0
  else
    echo "[INFO] No test files matched pattern: $pattern"
    exit 0
  fi
fi

# [o]nly mode
if [[ "$choice" == "o"* ]]; then
  echo "Enter a test name or description to grep: "
  read -r grep_pattern
  if [[ -n "$grep_pattern" ]]; then
    echo "[INFO] Running tests matching: $grep_pattern"
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" -g "$grep_pattern"
    sync
    exit 0
  else
    echo "[ERROR] No grep pattern provided."
    exit 1
  fi
fi

# [flaky] mode
if [[ "$choice" == "flaky"* ]]; then
  echo "Enter the test file to bisect for flakiness (e.g. e2e/your-test.spec.ts): "
  read -r flaky_file
  if [[ -n "$flaky_file" ]]; then
    echo "[INFO] Running Playwright bisect mode on: $flaky_file"
    npx playwright test --bisect "$flaky_file"
    exit 0
  else
    echo "[ERROR] No file provided."
    exit 1
  fi
fi

# [g]it-diff mode
if [[ "$choice" == "g"* ]]; then
  changed_files=( $(git diff --name-only HEAD | grep -E '^e2e/.*\\.spec\\.[tj]s$') )
  if [[ ${#changed_files[@]} -gt 0 ]]; then
    echo "[INFO] Running changed test files: ${changed_files[*]}"
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${changed_files[@]}"
    sync
    exit 0
  else
    echo "[INFO] No changed test files detected."
    exit 0
  fi
fi

# [ci] mode
if [[ "$choice" == "ci"* ]]; then
  PW_HEADLESS=1 npx playwright test --reporter=list | tee "$OUTPUT_FILE"
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

# [s]tats mode
if [[ "$choice" == "s"* && "$choice" != "single"* ]]; then
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

# [q]uick mode
if [[ "$choice" == "q"* ]]; then
  echo "[INFO] Running only @fast-tagged tests."
  PW_HEADLESS=0 npx playwright test --grep "@fast" --headed --reporter=list --project="Desktop Chrome"
  sync
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
