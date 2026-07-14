# Design: Blueprint v2 UI — Figma-aligned polish layer

<!-- UI phase on top of completed functional Blueprint v2 (#67–#75) -->

## Problem & Intent

Blueprint v2 functional views (#67–#75) ship graph projections, filters, and tests — but the UI is a **developer scaffold**: horizontal English tabs, HTML checkboxes, bare Cytoscape canvases, no shared Inspektor panel.

**Goal:** Match the Figma mockups (Dependencies, Execution, Infrastructure, Diagnostics, Evolution, Architecture, Atlas) with a cohesive dark UI: sidebar sub-navigation, German copy, colored relationship chips, step cards, metric cards, and a right-hand Inspektor.

**Prerequisite:** SoftwareGraph + all seven functional views merged to `main` (done).

## Non-Goals

- Changing graph builder logic or enrichment (unless UI reveals a projection bug).
- Replacing App Flow / Data modules.
- Full 3D Atlas in the first UI slice (2D polish first; 3D is a separate optional issue).

## Navigation Model

| Current                                 | Target                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Horizontal tabs in `BlueprintViewShell` | Blueprint sub-nav in shell sidebar under **Blueprint**                                       |
| English labels                          | German: Atlas, Architektur, Abhängigkeiten, Ausführung, Infrastruktur, Diagnosen, Evolution  |
| One tab bar per page                    | Persistent view header + optional sub-tabs per view (e.g. Evolution: Timeline / Commit Diff) |

## Shared UI Primitives

Reusable components under `src/components/blueprint-ui/` (or `src/modules/blueprint/components/ui/`):

- `BlueprintViewLayout` — canvas + right Inspektor slot
- `InspectorPanel` — title, badges, sections, code excerpt
- `RelationshipChip` — toggle chip with icon + accent color per edge kind
- `MetricCard` — sparkline placeholder, delta vs baseline
- `StepCard` — execution pipeline step with timing badge
- `StatusBadge` — RUNNING / confirmed / missing / unknown
- `ViewSectionTitle` — uppercase section labels (BEZIEHUNGSTYPEN, INSPECTOR)

CSS Modules only; DaisyUI for buttons/badges where it fits AGENTS.md.

## Per-View Targets (Figma reference)

| View               | Key UI elements                                                                      |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Shell**          | Sidebar sub-nav, project/branch breadcrumb, view title                               |
| **Dependencies**   | Colored Beziehungstypen chips, graph canvas, Inspektor, Top-Abhängigkeiten list      |
| **Execution**      | Horizontal step cards, Schritte list, detail tabs (Übersicht, Payload, Logs…)        |
| **Infrastructure** | Service cards (Web App, API, DB), status badges, resource bars in Inspektor          |
| **Diagnostics**    | Security sub-tabs, matrix table styling, findings severity badges, Problem-Inspektor |
| **Architecture**   | Layer stack cards with glow borders, Domains/Layers/Modules toggle                   |
| **Evolution**      | Snapshot cards, metric row, Timeline sub-tabs, diff legend                           |
| **Atlas 2D**       | Search, cluster labels, floating node labels, Inspektor                              |
| **Atlas 3D**       | React Three Fiber city (lazy, toggle) — optional follow-up                           |

## Phase Order

0. Shared tokens + UI primitives
1. Shell + sidebar sub-navigation
2. Dependencies UI
3. Execution UI
4. Infrastructure UI
5. Diagnostics UI
6. Architecture UI
7. Evolution UI
8. Atlas 2D UI polish
9. Atlas 3D city mode (optional)

## Acceptance Pattern

Each view issue:

- [ ] Layout matches Figma structure (canvas + Inspektor + controls)
- [ ] German UI copy
- [ ] Uses shared blueprint-ui components (no one-off duplicates)
- [ ] Existing functional tests still pass; add Vitest smoke for new layout
- [ ] `npm run checks` green
- [ ] Optional: Playwright verify-ui screenshot smoke

## Reference Assets

Figma mockups attached in parent chat (Dependencies, Execution, Infrastructure, Diagnostics, Evolution, Architecture, Atlas).
