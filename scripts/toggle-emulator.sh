#!/bin/zsh
# Toggle Firestore and Auth emulator usage in .env
ENV_FILE=".env"
ENV_E2E_FILE=".env.e2e"

# If .env.e2e exists and user wants to fully enable emulator, copy it over
if [[ "$1" == "full" ]]; then
  if [[ -f "$ENV_E2E_FILE" ]]; then
    cp "$ENV_E2E_FILE" "$ENV_FILE"
    echo ".env.e2e copied to .env (full emulator environment enabled)."
    exit 0
  else
    echo ".env.e2e not found. Cannot enable full emulator environment."
    exit 1
  fi
fi

# Toggle Firestore and Auth emulators together (comment/uncomment lines)
if grep -q '^VITE_FIRESTORE_EMULATOR_HOST=localhost:8080' "$ENV_FILE" && grep -q '^VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099' "$ENV_FILE" && grep -q '^VITE_USE_FIREBASE_EMULATOR=true' "$ENV_FILE"; then
  # Disable all emulators
  sed -i '' 's/^VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/# VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/' "$ENV_FILE"
  sed -i '' 's/^VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/# VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/' "$ENV_FILE"
  sed -i '' 's/^VITE_USE_FIREBASE_EMULATOR=true/# VITE_USE_FIREBASE_EMULATOR=true/' "$ENV_FILE"
  echo "Firestore, Auth, and VITE_USE_FIREBASE_EMULATOR disabled (using production) in $ENV_FILE."
else
  # Enable all emulators
  sed -i '' 's/^# VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/VITE_FIRESTORE_EMULATOR_HOST=localhost:8080/' "$ENV_FILE"
  sed -i '' 's/^# VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/VITE_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099/' "$ENV_FILE"
  if grep -q '^# VITE_USE_FIREBASE_EMULATOR=true' "$ENV_FILE"; then
    sed -i '' 's/^# VITE_USE_FIREBASE_EMULATOR=true/VITE_USE_FIREBASE_EMULATOR=true/' "$ENV_FILE"
  elif ! grep -q '^VITE_USE_FIREBASE_EMULATOR=true' "$ENV_FILE"; then
    echo 'VITE_USE_FIREBASE_EMULATOR=true' >> "$ENV_FILE"
  fi
  echo "Firestore, Auth, and VITE_USE_FIREBASE_EMULATOR enabled in $ENV_FILE."
fi
