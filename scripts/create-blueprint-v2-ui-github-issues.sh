#!/usr/bin/env bash
# Create GitHub issues for Blueprint v2 UI polish (Figma-aligned layer).
# Usage: bash scripts/create-blueprint-v2-ui-github-issues.sh [owner/repo]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO="${1:-iamthamanic/visudev-app}"
ECC_ROOT="${ECC_RUNNER_ROOT:-$HOME/.cursor/skills/ecc-runner}"
DESIGN=".qa/design/blueprint-v2-ui.md"

gh auth status >/dev/null
bash "${ECC_ROOT}/scripts/bootstrap-labels.sh" "${REPO}" >/dev/null

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local num
  num=$(gh issue create --repo "${REPO}" --title "${title}" --body "${body}" --label "${labels}")
  echo "${num}" | grep -oE '[0-9]+$'
}

PREREQ="Functional Blueprint v2 views (#67–#75) are merged. SoftwareGraph projections and tests exist; this issue adds the Figma UI layer only."

echo "Creating Blueprint v2 UI polish issues on ${REPO}..."
echo ""

# 76
n=$(create_issue \
  "UI Phase 0 — Shared Blueprint UI primitives and design tokens" \
  "## Intent
Establish reusable UI components and CSS tokens so all Blueprint views share Inspektor, chips, cards, and layout — matching Figma mockups.

## Context
${PREREQ}

Design: \`${DESIGN}\`

## Solution
- Add \`src/modules/blueprint/components/ui/\` (or \`src/components/blueprint-ui/\`) with:
  - \`BlueprintViewLayout\` (canvas + Inspektor slot)
  - \`InspectorPanel\`
  - \`RelationshipChip\` (toggle, icon, accent color)
  - \`MetricCard\`, \`StepCard\`, \`StatusBadge\`, \`ViewSectionTitle\`
- Extend blueprint CSS module tokens (edge-kind colors, layer colors, severity colors).
- DaisyUI for badges/buttons where consistent with AGENTS.md.
- Vitest smoke: components render without crash.

## Out of scope
- Rewiring individual views (follow-up issues).
- Graph builder changes.

## Acceptance
- [ ] Shared components exported from one barrel file.
- [ ] Edge-kind accent colors match Figma (imports=blue, calls=green, api=cyan, db=purple, events=pink, auth=orange, validation=lime).
- [ ] InspectorPanel supports title, badges, sections, code excerpt.
- [ ] Component tests pass.
- [ ] \`npm run checks\` green.

## Labels
P0 — blocker for all UI view issues." \
  "P0,agent-ready")
echo "#${n} UI Phase 0 — Shared primitives"
P0="${n}"

# 77
n=$(create_issue \
  "UI Phase 1 — Blueprint shell sidebar sub-navigation" \
  "## Intent
Replace horizontal English tabs with German Blueprint sub-navigation in the shell sidebar (Atlas, Architektur, Abhängigkeiten, Ausführung, Infrastruktur, Diagnosen, Evolution).

## Context
${PREREQ}
Depends on: #${P0}

Design: \`${DESIGN}\`

## Solution
- Extend \`Sidebar.tsx\` (or blueprint-specific sub-nav) with collapsible **Blueprint** group and seven view links.
- Route or in-app state for active blueprint view (URL param e.g. \`/blueprint?view=dependencies\` preferred).
- Remove or demote horizontal \`BlueprintViewShell\` tab bar; keep view switching logic.
- Shared view header: project name, branch breadcrumb placeholder, view title (DE).
- Default view: Diagnosen (matches product) or last selected.
- Playwright: navigate between blueprint views via sidebar.

## Acceptance
- [ ] Seven views reachable from sidebar with German labels.
- [ ] Horizontal tab bar removed or reduced to view-internal sub-tabs only.
- [ ] Keyboard accessible navigation.
- [ ] Existing BlueprintPage tests updated.
- [ ] \`npm run checks\` green.

## Depends on
#${P0}" \
  "P0,agent-ready")
echo "#${n} UI Phase 1 — Shell sidebar"
P1="${n}"

# 78
n=$(create_issue \
  "UI Phase 2 — Dependencies view Figma UI" \
  "## Intent
Match Dependencies mockup: BEZIEHUNGSTYPEN colored chips, graph canvas, right Inspektor, Top-Abhängigkeiten summary.

## Context
${PREREQ}
Functional view exists (\`DependenciesView\`, filters, evidence). Replace checkbox sidebar with Figma layout.

Depends on: #${P0}, #${P1}

## Solution
- Wrap in \`BlueprintViewLayout\` + \`InspectorPanel\`.
- Replace checkbox filters with \`RelationshipChip\` toggles (Imports, Calls, API Calls, Database, Events, Auth, Validation, External Services).
- Style Cytoscape nodes/edges with chip accent colors.
- Inspektor: selected edge/node details, evidence excerpt, file:line.
- Bottom or sidebar: Top-Abhängigkeiten list with counts per kind.
- German copy throughout.

## Acceptance
- [ ] Colored relationship type chips toggle edge visibility.
- [ ] Inspektor panel on the right matches layout pattern from Figma.
- [ ] Graph edge colors align with chip colors.
- [ ] Functional filter/evidence behavior unchanged.
- [ ] Vitest + \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P1,agent-ready")
echo "#${n} UI Phase 2 — Dependencies UI"

# 79
n=$(create_issue \
  "UI Phase 3 — Execution view Figma UI" \
  "## Intent
Match Execution mockup: horizontal step cards with timing, Schritte list, detail tabs (Übersicht, Payload, Headers, Logs, Stacktrace, Tags, Code-Standort).

## Context
${PREREQ}
Functional \`ExecutionView\` + pipeline projection exists.

Depends on: #${P0}, #${P1}

## Solution
- Top: horizontal \`StepCard\` row connected by dotted arrows.
- Left: numbered Schritte list with selection highlight.
- Center/bottom: tabbed detail panel for selected step.
- Inspektor or inline panel for step evidence (auth, validation, DB).
- German labels; status icons (confirmed/missing).

## Acceptance
- [ ] Step cards show route pipeline left-to-right with visual connectors.
- [ ] Schritte list selects active step; detail tabs switch content.
- [ ] Evidence from graph still drives step content.
- [ ] Vitest + \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P1,agent-ready")
echo "#${n} UI Phase 3 — Execution UI"

# 80
n=$(create_issue \
  "UI Phase 4 — Infrastructure view Figma UI" \
  "## Intent
Match Infrastructure mockup: service cards (Web App, API Service, Auth, PostgreSQL, Redis), connection lines, Inspektor with status and resource bars.

## Context
${PREREQ}
Functional \`InfrastructureView\` renders GraphCanvas only — no Inspektor or card layout.

Depends on: #${P0}, #${P1}

## Solution
- Replace bare canvas with styled service nodes (card chrome, port labels, RUNNING badge).
- Grid/radial layout preserved via Cytoscape or complementary HTML overlay.
- Right \`InspectorPanel\`: CPU/RAM/Network bars (static or from graph metrics when available), responsibilities checklist.
- German copy; accent colors per runtime kind.

## Acceptance
- [ ] Service nodes visually match Figma card pattern.
- [ ] Clicking a node opens Inspektor with service details.
- [ ] Empty state unchanged for missing graph.
- [ ] \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P1,agent-ready")
echo "#${n} UI Phase 4 — Infrastructure UI"

# 81
n=$(create_issue \
  "UI Phase 5 — Diagnostics view Figma UI" \
  "## Intent
Match Diagnostics mockup: Security/Architecture/Completeness/Complexity/Evidence sub-tabs, styled Security Matrix, findings severity badges, Problem-Inspektor with code snippet.

## Context
${PREREQ}
\`DiagnosticsView\` wraps v1 Security Matrix + Route Canvas + FindingInspector functionally.

Depends on: #${P0}, #${P1}

## Solution
- Pill sub-tabs with active blue outline (Security default).
- Table styling for Sicherheits-Matrix (route rows, status icons).
- Findings list with Kritisch/Hoch/Mittel badges.
- Right Problem-Inspektor: severity, description, SQL/code excerpt panel.
- Preserve all v1 behavior and graph-derived projections.

## Acceptance
- [ ] Sub-tab navigation works; Security tab identical behavior to today.
- [ ] Findings and matrix visually match Figma severity colors.
- [ ] Inspektor shows selected finding details.
- [ ] Parity tests still pass.
- [ ] \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P1,agent-ready")
echo "#${n} UI Phase 5 — Diagnostics UI"

# 82
n=$(create_issue \
  "UI Phase 6 — Architecture view Figma UI" \
  "## Intent
Match Architecture mockup: Domains/Layers/Modules toggle, vertical layer stack with colored glow borders, included-services pills, Inspektor checklist.

## Context
${PREREQ}
Functional \`ArchitectureView\` + hierarchical graph exists.

Depends on: #${P0}, #${P1}

## Solution
- Sub-nav toggle: Domains | Layers | Modules.
- Layer cards: Experience, Application, Domain, Integration, Persistence, Processing, Platform — each with accent color and service pills.
- Selected layer glow border; Inspektor shows responsibilities, services table, dependencies.
- German section titles.

## Acceptance
- [ ] Layer stack readable without zoom; matches Figma hierarchy.
- [ ] Toggle switches projection/grouping mode.
- [ ] Inspektor bound to selected layer/module node.
- [ ] \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P1,agent-ready")
echo "#${n} UI Phase 6 — Architecture UI"

# 83
n=$(create_issue \
  "UI Phase 7 — Evolution view Figma UI" \
  "## Intent
Match Evolution mockup: Timeline/Commit Diff/Branch Compare/Working Tree sub-tabs, snapshot cards, Evolutions-Metriken row, diff legend, commit Inspektor.

## Context
${PREREQ}
Functional \`EvolutionView\` + git summary API + snapshots exist.

Depends on: #${P0}, #${P1}

## Solution
- Sub-tabs with purple active state (Timeline default).
- Horizontal Atlas snapshot selector cards with selection checkmark.
- Metric cards row (+Neue Module, Geänderte Routen, etc.) — use graph diff stats.
- Wesentliche Änderungen columns (Neu/Geändert/Entfernt/Top Abhängigkeiten).
- Right Inspektor: commit summary, stats, complexity/instability bars.

## Acceptance
- [ ] Sub-tabs switch evolution modes without losing snapshot selection.
- [ ] Metric cards reflect diff between selected snapshots.
- [ ] German copy; diff highlighting preserved.
- [ ] \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P2,agent-ready")
echo "#${n} UI Phase 7 — Evolution UI"

# 84
n=$(create_issue \
  "UI Phase 8 — Atlas 2D view Figma UI polish" \
  "## Intent
Polish Atlas 2D map: search, cluster labels, floating service labels, Inspektor — matching Figma before any 3D work.

## Context
${PREREQ}
Functional \`AtlasView\` with 2D force layout + search exists.

Depends on: #${P0}, #${P1}

## Solution
- Search bar styling; soft-limit banner when condensed.
- Node labels as floating cards (kind-colored borders).
- Inspektor: Übersicht/Details/Abhängigkeiten/Deployments sub-tabs.
- Performance: no regression on 400-node soft limit.

## Acceptance
- [ ] Search and selection UX match Figma layout.
- [ ] Inspektor shows selected node/cluster details.
- [ ] 2D map remains default (no 3D bundle yet).
- [ ] \`npm run checks\` green.

## Depends on
#${P0}, #${P1}" \
  "P2,agent-ready")
echo "#${n} UI Phase 8 — Atlas 2D UI"

# 85
n=$(create_issue \
  "UI Phase 9 — Atlas 3D city mode (optional)" \
  "## Intent
Add optional 3D city visualization for Atlas behind a lazy-loaded toggle — only if 2D polish (#84) is insufficient.

## Context
${PREREQ}
Design defers 3D until 2D prototype proven. Figma shows 3D isometric city.

Depends on: UI Phase 8 — Atlas 2D view Figma UI polish

## Solution
- Lazy import \`three\`, \`@react-three/fiber\`, \`@react-three/drei\`.
- Toggle: 2D | 3D in Atlas toolbar.
- Map graph hierarchy to city blocks (district/building metaphor).
- Disable on low-power / reduced-motion preference.
- Bundle budget documented in PR.

## Acceptance
- [ ] 3D mode is code-split; initial Atlas load unchanged.
- [ ] Toggle switches between 2D Cytoscape and 3D scene.
- [ ] Keyboard users can stay in 2D-only mode.
- [ ] \`npm run checks\` green.

## Depends on
Atlas 2D UI issue above" \
  "P2,agent-ready")
echo "#${n} UI Phase 9 — Atlas 3D"

echo ""
echo "Done. Created UI Phase 0–9 issues."
echo "Next: @ecc-runner-loop continue"
