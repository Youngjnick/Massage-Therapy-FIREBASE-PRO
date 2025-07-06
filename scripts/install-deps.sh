#!/bin/bash
set -e

# Install all dependencies listed in package.json (including devDependencies)
echo "Installing all project dependencies..."
npm install

echo "Installing required dev dependencies for testing, linting, and type support..."
npm install --save-dev react @types/react @testing-library/react @types/testing-library__react jest @types/jest eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-config-prettier @babel/core @babel/eslint-parser @babel/preset-env @babel/preset-react @babel/preset-typescript @vitejs/plugin-react vite typescript @types/react-dom @types/node babel-jest babel-plugin-transform-import-meta babel-plugin-transform-vite-meta-env @playwright/test @testing-library/jest-dom @testing-library/user-event identity-obj-proxy jest-environment-jsdom gh-pages cross-fetch firebase-admin react-icons start-server-and-test dotenv

echo "Installing required dependencies..."
npm install firebase glob json5 jspdf react-dom react-router-dom strip-json-comments

echo "Installing Material UI (MUI) and peer dependencies..."
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material @mui/lab @mui/x-tree-view

echo "Installing Playwright browsers..."
npx playwright install

echo "All dependencies installed!"

echo "Ensuring jest-dom matchers are available for all test environments..."
# Add jest-dom import to both setupTests.js and setupTests.ts if not present
if ! grep -q "@testing-library/jest-dom" src/setupTests.js 2>/dev/null; then
  echo "import '@testing-library/jest-dom';" >> src/setupTests.js
fi
if ! grep -q "@testing-library/jest-dom" src/setupTests.ts 2>/dev/null; then
  echo "import '@testing-library/jest-dom';" >> src/setupTests.ts
fi

echo "Checking all question JSON files for syntax errors..."
find src/data/questions -type f -name '*.json' -exec sh -c 'echo -n "{}: "; node -e "try{JSON.parse(require(\"fs\").readFileSync(\"{}\",\"utf8\"));console.log(\"OK\") }catch(e){console.log(\"ERROR\")}"' \;
echo "JSON syntax check complete."

echo "Checking for gawk (GNU awk)..."
if ! command -v gawk >/dev/null 2>&1; then
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "gawk not found. Installing with Homebrew..."
    if command -v brew >/dev/null 2>&1; then
      brew install gawk
    else
      echo "Homebrew not found. Please install Homebrew and re-run this script, or install gawk manually."
      exit 1
    fi
  else
    echo "gawk not found. Please install gawk using your system package manager (e.g., sudo apt-get install gawk) and re-run this script."
    exit 1
  fi
else
  echo "gawk is already installed."
fi

echo "Installing Playwright/Vite code coverage dev dependencies..."
npm install --save-dev vite-plugin-istanbul nyc @cypress/code-coverage
# Optionally: playwright-coverage (for advanced scenarios)
# npm install --save-dev playwright-coverage
