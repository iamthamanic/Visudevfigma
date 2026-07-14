# Issue #123 — Wave 2 cross-cutting (paused)

**Branch:** `issue-123-wave2-cross-cutting`  
**Status:** implement ✓ | verify-ticket ✓ | checks ✓ | push ✗ (AI review hook)

## Done
- `shared/demo-graph-seed.ts` + `shared/demo-graph-thin.ts` — HR-tool demo fixture + thin-graph merge
- `local-engine` enrichBlueprint with `VISUDEV_DEMO_ENRICHMENT` flag (default on)
- Playwright default `http://localhost:3005`
- Graph normalizer: `layer` + `repository` node kinds
- Wave 2 acceptance files + reference images + issue script
- `tests/e2e/wave2-viz-smoke.spec.ts`

## Blocker
Pre-push hook: Codex AI review REJECT (35–70% across attempts). `git push` fails.

## Resume
1. Resolve AI review or push with approved bypass
2. `gh pr create` → babysit → merge
3. `@ecc-runner-loop continue` for #124–#130
