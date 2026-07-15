# Acceptance: wave4-execution-fehlts

## Intent

Execution demo trace reduces FEHLT badges; Payload/Response JSON visible on the default capture path (Übersicht or Payload tab without empty state).

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-execution.png`

## Visual checklist

- [ ] Demo leave-request trace shows ≤1 FEHLT badge (prefer 0)
- [ ] Steps without evidence still show OK when demo enrichment fills payload/status
- [ ] Selecting first/default step shows request + response JSON (Übersicht or Payload)
- [ ] Headers + Logs tabs non-empty for default step
- [ ] Summary bar matches ≈8 Schritte / 0 Fehler

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave4-execution-fehlts.spec.ts --project=chromium
```

- Assert: pipeline cards with text "FEHLT" count ≤ 1
- Open Payload → assert JSON `{` present for request and response
- Screenshot execution view

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
