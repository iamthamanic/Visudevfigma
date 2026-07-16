# Feature: [visudev-gapclose P1-3] Prisma: alle Models aus einem schema.prisma emittieren

<!-- seeded by ecc-runner from issue #197 -->

## Intent

Alle Prisma-Models aus einer gelesenen `schema.prisma` emittieren (nicht first-N Cap-Truncate).

## Happy Path

- [ ] `selectFactsPreservingPrismaModels` keeps all `prisma-model` facts under route flood
- [ ] LeaveRequest survives when many models + noise facts
- [ ] Pipeline + graph assembly use preserving selector (not bare `.slice`)
- [ ] Enrichment OFF for acceptance scans

## Implementation Notes

- `graph-export-cap.ts`: `selectFactsPreservingPrismaModels` / `isPrismaSchemaModelFact`
- Wired in `blueprint-pipeline.service.ts` + `blueprint-graph-assembly.ts`
- Deno tests: 8/8 in `graph-export-cap.test.ts`
