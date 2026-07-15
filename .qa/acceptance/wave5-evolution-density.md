# Acceptance: wave5-evolution-density

## Intent

Evolution density: richer timeline commits, snapshot thumbnails closer to Zielbild, richer changes grid.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-evolution.png`

## Visual checklist

- [ ] ≥5 timeline commits with titles
- [ ] ≥5 snapshot cards with thumbnail visual hint
- [ ] Changes grid with 4 columns (new / changed / removed / deps)
- [ ] Existing ≥6 metric cards preserved

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave5-evolution-density.spec.ts --project=chromium
```

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
