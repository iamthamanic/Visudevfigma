# Acceptance: wave4-footer-stats

## Intent

Blueprint footer (and Atlas stats) show demo Module/Dateien scale closer to Zielbild; avoid footer zeros on enriched demo graphs.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-atlas.png` (header stats) + footer on Blueprint views

## Visual checklist

- [ ] Footer Module count ≥ 100 on demo/E2E project (Zielbild ~1248 Modules)
- [ ] Footer Dateien count ≥ 500 (Zielbild ~5732 Files)
- [ ] Atlas stats bar Module/Dateien align with footer order-of-magnitude
- [ ] Dependency count remains plausible (≥ 6)
- [ ] No "0 Module / 0 Dateien" after blueprint enrichment load

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave4-footer-stats.spec.ts --project=chromium
```

- Assert: `[data-testid="blueprint-footer-stats"]` module ≥ 100, files ≥ 500
- Screenshot architecture or atlas with footer visible

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
