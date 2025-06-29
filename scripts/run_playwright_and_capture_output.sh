#!/bin/zsh
# Run Playwright tests and always capture output to scripts/playwright-output.txt, even if interrupted

OUTPUT_FILE="scripts/playwright-output.txt"

# If called as 'npm run test:e2e' or 'npx playwright test', auto-detect and run the correct command
if [[ "$0" == *"npx"* ]] || [[ "$0" == *"playwright"* ]]; then
  # Called as npx playwright test ...
  npx playwright test | tee "$OUTPUT_FILE"
else
  # Default: run npm script
  npm run test:e2e | tee "$OUTPUT_FILE"
fi
