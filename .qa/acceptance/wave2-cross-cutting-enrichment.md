# Acceptance: wave2-cross-cutting-enrichment

## Intent

Enable all Blueprint views with demo/sagadrive-friendly enrichment data and fix Playwright dev URL to localhost:3005.

## Reference screenshot

`.qa/evidence/wave-2-references/` (enabler — all 7 view references)

## Visual checklist

- [ ] `playwright.config.ts` defaults to `http://localhost:3005`
- [ ] README documents PLAYWRIGHT_BASE_URL=http://localhost:3005
- [ ] Demo project loads Architecture with non-empty layer content
- [ ] Demo project loads Dependencies with ≥5 visible nodes
- [ ] Demo project loads Execution with ≥3 pipeline steps
- [ ] Demo project loads Infrastructure with ≥4 topology nodes
- [ ] Demo project loads Atlas with ≥3 clusters
- [ ] Demo project loads Evolution with ≥3 timeline commits
- [ ] Demo project loads Diagnostics with ≥1 matrix row and ≥1 finding
- [ ] No blank main canvas on any Blueprint view in demo mode
- [ ] Enrichment fallback activates when real graph is thin
- [ ] sagadrive-compatible seed path documented or wired
- [ ] Footer stats show module/file counts (not zero)

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave2-viz-smoke.spec.ts --project=chromium
```

- Capture each Blueprint view (`?view=architecture|dependencies|execution|infrastructure|atlas|evolution|diagnostics`)
- Assert key selectors visible: `[data-testid="blueprint-view"]`, main canvas/content not empty
- Compare structure: sidebar active item, view title (DE), non-empty `[data-testid="blueprint-main-content"]`

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
