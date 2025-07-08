#!/bin/zsh
# Toggle between .env.production, .env.development, and .env.e2e
# Usage: ./scripts/toggle-env.sh [1|2|3]
# 1 = Production mode (build & preview)
# 2 = Development mode (dev server, emulator/E2E)
# 3 = Coverage mode (emulator/E2E with coverage)

if [ $# -eq 0 ]; then
  echo "Select environment:"
  echo "1) Production mode (build & preview)"
  echo "2) Development mode (dev server, emulator/E2E)"
  echo "3) Coverage mode (emulator/E2E with coverage)"
  read "env_choice?Enter 1, 2, or 3: "
else
  env_choice=$1
fi

# Default to Development mode if no valid input is provided
if [[ -z "$env_choice" || "$env_choice" != "1" && "$env_choice" != "2" && "$env_choice" != "3" ]]; then
  env_choice=2
fi

case $env_choice in
  1)
    cp .env.production .env
    echo ".env set to Production mode."
    echo "Building and previewing production build..."
    npm run build && npm run preview
    ;;
  2)
    cp .env.development .env
    echo ".env set to Development mode (emulator/E2E)."
    echo "Unsetting COVERAGE environment variable..."
    unset COVERAGE
    echo "Starting development server with emulator environment..."
    npm run dev
    ;;
  3)
    cp .env.e2e .env
    echo ".env set to Coverage mode (emulator/E2E with coverage)."
    echo "Setting COVERAGE environment variable..."
    export COVERAGE=true
    echo "Starting development server with emulator and coverage enabled..."
    npm run dev
    ;;
  *)
    echo "Unknown mode: $env_choice. Use 1 for Production mode, 2 for Development mode, or 3 for Coverage mode."
    exit 1
    ;;
esac
