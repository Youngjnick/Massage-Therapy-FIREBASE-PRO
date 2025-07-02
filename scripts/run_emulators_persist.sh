#!/bin/zsh
# Start Firebase emulators with persistent data

# Always clean up any old emulators and ports first
./scripts/kill-all-ports.sh
sleep 2  # Give OS time to release ports and delete lock files

# Set the data import/export directories
FIRESTORE_EXPORT_DIR="emulator-data/firestore_export"
AUTH_EXPORT_DIR="emulator-data/auth_export"

# Import Firestore data if export exists
if [ -d "$FIRESTORE_EXPORT_DIR" ]; then
  FIRESTORE_IMPORT="--import=$FIRESTORE_EXPORT_DIR"
else
  FIRESTORE_IMPORT=""
fi

# Import Auth data if export exists
if [ -d "$AUTH_EXPORT_DIR" ]; then
  AUTH_IMPORT="--import=$AUTH_EXPORT_DIR"
else
  AUTH_IMPORT=""
fi

# Set environment variables for emulator clients
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export GCLOUD_PROJECT="massage-therapy-smart-st-c7f8f"
export FIREBASE_PROJECT_ID="massage-therapy-smart-st-c7f8f"
echo "Using FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID and GCLOUD_PROJECT=$GCLOUD_PROJECT"

# Start emulators with import flags and export on exit
firebase emulators:start $FIRESTORE_IMPORT $AUTH_IMPORT --export-on-exit --project massage-therapy-smart-st-c7f8f

