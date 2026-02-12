#!/usr/bin/env bash
# Führt Maestro Preview-Smoke-Flows gegen die angegebene Preview-URL aus.
# Verwendung: PREVIEW_URL=http://localhost:4001 bash scripts/maestro-test-preview.sh
# Oder: bash scripts/maestro-test-preview.sh http://localhost:4001
# Erfordert: Maestro CLI (curl -fsSL https://get.maestro.mobile.dev | bash)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PREVIEW_URL="${1:-${PREVIEW_URL:-}}"
if [[ -z "$PREVIEW_URL" ]]; then
  echo "Verwendung: PREVIEW_URL=<url> $0  oder  $0 <url>" >&2
  echo "Beispiel: PREVIEW_URL=http://localhost:4001 $0" >&2
  echo "Preview-URL erhältst du in App Flow, nachdem du eine Preview gestartet hast." >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI nicht gefunden. Installieren: curl -fsSL https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

export PREVIEW_URL
maestro test -e PREVIEW_URL="$PREVIEW_URL" maestro/preview-smoke.yaml
