# Acceptance: wave5-execution-fine-tune

## Intent

Execution fine-tune: no FEHLT on default demo path, step timing labels, timeline strip, Payload + Response visible in overview.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-execution.png`

## Visual checklist

- [ ] 0 FEHLT badges on default LeaveRequest path
- [ ] ≥6 steps show duration (ms)
- [ ] Payload and Response both visible in overview
- [ ] Timeline / total duration visible

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave5-execution-fine-tune.spec.ts --project=chromium
```

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
