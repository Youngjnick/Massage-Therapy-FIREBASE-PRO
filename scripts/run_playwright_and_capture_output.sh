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

# Function to extract failing test files from output
function update_last_failing_files() {
  grep -E '^\s*[✘xX-]' "$OUTPUT_FILE" | \
    sed -E 's/.*\] › ([^:]+):.*/\1/' | \
    sort | uniq > "$LAST_FAILING_FILE"
  # If no failures, clear the file
  if [[ ! -s "$LAST_FAILING_FILE" ]]; then
    > "$LAST_FAILING_FILE"
  fi
}

# Ensure last-failing file is updated even on interruption
trap update_last_failing_files EXIT


# Prompt user to choose which tests to run
echo "Which tests do you want to run? ([a]ll/[f]ailed/[p]riorities): "
read -r choice

DEFAULT_PRIORITIZED_TESTS="e2e/stats-critical-flows.spec.ts,e2e/stats-persistence.spec.ts,e2e/quiz-firestore-verification.spec.cjs,e2e/quiz-keyboard-navigation.spec.ts,e2e/quiz-stats-live-update.spec.ts,e2e/finish-quiz-buttons.spec.ts,e2e/keyboard-navigation-and-restart.spec.ts,e2e/login-flow.spec.ts,e2e/edge-accessibility.spec.ts,e2e/critical-ui-accessibility.spec.ts"
prioritized_files=()

if [[ "$choice" == "f"* ]]; then
  if [[ -s "$LAST_FAILING_FILE" ]]; then
    # Read non-empty lines only
    prioritized_files=()
    while IFS= read -r line; do
      [[ -n "$line" ]] && prioritized_files+=("$line")
    done < "$LAST_FAILING_FILE"
    if [[ ${#prioritized_files[@]} -gt 0 ]]; then
      echo "Running last-failed test files: ${prioritized_files[@]}"
      npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
      update_last_failing_files
    else
      echo "No valid last-failed test files found. Falling back to --last-failed."
      npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
    fi
  else
    npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
  fi
elif [[ "$choice" == "p"* ]]; then
  # Use priorities: env or last failed only. Do NOT fall back to default list.
  if [[ -n "$PLAYWRIGHT_PRIORITIZED_TESTS" ]]; then
    IFS=',' read -A prioritized_files <<< "$PLAYWRIGHT_PRIORITIZED_TESTS"
  elif [[ -s "$LAST_FAILING_FILE" ]]; then
    mapfile -t prioritized_files < "$LAST_FAILING_FILE"
  fi
  if [[ ${#prioritized_files[@]} -gt 0 ]]; then
    echo "Running prioritized test files: ${prioritized_files[@]}"
    npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
    update_last_failing_files
  else
    echo "No prioritized tests found. Exiting."
    exit 1
  fi
else
  npx playwright test --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
fi
