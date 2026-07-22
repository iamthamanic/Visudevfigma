# Feature Intake: vertical-slice-strangler

Epic design: [`.qa/design/vertical-slice-strangler.md`](../design/vertical-slice-strangler.md)  
Intent Contract: [`.qa/intake/vertical-slice-strangler-intent-contract.md`](./vertical-slice-strangler-intent-contract.md)

> Approved via „setz um“ + ACCEPT-WITH-CHANGES — create + `@ecc-runner-loop`.

## Slices

| #   | Title                                                        | Priority | dependsOn  |
| --- | ------------------------------------------------------------ | -------- | ---------- |
| 1   | Foundation: slice rules, boundary check, baseline            | P0       | —          |
| 2   | Logs pilot: own hooks/services behind slice boundary         | P0       | 1          |
| 3   | Data slice strangler: own ERD/schema hooks                   | P1       | 2          |
| 4   | Appflow slice strangler: own flows hooks                     | P1       | 2          |
| 5   | Projects: public entry for types and githubAuth              | P1       | 2          |
| 6   | Settings: remove projects deep-import + slice ownership      | P1       | 5          |
| 7   | Legacy facade: drop reverse type imports for migrated slices | P1       | 3, 4, 5, 6 |
| 8   | Blueprint slice strangler: entry + hook ownership            | P2       | 7          |

## MVP cut

- Phase 0 boundary guardrails
- Logs pilot
- Data, Appflow, Projects, Settings strangler
- Facade reverse-import cleanup
- Blueprint parent DoD (no sub-slices)

## Deferred

- `modules/` → `slices/` rename
- Blueprint subfeature isolation
- Package/Hybrid
- Integrations as product slice
- Full `shared/` kernel audit

## Create issues

```bash
bash "$HOME/.cursor/skills/feature-intake/scripts/create-github-issues.sh" \
  .qa/intake/vertical-slice-strangler-issues.json
# then milestone + agent-ready (script may already set labels)
```

## Assigned numbers

| #   | Issue                                                             |
| --- | ----------------------------------------------------------------- |
| 1   | #243 Foundation: slice rules, boundary check, baseline            |
| 2   | #244 Logs pilot: own hooks/services behind slice boundary         |
| 3   | #245 Data slice strangler: own ERD/schema hooks                   |
| 4   | #246 Appflow slice strangler: own flows hooks                     |
| 5   | #247 Projects: public entry for types and githubAuth              |
| 6   | #248 Settings: remove projects deep-import + slice ownership      |
| 7   | #249 Legacy facade: drop reverse type imports for migrated slices |
| 8   | #250 Blueprint slice strangler: entry + hook ownership            |
