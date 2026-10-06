#!/usr/bin/env bash
# AdaptIQ — one-command demo startup. Works from a fresh clone.
#
#   ./start.sh        (Git Bash on Windows, macOS, Linux, WSL)
#
# Every run:
#   1. picks a supported Python (3.10-3.13) and creates backend/venv if missing
#   2. installs backend deps (requirements.txt) and frontend deps (if needed),
#      and builds the Next.js frontend when its sources changed
#   3. stops any AdaptIQ servers already on :8000 / :5173
#   4. DELETES backend/adaptiq.db and reseeds it (question bank + demo class),
#      so the demo always starts from the same known state
#   5. starts backend + frontend, waits until both answer, opens the browser
# Press Ctrl+C to stop both servers.

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT=8000
FRONTEND_PORT=5173

case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*) IS_WINDOWS=true ;;
  *) IS_WINDOWS=false ;;
esac

say() { echo "[$1] $2"; }
die() { echo "ERROR: $*" >&2; exit 1; }

# --- Pick a Python the pinned requirements support (3.10-3.13) ---
supported_python() {
  "$@" -c 'import sys; sys.exit(0 if (3, 10) <= sys.version_info[:2] <= (3, 13) else 1)' >/dev/null 2>&1
}

find_python() {
  local candidates=()
  if command -v py >/dev/null 2>&1; then
    candidates+=("py -3.12" "py -3.13" "py -3.11" "py -3.10")
  fi
  candidates+=("python3.12" "python3.13" "python3.11" "python3.10" "python3" "python")
  for c in "${candidates[@]}"; do
    # shellcheck disable=SC2086
    if command -v ${c%% *} >/dev/null 2>&1 && supported_python $c; then
      echo "$c"; return 0
    fi
  done
  return 1
}

venv_python() {
  if [ -x "$BACKEND_DIR/venv/Scripts/python.exe" ]; then
    echo "$BACKEND_DIR/venv/Scripts/python.exe"
  else
    echo "$BACKEND_DIR/venv/bin/python"
  fi
}

# --- Port helpers ---
pids_on_port() {
  if [ "$IS_WINDOWS" = true ]; then
    netstat -ano 2>/dev/null | awk -v p=":$1" '$2 ~ p"$" && $4 == "LISTENING" {print $5}' | sort -u
  elif command -v lsof >/dev/null 2>&1; then
    lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null || true
  fi
}

free_port() {
  local pids
  pids="$(pids_on_port "$1")"
  [ -z "$pids" ] && return 0
  say stop "something is already on :$1 (pid $pids), stopping it for a clean demo start"
  for pid in $pids; do
    if [ "$IS_WINDOWS" = true ]; then
      taskkill //F //PID "$pid" >/dev/null 2>&1 || true
    else
      kill "$pid" 2>/dev/null || true
    fi
  done
  sleep 1
}

wait_for() {
  local url="$1" name="$2" log="$3"
  for _ in $(seq 1 60); do
    if curl -s -m 3 -o /dev/null "$url"; then return 0; fi
    sleep 1
  done
  die "$name didn't come up within 60s — check $log"
}

echo "== AdaptIQ demo startup =="

command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node.js 20 LTS or newer from https://nodejs.org"
command -v npm >/dev/null 2>&1 || die "npm not found. Install Node.js 20 LTS or newer from https://nodejs.org"
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)'   || die "Node.js $(node --version) is too old — the Next.js frontend needs 20.9+. Install the LTS from https://nodejs.org"
command -v curl >/dev/null 2>&1 || die "curl not found."

# --- 1. Backend venv + deps ---
if [ ! -x "$(venv_python)" ]; then
  PY="$(find_python)" || die "Python 3.10-3.13 not found (3.14+ is not supported by the pinned packages). Install Python 3.12 from https://www.python.org/downloads/ and re-run."
  say backend "creating venv with: $PY"
  # shellcheck disable=SC2086
  $PY -m venv "$BACKEND_DIR/venv"
fi
VPY="$(venv_python)"
supported_python "$VPY" || die "backend/venv uses an unsupported Python ($("$VPY" --version 2>&1)). Delete backend/venv and re-run."

say backend "installing dependencies ($("$VPY" --version 2>&1))..."
"$VPY" -m pip install -q --disable-pip-version-check -r "$BACKEND_DIR/requirements.txt"

# --- 2. Frontend deps ---
if [ ! -d "$FRONTEND_DIR/node_modules" ] || [ "$FRONTEND_DIR/package-lock.json" -nt "$FRONTEND_DIR/node_modules/.package-lock.json" ]; then
  say frontend "running npm install (first run can take a minute)..."
  (cd "$FRONTEND_DIR" && npm install --no-audit --no-fund)
fi

# Production build: much faster page loads than dev mode, so the demo feels instant.
# Rebuilt only when frontend sources changed since the last build.
if [ ! -f "$FRONTEND_DIR/.next/BUILD_ID" ] || [ -n "$(cd "$FRONTEND_DIR" && find src next.config.mjs package-lock.json -newer .next/BUILD_ID 2>/dev/null | head -1)" ]; then
  say frontend "building the Next.js app (about a minute on first run)..."
  (cd "$FRONTEND_DIR" && NEXT_TELEMETRY_DISABLED=1 node node_modules/next/dist/bin/next build > build.log 2>&1)     || die "frontend build failed — see frontend/build.log"
fi

# --- 3. Stop old servers (the backend holds the DB file open) ---
free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

# --- 4. Fresh demo database ---
say db "resetting adaptiq.db and seeding demo data..."
rm -f "$BACKEND_DIR/adaptiq.db"
(cd "$BACKEND_DIR" && "$VPY" -m app.demo_data)

# --- 5. Start servers ---
say backend "starting on :$BACKEND_PORT (log: backend/uvicorn.log)"
(cd "$BACKEND_DIR" && exec "$VPY" -m uvicorn app.main:app --port "$BACKEND_PORT" > uvicorn.log 2>&1) &
BACKEND_PID=$!

say frontend "starting on :$FRONTEND_PORT (log: frontend/next.log)"
(cd "$FRONTEND_DIR" && NEXT_TELEMETRY_DISABLED=1 exec node node_modules/next/dist/bin/next start -p "$FRONTEND_PORT" > next.log 2>&1) &
FRONTEND_PID=$!

cleanup() {
  echo
  say stop "shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  free_port "$BACKEND_PORT" >/dev/null
  free_port "$FRONTEND_PORT" >/dev/null
  exit 0
}
trap cleanup INT TERM

wait_for "http://localhost:$BACKEND_PORT/" "Backend" "backend/uvicorn.log"
wait_for "http://localhost:$FRONTEND_PORT/" "Frontend" "frontend/next.log"

APP_URL="http://localhost:$FRONTEND_PORT"
if [ -n "$ADAPTIQ_NO_BROWSER" ]; then
  :
elif [ "$IS_WINDOWS" = true ]; then
  # Not "cmd.exe /c start": Git Bash rewrites "/c" into a path and cmd then
  # sits as an interactive shell, blocking the script. explorer.exe hands the
  # URL to the default browser and returns immediately.
  explorer.exe "$APP_URL" </dev/null >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open "$APP_URL" </dev/null >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$APP_URL" </dev/null >/dev/null 2>&1 &
fi

cat <<EOF

== Ready ==
App:      $APP_URL
API docs: http://localhost:$BACKEND_PORT/docs

Demo logins (password for all: Demo1234!)
  Teacher:  demo.teacher@adaptiq.test
  Students: ananya.demo@adaptiq.test, rohit.demo@adaptiq.test, meera.demo@adaptiq.test

Press Ctrl+C to stop both servers.
EOF

wait
