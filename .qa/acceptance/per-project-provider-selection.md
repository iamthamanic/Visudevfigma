# Feature: Per-project blueprint provider selection + API

<!-- seeded by ecc-runner from issue #47 on 2026-07-12 — @implement may refine -->

## Intent

Allow each VisuDEV project to choose its blueprint provider independently, falling back to the global env default.

## Happy Path

- [ ] - [ ] `LocalVisuDevProject` has optional `blueprintProviderId`.
- [ ] - [ ] Create and update project APIs accept and persist `blueprintProviderId`.
- [ ] - [ ] `AnalysisService.startAnalysis` resolves provider from project first, then config.
- [ ] - [ ] `GET /api/capabilities` still lists available providers.
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
