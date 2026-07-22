# Feature: Data slice strangler: own ERD/schema hooks

<!-- seeded by ecc-runner from issue #245 on 2026-07-22 — @implement may refine -->

## Intent

Stranguliere `src/modules/data/` analog zum Logs-Pilot: ERD/Schema/Migrations-Hooks und Service-Mapping hinter die Data-Grenze ziehen, `DataPage`-Verhalten und Runtime-Gating erhalten.

## Happy Path

- [ ] Data-Hooks/Services unter `src/modules/data/`; Page ohne direkte Facade-Hook-Implementierung
- [ ] Beobachtbares Verhalten + Local-Gating unverändert
- [ ] Slice-lokale Tests vorhanden
- [ ] Touched files: zero type escape hatches (`@typed-strict` / Boy Scout)
- [ ] `npm run checks` grün

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
