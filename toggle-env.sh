#!/bin/zsh
# toggle-env.sh: Switch between production, localprod, and development (emulator) envs for Vite
# Usage: ./toggle-env.sh [production|localprod|development]

set -e

MODE="$1"
if [[ -z "$MODE" ]]; then
  echo "Usage: $0 [production|localprod|development]"
  exit 1
fi

case "$MODE" in
  production)
    cp .env.production .env
    echo "Switched to production environment (.env.production -> .env)"
    ;;
  localprod)
    cp .env.localprod .env
    echo "Switched to local production environment (.env.localprod -> .env)"
    ;;
  development)
    cp .env.development .env
    echo "Switched to development environment with emulators (.env.development -> .env)"
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: $0 [production|localprod|development]"
    exit 1
    ;;
esac
