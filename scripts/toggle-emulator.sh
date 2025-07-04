#!/bin/zsh
# Toggle Firestore and Auth emulator usage in .env
ENV_FILE=".env"

# Toggle Firestore and Auth emulators together
if grep -q '^VITE_FIRESTORE_EMULATOR_HOST=localhost:8080' "$ENV_FILE" && grep -q '^VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099' "$ENV_FILE"; then
  # Disable both emulators
  sed -i '' 's/^VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/# VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/' "$ENV_FILE"
  sed -i '' 's/^VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/# VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/' "$ENV_FILE"
  echo "Firestore and Auth emulators disabled (using production) in $ENV_FILE."
else
  # Enable both emulators
  sed -i '' 's/^# VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/' "$ENV_FILE"
  sed -i '' 's/^# VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/' "$ENV_FILE"
  echo "Firestore and Auth emulators enabled in $ENV_FILE."
fi
