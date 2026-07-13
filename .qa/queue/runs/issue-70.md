# Issue #70 — Architecture view

## Phase: implement → verify
- Extended Software Graph with `layer` and `repository` node kinds
- Graph builder: domain → layer → module → file hierarchy
- ArchitectureView with hierarchical Cytoscape layout, collapse/expand, kind filters
- BlueprintViewShell: Architecture tab added
- Tests: heuristics, projection, component, builder, layout preset

## Checks
- `npm run checks` — PASS (85 tests)
