#!/usr/bin/env bash
# Wrapper — projectId from config/supabase-cloud.json; anon key from .env.local (see .env.cloud.example).
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec node "${ROOT_DIR}/scripts/ping-cloud-supabase.js" "$@"
