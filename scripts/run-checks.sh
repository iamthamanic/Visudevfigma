#!/usr/bin/env bash
# Shared checks for pre-push (GitHub) and supabase-checked (Supabase deploy).
# Usage: run-checks.sh [--frontend] [--backend] [--no-ai-review] [--ai-review] [--chunk=src|supabase|scripts]
#   With no args: run frontend and backend checks (same as --frontend --backend).
#   With args: run only the requested checks.
#   AI review runs by default after frontend/backend checks; use --no-ai-review to disable (or SKIP_AI_REVIEW=1).
#   --chunk: bei full-Codebase-Review nur diesen Chunk prüfen (schnellere Iteration auf 95%). Setzt CHECK_MODE=full.
# If a check fails, only that check is skipped (recorded); all following checks still run. Hook fails at the end only if a required check failed.
# Required (fail hook if any fails): format, lint, typecheck, test, rules, build, npm audit, backend checks.
# Optional (run but don't fail hook): Snyk only. AI review is required when run_ai_review=true.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_frontend=false
run_backend=false
run_ai_review=true
ai_review_chunk=""

if [[ $# -eq 0 ]]; then
  run_frontend=true
  run_backend=true
else
  for arg in "$@"; do
    case "$arg" in
      --frontend) run_frontend=true ;;
      --backend) run_backend=true ;;
      --ai-review) run_ai_review=true ;;
      --no-ai-review) run_ai_review=false ;;
      --chunk=*)
        ai_review_chunk="${arg#--chunk=}"
        if [[ "$ai_review_chunk" != "src" && "$ai_review_chunk" != "supabase" && "$ai_review_chunk" != "scripts" ]]; then
          echo "Invalid --chunk=$ai_review_chunk. Use src, supabase, or scripts." >&2
          exit 1
        fi
        run_ai_review=true
        ;;
      *)
        echo "Unknown option: $arg. Use --frontend, --backend, --no-ai-review, --ai-review, or --chunk=src|supabase|scripts." >&2
        exit 1
        ;;
    esac
  done
fi

# Opt-out via env: SKIP_AI_REVIEW=1 disables AI review
[[ -n "${SKIP_AI_REVIEW:-}" ]] && run_ai_review=false

# Bei nur --chunk=X: trotzdem Frontend+Backend laufen lassen, damit AI-Review (ein Chunk) ausgeführt wird
[[ -n "$ai_review_chunk" ]] && [[ "$run_frontend" = false ]] && [[ "$run_backend" = false ]] && run_frontend=true && run_backend=true

# Required checks that failed (hook will exit 1 at end). Optional checks (Snyk, AI review) are not added here.
REQUIRED_FAILED=()

run_required() {
  local name="$1"
  shift
  if ! "$@" 2>&1; then
    REQUIRED_FAILED+=("$name")
    echo "[FAILED] $name (weiter mit nächstem Check)" >&2
    return 1
  fi
  return 0
}

run_optional() {
  local name="$1"
  shift
  if ! "$@" 2>&1; then
    echo "[SKIPPED] $name fehlgeschlagen – weitere Checks laufen weiter." >&2
    return 1
  fi
  return 0
}

if [[ "$run_frontend" = true ]]; then
  echo "Running frontend checks..."
  run_required "format:check" npm run format:check
  run_required "lint" npm run lint
  run_required "typecheck" npm run typecheck
  run_required "test:run" npm run test:run
  run_required "rules:check" npm run rules:check
  echo "Running frontend security (npm audit)..."
  run_required "npm audit" npm audit --audit-level=high

  if [[ -z "${SKIP_SNYK:-}" ]]; then
    if command -v snyk >/dev/null 2>&1; then
      echo "Running Snyk (dependency scan)..."
      run_optional "Snyk" snyk test
    elif npm exec --yes snyk -- --version >/dev/null 2>&1; then
      echo "Running Snyk (dependency scan)..."
      run_optional "Snyk" npx snyk test
    else
      echo "Skipping Snyk: not installed (optional; set SKIP_SNYK=1 to suppress)." >&2
    fi
  fi
fi

echo "Running frontend build (always)..."
run_required "build" npm run build

if [[ "$run_backend" = true ]]; then
  echo "Running Supabase edge function checks..."
  backend_dirs=()
  if [[ -d "src/supabase/functions" ]]; then
    backend_dirs+=("src/supabase/functions")
  fi
  if [[ -d "supabase/functions" ]]; then
    backend_dirs+=("supabase/functions")
  fi
  if [[ ${#backend_dirs[@]} -eq 0 ]]; then
    echo "Skipping backend checks: no functions directory found."
  else
    run_required "deno fmt" deno fmt --check "${backend_dirs[@]}"
    run_required "deno lint" deno lint "${backend_dirs[@]}"
    echo "Running backend security (deno audit)..."
    if [[ -d "src/supabase/functions/server" ]]; then
      run_required "deno audit" bash -c 'cd src/supabase/functions/server && deno audit'
    elif [[ -d "supabase/functions/server" ]]; then
      run_required "deno audit" bash -c 'cd supabase/functions/server && deno audit'
    else
      echo "Skipping deno audit: server function not found."
    fi
  fi
fi

if [[ "$run_ai_review" = true ]] && { [[ "$run_frontend" = true ]] || [[ "$run_backend" = true ]]; }; then
  echo "Running AI code review..."
  export CHECK_MODE=full
  [[ -n "$ai_review_chunk" ]] && export AI_REVIEW_CHUNK="$ai_review_chunk"
  run_required "AI review" bash "$ROOT_DIR/scripts/ai-code-review.sh"
fi

if [[ ${#REQUIRED_FAILED[@]} -gt 0 ]]; then
  echo "" >&2
  echo "Erforderliche Checks fehlgeschlagen: ${REQUIRED_FAILED[*]}" >&2
  exit 1
fi
echo "All checks passed."
exit 0