# Feature: [visudev-gapclose P0-4] Security-Matrix aus Auth/Validation-Edges (browo + Plane)

<!-- seeded by ecc-runner from issue #187 on 2026-07-17 — @implement may refine -->

## Intent

Derive Security Matrix cells from existing `authenticates` / `validates` / `data` graph edges (plus permission/authorize snippets for ROLE) so browo-hr and Plane Diagnostics no longer show all-`?` on routes that already have auth/validation facts.

## Happy Path

- [ ] browo-hr (Enrichment OFF): Auth and Validation not all-`?` when authenticates/validates edges exist — **BH-W4**
- [ ] Plane: ROLE fewer `?` when permission_classes / IsAuthenticated evidence exists — **PL-W3**
- [ ] Tests cover edge→cell mapping in `software-graph-projections.test.ts`
- [ ] No false RLS / no fabricated permissions
- [ ] Enrichment OFF for acceptance

## Edge Cases

- [ ] Empty/degenerate paths do not invent ROLE from bare auth middleware without permission cues (analyzer)
- [ ] Prefix-colliding directories still do not leak auth evidence

## Regression

- [ ] Existing diagnostics projection tests pass

## Assumptions

- Diagnostics UI prefers graph-derived matrix via `deriveDiagnosticsFromGraph` when graph score wins

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- `shared/blueprint-graph-inference.ts`: `collectRouteEdgeSignals` + `inferRouteStates(graph)`; ROLE from permission/authorize snippets; DB from `data` edges
- `shared/blueprint-graph-projections.ts`: pass graph into inference; matrix uses role/db states
- Analyzer `graph-security-matrix.ts`: prefer graph cells; ROLE from permission-like authenticates targets
