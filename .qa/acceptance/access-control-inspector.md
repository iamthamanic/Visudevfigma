# Feature: Access Control Inspector — mechanisms and evidence

## Intent

Inspector shows mechanisms (PostgreSQL RLS, Repository Filter, …), enforcement layers, evidence, bypass warnings.

## Happy Path

- [x] `AccessControlInspector.tsx`
- [x] Cell click opens control-specific findings
- [x] `unsupported` shown as ⊘ not critical red (`data-variant="unknown"`)

## Edge Cases

- [x] Empty selection prompts matrix cell click
- [x] No findings for control → empty message

## Regression

- [x] Legacy Problem-Inspektor still used when BlueprintFinding selected / AC v2 off

## Assumptions

- Requires `VITE_ACCESS_CONTROL_V2` + `accessControlMatrix` (same gate as #138)

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- Matrix cells are buttons (`ac-matrix-cell-*`); wire into DiagnosticsView inspector slot
