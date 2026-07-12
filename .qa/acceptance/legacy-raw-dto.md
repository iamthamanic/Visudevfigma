# Feature: Refactor legacy blueprint provider to raw DTO

<!-- seeded by ecc-runner from issue #49 on 2026-07-12 — @implement may refine -->

## Intent

Make the legacy Preview-Runner blueprint provider return a `RawBlueprintScan` instead of a fully-formed `BlueprintDocument`.

## Happy Path

- [ ] - [ ] Legacy provider returns raw scan shape consumed by enrichment service.
- [ ] - [ ] Final persisted `blueprint.json` remains compatible with `BlueprintPage`.
- [ ] - [ ] Regression: legacy provider still default when no override is set.
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
