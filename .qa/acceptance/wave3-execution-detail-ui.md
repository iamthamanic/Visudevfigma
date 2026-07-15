# Acceptance: wave3-execution-detail-ui

## Intent

Execution detail panel matches Zielbild: Payload/Headers/Logs tabs show syntax-highlighted JSON, step click populates panels, fewer missing-data badges.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-execution.png`

## Visual checklist

- [ ] Click pipeline step → detail panel updates (Schritt X von 8)
- [ ] Payload tab: request + response JSON blocks with Kopieren buttons
- [ ] Headers tab: key/value table or JSON for HTTP headers
- [ ] Logs tab: timestamped log lines (not empty placeholder)
- [ ] Übersicht tab: DETAILS metadata table (duration, status, service)
- [ ] No excessive "FEHLT" / "Keine Daten" badges on demo trace steps
- [ ] Tags tab: grey pills (http.method, feature, etc.)

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave3-execution-detail-ui.spec.ts --project=chromium
```

- Click step 2 → open Payload tab → assert `[data-testid="execution-detail-tab-payload"]` contains `{`
- Open Headers tab → assert `[data-testid="execution-detail-tab-headers"]` non-empty
- Open Logs tab → assert `[data-testid="execution-detail-tab-logs"]` has ≥1 log line
- Screenshot pipeline + detail panel

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
