#!/usr/bin/env bash
# Thin wrapper: Refactor-Modus — Loop bis alle Chunks ≥95%, dann Hinweis: push, danach npm run checks.
# Delegiert an run-checks.sh --refactor (Logik lebt dort).
#
# Usage: GIT_CMD=/usr/bin/git bash scripts/run-checks-until-95.sh
# Prerequisite: Commit your changes before each retry; the AI review uses committed code only.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT_DIR/scripts/run-checks.sh" --refactor "$@"
