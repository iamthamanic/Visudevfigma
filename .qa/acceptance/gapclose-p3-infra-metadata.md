# Feature: [visudev-gapclose P3-2b] Infra metadata allowlist + compose Redis/Postgres nodes

## Intent

Export-Sanitize behält `service`/`source`/`provider` für `infra-service` Facts; Graph emittiert `infra:postgresql` / `infra:redis` aus Prisma datasource + docker-compose ohne Halluzination. Enrichment OFF.

## Happy Path

- [ ] browo Re-Scan: Postgres + Redis infra nodes wenn compose/schema belegen
- [ ] Plane: Redis wenn compose/valkey — kein Stub-LB
- [ ] Unit-Tests: sanitize keeps service; fixture → infra nodes; empty fixture → none
- [ ] Leave matrix db=confirmed (P3-1) unverändert

## Edge Cases

- [ ] Keine Secrets/Passwörter aus compose in Labels
- [ ] Soft-cap: compose seed bleibt im FILE_LIMIT

## Regression

- [ ] Formbricks/Rocket.Chat keine false Redis
- [ ] Existing graph-security-matrix / leave db tests pass

## Assumptions

- Follow-up to #210; root cause = fact-metadata-sanitizer allowlist

## Screenshots

| Step | Filename |
| ---- | -------- |
| 1 | `01-happy-path.png` |

## Implementation Notes

(filled by @implement)

## Implementation Notes

- Root cause: `sanitizeFactMetadataForExport` dropped `service`/`source`/`provider`, so `isInfraServiceFact` never matched after export.
- Allowlist extended; compose facts set `framework: "docker-compose"`; export cap preserves infra-service facts like Prisma models.
- Tests: sanitizer + extractors + graph-export-cap (38 Deno) + software-graph-builder (21 Vitest).

