# Feature: [visudev-gapclose P1-1] Walk-Seed: schema.prisma + meteor/server vor FILE_LIMIT

<!-- seeded by ecc-runner from issue #195 on 2026-07-17 — @implement may refine -->

## Intent

Seed kritische Pfade (`schema.prisma`, `packages/database`, `apps/meteor/server`) in den Walk-Candidate-Set **vor** dem FILE_LIMIT-Schnitt, damit Soft-cap-Ranking die Formbricks-Prisma- und Rocket.Chat-Meteor-Oberfläche nicht mehr wegschnitten wird.

## Happy Path

### Preconditions

- Enrichment OFF
- Soft-cap ranking (P0-1) still demotes specs/mocks
- Local clones or fixtures with `packages/database/schema.prisma` and/or `apps/meteor/server`

### Postconditions

- [ ] Formbricks: `packages/database/schema.prisma` (and package-database seeds) guaranteed under Cap
- [ ] Rocket.Chat: `apps/meteor/server/**` seeds guaranteed under Cap (not 0)
- [ ] Soft-cap Spec-Demotion bleibt (keine spec/mock Dominanz)
- [ ] Unit tests for seed/guarantee (`blueprint-local.test.js`)
- [ ] Analyzer parity: `applyFileLimitWithSeeds` in pipeline/analysis
- [ ] Enrichment OFF for any acceptance scan

## Edge Cases

- [ ] Missing seed dirs → no throw; Cap falls back to ranked fill
- [ ] Seed count > FILE_LIMIT → schema.prisma preferred, then database, then meteor
- [ ] route.ts flood cannot drop seeded meteor/server or schema.prisma

## Regression

- [ ] Feed and topic routes still load
- [ ] P0-1 spec demotion unchanged

## Assumptions

- Local preview-runner walk is the Golden-Set path; GitHub tree path uses seed classification on paths already in the tree.

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- `preview-runner/lib/blueprint-local.js`: `collectCriticalSeedRelPaths` + `applyFileLimitWithSeeds` before FILE_LIMIT; budgets for database/meteor/schema.
- `call-graph.builder.ts`: `isCriticalWalkSeedPath` + `applyFileLimitWithSeeds` parity.
- `blueprint-pipeline.service.ts` + `blueprint-analysis.service.ts`: Cap via seeds, not bare `.slice`.
- Vitest: 9/9 in `blueprint-local.test.js` incl. route.ts-flood guarantee.
- Smoke: Formbricks seeds include `packages/database/schema.prisma`; Rocket.Chat seeds include `apps/meteor/server` (120).
