# Normalize line endings for all shell scripts to Unix (LF)
echo "Normalizing line endings for all shell scripts to Unix (LF)..."
if ! command -v dos2unix >/dev/null 2>&1; then
  echo "dos2unix not found. Installing with Homebrew..."
  if command -v brew >/dev/null 2>&1; then
    brew install dos2unix
  else
    echo "Homebrew not found. Please install Homebrew and re-run this script, or install dos2unix manually."
    exit 1
  fi
fi
dos2unix scripts/git-sync-utils.sh scripts/sync-all-files-to-specified-branches.sh
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

echo "Checking for Python 3..."
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required for advanced Playwright reporting. Please install Python 3 and re-run this script."
  exit 1
else
  echo "Python 3 is already installed."
fi

echo "Installing Playwright/Vite code coverage dev dependencies..."
npm install --save-dev vite-plugin-istanbul nyc @cypress/code-coverage
# Optionally: playwright-coverage (for advanced scenarios)
# npm install --save-dev playwright-coverage

echo "\nChecking shell scripts for syntax errors and best practices..."

# Install ShellCheck if not present (macOS/Homebrew)
if ! command -v shellcheck >/dev/null 2>&1; then
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "ShellCheck not found. Installing with Homebrew..."
    if command -v brew >/dev/null 2>&1; then
      brew install shellcheck
    else
      echo "Homebrew not found. Please install Homebrew and re-run this script, or install ShellCheck manually."
      exit 1
    fi
  else
    echo "ShellCheck not found. Please install ShellCheck using your system package manager (e.g., sudo apt-get install shellcheck) and re-run this script."
    exit 1
  fi
else
  echo "ShellCheck is already installed."
fi

# Run ShellCheck on all scripts
for script in scripts/*.sh; do
  echo "\nRunning ShellCheck on $script..."
  shellcheck "$script" || true
  # Syntax check with zsh (if script uses zsh), else bash
  if head -1 "$script" | grep -q 'zsh'; then
    echo "Syntax checking $script with zsh -n..."
    zsh -n "$script" || echo "Syntax error in $script (zsh)"
  else
    echo "Syntax checking $script with bash -n..."
    bash -n "$script" || echo "Syntax error in $script (bash)"
  fi
done

echo "Shell script checks complete."

echo "\nInstalling bats-core for shell script testing..."
if ! command -v bats >/dev/null 2>&1; then
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "bats not found. Installing with Homebrew..."
    if command -v brew >/dev/null 2>&1; then
      brew install bats-core
    else
      echo "Homebrew not found. Please install Homebrew and re-run this script, or install bats-core manually."
      exit 1
    fi
  else
    echo "bats not found. Please install bats-core using your system package manager (e.g., sudo apt-get install bats) and re-run this script."
    exit 1
  fi
else
  echo "bats-core is already installed."
fi
