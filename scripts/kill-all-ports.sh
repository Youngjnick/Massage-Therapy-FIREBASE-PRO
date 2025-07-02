#!/bin/zsh
# Kill all processes listening on common dev ports (macOS/zsh)
PORTS=(3000 4000 5000 8080 8081 8085 9000 9099 9150 4400 4500 5173)
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
echo "Done."
