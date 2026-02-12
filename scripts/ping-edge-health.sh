#!/usr/bin/env bash
# Ping the deployed Edge Function health endpoint after db push / functions deploy.
# Project ref: SUPABASE_PROJECT_REF env, or file supabase/project-ref or src/supabase/project-ref (one line).
# Function: detected from CLI args; if none found, defaults to "all" (all functions).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REF="${SUPABASE_PROJECT_REF:-}"
if [[ -z "$REF" ]] && [[ -f "$ROOT_DIR/supabase/project-ref" ]]; then
  REF="$(head -n1 "$ROOT_DIR/supabase/project-ref" | tr -d '\r\n' | tr -d ' ')";
fi
if [[ -z "$REF" ]] && [[ -f "$ROOT_DIR/src/supabase/project-ref" ]]; then
  REF="$(head -n1 "$ROOT_DIR/src/supabase/project-ref" | tr -d '\r\n' | tr -d ' ')";
fi

if [[ -z "$REF" ]]; then
  echo "Edge health: skipped (set SUPABASE_PROJECT_REF or create supabase/project-ref)"
  exit 0
fi

ARGS=("$@")
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

default_function="${SUPABASE_HEALTH_FUNCTION:-${SUPABASE_DEFAULT_FUNCTION:-}}"
if [[ -z "$function_name" ]]; then
  function_name="$default_function"
fi
if [[ -z "$function_name" ]]; then
  function_name="all"
fi

ping_one() {
  local name="$1"
  local base_url="https://${REF}.supabase.co/functions/v1/${name}"
  local urls=("${base_url}/health" "${base_url}/${name}/health")
  local code="000"
  for url in "${urls[@]}"; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 "$url" 2>/dev/null || echo "000")"
    if [[ "$code" == "200" ]]; then
      echo "Edge health: OK ($url)"
      return 0
    fi
  done
  echo "Edge health: HTTP $code (${urls[-1]})"
  return 1
}

if [[ "$function_name" == "all" ]]; then
  base_dir=""
  if [[ -d "$ROOT_DIR/src/supabase/functions" ]]; then
    base_dir="$ROOT_DIR/src/supabase/functions"
  elif [[ -d "$ROOT_DIR/supabase/functions" ]]; then
    base_dir="$ROOT_DIR/supabase/functions"
  fi

  if [[ -z "$base_dir" ]]; then
    echo "Edge health: skipped (no functions directory found)"
    exit 0
  fi

  found=false
  for dir in "$base_dir"/*; do
    [[ -d "$dir" ]] || continue
    if [[ -f "$dir/index.tsx" || -f "$dir/index.ts" ]]; then
      found=true
      fn="$(basename "$dir")"
      ping_one "$fn" || true
    fi
  done

  if [[ "$found" = false ]]; then
    echo "Edge health: skipped (no functions with index.ts/x found)"
  fi
  exit 0
fi

if [[ "$function_name" == --* ]]; then
  echo "Edge health: skipped (unable to detect function name)"
  exit 0
fi

ping_one "$function_name" || true
exit 0
