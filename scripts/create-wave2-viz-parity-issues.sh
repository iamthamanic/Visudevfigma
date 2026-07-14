#!/usr/bin/env bash
# Create GitHub issues for Wave 2 VISUDEV visualization parity (Zielbilder).
# Usage: bash scripts/create-wave2-viz-parity-issues.sh [owner/repo]

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
MILESTONE="blueprint-wave-2-viz-parity"
REF=".qa/evidence/wave-2-references"

gh auth status >/dev/null
bash "${ECC_ROOT}/scripts/bootstrap-labels.sh" "${REPO}" >/dev/null

gh label create "wave-2" --repo "${REPO}" --color "0052CC" --description "Wave 2 visualization parity" 2>/dev/null || true
gh label create "visualization" --repo "${REPO}" --color "5319E7" --description "Visualization parity work" 2>/dev/null || true

MILESTONE_NUM=$(gh api "repos/${REPO}/milestones" --jq '.[] | select(.title=="'"${MILESTONE}"'") | .number' | head -1)
if [[ -z "${MILESTONE_NUM}" ]]; then
  MILESTONE_NUM=$(gh api -X POST "repos/${REPO}/milestones" \
    -f title="${MILESTONE}" \
    -f description="Wave 2 VISUDEV visualization parity vs reference Zielbilder" \
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

PREREQ="Wave 1 (#105–#113) ist gemerged. Shell, Footer und Basis-UI existieren; diese Wave schließt **Visualisierungs-Parität** zu den Zielbildern (kein leerer Graph, keine Duplikate, volle Inspektoren)."

COMMON_ASSUMPTIONS="## Annahmen
- Funktionale Parität mit Referenz-Visualisierung ist das Ziel; pixel-perfect ± vernünftige Abstände
- Blueprint-Enrichment füllt Layer/Topologie wenn echte Projektdaten dünn sind
- UI-Copy Deutsch, Commits Englisch
- Dev-URL: **http://localhost:3005** (IPv6/localhost only, nicht 127.0.0.1)"

echo "Creating Wave 2 viz parity issues on ${REPO} (milestone #${MILESTONE_NUM})..."
echo ""

# 1 — Cross-cutting P0
n=$(create_issue \
  "Wave 2 P0 — Demo-Enrichment & Playwright localhost:3005" \
  "## Kontext
${PREREQ}

Ohne sinnvolle Demo-/Enrichment-Daten erscheinen Blueprint-Views leer; Playwright nutzt aktuell \`127.0.0.1:3000\` statt \`localhost:3005\`.

## Problem
- Real-Graph-Projekte zeigen leere Layer/Topologie (kein sagadrive-freundlicher Fallback)
- \`playwright.config.ts\` baseURL weicht von Dev-URL ab → verify-ui schlägt fehl
- Kein einheitlicher Demo-Seed für alle 7 Blueprint-Views

## Lösung
- \`playwright.config.ts\`: \`baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3005'\`
- Blueprint-Enrichment: Demo-Fixtures oder sagadrive-kompatible Seeds für Architecture-Layers, Dependencies, Execution, Infrastructure, Atlas, Evolution, Diagnostics
- \`.env.example\` / README: PLAYWRIGHT_BASE_URL=http://localhost:3005
- Vitest/Playwright Smoke: jede Blueprint-View rendert nicht-leeren Hauptinhalt

## User Journey
1. Entwickler startet \`npm run dev\` → App auf localhost:3005
2. Playwright verify-ui nutzt dieselbe URL
3. Nutzer öffnet Blueprint ohne prior Scan → sieht referenznahe Demo-Daten statt leerer Canvas

## Architektur
- Erweitere \`blueprint-enrichment\` / Provider-Fallback
- Zentraler \`demo-graph-seed.ts\` oder sagadrive-Adapter
- Playwright spec: \`tests/e2e/wave2-viz-smoke.spec.ts\`

## UI/UX Design Skizze
Kein eigenes Zielbild — Enabler für alle 7 Views. Referenzen siehe \`${REF}/\`.

## Akzeptanzkriterien
- [ ] Playwright baseURL default localhost:3005
- [ ] Demo-Enrichment liefert Daten für alle 7 Blueprint-Views
- [ ] Keine leeren Haupt-Canvas bei Standard-Demo-Projekt
- [ ] \`npm run checks\` grün
- [ ] verify-ui Smoke-Spec für alle Views

Acceptance: \`.qa/acceptance/wave2-cross-cutting-enrichment.md\`

${COMMON_ASSUMPTIONS}" \
  "P0,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Cross-cutting enrichment"
CROSS="${n}"

# 2 — Architecture P0 regression
n=$(create_issue \
  "Wave 2 P0 — Architektur Regression: Layer-Stack & Domain-Dedupe" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_architecture-79bd757f-2ccb-404c-b9da-53ac55acd82a.png\`

Wave 1 #107 lieferte Layer-Stack-UI, aber auf echtem Graph: **leerer Stack**, **17× DOMAIN App.tsx Duplikate**.

## Problem
- \`build-layer-stack.ts\` / Enrichment liefert keine Layer bei dünnem Graph
- Domain-Dedupe fehlt → identische Module mehrfach
- Layers-Modus zeigt leere Mitte statt 7 Ebenen-Karten

## Lösung
- Fix Layer-Enrichment: 7 Ebenen aus Graph + Fallback-Demo
- Dedupe Domains/Modules by path + semantic key
- Zentrum: vertikaler Layer-Stack (Experience→Platform) mit Tags, Glow, Domain-Subcards
- Inspektor: Beschreibung, Verantwortlichkeiten, Services-Tabelle, Abhängigkeiten (NUTZT / WIRD GENUTZT VON)

## User Journey
1. Nutzer wählt Architektur → Layers-Tab
2. Sieht 7 farbige Ebenen mit Modul-Tags (wie Zielbild)
3. Klick Application Layer → Glow + Inspektor mit Services-Tabelle

## Architektur
- \`build-layer-stack.ts\`, \`ArchitectureLayerStack.tsx\`, \`ArchitectureInspector.tsx\`
- Enrichment-Hook aus #${CROSS}
- Domains/Layers/Modules Toggle unverändert

## UI/UX Design Skizze (Referenz)
- Tabs: Domains | **Layers** | Modules
- 7 horizontale Layer-Balken: Experience (blau), Application (cyan, selected glow), Domain (grün, Subcards), Integration (gold), Persistence (lila), Processing (indigo), Platform (stahlblau)
- Vertikale Verbindungslinie zwischen Layern
- Inspektor rechts: APPLICATION LAYER, Beschreibung, Verantwortlichkeiten (Checkmarks), Enthaltene Services (Tabelle), Abhängigkeiten mit farbigen Dots

## Akzeptanzkriterien
- [ ] 7 Layer-Karten sichtbar auf Demo- und Real-Graph
- [ ] Keine 17× App.tsx DOMAIN-Duplikate
- [ ] Selected-Glow auf aktiver Ebene
- [ ] Inspektor: Services-Tabelle + Abhängigkeiten
- [ ] Vitest + verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-architecture-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P0,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Architecture regression"
ARCH="${n}"

# 3 — Dependencies
n=$(create_issue \
  "Wave 2 P1 — Abhängigkeiten: Edge-Labels, Node-Karten, Auto-Select" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_dependencies-f4e1c629-27ac-4ec5-bf23-3ecd8e7df4ad.png\`

## Problem
- Kanten ohne Typ-Labels (Calls, Auth, DB, …)
- Nodes ohne reiche Karten (Typ, Datei, Icon)
- 8 Beziehungstypen-Chips ohne Auto-Selection zentraler Use-Case
- Inspektor unvollständig (Top-Abhängigkeiten fehlen)

## Lösung
- 8 \`RelationshipChip\`-Toggles mit korrekten Farben
- Rich node cards + edge mid-labels (Pill-Labels auf Kanten)
- Auto-select zentraler Use-Case-Node bei Load
- Inspektor: Beschreibung, Metadaten, eingehend/ausgehend, Top-Abhängigkeiten
- Minimap, Suche, Vollbild, Footer-Stats

## User Journey
1. Nutzer öffnet Abhängigkeiten → Graph mit CreateLeaveRequest zentriert
2. Kanten zeigen farbige Typ-Labels
3. Klick Node → Inspektor mit Top-Deps

## Architektur
- \`DependenciesView.tsx\`, Cytoscape styles, \`DependencyInspector.tsx\`

## UI/UX Design Skizze (Referenz)
- BEZIEHUNGSTYPEN: Imports, Calls, API Calls, Database, Events, Auth, Validation, External Services
- Zentraler blauer Use-Case-Knoten, Satelliten (Controller, Services, DB, EventBus)
- Gestrichelte farbige Kanten mit Pill-Labels
- Minimap unten links, Zoom - 100% +
- Inspektor: Modul, Verzeichnis, 8 eingehend / 7 ausgehend

## Akzeptanzkriterien
- [ ] 8 Beziehungstyp-Chips funktional
- [ ] Edge-Labels auf Kanten sichtbar
- [ ] Rich node cards mit Typ + Datei
- [ ] Auto-Selection + vollständiger Inspektor
- [ ] verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-dependencies-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P1,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Dependencies viz parity"
DEP="${n}"

# 4 — Execution
n=$(create_issue \
  "Wave 2 P1 — Execution: Pipeline, Timeline, 7 Tabs, Live-Badge" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_execution-21d6b4b7-ce63-414d-b7db-1f1d1d38d927.png\`

## Problem
- Pipeline-Schritte ohne horizontale Step-Cards + Timing
- Fehlende Timeline-Ruler (0–364ms)
- Metriken-Leiste (Gesamtdauer, Schritte, Fehler, Payload) fehlt
- 7 Detail-Tabs ohne Payload/Headers/Logs-Inhalt
- Kein Live (Streaming)-Badge

## Lösung
- 8 StepCards mit Dauer, Checkmarks, Pfeilen
- Timeline-Ruler unter Pipeline
- Metriken-Bar: 364ms, 8 Schritte, 0 Fehler, Services, DB, Events, Payload
- Schritte-Liste links + Tab-Panel: Übersicht, Payload, Headers, Logs, Stacktrace, Tags, Code-Standort
- Live-Badge + Trace-ID/Dauer Header

## User Journey
1. Nutzer öffnet Ausführung → sieht 8-Schritt-Pipeline LeaveRequest
2. Klick Schritt 1 → Tabs mit JSON Payload/Response
3. Live-Badge zeigt Streaming-Status

## Architektur
- \`ExecutionView.tsx\`, \`ExecutionPipeline.tsx\`, \`ExecutionStepDetail.tsx\`

## UI/UX Design Skizze (Referenz)
- Filter: Letzte 5 Minuten, LeaveRequest, Alle
- 8 farbige Step-Cards verbunden durch gestrichelte Pfeile
- Metriken-Zeile darunter
- Unten: SCHRITTE-Liste + Tab-Detail mit JSON-Blöcken und Tags

## Akzeptanzkriterien
- [ ] 8 Step-Cards mit Dauer sichtbar
- [ ] Timeline-Ruler + Metriken-Bar
- [ ] 7 Tabs mit Demo-Payload-Inhalt
- [ ] Live-Badge + Trace-Header
- [ ] verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-execution-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P1,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Execution viz parity"
EXEC="${n}"

# 5 — Infrastructure
n=$(create_issue \
  "Wave 2 P1 — Infrastruktur: Volle Topologie & Ressourcen-Inspektor" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_infrastructure-d2086d92-b47b-4a15-9ce8-134520c76466.png\`

## Problem
- Topologie unvollständig (fehlende External APIs, Monitoring-Tier)
- Keine Umgebung/Region/Ansicht-Filter
- Inspektor ohne Ressourcen-Meter (CPU, RAM, Netzwerk)
- Verbindungs-Legende fehlt

## Lösung
- Vollständige Topologie: Internet → LB → 4 Services → Data Tier → External APIs → Monitoring
- Filter: Produktion, eu-central-1, Logische Topologie
- Inspektor: Übersicht, RESSOURCEN (Balken), VERBINDUNGEN, Logs-Button
- Legende: HTTP, gRPC, Jobs, Datenzugriff, Extern

## User Journey
1. Nutzer wählt Infrastruktur → sieht LB→Services→DB Flow
2. Klick Web App → Inspektor mit CPU/RAM-Balken
3. Legende erklärt Kantenfarben

## Architektur
- \`InfrastructureView.tsx\`, \`InfrastructureTopology.tsx\`, \`InfrastructureInspector.tsx\`

## UI/UX Design Skizze (Referenz)
- Internet (Globe) → NGINX LB → Web/API/Worker/Auth → PostgreSQL/Redis/S3 → SendGrid/Stripe/Auth0 → Prometheus/Grafana/Loki

## Akzeptanzkriterien
- [ ] Alle Topologie-Tiers sichtbar
- [ ] 3 Filter-Dropdowns + Aktualisieren
- [ ] Ressourcen-Meter im Inspektor
- [ ] Verbindungs-Legende unten
- [ ] verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-infrastructure-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P1,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Infrastructure viz parity"
INFRA="${n}"

# 6 — Atlas
n=$(create_issue \
  "Wave 2 P2 — Atlas: Cluster-Farben, Stats-Bar, Legend, Zoom" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_atlas-b9c476de-1c77-46ac-b1a2-2ae140d0f2c6.png\`

## Problem
- Cluster ohne Farbcodierung (7 Typen)
- Fehlende floating Labels mit Metriken
- Stats-Bar (Systeme/Services/Module/Dateien/Abdeckung) fehlt
- Zoom-Controls und 7-Typ-Legende unvollständig
- Inspektor ohne Tabs (Übersicht, Details, Abhängigkeiten, Deployments)

## Lösung
- Isometrische Cluster mit 7 Farben + floating Label-Cards
- Stats-Bar oben links
- Zoom -/100%/+ und Center-View
- Legende: Frontend, Backend, Worker, Daten, Speicher, Externe, Sicherheit
- Rich Inspektor mit Mini-Dashboard, Top-Abhängigkeiten, Technologien, Aktivität

## User Journey
1. Nutzer öffnet Atlas → 3D/2D Stadt mit farbigen Clustern
2. Klick API SERVICE → Inspektor mit Tabs
3. Stats-Bar zeigt Gesamt-KPIs

## Architektur
- \`AtlasView.tsx\`, \`AtlasClusterLabels.tsx\`, \`AtlasInspector.tsx\`

## UI/UX Design Skizze (Referenz)
- WEB APP (blau), API SERVICE (grün), WORKER (lila), POSTGRESQL (orange), etc.
- Floating cards: nodes, modules, coverage %

## Akzeptanzkriterien
- [ ] 7 Cluster-Farben + floating Labels
- [ ] Stats-Bar mit 5 KPIs
- [ ] Zoom-Controls + Legende 7 Typen
- [ ] Inspektor 4 Tabs mit Inhalt
- [ ] verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-atlas-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P2,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Atlas viz parity"
ATLAS="${n}"

# 7 — Evolution
n=$(create_issue \
  "Wave 2 P2 — Evolution: Commit-Timeline, Snapshots, Sparklines" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_evolution-5663f2be-8d0f-4128-a222-55524a655f35.png\`

## Problem
- Commit-Timeline ohne interaktive Auswahl
- Atlas-Snapshot-Thumbnails fehlen
- Evolutions-Metriken ohne Sparklines
- 4-Spalten Änderungen (Neu/Geändert/Entfernt/Deps) unvollständig
- Commit-Inspektor ohne Statistik + Element-Detail

## Lösung
- Horizontale Timeline mit Commit-Dots + Selection-Glow
- 5 Atlas-Snapshot-Karten mit Mini-3D-Thumbnails
- 6 Metrik-Karten mit Sparklines (+4 Module, +6 Deps, Drift %, …)
- 4-Spalten Wesentliche Änderungen
- Inspektor: Commit-Header, Zusammenfassung, Statistik, geändertes Element, Komplexität/Instabilität

## User Journey
1. Nutzer wählt Evolution → Timeline-Tab
2. Klick Commit e9b3c42 → Snapshot + Metriken + 4-Spalten-Changes
3. Inspektor zeigt Autor, +/- Zeilen, Dependencies

## Architektur
- \`EvolutionView.tsx\`, \`EvolutionTimeline.tsx\`, \`EvolutionInspector.tsx\`

## UI/UX Design Skizze (Referenz)
- Tabs: Timeline | Commit Diff | Branch Compare | Working Tree
- Timeline Apr–Mai mit Payroll Integration selected
- Snapshot cards mit node/edge counts

## Akzeptanzkriterien
- [ ] Interaktive Commit-Timeline
- [ ] 5 Snapshot-Thumbnails
- [ ] 6 Metrik-Karten mit Sparklines
- [ ] 4-Spalten Änderungen
- [ ] Commit-Inspektor vollständig
- [ ] verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-evolution-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P2,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Evolution viz parity"
EVO="${n}"

# 8 — Diagnostics
n=$(create_issue \
  "Wave 2 P2 — Diagnosen: Matrix+Findings Layout, Pagination, Aktionen" \
  "## Kontext
${PREREQ}

Referenz: \`${REF}/visudev_diagnostics-8e141c18-e212-4a6f-86a0-a948f83e7920.png\`

## Problem
- Layout weicht ab: Matrix nicht oben, Findings nicht unten
- Keine Pagination (1-5 von 24)
- Problem-Inspektor ohne Evidence-SQL + verknüpfte Artefakte
- Aktionen (Als erledigt markieren, Ausnahmen) nicht funktional

## Lösung
- Split-Layout: Sicherheits-Matrix oben, FINDINGS-Tabelle unten
- Tabs: Security, Architecture, Completeness, Complexity, Evidence
- Pagination + Filter (Schweregrad, Bereich, Suche)
- Inspektor: Details, Auswirkung, Empfohlene Maßnahme, Evidence-Codeblock, Artefakt-Links
- Funktionale Status-Aktionen (Demo-State)

## User Journey
1. Nutzer öffnet Diagnosen → Matrix mit Route×Check Icons
2. Klick Finding SEC-001 → Inspektor mit SQL-Evidence
3. „Als erledigt markieren“ ändert Status

## Architektur
- \`DiagnosticsView.tsx\`, \`SecurityMatrix.tsx\`, \`FindingsTable.tsx\`, \`ProblemInspector.tsx\`

## UI/UX Design Skizze (Referenz)
- Matrix: Auth/Rolle/Validation/RLS/Audit/Status Spalten
- Findings: Kritisch/Hoch/Warnung Badges, Pagination footer
- Inspektor: SEC-001, RLS nicht aktiviert, Evidence SQL

## Akzeptanzkriterien
- [ ] Matrix oben + Findings unten
- [ ] Pagination funktional
- [ ] Evidence-Inspektor bei Select
- [ ] Status-Aktionen klickbar
- [ ] verify-ui Screenshot-Gate grün

Acceptance: \`.qa/acceptance/wave2-diagnostics-viz-parity.md\`

## Depends on
#${CROSS}

${COMMON_ASSUMPTIONS}" \
  "P2,agent-ready,blueprint,ui,wave-2,visualization")
echo "#${n} Diagnostics viz parity"
DIAG="${n}"

# Write intake
cat > .qa/intake/blueprint-wave-2-viz-parity-issues.md <<EOF
# Blueprint Wave 2 — Visualization Parity (Zielbilder)

Epic: **VISUDEV UI must match reference images — understand code WITHOUT reading code**

Prerequisite: Wave 1 #105–#113 merged.

## ECC Runner queue: \`${MILESTONE}\`

1. wave2-cross-cutting-enrichment (#${CROSS}) — P0
2. wave2-architecture-viz-parity (#${ARCH}) — P0
3. wave2-dependencies-viz-parity (#${DEP}) — P1
4. wave2-execution-viz-parity (#${EXEC}) — P1
5. wave2-infrastructure-viz-parity (#${INFRA}) — P1
6. wave2-atlas-viz-parity (#${ATLAS}) — P2
7. wave2-evolution-viz-parity (#${EVO}) — P2
8. wave2-diagnostics-viz-parity (#${DIAG}) — P2

Issues: #${CROSS}–#${DIAG}

Reference images: \`${REF}/\`

\`\`\`bash
export ECC_RUNNER_ROOT="\$HOME/.cursor/skills/ecc-runner"
cd Visudevfigma
# state.json: featureSlug=blueprint-wave-2-viz-parity, milestoneFilter=${MILESTONE}
bash "\$ECC_RUNNER_ROOT/scripts/sync-queue-to-state.sh"
@ecc-runner-loop continue
\`\`\`
EOF

echo ""
echo "Done. Issues #${CROSS}–#${DIAG}"
echo "Intake: .qa/intake/blueprint-wave-2-viz-parity-issues.md"
