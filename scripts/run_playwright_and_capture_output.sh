#!/bin/zsh
set -x

# Function to extract only failing test file paths from output
function update_last_failing_files() {
  echo "[DEBUG] Running update_last_failing_files, OUTPUT_FILE=$OUTPUT_FILE"
  if [[ -f "$OUTPUT_FILE" ]]; then
    # Extract all failing test file:line pairs (strip column), portable for macOS
    grep -Eo 'e2e/[^ >]*\.spec\.[tc]s:[0-9]+:[0-9]+' "$OUTPUT_FILE" \
      | sed -E 's/(:[0-9]+):[0-9]+$/\1/' \
      | sort -u > "$LAST_FAILING_FILE"
    echo "[DEBUG] last-failing-playwright-files.txt contents:"
    cat "$LAST_FAILING_FILE"
  else
    echo "[DEBUG] OUTPUT_FILE does not exist: $OUTPUT_FILE"
  fi
}

# Always use local emulators, never Google Cloud
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_PROJECT_ID=massage-therapy-smart-st-c7f8f
export GCLOUD_PROJECT=massage-therapy-smart-st-c7f8f
export NODE_ENV=test

OUTPUT_FILE="scripts/playwright-output.txt"
LAST_FAILING_FILE="scripts/last-failing-playwright-files.txt"

# Trap EXIT and INT (Ctrl+C) to always update last-failing-playwright-files.txt
trap update_last_failing_files EXIT INT

# Prompt user to choose which tests to run
print "Which tests do you want to run? ([a]ll/[f]ailed/[p]riorities): "
read -r choice

DEFAULT_PRIORITIZED_TESTS="e2e/stats-critical-flows.spec.ts,e2e/stats-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs,e2e/quiz-keyboard-navigation.spec.ts,e2e/quiz-stats-live-update.spec.ts,e2e/finish-quiz-buttons.spec.ts,e2e/keyboard-navigation-and-restart.spec.ts,e2e/login-flow.spec.ts,e2e/edge-accessibility.spec.ts,e2e/critical-ui-accessibility.spec.ts,e2e/auth-session-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs"
prioritized_files=()

if [[ "$choice" == "f"* ]]; then
  if [[ -s "$LAST_FAILING_FILE" ]]; then
    prioritized_files=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
    if [[ ${#prioritized_files[@]} -gt 0 ]]; then
      PW_HEADLESS=0 npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
      sync
      update_last_failing_files
    else
      PW_HEADLESS=0 npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
      sync
      update_last_failing_files
    fi
  else
    PW_HEADLESS=0 npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
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
    PW_HEADLESS=0 npx playwright test --headed --reporter=list "${prioritized_files[@]}"
    sync
    update_last_failing_files
  else
    exit 1
  fi
else
  PW_HEADLESS=0 npx playwright test --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
  sync
  update_last_failing_files
fi
