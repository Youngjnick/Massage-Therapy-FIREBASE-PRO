#!/bin/zsh
# Run Playwright tests and always capture output to scripts/playwright-output.txt, even if interrupted

# Always use local emulators, never Google Cloud
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_PROJECT_ID=massage-therapy-smart-st-c7f8f
export GCLOUD_PROJECT=massage-therapy-smart-st-c7f8f
export NODE_ENV=test

OUTPUT_FILE="scripts/playwright-output.txt"
LAST_FAILING_FILE="scripts/last-failing-playwright-files.txt"

# Function to extract only failing test file paths from output
function update_last_failing_files() {
  # Extract lines that look like Playwright test failures and get only the file path
  awk '/^e2e\// { split($1, arr, ":"); print arr[1] }' "$OUTPUT_FILE" | sort | uniq > "$LAST_FAILING_FILE"
}

# Ensure last-failing file is updated even on interruption
trap update_last_failing_files EXIT

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
      npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
      update_last_failing_files
    else
      npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
    fi
  else
    npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
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
    npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
    update_last_failing_files
  else
    exit 1
  fi
else
  npx playwright test --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
fi
