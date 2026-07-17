# Feature: Access control types + matrix derivation (Phase 0)

<!-- issue #133 — stack-agnostic access control foundation -->

## Intent

Introduce canonical `AccessControlFinding` / `AccessControlMatrixRow` types and `deriveAccessControlMatrixFromFindings()` so Diagnostics can express AuthN/AuthZ/Scope/Tenant/Ownership without treating RLS as a universal column.

## Preconditions

- Shared package builds under Vite/TS project references
- Legacy `securityMatrix` remains available for compat

## Happy Path

- [ ] Types live in `shared/access-control.types.ts` (controls ≠ mechanisms; status includes `unsupported`)
- [ ] `deriveAccessControlMatrixFromFindings(routes, findings)` derives matrix cells + `overallStatus`
- [ ] Unit tests cover empty findings, tenant column mapping, worst-status fold
- [ ] `BlueprintData` optional `accessControlFindings` / `accessControlMatrix`
- [ ] Re-exports via `shared/blueprint.ts` and `src/lib/visudev/access-control-types.ts`
- [ ] Design restored at `.qa/design/blueprint-access-control.md`
- [ ] `npm run checks` green

## Edge Cases

- [ ] Empty findings → all cells `unverified`, overall `unverified`
- [ ] `read-restriction` / `write-restriction` map into `resourceScope` column
- [ ] Types alone never emit false RLS criticals for MariaDB/Mongo

## Regression

- [ ] Existing security matrix / graph projection tests still pass

## Assumptions

- Analyzer wiring and UI columns land in later issues (#134–#142)
- `DatabaseSecurityAdapter` interface is typed now; implementations follow in #135+

## Screenshots

| Step | Filename              |
| ---- | --------------------- |
| n/a  | Phase 0 is types-only |

## Implementation Notes

- Restored full Phase 0 model (controls vs mechanisms, enforcement layers, adapter contract) replacing Wave-2 stubs.
- Fixed `resource-scope` mapping for read/write-restriction findings.
- Design + intake artifacts restored under `.qa/design` / `.qa/intake`.
