#!/usr/bin/env bash
# Extracts a flat to-do list from an AI code review file (full chunked mode).
# Output: .shimwrapper/refactor-todo.json
# Used by run-checks.sh --refactor Phase 1.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REVIEWS_DIR="$ROOT_DIR/.shimwrapper/reviews"
TODO_FILE="$ROOT_DIR/.shimwrapper/refactor-todo.json"

REVIEW_FILE="${1:-}"
if [[ -z "$REVIEW_FILE" ]]; then
  REVIEW_FILE="$(ls -t "$REVIEWS_DIR"/review-*.md 2>/dev/null | head -1)"
fi

if [[ ! -f "$REVIEW_FILE" ]]; then
  echo "No review file found. Run full check first." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq required for extract-refactor-todo.sh." >&2
  exit 1
fi

REVIEW_BASENAME="$(basename "$REVIEW_FILE")"
CREATED="$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')"

chunk=""
items_json=""
in_block=0
# Per-chunk index for IDs (bash 3 compatible, no associative arrays)
idx_src=0 idx_supabase=0 idx_scripts=0 idx_other=0

while IFS= read -r line; do
  if [[ "$line" =~ ^##[[:space:]]Chunk:[[:space:]]([a-zA-Z0-9_-]+) ]]; then
    chunk="${BASH_REMATCH[1]}"
  elif [[ "$line" =~ ^\`\`\` ]]; then
    if (( in_block )); then
      in_block=0
    else
      in_block=1
    fi
  elif (( in_block )) && [[ "$line" =~ ^\{ ]]; then
    raw="$line"
    while IFS= read -r ded; do
      [[ -z "$ded" ]] && continue
      case "$chunk" in
        src) idx_src=$((idx_src + 1)); idx=$idx_src ;;
        supabase) idx_supabase=$((idx_supabase + 1)); idx=$idx_supabase ;;
        scripts) idx_scripts=$((idx_scripts + 1)); idx=$idx_scripts ;;
        *) idx_other=$((idx_other + 1)); idx=$idx_other ;;
      esac
      item_id="${chunk}-${idx}"
      point="$(echo "$ded" | jq -r '.point // "Unknown"')"
      minus="$(echo "$ded" | jq -r '.minus // 0')"
      reason="$(echo "$ded" | jq -r '.reason // ""' | jq -Rs .)"
      item="{\"id\":\"$item_id\",\"chunk\":\"$chunk\",\"point\":\"$point\",\"minus\":$minus,\"reason\":$reason,\"done\":false}"
      if [[ -n "$items_json" ]]; then
        items_json="$items_json,$item"
      else
        items_json="$item"
      fi
    done < <(echo "$raw" | jq -c '.deductions[]?' 2>/dev/null || true)
  fi
done < "$REVIEW_FILE"

if [[ -z "$items_json" ]]; then
  echo "No deductions found in $REVIEW_FILE" >&2
  exit 1
fi

mkdir -p "$(dirname "$TODO_FILE")"
# Build raw JSON then sort: chunk order (src, supabase, scripts), then minus descending
TMP_JSON="$ROOT_DIR/.shimwrapper/refactor-todo-tmp.json"
echo "{\"source_review\":\"$REVIEW_BASENAME\",\"created\":\"$CREATED\",\"items\":[$items_json]}" > "$TMP_JSON"
jq '.items |= sort_by([(["src","supabase","scripts"] | index(.chunk) // 99), -.minus])' "$TMP_JSON" 2>/dev/null > "$TODO_FILE" || cp "$TMP_JSON" "$TODO_FILE"
rm -f "$TMP_JSON"

echo "To-do list saved: $TODO_FILE" >&2
echo "Items: $(jq '.items | length' "$TODO_FILE" 2>/dev/null || echo "?")" >&2
