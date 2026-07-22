# Slice DoD + Feature-Intake metadata (Vertical-Slice Strangler)

Normative source: `.qa/intake/vertical-slice-strangler-intent-contract.md`

## Product slice

A top-level directory `src/modules/<capability>/` (except `shell`) **is** a product slice.
Public entry is only `index.ts`. Internals must not be imported from outside the slice.

## Dependency path

`Produkt-Slice → slice service/port → Frontend adapter/dispatch → Local or Supabase API`

## Definition of Done (migrated slice)

- Capability ownership is clear inside one top-level module
- Public `index.ts` is minimal and documented
- UI does not call runtime/API implementations directly
- Slice state/service/types are not newly extended via generic legacy facades
- No new cross-slice deep or reverse imports
- Local tests cover user behavior and error paths
- Affected Local/Cloud client contracts tested or capability gated via `getCapabilities()`
- Old imports removed or time-boxed with a cleanup issue
- `npm run checks` green

## Intake metadata (every feature issue)

Required fields: `featureSlug`, `userOutcome`, `ownerKind`, `primaryBoundary`,
`contractChange`, `runtimeTouch`, `consumers`, `dependsOn`, `compatibilityPlan`,
verifiable `acceptance`.

## Boundary enforcement

- Check: `scripts/checks/boundary-imports.sh` (via `npm run rules:check`)
- Finite known debt: `.qa/architecture/boundary-baseline.txt`
