# Feature: [Local-First P2] Runtime screenshots in local mode

<!-- seeded by @implement from issue #28 on 2026-07-08 -->

## Intent

App Flow thumbnails via preview runner crawl routed through Local Engine (not direct UI → Runner).

## Preconditions

- Local project with `local_path` and completed App Flow analysis (screens detected)
- Preview Runner reachable; preview run `ready` with `previewUrl`

## Happy Path

- [x] POST `/api/projects/:id/preview/crawl` proxies to Runner `POST /crawl/:runId`
- [x] Crawl result persisted under `~/.visudev/projects/{id}/runtime-crawl.json`
- [x] `appflow.json` updated with screenshot URLs on screens
- [x] Local App Flow scan triggers crawl via Engine after analysis (no `previewAPI.crawl` in local mode)
- [x] AppFlowPage hydrates screenshots/runtime from `getAppflowLatest`
- [x] `npm run checks` green

## Edge Cases

- [x] Graceful skip when preview not ready (log message, scan still completes)
- [x] No Supabase Edge calls for screenshots/crawl in local mode

## Regression

- [ ] Blueprint and Data local scans still work
- [ ] Supabase mode crawl path unchanged

## Assumptions

- Route + state screenshots come from Runner runtime-crawl (base64 data URLs)

## Implementation Notes

- Engine: `POST /preview/crawl`, `GET /runtime/latest`, `runtime-crawl.json` + `appflow.json` merge
- Runner: route-screen screenshot on visit in `runtime-crawl.js`
- Frontend: local appflow scan uses `client.crawlPreview`; AppFlowPage hydrates `runtime` from cache
