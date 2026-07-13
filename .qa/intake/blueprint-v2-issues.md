# Blueprint v2 — High-Level Slice Plan (Intake)

<!-- companion to .qa/design/blueprint-v2.md -->

This document records the implementation phases for the VisuDEV Blueprint v2 multi-view architecture tool. Each slice is a GitHub-issue-sized unit with title, priority, dependencies, and scope summary. Full issue bodies are not written yet.

## Epic

**Title:** Blueprint v2 — Multi-View Technical Architecture Tool on Shared Software Graph
**Goal:** Transform Blueprint from a Security Matrix into seven views (Atlas, Architecture, Dependencies, Execution, Infrastructure, Diagnostics, Evolution) built on a neutral Software Graph IR.
**Epic design:** `.qa/design/blueprint-v2.md`

---

## Phase 0 — Foundation: Software Graph IR

| Field               | Value                                                                                                                                                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Define neutral Software Graph schema and builder                                                                                                                                                                                                                                         |
| **Priority**        | P0 — blocker for all other slices                                                                                                                                                                                                                                                        |
| **Dependencies**    | `.qa/design/visudev-graph-ir.md`, `blueprint-engine-pluggable.md`, existing `blueprint-enrichment.service.ts`                                                                                                                                                                            |
| **What it covers**  | Add `SoftwareGraph` types; add optional `graph` field to `BlueprintDocument`; build `software-graph-builder.service.ts` that converts `RawBlueprintScan` into graph nodes/edges/evidence/groups/metrics/findings/snapshots/layouts; attach graph in enrichment service; Deno unit tests. |
| **Out of scope**    | UI changes; 2D/3D rendering; deprecating legacy report fields.                                                                                                                                                                                                                           |
| **Acceptance hint** | Every new `BlueprintDocument` contains a valid `SoftwareGraph`; old documents still load.                                                                                                                                                                                                |

---

## Phase 1 — View Shell + Diagnostics Migration

| Field               | Value                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Blueprint view shell and Diagnostics view                                                                                                                                                                           |
| **Priority**        | P0                                                                                                                                                                                                                  |
| **Dependencies**    | Phase 0 complete; existing `BlueprintPage.tsx`, `SecurityMatrix.tsx`, `RouteBlueprintCanvas.tsx`, `FindingInspector.tsx`                                                                                            |
| **What it covers**  | Create `BlueprintViewShell` with seven-view navigation; migrate existing Security Matrix / Route Canvas / Inspector into `DiagnosticsView`; keep all v1 behavior; CSS Modules for shell; Vitest + Playwright smoke. |
| **Out of scope**    | New graph rendering engine; new views beyond Diagnostics.                                                                                                                                                           |
| **Acceptance hint** | Users can switch between seven tabs; Diagnostics is default and identical to current Blueprint page.                                                                                                                |

---

## Phase 2 — Architecture View

| Field               | Value                                                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Architecture view: domains, layers, modules                                                                                                                                                        |
| **Priority**        | P1                                                                                                                                                                                                 |
| **Dependencies**    | Phase 1 complete; `GraphCanvas` wrapper; `SoftwareGraph` grouping fields                                                                                                                           |
| **What it covers**  | Heuristic domain/layer/module grouping in graph builder; hierarchical Cytoscape layout; `ArchitectureView` component; node kinds: domain, layer, module, route, service, repository, table; tests. |
| **Out of scope**    | User-editable architecture model; 3D.                                                                                                                                                              |
| **Acceptance hint** | Architecture view renders a collapsible tree of project structure.                                                                                                                                 |

---

## Phase 3 — Dependencies View

| Field               | Value                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Dependencies view: imports, calls, API, events, data                                                                                    |
| **Priority**        | P1                                                                                                                                      |
| **Dependencies**    | Phase 2 complete; edge classification in graph builder                                                                                  |
| **What it covers**  | Extend graph builder with import/call/API/data/event edges; force-directed / dagre layout; `DependenciesView` with edge filters; tests. |
| **Out of scope**    | Interactive edge editing; dependency constraint enforcement.                                                                            |
| **Acceptance hint** | Users can filter edges by type and inspect any node/edge.                                                                               |

---

## Phase 4 — Execution + Infrastructure Views

| Field               | Value                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Execution and Infrastructure views                                                                                                                                     |
| **Priority**        | P1                                                                                                                                                                     |
| **Dependencies**    | Phase 3 complete; route/scope data in graph                                                                                                                            |
| **What it covers**  | `ExecutionView`: sequence layout per route/use case; `InfrastructureView`: runtime/deployment/external system map inferred from facts; layout presets per view; tests. |
| **Out of scope**    | Live tracing or runtime telemetry integration.                                                                                                                         |
| **Acceptance hint** | Execution view shows route pipeline; Infrastructure view shows where code runs.                                                                                        |

---

## Phase 5 — Evolution View

| Field               | Value                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Evolution view: working tree, commit diff, branch compare, timeline                                                                                       |
| **Priority**        | P2                                                                                                                                                        |
| **Dependencies**    | Phase 4 complete; `snapshots` support in graph schema; git access from local engine / runner                                                              |
| **What it covers**  | Add `snapshots` and `diff` to `SoftwareGraph`; build `EvolutionView` with working tree, commit diff, branch compare, timeline; tests with mock git state. |
| **Out of scope**    | Full Git history analytics; pull-request diff UI.                                                                                                         |
| **Acceptance hint** | Users can select two commits/branches and see affected graph nodes.                                                                                       |

---

## Phase 6 — Atlas View (2D first, 3D optional)

| Field               | Value                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Atlas view: 2D system map with optional 3D city mode                                                                                                                |
| **Priority**        | P2                                                                                                                                                                  |
| **Dependencies**    | Phase 5 complete; full graph available                                                                                                                              |
| **What it covers**  | `AtlasView` 2D clustered/density map of whole graph; prototype 3D city with React Three Fiber only if 2D is insufficient; performance budget and node limit; tests. |
| **Out of scope**    | Gamified navigation; VR/AR.                                                                                                                                         |
| **Acceptance hint** | Atlas gives an immediate high-level overview of system size and clusters.                                                                                           |

---

## Phase 7 — Graph-Derived Legacy Retirement

| Field               | Value                                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**           | Derive legacy report views from Software Graph                                                                                                                                                                                                              |
| **Priority**        | P2                                                                                                                                                                                                                                                          |
| **Dependencies**    | All prior phases complete; graph is stable                                                                                                                                                                                                                  |
| **What it covers**  | Re-implement Security Matrix, Route Canvas, and Findings as projections of `SoftwareGraph`; deprecate legacy `routes[]`, `securityMatrix[]`, `findings[]` fields; `normalizeBlueprintData` synthesizes legacy fields from graph when missing; parity tests. |
| **Out of scope**    | Removing legacy fields completely (keep for one more major version).                                                                                                                                                                                        |
| **Acceptance hint** | Old UI works from graph-only documents with identical behavior.                                                                                                                                                                                             |

---

## Cross-Cutting Concerns (not standalone issues yet)

- **Performance & scaling:** define max node/edge limits, lazy subgraph loading, view-level filters.
- **Accessibility:** keyboard navigation between views, ARIA labels on graph nodes, 2D fallback if 3D is added.
- **GitHub mode mirror:** decide whether full graph is mirrored to Supabase storage or fetched on demand.
- **Bundle size:** Cytoscape and optional Three.js must be code-split per view.

---

## Suggested next command

`@implement blueprint-v2 phase-0` to begin with the Software Graph schema and builder.
