# Acceptance: evolution-view (#73)

## Intent

Show how software architecture changes over time by comparing graph snapshots with git context.

## Criteria

- [x] SoftwareGraph supports snapshots and diff metadata
- [x] Runner API provides git summary for local analysis
- [x] EvolutionView lets users select two commits/branches (snapshots)
- [x] Graph highlights added/changed/removed nodes
- [x] Timeline shows available snapshots
- [x] Component and unit tests with mock git state pass
- [x] npm run checks green
