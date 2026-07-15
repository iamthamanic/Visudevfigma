# Acceptance: wave5-diagnostics-filter-chrome

## Intent

Diagnostics findings filter chrome (severity/area/search) and polished matrix status badges matching Zielbild.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-diagnostics.png`

## Visual checklist

- [ ] Severity dropdown visible (`Alle Schweregrade`)
- [ ] Area dropdown visible (`Alle Bereiche`)
- [ ] Search input (`Suche Findings…`)
- [ ] Matrix status badges styled for Warnung / Kritisch / OK
- [ ] Wave-4 findings scale (≥20) preserved

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave5-diagnostics-filter-chrome.spec.ts --project=chromium
```

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
