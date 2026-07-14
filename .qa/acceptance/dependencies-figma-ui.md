# Acceptance: dependencies-figma-ui (#87)

## Intent

Match Dependencies Figma mockup: colored Beziehungstypen chips, graph canvas, right Inspektor, Top-Abhängigkeiten summary.

## Criteria

- [x] `BlueprintViewLayout` with controls, canvas, and right `InspectorPanel`
- [x] Checkbox filters replaced with `RelationshipChip` toggles for dependency edge kinds
- [x] Top Abhängigkeiten list shows counts per kind (sorted by count)
- [x] Inspektor shows selected edge metadata and evidence excerpts
- [x] Cytoscape edges colored via `--color-bp-rel-*` tokens per kind
- [x] Functional filter/evidence behavior unchanged
- [x] Vitest + `npm run checks` green
