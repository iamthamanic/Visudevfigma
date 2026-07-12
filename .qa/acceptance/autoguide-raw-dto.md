# Feature: Refactor AutoGuide adapter to raw DTO

<!-- seeded by ecc-runner from issue #50 on 2026-07-12 — @implement may refine -->

## Intent

Make AutoGuide provider return the same `RawBlueprintScan` shape so it can share VisuDEV enrichment with the legacy provider.

## Happy Path

- [ ] - [ ] AutoGuide provider returns raw scan shape.
- [ ] - [ ] Old `autoguide-to-blueprint.mapper.ts` logic is moved or replaced; no duplication with enrichment service.
- [ ] - [ ] Final blueprint still renders Security Matrix, Route Canvas, and Findings.
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
