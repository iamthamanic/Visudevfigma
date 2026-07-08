# Feature: [Local-First P2] Local Data / ERD scan

<!-- seeded by ecc-runner from issue #27 on 2026-07-08 — @implement may refine -->

## Intent

Enable scanType=data in local mode via Engine schema introspection (PostgreSQL or SQLite).

## Happy Path

- [x] POST /api/projects/:id/analyze { scanType: data } succeeds locally
- [x] DataPage renders tables from local ERD cache (~/.visudev/projects/{id}/erd.json)
- [x] npm run checks green

## Edge Cases

- [x] Graceful empty state when no DB connection is configured in project .env
- [ ] (from .qa/edge-cases.md + @implement)

## Regression

- [ ] Blueprint and App Flow local scans still work

## Assumptions

- Connection strings are read from project `.env` files at scan time (not persisted in Engine storage)

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- Engine: `local-data-introspection.provider.ts`, `resolve-database-config.ts`, `data-introspection.service.ts`
- Cache: `erd.json` + `GET /api/projects/:id/data/latest`
- Frontend: local `startScan("data")`, `useERD` via `getDataLatest`
