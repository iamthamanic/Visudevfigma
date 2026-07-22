# Feature: Settings: remove projects deep-import

## Happy Path

- [x] Settings imports githubAuth from `modules/projects` public entry
- [x] Baseline deep-import line removed
- [x] checks green

## Implementation Notes

- `SettingsPage` now imports from `../../projects`
