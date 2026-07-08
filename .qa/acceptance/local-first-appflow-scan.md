# Feature: [Local-First P2] Local App Flow scan via Runner + Engine

<!-- seeded by ecc-runner from issue #26 on 2026-07-08 — @implement may refine -->

## Intent

Enable scanType=appflow in local mode (Engine orchestrator + Runner Deno CLI).

## Happy Path

- [x] POST /api/projects/:id/analyze { scanType: appflow } succeeds locally
- [x] AppFlowPage shows screens after scan on local_path project
- [x] npm run checks green

## Edge Cases

- [ ] (from .qa/edge-cases.md + @implement)

## Regression

- [ ] Feed and topic routes still load

## Assumptions

- none

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- Deno: `appflow-pipeline.service.ts` + `appflow/cli/analyze-local.ts`
- Runner: `appflow-local.js` + `POST /appflow/analyze`
- Engine: `legacy-appflow-runner.provider.ts`, appflow cache + `GET /appflow/latest`
- Frontend: local `startScan("appflow")`, AppFlowPage hydration via `getAppflowLatest`
