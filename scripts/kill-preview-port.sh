#!/usr/bin/env bash
# Beendet alle Prozesse auf Port 3005 (Vite) und 4000 (Preview-Runner).
# Wird vor jedem "npm run dev" ausgeführt – so starten immer die richtigen Prozesse.
set -e
for port in 3005 4000; do
  pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Stoppe Prozess(e) auf Port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
# Kurz warten, bis die Ports frei sind
for i in 1 2 3 4 5 6 7 8 9 10; do
  if ! lsof -ti :3005 >/dev/null 2>&1 && ! lsof -ti :4000 >/dev/null 2>&1; then
    exit 0
  fi
  sleep 0.5
done
echo "Warnung: Port(s) nach 5s noch belegt. Starte trotzdem." >&2
exit 0
