# Acceptance: wave3-diagnostics-scale

## Intent

Diagnostics view scales to Zielbild density: 5+ matrix rows, ~24 paginated findings, evidence SQL in inspector.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-diagnostics.png`

## Visual checklist

- [ ] Security matrix shows ≥5 route rows on demo project
- [ ] Findings table lists paginated results (~24 total, 5 per page default)
- [ ] Pagination footer: "1-5 von 24" (or equivalent) with page controls
- [ ] First critical finding inspector shows Evidence SQL code block
- [ ] Matrix + findings layout preserved from Wave 2

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave3-diagnostics-scale.spec.ts --project=chromium
```

- Assert: `[data-testid="security-matrix-row"]` count ≥ 5
- Assert: `[data-testid="findings-pagination"]` shows total ≥ 20
- Click SEC-001 → assert `[data-testid="problem-inspector-evidence"]` contains SQL
- Screenshot diagnostics view

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
