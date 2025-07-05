#!/bin/zsh
# Toggle between .env, .env.localprod, and .env.production
# Usage: ./toggle-env.sh [dev|localprod|production]

if [ $# -eq 0 ]; then
  echo "Usage: $0 [dev|localprod|production]"
  exit 1
fi

case $1 in
  dev)
    cp .env.development .env
    echo ".env set to development mode."
    ;;
  localprod)
    cp .env.localprod .env
    echo ".env set to local production mode."
    ;;
  production)
    cp .env.production .env
    echo ".env set to production mode."
    ;;
  *)
    echo "Unknown mode: $1. Use dev, localprod, or production."
    exit 1
    ;;
esac
