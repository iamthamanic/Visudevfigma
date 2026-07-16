# Feature: [visudev-gapclose P0-5] Rocket.Chat Meteor Methods / Mongo Extractors (RC-W2)

<!-- seeded by ecc-runner from issue #188 on 2026-07-17 — @implement may refine -->

## Intent

Add Meteor.methods / publications / Mongo collection extractors so Rocket.Chat Blueprint has methods/units >0 and Mongo facts >0; Execution not empty after monorepo root fix.

## Happy Path

### Preconditions

- Enrichment OFF
- Soft-cap ranking includes `apps/meteor/server` (#184)
- Rocket.Chat SHA `4b57346a59b5…` (or fixture content with Meteor.methods + registerModel)

### Postconditions

- [ ] Rocket.Chat scan: routes/methods/units >0 **or** explicit method-nodes (Meteor methods as `api-route`)
- [ ] mongo/collection facts >0 (`db-write` with `framework: mongodb`)
- [ ] Execution not empty (Meteor METHOD routes or non-HTTP group)
- [ ] RC-W3 RLS-Trap remains PASS (no false PG-RLS facts invented)
- [ ] Ranking boost `apps/meteor/server` already present (#184)
- [ ] RC-W2 not FAIL on re-scan criteria above

## Edge Cases

- [ ] Nested braces inside Meteor.methods body do not drop methods
- [ ] `registerModel('IFooModel')` → table `Foo` (strip I + Model)
- [ ] No supabase framework hint for mongodb db facts
- [ ] Spec/test files still demoted by soft-cap (no false method flood from client minimongo)

## Regression

- [ ] Express/Nest/Django/Prisma extractors unchanged
- [ ] Feed and topic routes still load

## Assumptions

- Meteor methods are modeled as `api-route` with `method: METHOD` and path `/meteor/<name>` so existing route→execution pipeline applies without a parallel IR.

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- `fact-extractors.ts`: `extractMeteorMethods` (top-level METHOD routes `/meteor/<name>`), `extractMeteorPublications` (PUBLISH), `extractMongoRegisterModels`, `extractMongoCollections`.
- `blueprint-pipeline.service.ts`: `detectFrameworkHints` only tags bare db facts as supabase; mongodb/prisma/django/meteor keep their framework hints.
- Ranking boost `apps/meteor/server` already shipped in #184.
- Smoke: real RC `setRealName.ts` → 1 METHOD; `models.ts` → 73 mongodb db-write facts; no rls-policy facts.
- Deno tests: 12/12 in `fact-extractors.test.ts`.
