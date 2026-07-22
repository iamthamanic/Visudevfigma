# Feature: Appflow slice strangler: own flows hooks

<!-- seeded by ecc-runner from issue #246 on 2026-07-22 — @implement may refine -->

## Intent

Ziehe Appflow-Flows-Hooks hinter `src/modules/appflow/`, bestätige öffentlichen Entry und erhalte bestehendes Flow-UI-Verhalten ohne Cross-Slice-Deep-Imports.

## Happy Path

- [x] `useFlows` Ownership in `src/modules/appflow/`
- [x] Öffentlicher Entry minimal; UI-Verhalten unverändert
- [x] Slice-lokale Tests; checks grün
- [x] Touched files: zero type escape hatches (`@typed-strict` / Boy Scout)

## Edge Cases

- [x] Blank project/flow ids rejected; oversized payloads rejected; race-safe refresh

## Regression

- [x] typecheck/lint/rules:check/appflow unit tests green; no page consumers of facade `useFlows`

## Assumptions

- none

## Screenshots

| Step | Filename                                              |
| ---- | ----------------------------------------------------- |
| 1    | n/a (no UI consumer of useFlows; hook ownership only) |

## Implementation Notes

- Port + adapter + service under `src/modules/appflow/services/`
- Hook `useFlows` accepts injectable port; requestGeneration race guards
- Removed `useFlows` from `src/utils/useVisuDev.ts`; baseline drop for useVisuDev→appflow/types
- Public export via `src/modules/appflow/index.ts`
