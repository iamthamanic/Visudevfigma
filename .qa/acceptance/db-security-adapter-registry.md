# Feature: Database security adapter registry + unknown fallback

<!-- issue #135 -->

## Intent

`DatabaseSecurityAdapter` registry by dialect; unknown adapter uses app-layer honesty only — never false RLS criticals.

## Happy Path

- [ ] Registry + `unknown.adapter.ts`
- [ ] Dialect from `resolve-database-config` / framework hints
- [ ] Unit tests for selection
- [ ] Wired into enrichment alongside app-chain findings
- [ ] `npm run checks` green

## Edge Cases

- [ ] Unregistered dialects (mariadb/mongo/…) fall back to unknown
- [ ] Unknown findings status is `unsupported`, never `missing` for RLS

## Implementation Notes

- `database-security-registry.ts` + `adapters/unknown.adapter.ts`
- Concrete adapters register later (#136/#140/#141)
