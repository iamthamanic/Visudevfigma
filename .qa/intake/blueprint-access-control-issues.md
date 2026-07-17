# Feature Intake: blueprint-access-control

Epic design: [`.qa/design/blueprint-access-control.md`](../design/blueprint-access-control.md)

> **DRAFT** — Issues noch nicht auf GitHub. Bei OK: `bash scripts/create-blueprint-access-control-issues.sh`

## Slices

| #   | Title                                                             | Priority | dependsOn |
| --- | ----------------------------------------------------------------- | -------- | --------- |
| 1   | Access control types + matrix derivation (Phase 0)                | P0       | —         |
| 2   | Application chain analyzer (middleware → repository → query)      | P0       | 1         |
| 3   | Database security adapter registry + unknown fallback             | P0       | 1         |
| 4   | PostgreSQL / Supabase security adapter                            | P1       | 3         |
| 5   | Replace db.rls-missing policy with abstract tenant-isolation rule | P1       | 2, 3      |
| 6   | Diagnostics UI — abstract Security Matrix columns                 | P1       | 1, 2      |
| 7   | Access Control Inspector — mechanisms and evidence                | P1       | 6         |
| 8   | MariaDB / MySQL security adapter                                  | P2       | 3         |
| 9   | MongoDB security adapter                                          | P2       | 3         |
| 10  | Legacy securityMatrix deprecation + docs                          | P1       | 5, 6      |

## MVP cut (Phase 0–3)

- Types + matrix derivation ✅ (started in repo)
- App chain analyzer
- Adapter registry + PostgreSQL adapter
- Abstract policy rules
- New matrix UI + inspector

## Deferred

- Firestore / DynamoDB adapters
- Live DB policy introspection (runtime credentials)
- Encryption control detection

## Migration summary

1. **Phase 0** — Types on `BlueprintDocument` (additive)
2. **Phase 1–2** — Analyzers emit `accessControlFindings`
3. **Phase 3** — UI reads `accessControlMatrix`; legacy `securityMatrix` synthesized
4. **Phase 5** — Remove RLS column and `rls-policy` concept

## Create issues

```bash
bash scripts/create-blueprint-access-control-issues.sh [owner/repo]
```
