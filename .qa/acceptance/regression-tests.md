# Feature: Regression tests + npm run checks green

<!-- seeded by ecc-runner from issue #54 on 2026-07-12 — @implement may refine -->

## Intent

Ensure the refactored provider and enrichment pipeline does not break existing blueprint behavior.

## Happy Path

- [ ] - [ ] Unit tests cover provider registry, status handling, and enrichment.
- [ ] - [ ] `npm run checks` exits 0 with zero warnings.
- [ ] - [ ] Manual smoke test: create project → blueprint scan via legacy → no `childRuns` error.

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
