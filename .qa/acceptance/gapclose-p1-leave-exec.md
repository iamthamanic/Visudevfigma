# Feature: [visudev-gapclose P1-2] Leave-Execution: Leave-Routen als Sample + ≥3-Step LeaveRequest-Pipeline

<!-- seeded by ecc-runner from issue #196 on 2026-07-17 — @implement may refine -->

## Intent

browo-hr: Leave-Routen als bevorzugtes Execution-Sample; Leave `db-read`/`db-write`-Facts zu Route→DB-Steps verdrahten (≥3-Schritt LeaveRequest-Pipeline).

## Happy Path

### Preconditions

- Enrichment OFF
- Leave routes extracted (P0-2)
- LeaveRequest db facts present when service scanned

### Postconditions

- [ ] Default Execution sample prefers Leave-/leaves-Route
- [ ] Leave path ≥3 steps including LeaveRequest table when facts exist
- [ ] data edges from leave route files → LeaveRequest tables
- [ ] Unit tests for preference + wiring
- [ ] Enrichment OFF for acceptance scans

## Edge Cases

- [ ] No leave routes → order unchanged
- [ ] Leave route without LeaveRequest table → no invented tables
- [ ] audit-logs remains available as secondary sample

## Regression

- [ ] Non-HTTP execution group still emitted when no routes
- [ ] Feed/topic routes still load

## Assumptions

- LeaveRequest table nodes come from real db-write/db-read facts (or Prisma models once P1-3 lands).

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- `listExecutionRoutes`: sort leave surfaces first (UI default sample).
- `_execution-paths.ts`: leave-first route group order; `ensureLeaveRouteDataEdges`; `appendLeaveRequestTables`; broader module-dir data targets for leave files.
- Tests: software-graph-builder + execution `_projection` (20/20).
