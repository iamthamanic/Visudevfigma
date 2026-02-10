#!/usr/bin/env bash
# Thin wrapper: Full-Modus mit Loop bis alle Chunks ≥95%.
# Delegiert an run-checks.sh --until-95 (Logik lebt dort).
#
# Usage: GIT_CMD=/usr/bin/git bash scripts/run-checks-until-95.sh
# Prerequisite: Commit your changes before each retry; the AI review uses committed code only.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec bash "$ROOT_DIR/scripts/run-checks.sh" --until-95 "$@"
