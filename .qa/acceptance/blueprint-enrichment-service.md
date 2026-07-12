# Feature: Raw-to-canonical Blueprint DTO + enrichment service

<!-- seeded by ecc-runner from issue #48 on 2026-07-12 — @implement may refine -->

## Intent

Decouple raw scan output from the final `BlueprintDocument` so VisuDEV enrichment is independent of the analysis provider.

## Happy Path

- [ ] - [ ] `RawBlueprintScan` type exists in shared API types.
- [ ] - [ ] `BlueprintEnrichmentService` exists in `local-engine/src/services/blueprint-enrichment.service.ts`.
- [ ] - [ ] Both providers can be routed through the same enrichment step.
- [ ] - [ ] Output passes `normalizeBlueprintData` on the client without data loss.
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
