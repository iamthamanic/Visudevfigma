# Feature: Application chain analyzer

<!-- issue #134 -->

## Intent

Trace identity → auth middleware → authz → service → repository → query scope → DB op; emit `AccessControlFinding`s with `enforcementLayers` and evidence, including bypass warnings for unscoped DB access.

## Happy Path

- [ ] `app-chain-analyzer.service.ts` under `local-engine/src/services/access-control/`
- [ ] Bypass detection (direct DB without tenant/owner filter) → partial/missing + warning
- [ ] Wired into `blueprint-enrichment.service.ts` (`accessControlFindings` + matrix)
- [ ] Unit tests cover protected tenant path, bypass, and non-data routes
- [ ] `npm run checks` green

## Edge Cases

- [ ] Routes without data edges → tenant/ownership `not-applicable`
- [ ] Mixed tenant filter + unscoped query → `partial` with warning

## Regression

- [ ] Legacy `securityMatrix` still produced from graph projections

## Assumptions

- Mechanism detection from SQL dialects lands in later adapter issues (#135+)

## Implementation Notes

- Analyzer walks route neighborhood via authenticates/validates/calls/api/data/implements.
- Emits AuthN/AuthZ/validation/tenant/ownership/resource-scope findings with enforcement layers.
- Unscoped DB snippets → missing/partial + bypass warning; `resourceId` uses `metadata.routeId` for matrix join.
- `enrichBlueprint` attaches `accessControlFindings` + derived matrix without changing legacy securityMatrix.
