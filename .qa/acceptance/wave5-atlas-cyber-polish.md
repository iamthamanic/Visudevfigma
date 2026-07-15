# Acceptance: wave5-atlas-cyber-polish

## Intent

Atlas cyber-city polish: neon glow plates under clusters, accurate coverage % on labels, denser NestJS-style inspector (tech chips + activity feed).

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-atlas.png`

## Visual checklist

- [ ] ≥6 clusters have visible glow plates (category-colored neon ground/rim)
- [ ] ≥4 floating labels show coverage ≥90%
- [ ] Inspector tech chips ≥4 for API SERVICE
- [ ] Inspector activity feed ≥3 events with relative times
- [ ] Wave-4 category colors + selection glow preserved

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave5-atlas-cyber-polish.spec.ts --project=chromium
```

- Assert glow plates present
- Assert coverage labels ≥90% for ≥4 clusters
- Assert tech chips ≥4 and activity items ≥3
- Screenshot atlas vs ziel-atlas.png

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
