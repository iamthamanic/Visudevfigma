#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v rg >/dev/null 2>&1; then
  echo "rg (ripgrep) is required for project rules checks." >&2
  exit 1
fi

fail=0

run_check() {
  local title="$1"
  local pattern="$2"
  shift 2
  local output
  set +e
  output="$(rg -n "$pattern" "$@" 2>&1)"
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    echo "$output"
    echo "❌ ${title}"
    fail=1
  elif [ "$status" -eq 1 ]; then
    echo "✅ ${title}"
  else
    echo "$output" >&2
    echo "❌ ${title} (rg error)" >&2
    exit 1
  fi
}

# Frontend-only checks (exclude Supabase functions)
FRONTEND_GLOBS=(
  "src"
  "-g" "*.ts" "-g" "*.tsx" "-g" "*.css" "-g" "*.scss"
  "-g" "!src/supabase/functions/**"
)

# Tailwind classes in JSX (forbidden)
run_check "No Tailwind classes in JSX" \
  "className=\"[^\"]*(?:bg-|text-|flex|grid|p-|m-|w-|h-|rounded|border|shadow)" \
  "src" "-g" "*.tsx" "-g" "!src/supabase/functions/**"

# Inline styles (forbidden)
run_check "No inline styles in JSX" \
  "style=\{\{" \
  "src" "-g" "*.tsx" "-g" "!src/supabase/functions/**"

# Hardcoded colors (forbidden outside globals.css)
run_check "No hardcoded colors outside globals.css" \
  "#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(" \
  "src" "-g" "*.ts" "-g" "*.tsx" "-g" "*.css" "-g" "*.scss" \
  "-g" "!src/styles/globals.css" "-g" "!src/supabase/functions/**"

# any type (forbidden in frontend)
run_check "No 'any' type in frontend" \
  "\\bany\\b" \
  "src" "-g" "*.ts" "-g" "*.tsx" "-g" "!src/supabase/functions/**"

if [ "$fail" -ne 0 ]; then
  echo "\nProject rules check failed." >&2
  exit 1
fi
