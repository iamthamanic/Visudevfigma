#!/usr/bin/env bash
# Create GitHub issues for Wave 3 VISUDEV visualization parity (v3 Zielbild gaps).
# Usage: bash scripts/create-wave3-viz-parity-issues.sh [owner/repo]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO="${1:-iamthamanic/visudev-app}"
if [[ ! "${REPO}" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "error: invalid repo format (expected owner/name): ${REPO}" >&2
  exit 1
fi
ECC_ROOT="${ECC_RUNNER_ROOT:-$HOME/.cursor/skills/ecc-runner}"
if [[ ! -d "${ECC_ROOT}/scripts" ]]; then
  echo "error: ECC runner scripts not found at ${ECC_ROOT}/scripts" >&2
  exit 1
fi
MILESTONE="blueprint-wave-3-viz-parity"
REF=".qa/evidence/figma-compare-v3"

gh auth status >/dev/null
bash "${ECC_ROOT}/scripts/bootstrap-labels.sh" "${REPO}" >/dev/null

if ! gh label create "wave-3" --repo "${REPO}" --color "0E8A16" --description "Wave 3 visualization parity" 2>&1; then
  if gh label list --repo "${REPO}" --json name --jq '.[].name' | grep -qx 'wave-3'; then
    echo "Label wave-3 already exists on ${REPO}"
  else
    echo "error: failed to create label wave-3 on ${REPO}" >&2
    exit 1
  fi
fi

MILESTONE_NUM=$(gh api "repos/${REPO}/milestones" --jq '.[] | select(.title=="'"${MILESTONE}"'") | .number' | head -1)
if [[ -z "${MILESTONE_NUM}" ]]; then
  MILESTONE_NUM=$(gh api -X POST "repos/${REPO}/milestones" \
    -f title="${MILESTONE}" \
    -f description="Wave 3 VISUDEV visualization parity — v3 Zielbild gaps (~85-90% target)" \
    -f state=open | jq -r '.number')
fi

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local num
  num=$(gh issue create --repo "${REPO}" --title "${title}" --body "${body}" \
    --label "${labels}" --milestone "${MILESTONE}")
  echo "${num}" | grep -oE '[0-9]+$'
}

PREREQ="Wave 2 (#123–#130) ist gemerged. v3 Playwright-Vergleich zeigt ~70% Alignment (vor Wave 2: 58%). Diese Wave schließt die verbleibenden Lücken Richtung **85–90%**."

COMMON_ASSUMPTIONS="## Annahmen
- Referenz: \`${REF}/ziel-*.png\` vs \`current-*.png\`
- Playwright-Gate: \`tests/e2e/wave2-viz-compare.spec.ts\` + view-spezifische wave3 Specs
- Blueprint-Enrichment + wave2-test-helpers für Demo-Daten
- UI-Copy Deutsch, Commits Englisch
- Dev-URL: **http://localhost:3005**"

echo "Creating Wave 3 viz parity issues on ${REPO} (milestone #${MILESTONE_NUM})..."
echo ""

# 1 — Shell scan badge P0
n=$(create_issue \
  "Wave 3 P0 — Shell: Scan abgeschlossen / Zuletzt gescannt Badge" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/ziel-architecture.png\` (Header-Badge)

## Problem
- Playwright/Demo zeigt „Noch nicht gescannt“ obwohl Blueprint geladen ist
- Zielbild: grüner „Scan abgeschlossen“ Chip + optional „Zuletzt gescannt“

## Lösung
- \`data-testid=\"blueprint-scan-badge\"\` auf StatusBadge
- Mock/Enrichment: \`scanStatuses.blueprint.status = completed\` nach Blueprint-Load
- Optional: \`lastScannedAt\` → „Zuletzt gescannt: …“ Subtext

## User Journey
1. Nutzer öffnet Blueprint → Header zeigt sofort „Scan abgeschlossen\"
2. Nach Rescan kurz „Analysiere…“, dann wieder abgeschlossen

## Architektur
- \`BlueprintShellHeader.tsx\`, \`BlueprintPage.tsx\`, \`wave2-test-helpers.ts\`

## UI/UX Design Skizze (Referenz)
- Grüner confirmed Badge „Scan abgeschlossen“ neben Projekt-Pill

## Akzeptanzkriterien
- [ ] Kein „Noch nicht gescannt“ bei Demo-Blueprint
- [ ] Badge testid + completed Label
- [ ] verify-ui wave3-shell-scan-badge grün

Acceptance: \`.qa/acceptance/wave3-shell-scan-badge.md\`

${COMMON_ASSUMPTIONS}" \
  "P0,agent-ready,blueprint,ui,wave-3,visualization")
echo "#${n} Shell scan badge"
SHELL="${n}"

# 2 — Inspector auto-select P0
n=$(create_issue \
  "Wave 3 P0 — Inspector Auto-Selection (Architektur, Atlas, Infra, Diagnosen)" \
  "## Kontext
${PREREQ}

Referenzen:
- \`${REF}/ziel-architecture.png\` — APPLICATION LAYER
- \`${REF}/ziel-atlas.png\` — API SERVICE
- \`${REF}/ziel-infrastructure.png\` — Web App
- \`${REF}/ziel-diagnostics.png\` — SEC-001

## Problem
- Views laden ohne Vorauswahl → leerer Inspektor, FEHLT-Badges
- Zielbilder zeigen immer gefüllten rechten Panel

## Lösung
- Architecture Layers: default select APPLICATION LAYER node
- Atlas: default select API SERVICE cluster
- Infrastructure: default select Web App topology node
- Diagnostics: default select first critical finding (SEC-001)

## User Journey
1. Nutzer wechselt View → sofort relevanter Inspektor-Inhalt sichtbar

## Architektur
- \`ArchitectureView.tsx\`, \`AtlasView/useAtlasViewState.ts\`, \`InfrastructureView.tsx\`, \`DiagnosticsView.tsx\`

## UI/UX Design Skizze (Referenz)
- Selected glow/highlight auf Default-Entity wie in Ziel-PNGs

## Akzeptanzkriterien
- [ ] 4 Views mit Auto-Select
- [ ] Inspector nicht leer on first paint
- [ ] verify-ui wave3-inspector-auto-select grün

Acceptance: \`.qa/acceptance/wave3-inspector-auto-select.md\`

## Depends on
#${SHELL}

${COMMON_ASSUMPTIONS}" \
  "P0,agent-ready,blueprint,ui,wave-3,visualization")
echo "#${n} Inspector auto-select"
AUTO="${n}"

# 3 — Execution detail UI P1
n=$(create_issue \
  "Wave 3 P1 — Execution: Payload/Headers/Logs Detail-UI" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/ziel-execution.png\`

## Problem
- Payload/Headers/Logs Tabs leer oder „Keine Daten\"
- Kein JSON mit Kopieren-Buttons wie Zielbild
- Zu viele FEHLT-Badges auf Demo-Steps

## Lösung
- Enrichment: demo payload/headers/logs evidence pro Step
- \`ExecutionDetailTabs.tsx\`: JSON panels, Kopieren, testids
- Step-Klick aktualisiert alle Tabs

## User Journey
1. Nutzer klickt Pipeline-Schritt → Payload zeigt Request/Response JSON
2. Headers/Logs Tabs mit Demo-Inhalt

## Architektur
- \`ExecutionDetailTabs.tsx\`, \`ExecutionInspector.tsx\`, demo enrichment

## UI/UX Design Skizze (Referenz)
- Syntax-highlighted JSON, Kopieren buttons, log lines with timestamps

## Akzeptanzkriterien
- [ ] Payload/Headers/Logs non-empty on demo
- [ ] Step click updates panel
- [ ] verify-ui wave3-execution-detail-ui grün

Acceptance: \`.qa/acceptance/wave3-execution-detail-ui.md\`

## Depends on
#${AUTO}

${COMMON_ASSUMPTIONS}" \
  "P1,agent-ready,blueprint,ui,wave-3,visualization")
echo "#${n} Execution detail UI"
EXEC="${n}"

# 4 — Evolution git timeline P1
n=$(create_issue \
  "Wave 3 P1 — Evolution: Git-Timeline Commit-Dots" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/ziel-evolution.png\`

## Problem
- Timeline ohne Commit-Dots aus Git-Summary
- Zielbild: Punkte auf Achse + Tooltips

## Lösung
- \`evolution-commit-dot\` testids aus \`buildDemoGitSummary()\`
- Position dots proportional to dates on \`evolution-timeline\`

## User Journey
1. Nutzer öffnet Evolution → sieht Commit-Historie auf Timeline

## Architektur
- \`EvolutionView.tsx\`, \`EvolutionTimeline.tsx\`, \`shared/demo-git-summary.ts\`

## UI/UX Design Skizze (Referenz)
- Horizontal axis with colored dots, hover labels

## Akzeptanzkriterien
- [ ] ≥3 commit dots on timeline
- [ ] verify-ui wave3-evolution-git-timeline grün

Acceptance: \`.qa/acceptance/wave3-evolution-git-timeline.md\`

## Depends on
#${EXEC}

${COMMON_ASSUMPTIONS}" \
  "P1,agent-ready,blueprint,ui,wave-3,visualization")
echo "#${n} Evolution git timeline"
EVO="${n}"

# 5 — Atlas 3D polish P2
n=$(create_issue \
  "Wave 3 P2 — Atlas: 3D Cluster Polish (Farben, Glow, Labels)" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/ziel-atlas.png\`

## Problem
- Cluster-Farben/Glow/Labels weichen vom Zielbild ab
- Inspektor bei Cluster-Select unvollständig

## Lösung
- Distinct cluster hues + selected glow in \`AtlasCityScene\`
- \`AtlasClusterLabels\`: floating labels, testid atlas-cluster-label
- Cluster inspector populated on select

## User Journey
1. Nutzer sieht farbige 3D-Stadt → klickt Cluster → Glow + Inspector

## Architektur
- \`AtlasCityScene.tsx\`, \`AtlasClusterLabels.tsx\`, \`AtlasInspector.tsx\`

## UI/UX Design Skizze (Referenz)
- Colored blocks, emissive selection, labels above clusters

## Akzeptanzkriterien
- [ ] ≥6 colored clusters + labels
- [ ] Selected glow + inspector
- [ ] verify-ui wave3-atlas-3d-polish grün

Acceptance: \`.qa/acceptance/wave3-atlas-3d-polish.md\`

## Depends on
#${EVO}

${COMMON_ASSUMPTIONS}" \
  "P2,agent-ready,blueprint,ui,wave-3,visualization")
echo "#${n} Atlas 3D polish"
ATLAS="${n}"

# 6 — Diagnostics scale P2
n=$(create_issue \
  "Wave 3 P2 — Diagnosen: Matrix-Skala, 24 Findings, Evidence SQL" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/ziel-diagnostics.png\`

## Problem
- Matrix zu wenige Zeilen (<5)
- Findings nicht skaliert (~24 mit Pagination)
- Evidence SQL im Inspektor fehlt teilweise

## Lösung
- Demo enrichment: ≥5 matrix rows, ~24 findings
- Pagination „1-5 von 24\"
- \`problem-inspector-evidence\` SQL block

## User Journey
1. Nutzer scrollt Matrix → 5+ Routes
2. Findings paginiert → SEC-001 mit SQL Evidence

## Architektur
- \`SecurityMatrix.tsx\`, \`FindingsTable.tsx\`, \`ProblemInspector.tsx\`, diagnostics mock builder

## UI/UX Design Skizze (Referenz)
- Dense matrix, paginated findings footer, SQL code block

## Akzeptanzkriterien
- [ ] ≥5 matrix rows, ≥20 findings total
- [ ] Pagination + SQL evidence
- [ ] verify-ui wave3-diagnostics-scale grün

Acceptance: \`.qa/acceptance/wave3-diagnostics-scale.md\`

## Depends on
#${ATLAS}

${COMMON_ASSUMPTIONS}" \
  "P2,agent-ready,blueprint,ui,wave-3,visualization")
echo "#${n} Diagnostics scale"
DIAG="${n}"

cat > .qa/intake/blueprint-wave-3-viz-parity-issues.md <<EOF
# Blueprint Wave 3 — Visualization Parity (v3 Zielbild gaps)

Epic: **Close remaining ~70% → ~85-90% Figma alignment from v3 compare report**

Prerequisite: Wave 2 #123–#130 merged on main.

## ECC Runner queue: \`${MILESTONE}\`

1. wave3-shell-scan-badge (#${SHELL}) — P0
2. wave3-inspector-auto-select (#${AUTO}) — P0
3. wave3-execution-detail-ui (#${EXEC}) — P1
4. wave3-evolution-git-timeline (#${EVO}) — P1
5. wave3-atlas-3d-polish (#${ATLAS}) — P2
6. wave3-diagnostics-scale (#${DIAG}) — P2

Issues: #${SHELL}–#${DIAG}

Reference images: \`${REF}/ziel-*.png\`

\`\`\`bash
export ECC_RUNNER_ROOT="\$HOME/.cursor/skills/ecc-runner"
cd Visudevfigma
bash "\$ECC_RUNNER_ROOT/scripts/sync-queue-to-state.sh"
@ecc-runner-loop continue
\`\`\`
EOF

echo ""
echo "Done. Issues #${SHELL}–#${DIAG}"
echo "Intake: .qa/intake/blueprint-wave-3-viz-parity-issues.md"
