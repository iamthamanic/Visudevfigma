# Feature: Legacy securityMatrix deprecation + docs

## Intent

Update docs; synthesize legacy matrix from access control matrix; remove RLS from default SecurityMatrix.

## Happy Path

- [x] Docs describe abstract controls vs mechanisms (`docs/visudev-blueprint-engine.md`)
- [x] `normalizeBlueprintData` compat layer (`synthesizeSecurityMatrixFromAccessControl`)
- [x] RLS column removed from default SecurityMatrix
- [x] `npm run checks` green

## Edge Cases

- [x] Empty legacy matrix + AC matrix → synthesized rows with `rls: n/a`

## Regression

- [x] Access Control v2 matrix columns unchanged

## Assumptions

- Payload field `rls` may still exist for KV compat but is not rendered

## Implementation Notes

- `shared/synthesize-security-matrix.ts`
