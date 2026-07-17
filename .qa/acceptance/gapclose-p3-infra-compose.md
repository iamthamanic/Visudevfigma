# Feature: [visudev-gapclose P3-2] Infra-Facts: Redis/Postgres aus docker-compose + Prisma datasource

<!-- seeded for issue #210 — @implement may refine -->

## Intent

Aus docker-compose und Prisma `provider = postgresql` ehrliche Infra-Facts/Nodes für Postgres und Redis emittieren (browo/Plane), ohne Halluzination und ohne Stub-LB-Regression. Enrichment OFF.

## Happy Path

- [ ] browo: Postgres als Infra/Service-Node wenn schema/compose belegen; Redis wenn compose
- [ ] Plane: Redis wenn in compose — ohne Stub-LB-Regression
- [ ] Unit-Tests: Fixture compose + postgresql provider → Services; Fixture ohne → keine erfundenen Services
- [ ] visudev-gapclose Re-Scan browo (+ Plane Spot-Check); Enrichment OFF; Diff vs P2-Verification (post-merge)

## Edge Cases

- [ ] Soft-cap FILE_LIMIT: compose/schema trotzdem lesbar (extra reader oder boost)
- [ ] Secrets aus compose/.env nicht in Labels

## Regression

- [ ] Formbricks/Rocket.Chat: keine false Postgres/Redis
- [ ] Existing infrastructure topology classification still works

## Assumptions

- Independent of P3-1 matrix db wiring; may land after or in parallel conceptually but sequential merge on main.

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- Seed `docker-compose*.yml` (+ yml/yaml ext, compose-only walk filter) in `blueprint-local.js` / `call-graph.builder.ts`
- `fact-extractors`: prisma `provider=` → infra-service; compose `image:` postgres/redis/valkey → infra-service
- Graph: `_infra-services.ts` stable `infra:*` nodes; ingest before routes; `addNodePrefer` past condensation
- Topology: PostgreSQL/Redis as `kind=table` → database tier (honest engines, no Stub-LB)

(filled by @implement)
