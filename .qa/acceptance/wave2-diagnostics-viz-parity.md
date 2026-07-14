# Acceptance: wave2-diagnostics-viz-parity

## Intent

Diagnostics view matches reference: matrix top, findings bottom, pagination, evidence inspector, functional actions.

## Reference screenshot

`.qa/evidence/wave-2-references/visudev_diagnostics-8e141c18-e212-4a6f-86a0-a948f83e7920.png`

## Visual checklist

- [ ] View title "DIAGNOSTICS" with German subtitle
- [ ] Tabs: Security (active), Architecture, Completeness, Complexity, Evidence
- [ ] Sicherheits-Matrix section above findings
- [ ] Matrix columns: Route, Auth, Rolle, Validation, RLS, Audit, Status
- [ ] Matrix cells: green check, orange warning, red X, grey unchecked icons
- [ ] Status column badges: Warnung, Hoch, Kritisch
- [ ] FINDINGS (N) section below matrix with count
- [ ] Findings filters: Schweregrad, Bereich, Suche
- [ ] Findings table: Schweregrad, Titel, Bereich, Route/Datei, Erkannt, Status
- [ ] Severity badges: Kritisch (red), Hoch, Warnung (orange)
- [ ] Row selection highlight on click
- [ ] Pagination: "1-5 von N Findings" with page numbers
- [ ] Rows-per-page dropdown
- [ ] Problem Inspektor panel on right
- [ ] Inspector: severity badge + ID (SEC-001)
- [ ] Inspector: title + summary
- [ ] Inspector: metadata grid (Bereich, Route, timestamps)
- [ ] Inspector: Details + Auswirkung + Empfohlene Maßnahme sections
- [ ] Inspector: Evidence code block (SQL)
- [ ] Inspector: Verknüpfte Artefakte file links
- [ ] "Als erledigt markieren" primary button functional
- [ ] "Ausnahmen verwalten" secondary button visible

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave2-diagnostics-viz.spec.ts --project=chromium
```

- Assert: `[data-testid="security-matrix"]` visible above `[data-testid="findings-table"]`
- Assert: `[data-testid="findings-pagination"]` visible
- Click first finding → assert `[data-testid="problem-inspector-evidence"]` visible
- Click "Als erledigt markieren" → assert status changes to Erledigt
- Screenshot matrix + findings + inspector

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
