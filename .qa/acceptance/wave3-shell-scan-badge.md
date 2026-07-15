# Acceptance: wave3-shell-scan-badge

## Intent

Blueprint shell shows completed scan status in demo/E2E mocks instead of "Noch nicht gescannt".

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-architecture.png` (header badge area)

## Visual checklist

- [ ] Scan chip shows "Scan abgeschlossen" when blueprint loaded with completed scan
- [ ] Optional secondary hint "Zuletzt gescannt" with relative or formatted timestamp
- [ ] Playwright mocks seed `scanStatuses.blueprint.status === "completed"`
- [ ] No "NOCH NICHT GESCANNT" / "Noch nicht gescannt" on demo project after enrichment load
- [ ] Rescan still shows "Analysiere…" while running

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave3-shell-scan-badge.spec.ts --project=chromium
```

- Assert: `[data-testid="blueprint-scan-badge"]` contains "Scan abgeschlossen"
- Screenshot shell header on architecture view

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
