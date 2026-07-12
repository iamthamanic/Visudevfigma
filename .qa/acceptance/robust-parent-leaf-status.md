# Feature: Robust parent/leaf run status handling

<!-- seeded by ecc-runner from issue #46 on 2026-07-12 — @implement may refine -->

## Intent

Eliminate the `parent.childRuns is not iterable` error by validating whether a status file actually represents a parent run before iterating children.

## Happy Path

- [ ] - [ ] `parent.childRuns is not iterable` no longer appears in logs or UI.
- [ ] - [ ] `getStatus` returns `{ success: false, error: { code: 'RUN_STATUS_INVALID' } }` when status file is not a valid parent run.
- [ ] - [ ] Unit tests cover leaf-run misread and missing `childRuns` scenarios.
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
