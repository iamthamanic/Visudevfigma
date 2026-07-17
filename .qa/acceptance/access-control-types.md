# Acceptance: access-control-types (Phase 0)

## Intent

Establish stack-agnostic access control types and matrix derivation as the foundation for Blueprint Diagnostics v3, without breaking the existing RLS-based Security Matrix UI.

## Preconditions

- Wave 2 Diagnostics shell exists (SecurityMatrix, Findings, Inspector).
- `SoftwareGraph` is attached to `BlueprintDocument` via enrichment.

## Happy Path

1. Developer adds `shared/access-control.types.ts` with `AccessControlFinding`, `AccessControlMechanism`, `AccessControlStatus`, `EnforcementLayer`.
2. `deriveAccessControlMatrixFromFindings(routes, findings)` produces rows with columns: authentication, authorization, resourceScope, tenantIsolation, ownership, validation, rateLimit, audit, overallStatus.
3. `BlueprintData` accepts optional `accessControlFindings` and `accessControlMatrix`.
4. Legacy `securityMatrix` (including `rls` column) remains unchanged until UI migration issue ships.
5. Unit tests pass for matrix derivation (empty findings, tenant finding, worst overall status).

## Edge Cases

- [ ] No findings → matrix cells `unverified`, not `missing`
- [ ] MariaDB project with no RLS facts → no automatic RLS critical from types layer
- [ ] `unsupported` status renders symbol `⊘` via `accessControlStatusSymbol()`

## Out of scope (later issues)

- Application chain analyzer
- Database adapters
- UI column migration
- Removing `rls` from legacy matrix

## Verification

```bash
npm run test -- shared/access-control-matrix.test.ts
npm run checks
```

## Implementation Notes

_(filled during implement)_
