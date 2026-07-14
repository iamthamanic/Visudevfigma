# Acceptance: wave2-dependencies-viz-parity

## Intent

Dependencies graph matches reference: 8 relationship chips, edge labels, rich nodes, auto-select, inspector.

## Reference screenshot

`.qa/evidence/wave-2-references/visudev_dependencies-f4e1c629-27ac-4ec5-bf23-3ecd8e7df4ad.png`

## Visual checklist

- [ ] View title "DEPENDENCIES" with project subtitle
- [ ] 8 BEZIEHUNGSTYPEN chips: Imports, Calls, API Calls, Database, Events, Auth, Validation, External Services
- [ ] Each chip has correct accent color (blue, green, cyan, purple, pink, orange, lime, cobalt)
- [ ] Toolbar: Filter, search "Im Graph suchen…", Vollbild
- [ ] Central Use-Case node card (CreateLeaveRequest) with type + file path
- [ ] Satellite nodes: Controller, Services, Repository, Policy, DB, EventBus, Worker
- [ ] Node cards show icon, name, type badge, file path
- [ ] Edges are dashed/colored with mid-edge pill labels (Calls, Auth, DB, …)
- [ ] Minimap bottom-left with viewport rectangle
- [ ] Zoom controls (-, 100%, +) visible
- [ ] Auto-selected central node on load
- [ ] Inspector: description paragraph (German)
- [ ] Inspector: Modul, Verzeichnis, Verantwortlich, Letzte Änderung
- [ ] Inspector: 8 eingehend / 7 ausgehend counts
- [ ] Inspector: Top-Abhängigkeiten lists with relationship badges

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave2-dependencies-viz.spec.ts --project=chromium
```

- Navigate to Dependencies view
- Assert: `[data-testid="relationship-chip"]` count = 8
- Assert: `[data-testid="edge-label"]` visible (≥3)
- Assert: `[data-testid="dependency-inspector"]` visible
- Screenshot graph canvas + inspector

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
