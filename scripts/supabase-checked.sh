#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

npm run checks

REAL_BIN="${SUPABASE_REAL_BIN:-}"
if [ -z "$REAL_BIN" ] && [ -f "$HOME/.supabase-real-bin" ]; then
  REAL_BIN="$(cat "$HOME/.supabase-real-bin")"
fi

if [ -z "$REAL_BIN" ] || [ ! -x "$REAL_BIN" ]; then
  echo "Supabase binary not found. Set SUPABASE_REAL_BIN or ~/.supabase-real-bin." >&2
  exit 1
fi

use_workdir=true
for arg in "$@"; do
  case "$arg" in
    --workdir|--workdir=*)
      use_workdir=false
      ;;
  esac
  if [ "$use_workdir" = false ]; then
    break
  fi
done

if [ "$use_workdir" = true ] && [ -d "src/supabase/functions" ]; then
  exec "$REAL_BIN" --workdir src "$@"
fi

exec "$REAL_BIN" "$@"
