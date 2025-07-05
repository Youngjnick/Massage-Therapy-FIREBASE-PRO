#!/bin/zsh
# toggle-env.sh: Switch between production and development (emulator) envs for Vite
# Usage: ./toggle-env.sh [production|development]

set -e

MODE="$1"

if [[ -z "$MODE" ]]; then
  echo "Select environment to switch to:"
  select opt in "production" "development"; do
    case $opt in
      production|development)
        MODE="$opt"
        break
        ;;
      *)
        echo "Invalid option. Please select 1 or 2."
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
  development)
    cp .env.development .env
    echo "Switched to development environment with emulators (.env.development -> .env)"
    echo "Current .env contents:" && cat .env
    echo "To start the development server, run: npm run dev"
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [production|development]"
    exit 1
    ;;
esac
