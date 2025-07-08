#!/bin/zsh
set -x

# Function to extract only failing test file paths from output
function update_last_failing_files() {
  echo "[DEBUG] Running update_last_failing_files, OUTPUT_FILE=$OUTPUT_FILE"
  if [[ -f "$OUTPUT_FILE" ]]; then
    # If there are no lines with '✘', all tests passed, so clear the last failing file
    if ! grep -q '✘' "$OUTPUT_FILE"; then
      echo "[DEBUG] No failures found (no '✘' in output). Clearing $LAST_FAILING_FILE."
      > "$LAST_FAILING_FILE"
    else
      # Extract all failing test file:line pairs (strip column), portable for macOS
      grep -Eo 'e2e/[^ >]*\.spec\.[tc]s:[0-9]+:[0-9]+' "$OUTPUT_FILE" \
        | sed -E 's/(:[0-9]+):[0-9]+$/\1/' \
        | sort -u > "$LAST_FAILING_FILE"
    fi
    echo "[DEBUG] last-failing-playwright-files.txt contents:"
    cat "$LAST_FAILING_FILE"
  else
    echo "[DEBUG] OUTPUT_FILE does not exist: $OUTPUT_FILE"
  fi
}

OUTPUT_FILE="scripts/playwright-output.txt"
LAST_FAILING_FILE="scripts/last-failing-playwright-files.txt"

function update_playwright_history() {
  python3 scripts/playwright_history_report.py
}

# Always use local emulators, never Google Cloud
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_PROJECT_ID=massage-therapy-smart-st-c7f8f
export GCLOUD_PROJECT=massage-therapy-smart-st-c7f8f
export NODE_ENV=test

# Trap EXIT and INT (Ctrl+C) to always update last-failing-playwright-files.txt and playwright history
trap 'update_last_failing_files; update_playwright_history' EXIT INT

# Prompt user to choose which tests to run
printf "Which tests do you want to run? ([a]ll/[f]ailed/[p]riorities/[c]overage): "
read -r choice

# Coverage mode: run all tests with coverage and update history
if [[ "$choice" == "c"* || "$choice" == "coverage"* ]]; then
  echo "[INFO] Running tests with code coverage enabled."
  # Always prompt for confirmation before running coverage tests
  vite_pid=$(lsof -i :5173 -t 2>/dev/null | head -n1)
  vite_status_msg=""
  if [[ -n "$vite_pid" ]]; then
    if ! ps -p "$vite_pid" -o env | grep -q 'COVERAGE=true'; then
      vite_status_msg="[WARN] Vite dev server is running but not with COVERAGE=true. Coverage will NOT be collected!\n[HINT] Stop your dev server and restart it with: COVERAGE=true npm run dev"
    else
      vite_status_msg="[INFO] Vite dev server detected on port 5173 with COVERAGE=true."
    fi
  else
    vite_status_msg="[WARN] Vite dev server is not running."
  fi
  echo "$vite_status_msg"
  while true; do
    echo "\nIs the Vite dev server running in coverage mode (COVERAGE=true npm run dev) and ready? [y/N]: "
    read -r confirm_vite
    if [[ "$confirm_vite" =~ ^[Yy]$ ]]; then
      break
    else
      echo "[INFO] Please start the Vite dev server in another terminal with:"
      echo "    COVERAGE=true npm run dev"
      echo "Then type 'y' and press Enter here when the server is ready, or Ctrl+C to abort."
    fi
  done
  COVERAGE=true PW_HEADLESS=0 npx playwright test --reporter=list --project="Desktop Chrome" | tee "$OUTPUT_FILE"
  sync
  # Generate HTML report if .nyc_output exists
  if [[ -d ".nyc_output" ]]; then
    npx nyc report --reporter=html
    echo "[INFO] Coverage HTML report generated at coverage/index.html"
  else
    echo "[WARN] .nyc_output directory not found, coverage report not generated."
  fi
  exit 0
fi

DEFAULT_PRIORITIZED_TESTS="e2e/stats-critical-flows.spec.ts,e2e/stats-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs,e2e/quiz-keyboard-navigation.spec.ts,e2e/quiz-stats-live-update.spec.ts,e2e/finish-quiz-buttons.spec.ts,e2e/keyboard-navigation-and-restart.spec.ts,e2e/login-flow.spec.ts,e2e/edge-accessibility.spec.ts,e2e/critical-ui-accessibility.spec.ts,e2e/auth-session-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs"
prioritized_files=()

if [[ "$choice" == "f"* ]]; then
  if [[ -s "$LAST_FAILING_FILE" ]]; then
    prioritized_files=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
    if [[ ${#prioritized_files[@]} -gt 0 ]]; then
      PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
      sync
      update_last_failing_files
    else
      PW_HEADLESS=0 npx playwright test --last-failed --headed --reporter=list --project="Desktop Chrome" "$@" | tee "$OUTPUT_FILE"
      sync
      update_last_failing_files
    fi
  else
    PW_HEADLESS=0 npx playwright test --last-failed --headed --reporter=list --project="Desktop Chrome" "$@" | tee "$OUTPUT_FILE"
    sync
    update_last_failing_files
  fi
elif [[ "$choice" == "p"* ]]; then
  if [[ -n "$PLAYWRIGHT_PRIORITIZED_TESTS" ]]; then
    IFS=',' read -A prioritized_files <<< "$PLAYWRIGHT_PRIORITIZED_TESTS"
  elif [[ -s "$LAST_FAILING_FILE" ]]; then
    prioritized_files=()
    while IFS= read -r line; do
      prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
  fi
  if [[ ${#prioritized_files[@]} -gt 0 ]]; then
    PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "${prioritized_files[@]}"
    sync
    update_last_failing_files
  else
    exit 1
  fi
elif [[ "$choice" == "a"* ]]; then
  PW_HEADLESS=0 npx playwright test "$@" | tee "$OUTPUT_FILE"
  sync
  update_last_failing_files
  exit 0
else
  PW_HEADLESS=0 npx playwright test --headed --reporter=list --project="Desktop Chrome" "$@" | tee "$OUTPUT_FILE"
  sync
  update_last_failing_files
fi
