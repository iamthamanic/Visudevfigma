# Feature: [visudev-gapclose P2-2] Leave-Execution: ≥3-Step + DB/LeaveRequest verdrahten

<!-- seeded by ecc-runner from issue #204 — refined after implement -->

## Intent

browo-hr Leave-Routen → Auth → LeaveRequest/Prisma-Table als Execution-Pipeline mit **≥3 Schritten** und echten `data`-Edges; Sample bleibt leave-preferring (P1-2).

## Happy Path

- [x] Leave Execution-Gruppe ≥3 Steps inkl. DB-/LeaveRequest-Bezug wenn Table-Node existiert
- [x] mind. eine leave-Route → LeaveRequest (oder Prisma-Table) `data`-Edge nach `buildSoftwareGraph`
- [x] Default Sample bleibt leave-preferring (kein Regression auf audit-logs-first)
- [x] Unit-Tests: Fixture leave-route + schema.prisma LeaveRequest → ≥3 steps + data edge
- [ ] visudev-gapclose Re-Scan browo; Enrichment OFF (post-merge)

## Implementation Notes

- `_execution-leave.ts` `tablesForRoute`: if no same-module LeaveRequest, fall back to schema-sourced tables (`modulePrefix === null`)
- Unblocks browo where LeaveRequest lives in `prisma/schema.prisma`, not under `/leaves/`
