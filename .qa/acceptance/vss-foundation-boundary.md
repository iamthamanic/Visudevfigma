# Feature: Foundation: slice rules, boundary check, baseline

<!-- seeded by ecc-runner from issue #243 on 2026-07-22 — @implement may refine -->

## Intent

Verankere `module = product slice` in der Repo-Guidance, ergänze einen automatischen Boundary-Check gegen neue Cross-Slice-Deep- und Reverse-Imports, und erfasse bekannte Bestandsausnahmen als endliche Baseline — damit Feature-Intake und Runner A–D sowie die DoD aus dem Intent Contract durchsetzen können.

## Happy Path

- [ ] `AGENTS.md` stellt `module = product slice` und Importregeln gemäß Intent Contract klar
- [ ] Boundary-Check ist Teil von `npm run checks` / `rules:check` und verhindert neue Deep-/Reverse-Imports
- [ ] Endliche Baseline erfasst bekannte Bestandsausnahmen; neue Verstöße failen
- [ ] DoD-/Intake-Hinweise für Runner dokumentiert (Feature-Slug-Felder)
- [ ] Touched files: zero type escape hatches (`@typed-strict` / Boy Scout)
- [ ] `npm run checks` grün

## Edge Cases

- [ ] Baseline covers Settings→projects/services/githubAuth and facade reverse type imports
- [ ] Shell deep-import of a product slice fails the check
- [ ] Import only via slice `index.ts` does not fail

## Regression

- [ ] Existing `npm run rules:check` Tailwind/inline/color/any rules still run
- [ ] `npm run checks` remains the gate

## Assumptions

- Intent Contract is normative; baseline is finite migrations debt only

## Screenshots

N/A (repo rules / CI check — no UI)

## Implementation Notes

- AGENTS.md: module = product slice + dependency path + facade note
- `.qa/architecture/boundary-baseline.txt` + `slice-dod.md`
- `scripts/checks/boundary-imports.sh` wired from `project-rules.sh`
