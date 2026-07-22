# Feature: Logs pilot: own hooks/services behind slice boundary

<!-- seeded by ecc-runner from issue #244 on 2026-07-22 — @implement may refine -->

## Intent

Migriere den kleinen Logs-Slice als Pilot: Capability-eigene Hooks/Services/Typen hinter `src/modules/logs/`, öffentlicher Entry über `index.ts`, Route/Props/UI/API-Verhalten unverändert, slice-lokale Tests — ohne Nebenbei-Umbau anderer generischer Hooks.

## Happy Path

- [ ] Logs-Hook/Service leben unter `src/modules/logs/`; Page importiert nicht mehr direkt die generische Facade-Implementierung
- [ ] Öffentlicher Entry über `index.ts`; beobachtbares UI/API-Verhalten unverändert
- [ ] Slice-lokale Tests decken Happy- und Fehlerpfad ab
- [ ] Keine Umbauten an Appflow/Data/Projects/Blueprint-Hooks in diesem Issue
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

- `src/modules/logs/hooks/useLogs.ts` + `services/logs.service.ts` own the capability
- `LogsPage` imports slice hook; removed `useLogs` from `useVisuDev` (no remaining consumers)
- Baseline dropped `useVisuDev`→logs/types reverse line
- Tests: `logs.service.test.ts`
- Branch: `issue-244-vss-logs-pilot` — not yet committed/pushed
