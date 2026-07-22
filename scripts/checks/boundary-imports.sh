#!/usr/bin/env bash
# Thin wrapper: AST-based boundary import check (Node + TypeScript).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ node is required for boundary-imports check." >&2
  exit 1
fi

if [[ ! -f node_modules/typescript/package.json ]]; then
  echo "❌ typescript package missing (node_modules/typescript). Run npm install." >&2
  exit 1
fi

exec node scripts/checks/boundary-imports.cjs
