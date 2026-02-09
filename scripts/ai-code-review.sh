#!/usr/bin/env bash
# AI code review: Codex only (Cursor disabled). Called from run-checks.sh.
# Prompt: senior-dev, decades-of-expertise, best-code bar.
# Codex: codex in PATH; use session after codex login (ChatGPT account, no API key in terminal).
# Diff: staged + unstaged; if clean (e.g. pre-push), uses diff of commits being pushed (@{u}...HEAD or HEAD~1...HEAD).
# Runs codex exec --json to get token usage from turn.completed; prints Token usage for agent to report.
# Diff limited to ~50KB head + tail. Timeout for Codex (increase in scripts/ai-code-review.sh if review aborts).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DIFF_FILE=""
cleanup() {
  [[ -n "$DIFF_FILE" ]] && [[ -f "$DIFF_FILE" ]] && rm -f "$DIFF_FILE"
}
trap cleanup EXIT

DIFF_FILE="$(mktemp)"
git diff --no-color >> "$DIFF_FILE" 2>/dev/null || true
git diff --cached --no-color >> "$DIFF_FILE" 2>/dev/null || true

# If working tree is clean (e.g. pre-push after commit), use diff of commits being pushed.
if [[ ! -s "$DIFF_FILE" ]] && command -v git >/dev/null 2>&1; then
  RANGE=""
  if git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then
    RANGE="@{u}...HEAD"
  elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    RANGE="HEAD~1...HEAD"
  fi
  if [[ -n "$RANGE" ]]; then
    git diff --no-color "$RANGE" >> "$DIFF_FILE" 2>/dev/null || true
  fi
fi

if [[ ! -s "$DIFF_FILE" ]]; then
  echo "Skipping AI review: no staged, unstaged, or pushed changes." >&2
  exit 0
fi

# Limit diff to first and last ~50KB to avoid token limits and timeouts
LIMIT_BYTES=51200
DIFF_LIMITED=""
if [[ $(wc -c < "$DIFF_FILE") -le $((LIMIT_BYTES * 2)) ]]; then
  DIFF_LIMITED="$(cat "$DIFF_FILE")"
else
  DIFF_LIMITED="$(head -c $LIMIT_BYTES "$DIFF_FILE")
...[truncated]...
$(tail -c $LIMIT_BYTES "$DIFF_FILE")"
fi

# Strict Senior-Software-Architekt review: start at 100, deduct per checklist item. Output JSON only.
PROMPT="Du bist ein extrem strenger Senior-Software-Architekt. Deine Aufgabe ist es, einen Code-Diff zu bewerten.

Regeln:
Starte mit 100 Punkten.
Gehe die folgende Checkliste durch und ziehe für jeden Verstoß die angegebenen Punkte ab. Sei gnadenlos. Ein 'okay' reicht nicht für 95%. 95% bedeutet Weltklasse-Niveau.

1. Architektur & SOLID (Die Struktur-Prüfung)
- Single Responsibility (SRP): Hat die Klasse/Funktion mehr als einen Grund, sich zu ändern? (Abzug: -15%)
- Dependency Inversion: Werden Abhängigkeiten (z.B. Datenbanken, APIs) hart instanziiert oder injiziert? (Abzug: -10%)
- Kopplung: Gibt es zirkuläre Abhängigkeiten oder zu tief verschachtelte Datei-Importe? (Abzug: -10%)
- YAGNI (You Ain't Gonna Need It): Wurde Code für \"zukünftige Fälle\" geschrieben, der jetzt noch nicht gebraucht wird? (Abzug: -5%)

2. Performance & Ressourcen (Der Effizienz-Check)
- Zeitkomplexität: Gibt es verschachtelte Schleifen (O(n²)), die bei größeren Datenmengen explodieren? (Abzug: -20%)
- Datenbank-Effizienz: Werden in einer Schleife Datenbankabfragen gemacht (N+1 Problem)? (Abzug: -20%)
- Memory Leaks: Werden Event-Listener oder Streams geöffnet, aber nicht wieder geschlossen? (Abzug: -15%)
- Bundle-Size: Werden riesige Bibliotheken importiert, um nur eine kleine Funktion zu nutzen? (Abzug: -5%)

3. Sicherheit (Logik-Ebene, die Snyk nicht sieht)
- IDOR (Insecure Direct Object Reference): Akzeptiert die API eine ID (z.B. user_id), ohne zu prüfen, ob der aktuelle User diese ID überhaupt sehen darf? (Abzug: -25%)
- Data Leakage: Werden sensible Daten (Passwörter, PII) in Logs geschrieben oder im Frontend ausgegeben? (Abzug: -20%)
- Rate Limiting: Könnte diese Funktion durch massenhafte Aufrufe den Server lahmlegen? (Abzug: -10%)

4. Robustheit & Error Handling (Die Stabilitäts-Prüfung)
- Silent Fails: Gibt es leere catch-Blöcke, die Fehler einfach \"verschlucken\"? (Abzug: -15%)
- Input Validation: Werden externe Daten (API-Inputs) validiert, bevor sie verarbeitet werden? (Abzug: -15%)
- Edge Cases: Was passiert bei null, undefined, [] oder extrem langen Strings? (Abzug: -10%)

5. Wartbarkeit & Lesbarkeit (Clean Code)
- Naming: Sind Variablennamen beschreibend oder heißen sie data, info, item? (Abzug: -5%)
- Side Effects: Verändert eine Funktion unvorhersehbar globale Zustände? (Abzug: -10%)
- Kommentar-Qualität: Erklärt der Kommentar das \"Warum\", oder nur das offensichtliche \"Was\"? (Abzug: -2%)

Antworte ausschließlich mit einem einzigen JSON-Objekt (kein anderer Text davor oder danach). Keine Dateien ändern oder Edits vorschlagen.

Format:
{\"score\": number, \"deductions\": [{\"point\": \"Kurzname\", \"minus\": number, \"reason\": \"...\"}], \"verdict\": \"REJECT\" | \"ACCEPT\"}

Regel: verdict muss \"ACCEPT\" sein nur wenn score >= 95 und keine kritischen Verstöße unadressiert; sonst verdict \"REJECT\".

--- DIFF ---
$DIFF_LIMITED"

CODEX_JSON_FILE="$(mktemp)"
CODEX_LAST_MSG_FILE="$(mktemp)"
cleanup() {
  [[ -n "$DIFF_FILE" ]] && [[ -f "$DIFF_FILE" ]] && rm -f "$DIFF_FILE"
  [[ -n "$CODEX_JSON_FILE" ]] && [[ -f "$CODEX_JSON_FILE" ]] && rm -f "$CODEX_JSON_FILE"
  [[ -n "$CODEX_LAST_MSG_FILE" ]] && [[ -f "$CODEX_LAST_MSG_FILE" ]] && rm -f "$CODEX_LAST_MSG_FILE"
}
trap cleanup EXIT

if ! command -v codex >/dev/null 2>&1; then
  echo "Skipping AI review: Codex CLI not available (run codex login or install codex in PATH)." >&2
  exit 0
fi

TIMEOUT_SEC=420
echo "Running Codex AI review..." >&2

# Run with --json to get turn.completed (token usage) and item.completed (assistant message). Use -o to get final message for PASS/FAIL.
CODEX_RC=0
if command -v timeout >/dev/null 2>&1; then
  timeout "$TIMEOUT_SEC" codex exec --json -o "$CODEX_LAST_MSG_FILE" "$PROMPT" 2>/dev/null > "$CODEX_JSON_FILE" || CODEX_RC=$?
else
  codex exec --json -o "$CODEX_LAST_MSG_FILE" "$PROMPT" 2>/dev/null > "$CODEX_JSON_FILE" || CODEX_RC=$?
fi

if [[ $CODEX_RC -eq 124 ]] || [[ $CODEX_RC -eq 142 ]]; then
  echo "Codex AI review timed out after ${TIMEOUT_SEC}s." >&2
  exit 1
fi

if [[ $CODEX_RC -ne 0 ]]; then
  echo "Codex AI review command failed (exit $CODEX_RC)." >&2
  cat "$CODEX_JSON_FILE" 2>/dev/null | head -50 >&2
  exit 1
fi

# Parse JSONL: turn.completed has usage (input_tokens, output_tokens); last assistant_message is in item.completed.
INPUT_T=""
OUTPUT_T=""
RESULT_TEXT=""
if command -v jq >/dev/null 2>&1; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    type="$(echo "$line" | jq -r '.type // empty')"
    if [[ "$type" == "turn.completed" ]]; then
      INPUT_T="$(echo "$line" | jq -r '.usage.input_tokens // empty')"
      OUTPUT_T="$(echo "$line" | jq -r '.usage.output_tokens // empty')"
    fi
    if [[ "$type" == "item.completed" ]]; then
      item_type="$(echo "$line" | jq -r '.item.item_type // empty')"
      if [[ "$item_type" == "assistant_message" ]]; then
        RESULT_TEXT="$(echo "$line" | jq -r '.item.text // empty')"
      fi
    fi
  done < "$CODEX_JSON_FILE"
fi

# Fallback: use --output-last-message file for PASS/FAIL if we didn't get assistant_message from JSONL
if [[ -z "$RESULT_TEXT" ]] && [[ -s "$CODEX_LAST_MSG_FILE" ]]; then
  RESULT_TEXT="$(cat "$CODEX_LAST_MSG_FILE")"
fi

# Parse JSON review: score, deductions[], verdict (ACCEPT | REJECT). Extract JSON from markdown code block if present.
REVIEW_RATING=0
REVIEW_DEDUCTIONS=""
REVIEW_VERDICT="REJECT"
PASS=0

if [[ -n "$RESULT_TEXT" ]]; then
  JSON_BLOCK="$(echo "$RESULT_TEXT" | sed -n '/^```.*json/,/^```/p' | sed '/^```/d')"
  if [[ -z "$JSON_BLOCK" ]]; then
    JSON_BLOCK="$(echo "$RESULT_TEXT" | grep -oE '\{[^{}]*( \{[^{}]*\}[^{}]*)*\}' | head -1)"
  fi
  if [[ -z "$JSON_BLOCK" ]]; then
    JSON_BLOCK="$RESULT_TEXT"
  fi
  if command -v jq >/dev/null 2>&1 && [[ -n "$JSON_BLOCK" ]]; then
    REVIEW_RATING=$(echo "$JSON_BLOCK" | jq -r '.score // 0' 2>/dev/null)
    REVIEW_VERDICT=$(echo "$JSON_BLOCK" | jq -r '.verdict // "REJECT"' 2>/dev/null)
    REVIEW_DEDUCTIONS=$(echo "$JSON_BLOCK" | jq -r '.deductions // [] | .[] | "\(.point): -\(.minus)% — \(.reason)"' 2>/dev/null | tr '\n' '; ')
    [[ -z "$REVIEW_RATING" || "$REVIEW_RATING" == "null" ]] && REVIEW_RATING=0
    [[ -z "$REVIEW_VERDICT" || "$REVIEW_VERDICT" == "null" ]] && REVIEW_VERDICT="REJECT"
  fi
  # Fallback: try to grep score and verdict from raw text
  if [[ "$REVIEW_RATING" -eq 0 ]] && echo "$RESULT_TEXT" | grep -qE '"score"[[:space:]]*:[[:space:]]*[0-9]+'; then
    REVIEW_RATING=$(echo "$RESULT_TEXT" | grep -oE '"score"[[:space:]]*:[[:space:]]*[0-9]+' | grep -oE '[0-9]+' | head -1)
  fi
  if [[ "$REVIEW_VERDICT" == "REJECT" ]] && echo "$RESULT_TEXT" | grep -qE '"verdict"[[:space:]]*:[[:space:]]*"ACCEPT"'; then
    REVIEW_VERDICT="ACCEPT"
  fi
  [[ "$REVIEW_RATING" -lt 0 ]] 2>/dev/null && REVIEW_RATING=0
  [[ "$REVIEW_RATING" -gt 100 ]] 2>/dev/null && REVIEW_RATING=100
fi

# Pass only if verdict is ACCEPT and score >= 95
if [[ "$REVIEW_VERDICT" == "ACCEPT" ]] && [[ "$REVIEW_RATING" -ge 95 ]]; then
  PASS=1
fi

# Always print token usage
if [[ -n "$INPUT_T" && -n "$OUTPUT_T" ]]; then
  TOTAL=$((INPUT_T + OUTPUT_T))
  echo "Token usage: ${INPUT_T} input, ${OUTPUT_T} output (total ${TOTAL})" >&2
else
  echo "Token usage: not reported by Codex CLI" >&2
fi

# Save review to .shimwrapper/reviews/ as markdown (always, pass or fail)
REVIEWS_DIR="$ROOT_DIR/.shimwrapper/reviews"
mkdir -p "$REVIEWS_DIR"
REVIEW_FILE="$REVIEWS_DIR/review-$(date +%Y%m%d-%H%M%S)-$$.md"
BRANCH=""
[[ -n "${GIT_BRANCH:-}" ]] && BRANCH="$GIT_BRANCH" || BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"
{
  echo "# AI Code Review — $(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')"
  echo ""
  echo "- **Branch:** $BRANCH"
  echo "- **Verdict:** ${REVIEW_VERDICT} ($([ "$PASS" -eq 1 ] && echo "PASS" || echo "FAIL"))"
  echo "- **Score:** ${REVIEW_RATING}%"
  echo "- **Tokens:** ${INPUT_T:-?} input, ${OUTPUT_T:-?} output"
  [[ -n "$REVIEW_DEDUCTIONS" ]] && { echo ""; echo "## Deductions"; echo ""; echo "$REVIEW_DEDUCTIONS" | tr ';' '\n' | sed 's/^/ - /'; echo ""; }
  echo "## Raw response"
  echo ""
  echo '```'
  [[ -n "$RESULT_TEXT" ]] && echo "$RESULT_TEXT" || echo "(no review text)"
  echo '```'
} >> "$REVIEW_FILE"
echo "Review saved: $REVIEW_FILE" >&2

# Always print review result
if [[ $PASS -eq 1 ]]; then
  echo "Codex AI review: PASS" >&2
else
  echo "Codex AI review: FAIL" >&2
  echo "→ Address deductions above (or in $REVIEW_FILE), fix the code, then push again." >&2
fi
echo "Score: ${REVIEW_RATING}%" >&2
echo "Verdict: ${REVIEW_VERDICT}" >&2
[[ -n "$REVIEW_DEDUCTIONS" ]] && echo "Deductions: ${REVIEW_DEDUCTIONS}" >&2

[[ $PASS -eq 1 ]] && exit 0 || exit 1
