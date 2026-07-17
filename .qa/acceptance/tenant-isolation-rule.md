# Feature: Replace db.rls-missing with abstract tenant-isolation rule

<!-- issue #137 -->

## Intent

Expectation engine checks tenant-isolation abstractly; MariaDB + repo filter = OK (not an RLS failure).

## Happy Path

- [ ] Rule `access-control.tenant-isolation-missing` replaces `db.rls-missing`
- [ ] `rls-policy` concept deprecated; legacy matrix RLS cell is `n/a`
- [ ] Fixture: MariaDB repo filter → protected (no missing rule)
- [ ] Wired into enrichment findings
- [ ] E2E fixtures updated to new rule id

## Implementation Notes

- `tenant-isolation-policy.ts` + tests; enrichment merges policy findings.
