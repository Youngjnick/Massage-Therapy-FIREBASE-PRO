#!/bin/zsh
# Run Playwright tests and always capture output to scripts/playwright-output.txt, even if interrupted


# Always use local emulators, never Google Cloud
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_PROJECT_ID=massage-therapy-smart-st-c7f8f
export GCLOUD_PROJECT=massage-therapy-smart-st-c7f8f
echo "Using FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID and GCLOUD_PROJECT=$GCLOUD_PROJECT"
export NODE_ENV=test

OUTPUT_FILE="scripts/playwright-output.txt"
LAST_FAILING_FILE="scripts/last-failing-playwright-files.txt"

# Function to extract only valid test file paths from output
function update_last_failing_files() {
  date '+[DEBUG] Updating last-failing file at %Y-%m-%d %H:%M:%S' >> "$LAST_FAILING_FILE"
  # Match file paths with optional :line:col and strip those off
  grep -Eo 'e2e/[a-zA-Z0-9/_-]+\.spec\.(ts|cjs)(:[0-9]+:[0-9]+)?' "$OUTPUT_FILE" | sed 's/:[0-9]*:[0-9]*$//' | sort | uniq > "$LAST_FAILING_FILE.tmp"
  mv "$LAST_FAILING_FILE.tmp" "$LAST_FAILING_FILE"
  # If no failures, clear the file (but keep timestamp)
  if [[ $(wc -l < "$LAST_FAILING_FILE") -eq 0 ]]; then
    > "$LAST_FAILING_FILE"
    date '+[DEBUG] Last-failing file cleared at %Y-%m-%d %H:%M:%S' >> "$LAST_FAILING_FILE"
  fi
}

# Ensure last-failing file is updated even on interruption
trap update_last_failing_files EXIT

echo "[DEBUG] trap for EXIT set. Will update output files on script exit."

echo "[DEBUG] Script started. Current directory: $(pwd)"
echo "[DEBUG] Output file: $OUTPUT_FILE"
echo "[DEBUG] Last failing file: $LAST_FAILING_FILE"

# Prompt user to choose which tests to run
echo "Which tests do you want to run? ([a]ll/[f]ailed/[p]riorities): "
read -r choice

DEFAULT_PRIORITIZED_TESTS="e2e/stats-critical-flows.spec.ts,e2e/stats-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs,e2e/quiz-keyboard-navigation.spec.ts,e2e/quiz-stats-live-update.spec.ts,e2e/finish-quiz-buttons.spec.ts,e2e/keyboard-navigation-and-restart.spec.ts,e2e/login-flow.spec.ts,e2e/edge-accessibility.spec.ts,e2e/critical-ui-accessibility.spec.ts,e2e/auth-session-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs"
prioritized_files=()

# Only log debug info if tests fail or are flaky
run_and_log() {
  npx playwright test --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
  local exit_code=${PIPESTATUS[0]}
  sleep 1  # Ensure all output is flushed before updating
  update_last_failing_files
  if [[ $exit_code -ne 0 ]]; then
    echo "[DEBUG] Playwright run failed or was flaky. See $OUTPUT_FILE for details." >&2
  fi
  return $exit_code
}

if [[ "$choice" == "f"* ]]; then
  echo "[DEBUG] User chose: failed"
  if [[ -s "$LAST_FAILING_FILE" ]]; then
    echo "[DEBUG] Last failing file is not empty."
    prioritized_files=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
    if [[ ${#prioritized_files[@]} -gt 0 ]]; then
      echo "[DEBUG] Running last-failed test files: ${prioritized_files[@]}"
      run_and_log "${prioritized_files[@]}"
    else
      echo "[DEBUG] No valid last-failed test files found. Falling back to --last-failed."
      run_and_log --last-failed "$@"
    fi
  else
    echo "[DEBUG] Last failing file is empty. Running --last-failed."
    run_and_log --last-failed "$@"
  fi
elif [[ "$choice" == "p"* ]]; then
  echo "[DEBUG] User chose: priorities"
  if [[ -n "$PLAYWRIGHT_PRIORITIZED_TESTS" ]]; then
    IFS=',' read -A prioritized_files <<< "$PLAYWRIGHT_PRIORITIZED_TESTS"
  elif [[ -s "$LAST_FAILING_FILE" ]]; then
    prioritized_files=()
    while IFS= read -r line; do
      prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
  fi
  if [[ ${#prioritized_files[@]} -gt 0 ]]; then
    echo "[DEBUG] Running prioritized test files: ${prioritized_files[@]}"
    run_and_log "${prioritized_files[@]}"
  else
    echo "[DEBUG] No prioritized tests found. Exiting."
    exit 1
  fi
else
  echo "[DEBUG] User chose: all"
  run_and_log "$@"
fi

echo "[DEBUG] Script finished."
