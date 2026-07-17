# Feature: Diagnostics UI — abstract Security Matrix columns

<!-- seeded by ecc-runner from issue #138 on 2026-07-17 — @implement may refine -->

## Intent

Replace RLS column with Scope, Tenant, Ownership; use `accessControlStatusSymbol`; feature flag `VITE_ACCESS_CONTROL_V2`.

## Happy Path

- [x] New columns when flag enabled (`AccessControlMatrix` + `data-access-control-v2`)
- [x] Legacy matrix fallback when new fields absent or flag off
- [x] Playwright smoke updated (v2 headers when flag baked into CI build)

## Edge Cases

- [x] Flag on but empty `accessControlMatrix` → legacy `SecurityMatrix`
- [x] `normalizeBlueprintData` preserves AC matrix/findings

## Regression

- [x] Feed and topic routes still load (legacy matrix default path unchanged)

## Assumptions

- CI E2E build sets `VITE_ACCESS_CONTROL_V2=true`; local default remains legacy unless env set

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- `AccessControlMatrix.tsx` + `access-control-flag.ts`
- `DiagnosticsView` switches on flag + non-empty `accessControlMatrix`
- `.github/workflows/e2e.yml` enables flag for CI smoke
