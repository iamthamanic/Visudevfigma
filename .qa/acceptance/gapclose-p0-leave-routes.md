# Feature: [visudev-gapclose P0-2] Express/Nest Modul-Routen → LeaveRequest-Pipeline (browo-hr)

<!-- seeded by ecc-runner from issue #185 on 2026-07-17 — @implement may refine -->

## Intent

Extract Express/Nest module routes (controllers, decorators, Nest `route.ts`, `modules/leaves/*`) so browo-hr LeaveRequest surfaces in Blueprint + Execution (≥3 steps with DB/Prisma edge). Reference gap #1 from visudev-gapclose evidence.

## Happy Path

- [ ] - [ ] browo-hr scan (Enrichment OFF): ≥1 Leave/leaves route in Blueprint facts
- [ ] - [ ] Execution path ≥3 steps including DB/Prisma link to LeaveRequest **or** explicit data-edge
- [ ] - [ ] Execution UI sample not audit-logs-only (`GET /` → `audit-logs.routes.ts`)
- [ ] - [ ] Formbricks: when Prisma call exists in handler graph → DB-Schritt ≠ 0 (or documented residual with test)
- [ ] - [ ] Unit/integration tests for new extractors (Nest/Express module patterns)
- [ ] - [ ] visudev-gapclose re-scan browo-hr SHA `24dd57cb0cfc…` — checklist **BH-W3** improves vs catalog; Enrichment OFF
- [ ] - [ ] Formbricks SHA `04511a58d52d…` — **FB-W2** DB contact when facts exist

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
- `this.prisma.*` client calls → db-read/db-write
- Multiline `router.get(
 '/path'` Express extraction
- `app.use('/api/…', router)` route-mount + same-dir join in buildRouteScopes
- Shared `*.service.ts` db facts attach to all related routes (was skipped when routeIds>1)
- Blocked on ship: `gh` auth token invalid — branch WIP local
