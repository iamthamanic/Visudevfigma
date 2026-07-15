# Acceptance: wave4-atlas-3d-polish

## Intent

Atlas 3D closes Wave-3 monochrome gap: colored cluster meshes, selection glow, floating labels, and a richer cluster inspector (NestJS/stack, deps, activity).

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-atlas.png`

## Visual checklist

- [ ] Cluster buildings use category hues (Frontend blue, Backend green, Worker purple, Daten orange, Speicher teal, Sicherheit yellow, Externe gray) — not monochrome gray
- [ ] Selected cluster has visible glow / emissive ring
- [ ] Floating labels above clusters remain readable (≥6)
- [ ] Inspector for API SERVICE shows NestJS · Backend-System (or equivalent stack), Top-Abhängigkeiten, Technologien, Aktivität
- [ ] Stats bar shows Module/Dateien closer to Zielbild scale (Modules ≫ 2, Files ≫ 3)

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave4-atlas-3d-polish.spec.ts --project=chromium
```

- Assert: `[data-testid="atlas-cluster"]` ≥ 6 with `data-cluster-color` set
- Assert: selected cluster `[data-selected="true"]` and glow marker present
- Assert: `[data-testid="atlas-inspector"]` contains NestJS or Backend and Dependency/Aktivität section
- Screenshot atlas view vs ziel-atlas.png

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
