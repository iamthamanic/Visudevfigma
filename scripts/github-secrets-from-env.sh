#!/usr/bin/env bash
# Setzt alle Variablen aus einer .env-Datei als GitHub Repository Secrets.
# Nutzung: ./scripts/github-secrets-from-env.sh path/to/.env.ci
# Voraussetzung: gh auth login, Datei nicht ins Repo committen.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${1:-}"
if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Usage: $0 <path-to-env-file>" >&2
  echo "Example: $0 .env.ci" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh (GitHub CLI) not found. Install: brew install gh" >&2
  exit 1
fi

count=0
while IFS= read -r line; do
  line="${line%%#*}"
  line="${line#"${line%%[![:space:]]*}"}"
  line="${line%"${line##*[![:space:]]}"}"
  if [[ -z "$line" ]]; then
    continue
  fi
  if [[ "$line" == *=* ]]; then
    name="${line%%=*}"
    name="${name%"${name##*[![:space:]]}"}"
    value="${line#*=}"   # alles nach erstem =
    value="${value#\"}"
    value="${value%\"}"
    if [[ -n "$name" ]]; then
      echo -n "$value" | gh secret set "$name"
      echo "Set secret: $name"
      (( count++ )) || true
    fi
  fi
done < "$ENV_FILE"

echo "Done. Set $count secret(s)."
