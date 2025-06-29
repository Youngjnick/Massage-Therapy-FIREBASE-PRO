#!/bin/zsh
# Run Playwright tests and always capture output to scripts/playwright-output.txt, even if interrupted

OUTPUT_FILE="scripts/playwright-output.txt"

# Pass all arguments to Playwright
npx playwright test "$@" | tee "$OUTPUT_FILE"
