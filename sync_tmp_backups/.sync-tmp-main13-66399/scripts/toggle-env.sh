#!/bin/zsh
# Toggle between .env.production, .env.development, and .env.e2e
# Usage: ./scripts/toggle-env.sh [1|2]
# 1 = production, 2 = development (emulator/E2E)

if [ $# -eq 0 ]; then
  echo "Select environment:"
  echo "1) Production (build & preview)"
  echo "2) Development (dev server, emulator/E2E)"
  read "env_choice?Enter 1 or 2: "
else
  env_choice=$1
fi

case $env_choice in
  1)
    cp .env.production .env
    echo ".env set to production mode."
    echo "Building and previewing production build..."
    npm run build && npm run preview
    ;;
  2)
    cp .env.e2e .env
    echo ".env set to development (emulator/E2E) mode."
    echo "Starting development server with emulator environment..."
    npm run dev
    ;;
  *)
    echo "Unknown mode: $env_choice. Use 1 for production or 2 for development (emulator/E2E)."
    exit 1
    ;;
esac
