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


# Run prioritized (flaky/important) test files first if specified
if [[ -n "$PLAYWRIGHT_PRIORITIZED_TESTS" ]]; then
  IFS=',' read -A prioritized_files <<< "$PLAYWRIGHT_PRIORITIZED_TESTS"
  echo "Running prioritized test files first: ${prioritized_files[@]}"
  npx playwright test --headed --reporter=list "${prioritized_files[@]}" | tee "$OUTPUT_FILE"
  update_last_failing_files
fi

# Prompt user to choose between running all tests or only last failed
echo "Run all tests or only last failed? ([a]ll/[f]ailed): "
read -r choice

if [[ "$choice" == "f"* ]]; then
  npx playwright test --last-failed --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
else
  npx playwright test --headed --reporter=list "$@" | tee "$OUTPUT_FILE"
fi
