#!/usr/bin/env bash
# Shared checks for pre-push (GitHub) and supabase-checked (Supabase deploy).
# Usage: run-checks.sh [--frontend] [--backend] [--no-ai-review] [--ai-review] [--chunk=src|supabase|scripts] [--until-95] [--refactor]
#   With no args: run frontend and backend checks (same as --frontend --backend).
#   AI review runs by default unless SKIP_AI_REVIEW=1 (pre-push sets this so push does not time out).
#   --chunk: bei full-Codebase-Review nur diesen Chunk prüfen. Setzt CHECK_MODE=full.
#   --until-95: Full-Modus mit Loop — alle Chunks bis ≥95%. Nach Fehlschlag: Fix, commit, Enter zum Retry. Kein --chunk.
#   --refactor: Refactor-Modus (wie --until-95). Alle Probleme identifizieren → fixen → committen → Loop bis alle Chunks ≥95%.
#               Bei Erfolg: Hinweis „git push“, danach erneut alle Checks laufen lassen; schlagen sie fehl, Spiel von vorne (fix, commit, push, checks).
# Pre-push runs only fast checks (no AI review). Use refactor mode to reach 95%, then push; run full checks again after push.
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
REVIEWS_DIR="$ROOT_DIR/.shimwrapper/reviews"

run_frontend=false
run_backend=false
run_ai_review=true
ai_review_chunk=""
until_95=false
refactor_mode=false

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
      --until-95) until_95=true ;;
      --refactor) until_95=true; refactor_mode=true ;;
      --chunk=*)
        ai_review_chunk="${arg#--chunk=}"
        if [[ "$ai_review_chunk" != "src" && "$ai_review_chunk" != "supabase" && "$ai_review_chunk" != "scripts" ]]; then
          echo "Invalid --chunk=$ai_review_chunk. Use src, supabase, or scripts." >&2
          exit 1
        fi
        run_ai_review=true
        ;;
      *)
        echo "Unknown option: $arg. Use --frontend, --backend, --no-ai-review, --ai-review, --chunk=..., --until-95, or --refactor." >&2
        exit 1
        ;;
    esac
  done
fi

# --until-95 / --refactor: Loop bis alle Chunks ≥95% (Full-Modus, alle Chunks; kein --chunk)
if [[ "$until_95" = true ]]; then
  if [[ -n "$ai_review_chunk" ]]; then
    echo "Invalid: --until-95/--refactor and --chunk cannot be used together. Use full codebase (all chunks)." >&2
    exit 1
  fi
  export CHECK_MODE=full
  export GIT_CMD="${GIT_CMD:-/usr/bin/git}"
  mkdir -p "$REVIEWS_DIR"
  if [[ "$refactor_mode" = true ]]; then
    echo "========== Refactor-Modus: Full-Scan → Teile fixen → committen → Loop bis ≥95% → push (dann Diff-Review) → wieder Full-Scan ==========" >&2
    echo "Beim Push: Check-Pipeline mit AI-Review nur fürs Diff (gepushte Änderungen). Danach Full-Scan erneut; nicht ≥95% → weiter fixen, push, wiederholen." >&2
    echo "" >&2
  fi
  while true; do
    if bash "$ROOT_DIR/scripts/run-checks.sh" 2>&1; then
      echo "" >&2
      echo "All checks and AI review passed (all chunks ≥95%)." >&2
      if [[ "$refactor_mode" = true ]]; then
        echo "" >&2
        echo "========== Refactor-Phase abgeschlossen ==========" >&2
        echo "1. Pushen:  git push  (dabei läuft Check-Pipeline inkl. AI-Review nur fürs Diff)" >&2
        echo "2. Danach wieder Full-Scan:  npm run checks  (oder run-checks.sh --refactor)" >&2
        echo "   Noch nicht ≥95%? → Weitere Teile fixen → Commit → Push (Diff-Review) → Schritt 2. Wiederholt sich bis Full-Scan durchgeht." >&2
        echo "" >&2
      fi
      exit 0
    fi
    LATEST_REVIEW=""
    [[ -d "$REVIEWS_DIR" ]] && LATEST_REVIEW="$(ls -t "$REVIEWS_DIR"/review-*.md 2>/dev/null | head -1)"
    echo "" >&2
    echo "========== Check failed ==========" >&2
    if [[ -n "$LATEST_REVIEW" && -f "$LATEST_REVIEW" ]]; then
      echo "Chunk scores:" >&2
      grep -E "^## Chunk:|Score:|Verdict:" "$LATEST_REVIEW" | head -20 >&2
      echo "" >&2
      echo "Review details: $LATEST_REVIEW" >&2
    else
      echo "No review file found. Check output above for format/lint/typecheck/build/deno errors." >&2
    fi
    echo "" >&2
    echo "Fix the issues (commit changes if needed). Then press Enter to retry or Ctrl+C to abort." >&2
    read -r
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
  # Pre-push sets CHECK_MODE=diff (review only pushed changes); else default full (whole codebase per chunk).
  export CHECK_MODE="${CHECK_MODE:-full}"
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