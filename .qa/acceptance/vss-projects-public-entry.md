# Feature: Projects: public entry for types and githubAuth

## Intent

Öffentliche Exports für Typen und GitHub-Auth; `useProjects`/`useProject` hinter der Slice-Grenze.

## Happy Path

- [x] `projects/index.ts` exportiert githubAuth-API und nötige Typen öffentlich
- [x] Project-Hooks leben im Slice; Verhalten unverändert
- [x] Keine Deep-Imports **neu** eingeführt
- [x] Touched files: zero type escape hatches
- [x] typecheck/lint/rules/tests grün

## Edge Cases

- [x] Whitelist create/update; required name; race-safe list/detail

## Regression

- [x] Settings deep-import of githubAuth remains until #248 (baseline kept)

## Implementation Notes

- Port/adapter/service + useProjects/useProject/useProjectMutations
- Public re-export of githubAuth helpers for Settings cutover
