# Acceptance: wave2-atlas-viz-parity

## Intent

Atlas view matches reference: color clusters, floating labels, stats bar, legend, zoom, rich inspector.

## Reference screenshot

`.qa/evidence/wave-2-references/visudev_atlas-b9c476de-1c77-46ac-b1a2-2ae140d0f2c6.png`

## Visual checklist

- [ ] 3D/2D isometric grid background with perspective
- [ ] Stats bar top-left: Systeme, Services, Module, Dateien, Abdeckung %
- [ ] ≥6 colored building clusters (WEB APP blue, API green, WORKER purple, etc.)
- [ ] Floating label cards per cluster with name + framework + metrics
- [ ] Cluster labels show nodes/modules/coverage counts
- [ ] 2D toggle and fullscreen controls top-right
- [ ] Zoom controls bottom-right (-, 100%, +, center view)
- [ ] Legend bottom-center with 7 types: Frontend, Backend, Worker, Daten, Speicher, Externe, Sicherheit
- [ ] Each legend dot matches cluster accent color
- [ ] Click cluster → selection highlight
- [ ] Inspector: title + type + Gesund status pulse
- [ ] Inspector tabs: Übersicht, Details, Abhängigkeiten, Deployments
- [ ] Inspector: 2×2 mini dashboard (Services, Module, Dateien, Abdeckung)
- [ ] Inspector: Top Abhängigkeiten list with counts
- [ ] Inspector: Technologien tag chips (NestJS, TypeScript, …)
- [ ] Inspector: Aktivität timeline with recent events
- [ ] "In App Flow anzeigen" action button

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave2-atlas-viz.spec.ts --project=chromium
```

- Assert: `[data-testid="atlas-stats-bar"]` visible with ≥4 stat items
- Assert: `[data-testid="atlas-cluster"]` count ≥ 6
- Assert: `[data-testid="atlas-legend"]` with 7 legend items
- Assert: `[data-testid="atlas-zoom-controls"]` visible
- Screenshot atlas canvas + inspector after cluster click

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
