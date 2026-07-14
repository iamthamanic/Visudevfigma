# Acceptance: wave2-architecture-viz-parity

## Intent

Architecture Layers view matches reference: 7-layer stack, no DOMAIN duplicates, rich inspector.

## Reference screenshot

`.qa/evidence/wave-2-references/visudev_architecture-79bd757f-2ccb-404c-b9da-53ac55acd82a.png`

## Visual checklist

- [ ] View title "ARCHITECTURE" with German subtitle
- [ ] Tabs: Domains | Layers | Modules — Layers default/active
- [ ] 7 horizontal layer bands visible (Experience through Platform)
- [ ] Each layer has distinct accent color matching reference palette
- [ ] Layer shows icon + title + short description
- [ ] Module/service tags visible inside layers (e.g. HR Service, PostgreSQL)
- [ ] Domain layer shows sub-cards (People, Time, Leave, …)
- [ ] Vertical connector line between layers
- [ ] Selected layer has glow/highlight border (Application Layer cyan)
- [ ] No duplicate "App.tsx" DOMAIN entries (max 1 per semantic module)
- [ ] Inspector header shows selected layer name + icon
- [ ] Inspector: Beschreibung paragraph
- [ ] Inspector: Verantwortlichkeiten list with checkmarks
- [ ] Inspector: Enthaltene Services table (Service | Modul | Count)
- [ ] Inspector: Abhängigkeiten NUTZT / WIRD GENUTZT VON with colored dots

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave2-architecture-viz.spec.ts --project=chromium
```

- Navigate to Architecture view
- Screenshot `[data-testid="architecture-layer-stack"]`
- Assert: `[data-testid="layer-card"]` count ≥ 7
- Assert: `[data-testid="architecture-inspector"]` visible after layer click
- Assert: no duplicate `[data-testid="domain-module"][data-path*="App.tsx"]` > 1

## Criteria

- [ ] All visual checklist items pass
- [ ] Vitest architecture tests green
- [ ] `npm run checks` green
