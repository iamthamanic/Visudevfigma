# Acceptance: wave3-inspector-auto-select

## Intent

Each Blueprint view auto-selects the Zielbild-default entity so the inspector is populated on first paint.

## Reference screenshots

- `.qa/evidence/figma-compare-v3/ziel-architecture.png` — APPLICATION LAYER selected
- `.qa/evidence/figma-compare-v3/ziel-atlas.png` — API SERVICE cluster
- `.qa/evidence/figma-compare-v3/ziel-infrastructure.png` — Web App node
- `.qa/evidence/figma-compare-v3/ziel-diagnostics.png` — first critical finding

## Visual checklist

- [ ] Architecture (Layers): APPLICATION LAYER pre-selected with glow + inspector
- [ ] Atlas: API SERVICE cluster pre-selected; inspector shows cluster details
- [ ] Infrastructure: Web App topology node pre-selected
- [ ] Diagnostics: first critical finding (SEC-001) pre-selected with evidence inspector
- [ ] Dependencies / Execution unchanged from Wave 2 defaults

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave3-inspector-auto-select.spec.ts --project=chromium
```

- Architecture: assert selected layer card + inspector title contains "APPLICATION"
- Atlas: assert `[data-testid="atlas-cluster"]` with selected state for API SERVICE
- Infrastructure: assert `[data-testid="infra-topology-node"][data-selected="true"]` for Web App
- Diagnostics: assert `[data-testid="findings-table"]` row selected + `[data-testid="problem-inspector"]` visible

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
