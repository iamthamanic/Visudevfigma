#!/usr/bin/env bash
# Updates README.md with a "Last updated" line so the README is refreshed on every push.
# Called from .husky/pre-push after run-checks. If README changes, pre-push commits it so the push includes it.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
README="$ROOT_DIR/README.md"

if [[ ! -f "$README" ]]; then
  exit 0
fi

# Current date for "Last updated" line
LAST_LINE="Last updated: $(date -u +%Y-%m-%d) (auto on push)."

if grep -q "Last updated:.*auto on push" "$README" 2>/dev/null; then
  # Replace existing line
  if [[ "$(uname -s)" = Darwin ]]; then
    sed -i '' "s/Last updated:.*(auto on push).*/$LAST_LINE/" "$README"
  else
    sed -i "s/Last updated:.*(auto on push).*/$LAST_LINE/" "$README"
  fi
else
  # Append if not present
  printf '\n---\n%s\n' "$LAST_LINE" >> "$README"
fi
