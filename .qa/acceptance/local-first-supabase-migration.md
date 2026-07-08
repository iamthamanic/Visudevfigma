# Feature: [Local-First P2] Supabase project import/export

<!-- seeded by @implement from issue #29 on 2026-07-08 -->

## Intent

Optional migration between Supabase KV projects and `~/.visudev` without copying secrets.

## Preconditions

- Local Engine running for API/CLI import-local and export-local
- Supabase export/import: valid `VITE_SUPABASE_URL` + user `accessToken` (or anon key for read-only export if permitted)

## Happy Path

- [x] Export Supabase project → JSON bundle (metadata + blueprint/erd/appflow artifacts, secrets stripped)
- [x] Import bundle → `~/.visudev` project + artifact files
- [x] Export local project → JSON bundle
- [x] Import bundle → Supabase project (metadata only, no secrets)
- [x] Documented in `docs/LOCAL_ENGINE.md`
- [x] `npm run checks` green

## Edge Cases

- [x] Missing optional artifacts (blueprint/erd) do not fail export
- [x] Invalid `localPath` on import rejected by path security

## Regression

- [ ] Existing project CRUD unchanged

## Assumptions

- Bundle format version `1`; stored as `.json` file or API body
- Integrations tokens are never exported or imported

## Implementation Notes

- Shared: `project-migration.types.ts`, `project-migration.mjs` (sanitize + map)
- Engine: `migration.service.ts`, `POST/GET /api/migration/*` routes
- CLI: `npm run migrate` → `scripts/migration/visudev-migrate.mjs`
- Docs: `docs/LOCAL_ENGINE.md` migration section
