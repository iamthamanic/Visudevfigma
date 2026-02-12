#!/usr/bin/env bash
# Fetch recent Edge Function logs after functions deploy (optional).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=("$@")
ARGS_TEXT=" ${*:-} "

# Only fetch logs when we just deployed functions
if [[ "$ARGS_TEXT" != *" functions "* ]]; then
  exit 0
fi

# Resolve real Supabase CLI (same as supabase-checked.sh)
REAL_BIN="${SUPABASE_REAL_BIN:-}"
if [[ -z "$REAL_BIN" ]] && [[ -f "$HOME/.supabase-real-bin" ]]; then
  REAL_BIN="$(cat "$HOME/.supabase-real-bin")"
fi
if [[ -z "$REAL_BIN" ]]; then
  REAL_BIN="$(command -v supabase || true)"
fi
if [[ -n "$REAL_BIN" ]] && { [[ "$REAL_BIN" == *"node_modules"* ]] || [[ "$REAL_BIN" == "$ROOT_DIR"* ]]; }; then
  REAL_BIN=""
fi

function_name=""
for i in "${!ARGS[@]}"; do
  if [[ "${ARGS[$i]}" == "functions" ]]; then
    sub="${ARGS[$((i + 1))]:-}"
    start_index=$((i + 1))
    case "$sub" in
      deploy|logs|delete|invoke|serve|new|list)
        start_index=$((i + 2))
        ;;
    esac

    for ((j=start_index; j<${#ARGS[@]}; j++)); do
      val="${ARGS[$j]}"
      if [[ "$val" == "--all" || "$val" == "all" ]]; then
        function_name="all"
        break 2
      fi
      if [[ "$val" == --* ]]; then
        continue
      fi
      function_name="$val"
      break 2
    done
  fi
done

default_function="${SUPABASE_LOG_FUNCTION:-${SUPABASE_DEFAULT_FUNCTION:-}}"
if [[ -z "$function_name" ]]; then
  function_name="$default_function"
fi
if [[ -z "$function_name" ]]; then
  function_name="all"
fi

workdir_args=()
if [[ -d "src/supabase/functions" ]]; then
  workdir_args=(--workdir src)
fi

run_logs() {
  local name="$1"
  echo "Edge logs (${name}):"
  if [[ -n "$REAL_BIN" ]] && [[ -x "$REAL_BIN" ]]; then
    "$REAL_BIN" "${workdir_args[@]}" functions logs "$name" --limit 30 2>/dev/null || true
  else
    npx --yes supabase "${workdir_args[@]}" functions logs "$name" --limit 30 2>/dev/null || true
  fi
}

if [[ "$function_name" == "all" ]]; then
  base_dir=""
  if [[ -d "$ROOT_DIR/src/supabase/functions" ]]; then
    base_dir="$ROOT_DIR/src/supabase/functions"
  elif [[ -d "$ROOT_DIR/supabase/functions" ]]; then
    base_dir="$ROOT_DIR/supabase/functions"
  fi

  if [[ -z "$base_dir" ]]; then
    echo "Edge logs: skipped (no functions directory found)." >&2
    exit 0
  fi

  found=false
  for dir in "$base_dir"/*; do
    [[ -d "$dir" ]] || continue
    if [[ -f "$dir/index.tsx" || -f "$dir/index.ts" ]]; then
      found=true
      fn="$(basename "$dir")"
      run_logs "$fn"
    fi
  done

  if [[ "$found" = false ]]; then
    echo "Edge logs: skipped (no functions with index.ts/x found)." >&2
  fi
  exit 0
fi

if [[ "$function_name" == --* ]]; then
  echo "Edge logs: skipped (unable to detect function name)." >&2
  exit 0
fi
run_logs "$function_name"
exit 0
