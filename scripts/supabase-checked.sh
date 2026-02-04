#!/usr/bin/env bash
# AI review runs by default when checks run; use --no-ai-review or SKIP_AI_REVIEW=1 to disable.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARGS=("$@")
ARGS_TEXT=" ${*:-} "
SUPABASE_ARGS=()
for arg in "${ARGS[@]}"; do
  case "$arg" in
    --no-ai-review|--with-frontend|--ai-review)
      ;;
    *)
      SUPABASE_ARGS+=("$arg")
      ;;
  esac
done

run_frontend=false
run_backend=false
run_ai_review=true

changed_files=""
if command -v git >/dev/null 2>&1; then
  unstaged=$(git diff --name-only --diff-filter=ACMR || true)
  staged=$(git diff --name-only --cached --diff-filter=ACMR || true)
  changed_files=$(printf "%s\n%s\n" "$unstaged" "$staged")
fi

if [[ -n "$changed_files" ]]; then
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if [[ "$file" == src/supabase/functions/* || "$file" == supabase/functions/* ]]; then
      run_backend=true
      continue
    fi
    case "$file" in
      src/*|index.html|vite.config.ts|package.json|package-lock.json|tsconfig.json|eslint.config.*|.prettierrc.*|prettier.config.*|vitest.config.*)
        run_frontend=true
        ;;
    esac
  done <<< "$changed_files"
fi

# If deploying functions, enforce backend checks even when git diff is clean.
if [[ "$ARGS_TEXT" == *" functions "* ]]; then
  run_backend=true
fi

# Allow explicit opt-in for frontend checks even if no src changes detected.
if [[ "$ARGS_TEXT" == *" --with-frontend "* ]]; then
  run_frontend=true
fi

# Opt-out for AI review: --no-ai-review or SKIP_AI_REVIEW=1 (or non-empty).
if [[ "$ARGS_TEXT" == *" --no-ai-review "* ]]; then
  run_ai_review=false
fi
if [[ -n "${SKIP_AI_REVIEW:-}" ]]; then
  run_ai_review=false
fi

if [[ "$run_frontend" = true ]] || [[ "$run_backend" = true ]]; then
  CHECK_ARGS=()
  [[ "$run_frontend" = true ]] && CHECK_ARGS+=(--frontend)
  [[ "$run_backend" = true ]] && CHECK_ARGS+=(--backend)
  [[ "$run_ai_review" = true ]] && CHECK_ARGS+=(--ai-review)
  bash "$ROOT_DIR/scripts/run-checks.sh" "${CHECK_ARGS[@]}"
fi

if [[ "${#SUPABASE_ARGS[@]}" -eq 0 ]]; then
  echo "No Supabase command provided. Usage: npm run supabase:checked -- <supabase args>"
  exit 1
fi

use_workdir=true
for arg in "${ARGS[@]}"; do
  case "$arg" in
    --workdir|--workdir=*)
      use_workdir=false
      ;;
  esac
  if [[ "$use_workdir" = false ]]; then
    break
  fi
done

REAL_BIN="${SUPABASE_REAL_BIN:-}"
if [[ -z "$REAL_BIN" ]] && [[ -f "$HOME/.supabase-real-bin" ]]; then
  REAL_BIN="$(cat "$HOME/.supabase-real-bin")"
fi

if [[ -z "$REAL_BIN" ]]; then
  REAL_BIN="$(command -v supabase || true)"
fi

# When invoked as project bin (npx supabase), command -v supabase may point to us → avoid recursion
if [[ -n "$REAL_BIN" ]] && { [[ "$REAL_BIN" == *"node_modules"* ]] || [[ "$REAL_BIN" == "$ROOT_DIR"* ]]; }; then
  REAL_BIN=""
fi

retry_max=${SUPABASE_RETRY_MAX:-1}
if [[ "$retry_max" =~ ^[0-9]+$ ]]; then
  retry_max=$retry_max
else
  retry_max=1
fi

retry_backoffs="${SUPABASE_RETRY_BACKOFF_SECONDS:-5,15}"
IFS=',' read -r -a retry_backoff_list <<< "$retry_backoffs"

retry_extra_args=()
if [[ -n "${SUPABASE_RETRY_EXTRA_ARGS:-}" ]]; then
  read -r -a retry_extra_args <<< "${SUPABASE_RETRY_EXTRA_ARGS}"
fi

run_supabase_cli() {
  local retry_mode="${1:-false}"
  local -a cmd_args=("${SUPABASE_ARGS[@]}")

  if [[ "$use_workdir" = true ]] && [[ -d "src/supabase/functions" ]]; then
    cmd_args=(--workdir src "${cmd_args[@]}")
  fi

  if [[ "$retry_mode" == "true" ]] && [[ "${#retry_extra_args[@]}" -gt 0 ]]; then
    cmd_args+=("${retry_extra_args[@]}")
  fi

  RUN_OUTPUT_FILE="$(mktemp)"
  set +e
  if [[ -z "$REAL_BIN" ]] || [[ ! -x "$REAL_BIN" ]]; then
    # Use npx so the real Supabase CLI from registry runs (no recursion when we are the local bin)
    npx --yes supabase "${cmd_args[@]}" 2>&1 | tee "$RUN_OUTPUT_FILE"
  else
    "$REAL_BIN" "${cmd_args[@]}" 2>&1 | tee "$RUN_OUTPUT_FILE"
  fi
  local rc=${PIPESTATUS[0]}
  set -e
  return $rc
}

is_network_error() {
  local file="$1"
  local pattern="(timed out|timeout|context deadline exceeded|connection (reset|refused|aborted|closed|lost)|network is unreachable|temporary failure in name resolution|no such host|tls handshake timeout|i/o timeout|EOF|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENETUNREACH|EAI_AGAIN|ENOTFOUND|dial tcp)"
  grep -E -i -q "$pattern" "$file"
}

attempt=1
max_attempts=$((retry_max + 1))
while true; do
  if [[ "$attempt" -gt 1 ]]; then
    echo "Supabase CLI retry stage ${attempt}/${max_attempts}..."
  fi

  if run_supabase_cli "$([[ "$attempt" -gt 1 ]] && echo true || echo false)"; then
    rm -f "$RUN_OUTPUT_FILE"
    break
  fi

  rc=$?
  if ! is_network_error "$RUN_OUTPUT_FILE"; then
    rm -f "$RUN_OUTPUT_FILE"
    exit $rc
  fi

  rm -f "$RUN_OUTPUT_FILE"

  if [[ "$attempt" -ge "$max_attempts" ]]; then
    echo "Supabase CLI failed after ${attempt} attempt(s) due to network error."
    exit $rc
  fi

  backoff_index=$((attempt - 1))
  if [[ "${#retry_backoff_list[@]}" -gt 0 ]]; then
    if [[ "$backoff_index" -ge "${#retry_backoff_list[@]}" ]]; then
      backoff_seconds="${retry_backoff_list[-1]}"
    else
      backoff_seconds="${retry_backoff_list[$backoff_index]}"
    fi
  else
    backoff_seconds=5
  fi

  if [[ ! "$backoff_seconds" =~ ^[0-9]+$ ]]; then
    backoff_seconds=5
  fi

  echo "Network error detected. Retrying in ${backoff_seconds}s with extended wait."
  sleep "$backoff_seconds"
  attempt=$((attempt + 1))
done

if [[ "$ARGS_TEXT" == *" functions "* ]] || [[ "$ARGS_TEXT" == *" db "* ]] || [[ "$ARGS_TEXT" == *" migration "* ]]; then
  bash "$ROOT_DIR/scripts/ping-edge-health.sh" "${ARGS[@]}" || true
  bash "$ROOT_DIR/scripts/fetch-edge-logs.sh" "${ARGS[@]}" || true
fi

if command -v git >/dev/null 2>&1; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
      ahead=$(git rev-list --count @{u}..HEAD)
      if [ "${ahead:-0}" -gt 0 ]; then
        echo "Pushing commits to remote..."
        git push
      else
        echo "No commits to push."
      fi
    else
      echo "No upstream configured; skipping git push."
    fi
  fi
fi
