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

# Function to extract failing test details from output
function update_last_failing_files() {
  date '+[DEBUG] Updating last-failing file at %Y-%m-%d %H:%M:%S' >> "$LAST_FAILING_FILE"
  gawk '/^[[:space:]]*[✘xX-]/ {
# Ensure gawk is available
command -v gawk >/dev/null 2>&1 || { echo >&2 "gawk is required but not installed. Aborting."; exit 1; }
    # Example line: ✘  31 [Desktop Chrome] › e2e/app.spec.ts:18:1 › Suite Name › Test Name (4.3s)
    match($0, /\] › ([^ ]+) ([^\(]+)/, arr)
    file=arr[1]
    test=arr[2]
    # Try to get the next error message (if present)
    getline nextline
    err=""
    if (nextline ~ /Error:/) {
      err=nextline
    }
    printf "%s ›%s%s\n", file, test, (err != "" ? " [" err "]" : "")
  }' "$OUTPUT_FILE" | sort | uniq >> "$LAST_FAILING_FILE"
  # If no failures, clear the file (but keep timestamp)
  if [[ $(wc -l < "$LAST_FAILING_FILE") -le 1 ]]; then
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

if [[ "$choice" == "f"* ]]; then
  echo "[DEBUG] User chose: failed"
  if [[ -s "$LAST_FAILING_FILE" ]]; then
    echo "[DEBUG] Last failing file is not empty."
    # Read non-empty lines only
    prioritized_files=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
    if [[ ${#prioritized_files[@]} -gt 0 ]]; then
      echo "[DEBUG] Running last-failed test files: ${prioritized_files[@]}"
      npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
      echo "[DEBUG] Playwright run complete. Updating last failing files."
      update_last_failing_files
    else
      echo "[DEBUG] No valid last-failed test files found. Falling back to --last-failed."
      npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
    fi
  else
    echo "[DEBUG] Last failing file is empty. Running --last-failed."
    npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
  fi
elif [[ "$choice" == "p"* ]]; then
  echo "[DEBUG] User chose: priorities"
  # Use priorities: env or last failed only. Do NOT fall back to default list.
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
    npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
    echo "[DEBUG] Playwright run complete. Updating last failing files."
    update_last_failing_files
  else
    echo "[DEBUG] No prioritized tests found. Exiting."
    exit 1
  fi
else
  echo "[DEBUG] User chose: all"
  npx playwright test --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
fi

echo "[DEBUG] Script finished."
