#!/usr/bin/env bash
# Setzt Supabase-relevante Secrets in GitHub (Repository Secrets) per gh CLI.
# Liest SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY aus lokalem Supabase (supabase status -o json)
# oder aus Umgebungsvariablen. Optional: weitere Secrets aus .env.gh-secrets (nicht committen!).
# Nutzung: ./scripts/github-secrets-supabase.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) not found. Install: brew install gh" >&2
  exit 1
fi

# Prefer SUPABASE_CMD or PATH supabase; fallback to common install paths (so CI/local can override).
SUPABASE_BIN="${SUPABASE_CMD:-}"
if [[ -z "$SUPABASE_BIN" ]] && command -v supabase >/dev/null 2>&1; then
  SUPABASE_BIN="supabase"
fi
if [[ -z "$SUPABASE_BIN" ]]; then
  for candidate in /opt/homebrew/bin/supabase /usr/local/bin/supabase; do
    if [[ -x "$candidate" ]]; then
      SUPABASE_BIN="$candidate"
      break
    fi
  done
fi
if [[ -z "$SUPABASE_BIN" ]]; then
  SUPABASE_BIN="supabase"
fi

set_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" ]]; then
    echo "Skip (empty): $name" >&2
    return 0
  fi
  echo -n "$value" | gh secret set "$name"
  echo "Set: $name"
}

# 1) SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY aus Supabase Status oder Env
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  if "$SUPABASE_BIN" status -o json &>/dev/null; then
    json="$("$SUPABASE_BIN" status -o json 2>/dev/null)"
    if [[ -n "$json" ]]; then
      if command -v jq >/dev/null 2>&1; then
        SUPABASE_URL="${SUPABASE_URL:-$(echo "$json" | jq -r '.API_URL // empty')}"
        # SERVICE_ROLE_KEY (JWT) oder SECRET_KEY (sb_secret_...) für neue CLI
        SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(echo "$json" | jq -r 'if .SERVICE_ROLE_KEY then .SERVICE_ROLE_KEY else .SECRET_KEY end // empty')}"
      else
        SUPABASE_URL="${SUPABASE_URL:-$(echo "$json" | grep -o '"API_URL"[^,]*' | sed 's/.*: *"\([^"]*\)".*/\1/')}"
        SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(echo "$json" | grep -o '"SERVICE_ROLE_KEY"[^,]*' | sed 's/.*: *"\([^"]*\)".*/\1/')}"
        if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
          SUPABASE_SERVICE_ROLE_KEY="$(echo "$json" | grep -o '"SECRET_KEY"[^,]*' | sed 's/.*: *"\([^"]*\)".*/\1/')"
        fi
      fi
    fi
  fi
fi

if [[ -z "$SUPABASE_URL" ]]; then
  echo "SUPABASE_URL not set. Run 'supabase start' and 'supabase status -o json' or set SUPABASE_URL in env." >&2
  exit 1
fi
if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "SUPABASE_SERVICE_ROLE_KEY not set. Set it in env or ensure 'supabase status -o json' returns it." >&2
  exit 1
fi

set_secret "SUPABASE_URL" "$SUPABASE_URL"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"

# 2) Optional: weitere Secrets aus .env.gh-secrets (z. B. SCREENSHOT_API_KEY, ANTHROPIC_API_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
ENV_GH="${ENV_GH_FILE:-.env.gh-secrets}"
if [[ -f "$ENV_GH" ]]; then
  echo "Reading extra secrets from $ENV_GH ..."
  while IFS= read -r line; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    if [[ -z "$line" ]]; then continue; fi
    if [[ "$line" =~ ^[[:space:]]*# ]]; then continue; fi
    if [[ "$line" == *=* ]]; then
      name="${line%%=*}"
      name="${name%"${name##*[![:space:]]}"}"
      value="${line#*=}"
      value="${value#"${value%%[![:space:]]*}"}"
      value="${value%"${value##*[![:space:]]}"}"
      value="${value#\"}"
      value="${value%\"}"
      if [[ -z "$name" || "$name" == "SUPABASE_URL" || "$name" == "SUPABASE_SERVICE_ROLE_KEY" ]]; then
        continue
      fi
      if [[ ! "$name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        echo "Skip invalid name: $name (use [A-Za-z_][A-Za-z0-9_]*)"
        continue
      fi
      set_secret "$name" "$value"
    fi
  done < "$ENV_GH"
fi

echo "Done. Supabase-related GitHub secrets are set."
