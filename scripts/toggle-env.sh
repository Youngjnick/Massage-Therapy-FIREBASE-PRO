#!/bin/zsh
# toggle-env.sh: Switch between production, localprod, and development (emulator) envs for Vite
# Usage: ./toggle-env.sh [production|localprod|development]

set -e

MODE="$1"

if [[ -z "$MODE" ]]; then
  echo "Select environment to switch to:"
  select opt in "production" "localprod" "development"; do
    case $opt in
      production|localprod|development)
        MODE="$opt"
        break
        ;;
      *)
        echo "Invalid option. Please select 1, 2, or 3."
        ;;
    esac
  done
fi

case "$MODE" in
  production)
    cp .env.production .env
    echo "Switched to production environment (.env.production -> .env)"
    echo "Current .env contents:" && cat .env
    echo "Building production build..."
    npm run build
    echo "To preview production build, run: npx vite preview"
    ;;
  localprod)
    cp .env.localprod .env
    echo "Switched to local production environment (.env.localprod -> .env)"
    echo "Current .env contents:" && cat .env
    ;;
  development)
    cp .env.development .env
    echo "Switched to development environment with emulators (.env.development -> .env)"
    echo "Current .env contents:" && cat .env
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [production|localprod|development]"
    exit 1
    ;;
esac
