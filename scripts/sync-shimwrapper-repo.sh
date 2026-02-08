#!/usr/bin/env bash
# Syncs setup changes (run-checks.sh, ai-code-review.sh, push-checked.sh, .githooks/pre-push) from this repo
# into the shimwrappercheck repo and pushes. Use after extending the check or AI review setup.
# Requires: shimwrappercheck repo clone, push access.
# Usage: SHIMWRAPPER_REPO_PATH=/path/to/shimwrappercheck bash scripts/sync-shimwrapper-repo.sh
#        or clone at ../shimwrappercheck (sibling of this repo).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TARGET="${SHIMWRAPPER_REPO_PATH:-}"
if [[ -z "$TARGET" ]]; then
  TARGET="$(cd "$ROOT_DIR/.." && pwd)/shimwrappercheck"
fi

if [[ ! -d "$TARGET" ]]; then
  echo "Shimwrapper repo not found at: $TARGET" >&2
  echo "Clone with: git clone https://github.com/iamthamanic/shimwrappercheck $TARGET" >&2
  echo "Or set SHIMWRAPPER_REPO_PATH to your clone path." >&2
  exit 1
fi

if [[ ! -d "$TARGET/.git" ]]; then
  echo "Not a git repo: $TARGET" >&2
  exit 1
fi

if [[ ! -d "$TARGET/templates" ]]; then
  echo "No templates/ in $TARGET" >&2
  exit 1
fi

echo "Syncing setup to shimwrapper repo: $TARGET" >&2
cp "$ROOT_DIR/scripts/run-checks.sh" "$TARGET/templates/run-checks.sh"
cp "$ROOT_DIR/scripts/ai-code-review.sh" "$TARGET/templates/ai-code-review.sh"
cp "$ROOT_DIR/scripts/push-checked.sh" "$TARGET/templates/push-checked.sh"
cp "$ROOT_DIR/.githooks/pre-push" "$TARGET/templates/husky-pre-push"

cd "$TARGET"
git add templates/run-checks.sh templates/ai-code-review.sh templates/push-checked.sh templates/husky-pre-push
if ! git diff --staged --quiet 2>/dev/null; then
git commit -m "chore: sync templates from VisuDEV (run-checks, ai-code-review, push-checked, pre-push)"
  git push
  echo "Pushed to shimwrappercheck." >&2
else
  echo "No changes to push." >&2
fi
