# Acceptance: wave2-evolution-viz-parity

## Intent

Evolution view matches reference: commit timeline, atlas snapshots, sparkline metrics, 4-column changes, inspector.

## Reference screenshot

`.qa/evidence/wave-2-references/visudev_evolution-5663f2be-8d0f-4128-a222-55524a655f35.png`

## Visual checklist

- [ ] View title "EVOLUTION" with German subtitle
- [ ] Tabs: Timeline (active), Commit Diff, Branch Compare, Working Tree
- [ ] Filters: Zeitraum (Letzte 30 Tage), Filter button
- [ ] Horizontal commit timeline with dated dots and labels
- [ ] Selected commit has blue glow/border (e.g. Payroll Integration)
- [ ] ATLAS SNAPSHOTS section with ≥4 thumbnail cards
- [ ] Each snapshot shows mini 3D architecture preview
- [ ] Snapshot cards show node + connection counts
- [ ] Selected snapshot matches selected commit (checkmark)
- [ ] EVOLUTIONS-METRIKEN: 6 metric cards
- [ ] Metrics: Neue Module, Geänderte Abhängigkeiten, Architektur-Drift, Komplexität, Instabilität, Kopplung
- [ ] Each metric card has sparkline mini-chart
- [ ] WESENTLICHE ÄNDERUNGEN: 4 columns
- [ ] Column 1: Neue Module (green + icons)
- [ ] Column 2: Geänderte Module (orange icons)
- [ ] Column 3: Entfernte Module (red minus)
- [ ] Column 4: Top Abhängigkeits-Änderungen with version arrows
- [ ] Inspector: commit hash, title, author avatar, timestamp
- [ ] Inspector: Zusammenfassung paragraph
- [ ] Inspector: Statistik (+modules, +/- lines)
- [ ] Inspector: Geändertes Element card with Neu badge
- [ ] Inspector: Komplexität + Instabilität colored boxes

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave2-evolution-viz.spec.ts --project=chromium
```

- Assert: `[data-testid="evolution-timeline"]` with ≥3 commit dots
- Assert: `[data-testid="evolution-snapshot-card"]` count ≥ 4
- Assert: `[data-testid="evolution-metric-card"]` count ≥ 6
- Assert: `[data-testid="evolution-changes-column"]` count = 4
- Screenshot timeline + inspector after commit click

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
