# Acceptance: wave5-shell-footer-health

## Intent

Shell footer health line „Keine kritischen Probleme“ plus residual header polish if needed.

## Reference

Zielbild status/health affordances; Wave-4 footer counts preserved.

## Visual checklist

- [ ] Footer shows „Keine kritischen Probleme“ (`footer-health-line`)
- [ ] Module/Datei counts remain Zielbild-scale in demo
- [ ] Health line persists across Blueprint views

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave5-shell-footer-health.spec.ts --project=chromium
```

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
