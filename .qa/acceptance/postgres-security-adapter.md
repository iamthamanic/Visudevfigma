# Feature: PostgreSQL / Supabase security adapter

<!-- issue #136 -->

## Intent

Detect `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, grants from SQL/facts; map to `database-row-policy` with inspector label "PostgreSQL RLS".

## Happy Path

- [ ] `postgres.adapter.ts` (+ supabase twin) with fixture tests
- [ ] Registered in default dialect registry
- [ ] `postgresInspectorMechanismLabel` returns "PostgreSQL RLS"
- [ ] No live DB required
- [ ] `npm run checks` green

## Edge Cases

- [ ] ENABLE without POLICY → partial
- [ ] No SQL facts → unverified (not false critical)

## Implementation Notes

- Pure regex over fact snippets; registered for `postgres` and `supabase`.
