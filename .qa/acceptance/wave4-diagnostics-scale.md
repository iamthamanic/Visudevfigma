# Acceptance: wave4-diagnostics-scale

## Intent

Diagnostics reaches Zielbild density: ≥5 matrix routes, ~24 paginated findings, Evidence SQL visible by default after auto-select.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-diagnostics.png`

## Visual checklist

- [ ] Security matrix shows ≥5 route rows on demo/E2E project
- [ ] Findings total ≈24 with pagination ("1-5 von 24" or equivalent)
- [ ] First critical finding auto-selected on load
- [ ] Problem inspector Evidence SQL code block visible without extra click (real SQL, not only `-- Evidence SQL` stub)
- [ ] Matrix + findings layout preserved

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave4-diagnostics-scale.spec.ts --project=chromium
```

- Assert: `[data-testid="security-matrix-row"]` ≥ 5
- Assert: `[data-testid="findings-pagination"]` total ≥ 20
- Assert: `[data-testid="problem-inspector-evidence"]` visible and matches `/SELECT|FROM|pg_/i`
- Screenshot diagnostics view

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
