#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INFO_FILE="$ROOT/src/utils/supabase/info.tsx"

if [ ! -f "$INFO_FILE" ]; then
  echo "Missing $INFO_FILE" >&2
  exit 1
fi

PROJECT_ID=""
ANON_KEY=""

read_project_info() {
  INFO_FILE="$INFO_FILE" python3 - <<'PY'
from pathlib import Path
import os
import re

info_path = Path(os.environ["INFO_FILE"])
text = info_path.read_text()
project_match = re.search(r'projectId\s*=\s*"([^"]+)"', text)
key_match = re.search(r'publicAnonKey\s*=\s*\n\s*"([^"]+)"', text)

if not project_match or not key_match:
    raise SystemExit("Could not parse projectId/publicAnonKey from info.tsx")

print(project_match.group(1))
print(key_match.group(1))
PY
}

if {
  IFS= read -r PROJECT_ID
  IFS= read -r ANON_KEY
} < <(read_project_info); then
  if [ -z "$PROJECT_ID" ] || [ -z "$ANON_KEY" ]; then
    echo "Failed to parse project info" >&2
    exit 1
  fi
else
  echo "Failed to parse project info" >&2
  exit 1
fi

BASE_URL="https://${PROJECT_ID}.supabase.co/functions/v1/visudev-analyzer"

ACTION="health"
REPO=""
BRANCH=""
GITHUB_TOKEN=""

usage() {
  cat <<USAGE
Usage:
  scripts/smoke/analyzer.sh health
  scripts/smoke/analyzer.sh analyze --repo owner/repo --branch main [--github-token TOKEN]

Options:
  --repo           GitHub repo (owner/name)
  --branch         GitHub branch (default: main)
  --github-token   Optional GitHub token for private repos
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    health|analyze)
      ACTION="$1"
      shift
      ;;
    --repo)
      REPO="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --github-token)
      GITHUB_TOKEN="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [ "$ACTION" = "health" ]; then
  curl -sS \
    -H "Authorization: Bearer ${ANON_KEY}" \
    "${BASE_URL}"
  echo
  exit 0
fi

if [ "$ACTION" = "analyze" ]; then
  if [ -z "$REPO" ]; then
    echo "--repo is required for analyze" >&2
    usage
    exit 1
  fi
  if [ -z "$BRANCH" ]; then
    BRANCH="main"
  fi
  # Input validation: avoid injection into JSON (repo/branch/token from args)
  if ! echo "$REPO" | grep -qE '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$'; then
    echo "Invalid --repo (expected owner/name, alphanumeric, dots, underscores, hyphens)" >&2
    exit 1
  fi
  if ! echo "$BRANCH" | grep -qE '^[a-zA-Z0-9/_.-]{1,512}$'; then
    echo "Invalid --branch (max 512 chars, alphanumeric, /._-)" >&2
    exit 1
  fi
  if [ -n "$GITHUB_TOKEN" ] && ! echo "$GITHUB_TOKEN" | grep -qE '^[a-zA-Z0-9_-]{1,512}$'; then
    echo "Invalid --github-token (max 512 chars, alphanumeric, _-)" >&2
    exit 1
  fi
  # Pass via env so Python builds JSON safely (no CLI interpolation). Prefer env GITHUB_TOKEN over --github-token to avoid history/process listing.
  export REPO BRANCH GITHUB_TOKEN
  PAYLOAD=$(python3 - <<'PY'
import json
import os
import re
repo = (os.environ.get("REPO") or "").strip()
branch = (os.environ.get("BRANCH") or "main").strip()
token = (os.environ.get("GITHUB_TOKEN") or "").strip()
if not re.match(r"^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$", repo):
    raise SystemExit("Invalid REPO")
if not re.match(r"^[a-zA-Z0-9/_.-]{1,512}$", branch):
    raise SystemExit("Invalid BRANCH")
payload = {"repo": repo, "branch": branch}
if token and re.match(r"^[a-zA-Z0-9_-]{1,512}$", token):
    payload["access_token"] = token
print(json.dumps(payload))
PY
)

  curl -sS \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "${PAYLOAD}" \
    "${BASE_URL}/analyze"
  echo
  exit 0
fi

usage
exit 1
