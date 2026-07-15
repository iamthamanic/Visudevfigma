# Acceptance: wave3-evolution-git-timeline

## Intent

Evolution view timeline shows commit dots from demo git summary aligned with snapshot cards.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-evolution.png`

## Visual checklist

- [ ] Horizontal timeline with ≥3 commit dots (data-testid evolution-commit-dot)
- [ ] Dots positioned along timeline proportional to dates
- [ ] Active/hover commit shows tooltip or label (short SHA + message)
- [ ] Timeline syncs with 5 snapshot cards below
- [ ] Sparkline metric cards unchanged from Wave 2

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave3-evolution-git-timeline.spec.ts --project=chromium
```

- Assert: `[data-testid="evolution-timeline"]` visible
- Assert: `[data-testid="evolution-commit-dot"]` count ≥ 3
- Screenshot evolution view

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
