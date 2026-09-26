#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
if [ "${LIMEN_FOREGROUND:-0}" = "1" ]; then
  exec npm run dev
fi
nohup npm run dev >>"${TMPDIR:-/tmp}/limen-app-startup.log" 2>&1 </dev/null &
