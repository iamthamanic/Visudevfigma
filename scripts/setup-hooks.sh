#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository." >&2
  exit 1
fi

chmod +x .githooks/pre-push

git config core.hooksPath .githooks

echo "Git hooks configured: core.hooksPath=.githooks"
