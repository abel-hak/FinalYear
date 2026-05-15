#!/bin/sh
set -e

: "Waiting for backend at ${SERVER_HEALTH_URL}"

# Try for a limited time to avoid infinite loops in CI; adjust as needed
TIMEOUT=${WAIT_TIMEOUT:-300}
COUNT=0
INTERVAL=1
while [ $COUNT -lt $TIMEOUT ]; do
  if curl -fsS "$SERVER_HEALTH_URL" >/dev/null 2>&1; then
    echo "Backend healthy, starting nginx..."
    exec nginx -g 'daemon off;'
  fi
  COUNT=$((COUNT + INTERVAL))
  sleep $INTERVAL
done

echo "Timed out waiting for backend after ${TIMEOUT}s" >&2
exit 1
