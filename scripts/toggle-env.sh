#!/bin/zsh
# Toggle between .env.production and .env.development
# Usage: ./scripts/toggle-env.sh [1|2]
# 1 = production, 2 = development

if [ $# -eq 0 ]; then
  echo "Select environment:"
  echo "1) Production (build & preview)"
  echo "2) Development (dev server)"
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
    cp .env.development .env
    echo ".env set to development mode."
    echo "Starting development server..."
    npm run dev
    ;;
  *)
    echo "Unknown mode: $env_choice. Use 1 for production or 2 for development."
    exit 1
    ;;
esac
