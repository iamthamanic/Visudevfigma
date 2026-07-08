# Feature: [Local-First] scanType all local orchestration

<!-- seeded by @implement on 2026-07-08 -->

## Intent

Enable `POST /api/projects/:id/analyze { scanType: all }` in local mode with Engine parent-run orchestration (blueprint → appflow → data).

## Happy Path

- [ ] Engine accepts `scanType: all` and returns parent run + child run IDs
- [ ] Parent status aggregates child progress (`children[]`)
- [ ] `GET /api/capabilities` reports `scans.all: true`
- [ ] Projects page „Alles scannen“ triggers `startScan("all")` when `local_path` set
- [ ] App Flow runtime crawl still runs from store after successful appflow child
- [ ] `npm run checks` green

## Edge Cases

- [ ] Partial parent status when one child fails but others succeed
- [ ] All children failed → parent `failed`
- [ ] Button disabled while any scan is running

## Regression

- [ ] Single blueprint/appflow/data scans unchanged
- [ ] Supabase `startScan("all")` legacy loop unchanged

## Implementation Notes

- `local-engine/src/lib/analysis-all.ts` — sequence + status aggregation
- `analysis.service.ts` — `startAllAnalyses`, `executeAllRuns`, parent getStatus/getResult
- `store.tsx` — local all-scan single engine call; `run-local-appflow-crawl.ts` extracted
- `ProjectsPage.tsx` — „Alles scannen“ button
