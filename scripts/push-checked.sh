#!/usr/bin/env bash
# Push wrapper: ensure npm login, run same checks as pre-push (incl. AI review), then git push.
# Use: npm run push [-- <git push args>]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Require npm login before push (e.g. for later publish or 2FA flows). Run interactively and wait until done.
if ! npm whoami >/dev/null 2>&1; then
  echo "npm login required. Complete login (browser or terminal), then the script continues." >&2
  npm login
  if ! npm whoami >/dev/null 2>&1; then
    echo "npm login failed or not completed. Aborting push." >&2
    exit 1
  fi
  echo "npm login OK, continuing with checks and push." >&2
fi

# AI review mandatory for push (no skip)
unset SKIP_AI_REVIEW
bash "$ROOT_DIR/scripts/run-checks.sh"

# Optional: update README "Last updated" (same as pre-push)
if [[ -f "$ROOT_DIR/scripts/update-readme-on-push.sh" ]]; then
  bash "$ROOT_DIR/scripts/update-readme-on-push.sh"
  if ! git diff --quiet README.md 2>/dev/null; then
    git add README.md
    git commit -m "docs: update README (auto on push)"
  fi
fi

exec git push "$@"
