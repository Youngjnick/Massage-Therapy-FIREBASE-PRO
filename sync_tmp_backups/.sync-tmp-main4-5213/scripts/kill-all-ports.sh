#!/bin/zsh
# Kill all processes listening on common dev ports (macOS/zsh)

# Remove Firebase emulator hub/lock files (prevents multiple instance warning)
echo "Removing .firebase/ directory (emulator hub state)..."
rm -rf .firebase/

PORTS=(3000 4000 5000 8080 8081 8085 9000 9099 9150 4400 4500 5173 4173)

# Also kill any node processes running the Firebase emulator suite (extra safety)
echo "Killing any Firebase emulator processes (node with 'emulator' in command)..."
for PID in $(ps aux | grep '[n]ode' | grep 'emulator' | awk '{print $2}'); do
  echo "Killing emulator process PID $PID..."
  kill -9 $PID
done

# Also kill any Firestore emulator Java processes (extra safety)
echo "Killing any Firestore emulator Java processes..."
for PID in $(ps aux | grep '[j]ava' | grep 'cloud-firestore-emulator' | awk '{print $2}'); do
  echo "Killing Firestore emulator Java process PID $PID..."
  kill -9 $PID
done

for PORT in $PORTS; do
  PIDS=$(lsof -ti tcp:$PORT)
  if [ -n "$PIDS" ]; then
    echo "Killing processes on port $PORT..."
    for PID in ${(f)PIDS}; do
      kill -9 $PID
    done
  fi
done

# Show remaining emulator processes and open ports for debugging
echo "Remaining emulator-related processes:"
ps aux | grep -E 'firebase|emulator|java' | grep -v grep
echo "Open emulator ports:"
lsof -i :8080 -i :9099 -i :4000 -i :4400 -i :4500 -i :9150

echo "Done."
