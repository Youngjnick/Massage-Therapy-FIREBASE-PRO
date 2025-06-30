#!/bin/zsh
# Kill all processes listening on common dev ports (macOS/zsh)
PORTS=(3000 4000 5000 8080 8081 8085 9000 9099 9150 4400 4500 5173)
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
