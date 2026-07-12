# Feature: Blueprint provider interface + registry refactor

<!-- seeded by ecc-runner from issue #45 on 2026-07-12 — @implement may refine -->

## Intent

Define a clean, narrow blueprint-provider contract so legacy and AutoGuide providers can be registered and selected interchangeably.

## Happy Path

- [ ] - [ ] `BlueprintProvider` interface exists in `local-engine/src/providers/blueprint-provider.interface.ts`.
- [ ] - [ ] `AnalysisService` stores blueprint providers separately from appflow/data providers.
- [ ] - [ ] `providerIdForScanType` still maps `blueprint` to the selected blueprint provider.
- [ ] - [ ] `npm run checks` green.

## Edge Cases

- [ ] (from .qa/edge-cases.md + @implement)

## Regression

- [ ] Feed and topic routes still load

## Assumptions

- none

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

<!-- filled after coding -->
