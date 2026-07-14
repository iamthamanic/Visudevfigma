# Acceptance: dependencies-view (#71)

## Intent

Visualize cross-module dependencies via imports, calls, API, events, and data edges with evidence inspection.

## Criteria

- [x] DependenciesView renders nodes and edges from SoftwareGraph
- [x] Edge filters for import, call, api, event, data work independently
- [x] Clicking an edge shows evidence in an inspector panel
- [x] Graph builder classifies edges with correct kinds and evidence
- [x] Component and unit tests pass
- [x] npm run checks green
