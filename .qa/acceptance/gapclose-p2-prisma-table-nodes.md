# Feature: [visudev-gapclose P2-1] Prisma: alle Models als kind=table Nodes emittieren (nicht ~26 Cap)

<!-- seeded by ecc-runner from issue #203 on 2026-07-17 — @implement may refine -->

## Intent

Alle Prisma-Schema-Models als Graph-`kind=table`-Nodes emittieren (nicht first-N Cap ~26), damit LeaveRequest und Formbricks-Models als nutzbare Table-Nodes existieren — Facts allein reichen nicht für Execution-Wiring.

## Happy Path

- [x] browo-hr: Schema ~125 Models → Table-Nodes decken **alle** Schema-Models ab (inkl. `LeaveRequest`); kein stilles Truncate auf ~26
- [x] Formbricks: Table-Nodes ehrlich vs Schema (Honesty wie P1 Facts; Dedup optional, keine erfundenen Tables)
- [x] Soft-cap File-Limit darf Dateien kürzen — **nicht** Table-Node-Emission aus bereits gelesenen Prisma-Model-Facts
- [x] Unit-Tests: Fixture mit N>26 Models → N `kind=table` Nodes (LeaveRequest-Index >26 überlebt)
- [ ] visudev-gapclose Re-Scan Golden+browo; Enrichment OFF; Diff vs P1-Verification (post-merge)

## Edge Cases

- [x] Route flood (200 routes) does not starve prisma models
- [x] Non-prisma db-write facts still map to tables

## Regression

- [x] Feed and topic routes still load (no UI change)
- [x] Existing leave-prefer + execution tests pass

## Assumptions

- Prisma-model facts already preserved by P1-3; this slice only promotes them to graph nodes before route budget consumption.

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- `software-graph/_prisma-models.ts`: `isPrismaSchemaModelFact`, `partitionPrismaModelFacts`, `prismaTableNodeId`
- `software-graph-builder.service.ts`: ingest prisma-model facts **before** routes
- `_fact-evidence.ts`: stable `table:prisma:<Name>` node ids for schema models
- Tests: `_prisma-models.test.ts` + P2-1 flood fixture in `software-graph-builder.service.test.ts`
