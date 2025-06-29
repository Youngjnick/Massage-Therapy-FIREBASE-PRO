#!/bin/zsh
# Start Firebase emulators with persistent data

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

# Start emulators with import flags and export on exit
firebase emulators:start $FIRESTORE_IMPORT $AUTH_IMPORT --export-on-exit --project massage-therapy-smart-st-c7f8f
