#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Run checks before Supabase. If they fail, auto-fix (format, deno fmt) and retry once (see AGENTS.md).
run_checks() { npm run checks; }
if ! run_checks; then
  echo "" >&2
  echo "Checks failed. Attempting auto-fix (format + deno fmt) and retrying once..." >&2
  npm run format 2>/dev/null || true
  if [ -d "src/supabase/functions" ]; then
    command -v deno >/dev/null 2>&1 && deno fmt src/supabase/functions 2>/dev/null || true
  fi
  if ! run_checks; then
    echo "Checks still failing after auto-fix. Fix the issues above and try again." >&2
    exit 1
  fi
  echo "Checks passed after auto-fix." >&2
fi

REAL_BIN="${SUPABASE_REAL_BIN:-}"
if [ -z "$REAL_BIN" ] && [ -f "$HOME/.supabase-real-bin" ]; then
  REAL_BIN="$(cat "$HOME/.supabase-real-bin")"
fi
if [ -z "$REAL_BIN" ] || [ ! -x "$REAL_BIN" ]; then
  for candidate in /opt/homebrew/bin/supabase /usr/local/bin/supabase "$(brew --prefix supabase 2>/dev/null)/bin/supabase"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      REAL_BIN="$candidate"
      break
    fi
  done
fi
if [ -z "$REAL_BIN" ] || [ ! -x "$REAL_BIN" ]; then
  echo "Supabase binary not found. Set SUPABASE_REAL_BIN or ~/.supabase-real-bin, or install: brew install supabase/tap/supabase" >&2
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
