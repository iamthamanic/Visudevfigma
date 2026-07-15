# Acceptance: wave3-atlas-3d-polish

## Intent

Atlas 3D scene matches Zielbild polish: distinct cluster colors, glow on selection, floating labels, populated cluster inspector.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-atlas.png`

## Visual checklist

- [ ] ≥6 clusters with distinct hue per cluster type (API, Domain, Data, etc.)
- [ ] Selected cluster: glow ring or emissive highlight
- [ ] Floating labels above clusters (readable at default zoom)
- [ ] Inspector shows cluster name, node count, dependency summary when cluster selected
- [ ] Stats bar + legend unchanged from Wave 2

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave3-atlas-3d-polish.spec.ts --project=chromium
```

- Assert: `[data-testid="atlas-cluster"]` count ≥ 6
- Assert: `[data-testid="atlas-cluster-label"]` count ≥ 6
- Assert: selected cluster has `[data-selected="true"]`
- Assert: `[data-testid="atlas-inspector"]` visible with cluster title
- Screenshot atlas view

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
