# Feature: [visudev-gapclose P0-3] Execution: HTTP-Bias sprengen + DB-Kontakt (Golden Set)

## Intent

Break HTTP-only execution bias: when Prisma/DB facts exist in module services, Execution paths include table nodes (DB contact >0). Honest non-HTTP surface when no HTTP routes (Rocket.Chat).

## Happy Path

- [ ] browo Leave path includes table step from same-module `*.service.ts` data edges — **BH-W3**
- [ ] Formbricks: DB contact when prisma facts share module/lib path with route — **FB-W2**
- [ ] Rocket.Chat: non-HTTP execution group / UI copy when routes=0 — **RC-W2 honesty**
- [ ] Unit tests for module data attachment + non-http group
- [ ] Enrichment OFF for acceptance

## Implementation Notes

- `local-engine/.../_execution-paths.ts`: `appendModuleDataTargets` pulls table nodes from same-dir service/repository data edges; `execution:non-http:0` when no routes
- `execution/_projection.ts`: list/project non-http surface
- `ExecutionView.tsx`: clearer empty-state copy for missing HTTP routes
