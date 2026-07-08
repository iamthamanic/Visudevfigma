# Feature: Execution graph from edges (fallback to template pipeline)

<!-- seeded by ecc-runner from issue #13 on 2026-07-08 — @implement may refine -->

## Intent

Derive RouteBlueprint.pipeline order from graph edge traversal; fall back to current template when edges insufficient.

## Happy Path

- [x] Pipeline nodes ordered by authenticates → validates → handler → writes
- [x] Fallback unchanged when graph sparse

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
