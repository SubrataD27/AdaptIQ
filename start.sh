#!/usr/bin/env bash
# AdaptIQ — one-command dev startup.
# Creates the backend venv if missing, installs/syncs dependencies for both
# sides, starts both servers (skipping any already running), and opens the
# app in your default browser.
#
# Usage (Git Bash / any bash on Windows): bash start.sh

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT=8000
FRONTEND_PORT=5173

port_in_use() {
  netstat -ano 2>/dev/null | grep -q ":$1 .*LISTENING"
}

echo "== AdaptIQ dev startup =="

command -v python >/dev/null 2>&1 || { echo "python not found on PATH"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm not found on PATH"; exit 1; }

# --- Backend: venv + deps ---
if [ ! -d "$BACKEND_DIR/venv" ]; then
  echo "[backend] no venv found, creating one..."
  python -m venv "$BACKEND_DIR/venv"
fi

echo "[backend] syncing dependencies..."
"$BACKEND_DIR/venv/Scripts/pip.exe" install -q -r "$BACKEND_DIR/requirements.txt"

if port_in_use "$BACKEND_PORT"; then
  echo "[backend] already running on :$BACKEND_PORT, leaving it alone"
else
  echo "[backend] starting on :$BACKEND_PORT..."
  (cd "$BACKEND_DIR" && "./venv/Scripts/python.exe" -m uvicorn app.main:app --port "$BACKEND_PORT" > uvicorn.log 2>&1 &)
fi

# --- Frontend: deps ---
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "[frontend] no node_modules found, running npm install (first run, can take a minute)..."
  (cd "$FRONTEND_DIR" && npm install)
fi

if port_in_use "$FRONTEND_PORT"; then
  echo "[frontend] already running on :$FRONTEND_PORT, leaving it alone"
else
  echo "[frontend] starting on :$FRONTEND_PORT..."
  (cd "$FRONTEND_DIR" && npm run dev > vite.log 2>&1 &)
fi

# --- Wait for the frontend to actually answer, then open it ---
echo "[wait] waiting for the app to come up..."
ready=false
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$FRONTEND_PORT"; then
    ready=true
    break
  fi
  sleep 1
done

if [ "$ready" = false ]; then
  echo "[wait] frontend didn't answer in time — check frontend/vite.log"
  exit 1
fi

echo "[open] launching the app in your browser..."
cmd.exe /c start "" "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1 || true

echo "== Ready =="
echo "Backend:  http://localhost:$BACKEND_PORT  (API docs at /docs)"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Logs:     backend/uvicorn.log, frontend/vite.log"
