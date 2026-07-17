# Feature: [visudev-gapclose P3-1] Leave/Security-Matrix: db aus LeaveRequest / Prisma-Table-Edges

<!-- seeded for issue #209 — @implement may refine -->

## Intent

Diagnostics Security-Matrix setzt `db=confirmed` auf Leave-Routen, wenn Graph-Edges zu LeaveRequest/Prisma-Table existieren (Execution und Matrix konsistent). Kein Force-Green ohne Edge. Enrichment OFF.

## Happy Path

- [ ] browo Leave-Routen mit LeaveRequest/Table-Bezug: Matrix **`db=confirmed`**
- [ ] Ohne echte Edge bleibt `db=unknown`
- [ ] Unit-Tests: Fixture mit table `data`/`writes`/`reads` → confirmed; ohne → unknown
- [ ] P2 Leave-Exec-Tiefe (≥3 Steps) und leave-prefer Sample unverändert
- [ ] visudev-gapclose Re-Scan browo; Enrichment OFF; Diff vs P2-Verification (post-merge)

## Edge Cases

- [ ] Auth/Role confirmed bleiben; nur `db` verdrahten
- [ ] Non-leave routes: keine Regression (nur bestätigen bei echten DB-Edges)

## Regression

- [ ] Plane/Formbricks/Rocket.Chat matrix behavior nicht force-greened
- [ ] Existing graph-security-matrix tests pass

## Assumptions

- P2 Table-Nodes + Leave exec depth already on main; this slice only aligns matrix `db` with those edges.

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- Root cause: node-cap sets `condensed=true`, so `ensureLeaveRouteDataEdges` `addEdge` was dropped while Execution still appended LeaveRequest via `appendLeaveRequestTables`.
- `addEdgePrefer` in `_state.ts` keeps leave-route-db-fact edges when edge budget remains.
- `collectRouteEdgeSignals` treats `leave-route-db-fact` as file-wide; also confirms `db` when execution group includes a table node.
- Tests: multi-route leave edges, condensed execution-group path, unknown without table, addEdgePrefer.

(filled by @implement)
