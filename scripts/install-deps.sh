#!/bin/bash
set -e

# Install all dependencies listed in package.json (including devDependencies)
echo "Installing all project dependencies..."
npm install

echo "Installing required dev dependencies for testing, linting, and type support..."
npm install --save-dev react @types/react @testing-library/react @types/testing-library__react jest @types/jest eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-config-prettier @babel/core @babel/eslint-parser @babel/preset-env @babel/preset-react @babel/preset-typescript @vitejs/plugin-react vite typescript @types/react-dom @types/node babel-jest babel-plugin-transform-import-meta babel-plugin-transform-vite-meta-env @playwright/test @testing-library/jest-dom @testing-library/user-event identity-obj-proxy jest-environment-jsdom gh-pages cross-fetch firebase-admin react-icons start-server-and-test

echo "Installing required dependencies..."
npm install firebase glob json5 jspdf react-dom react-router-dom strip-json-comments

# Install Material UI and its peer dependencies
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
