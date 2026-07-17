# Feature: [visudev-gapclose P2-2] Leave-Execution: ≥3-Step + DB/LeaveRequest verdrahten

<!-- seeded by ecc-runner from issue #204 on 2026-07-17 — @implement may refine -->

## Intent
browo-hr Leave-Routen → Auth → LeaveRequest/Prisma-Table als Execution-Pipeline mit **≥3 Schritten** und echten `data`-Edges; Sample bleibt leave-preferring (P1-2).

## Happy Path
- [ ] - [ ] Leave Execution-Gruppe ≥3 Steps inkl. DB-/LeaveRequest-Bezug wenn Table-Node existiert
- [ ] - [ ] mind. eine leave-Route → LeaveRequest (oder Prisma-Table) `data`-Edge nach `buildSoftwareGraph`
- [ ] - [ ] Default Sample bleibt leave-preferring (kein Regression auf audit-logs-first)
- [ ] - [ ] Matrix/`db` Status verbessert wo Edges existieren (kein erfundenes confirmed)
- [ ] - [ ] Unit-Tests: Fixture leave-route + LeaveRequest table → ≥3 steps + data edge
- [ ] - [ ] visudev-gapclose Re-Scan browo; Enrichment OFF; Diff vs [P1-Verification](https://github.com/iamthamanic/visudev-app/blob/main/visudev-test-repos/evidence/VISUDEV-GAPCLOSE-P1-VERIFICATION.md)

## Edge Cases
- [ ] (from .qa/edge-cases.md + @implement)

## Regression
- [ ] Feed and topic routes still load

## Assumptions
- none

## Screenshots
| Step | Filename |
|------|----------|
| 1 | `01-happy-path.png` |

## Implementation Notes
<!-- filled after coding -->
