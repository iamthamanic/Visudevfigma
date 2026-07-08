# Local-First VisuDEV — Architecture Decisions

Epic design for the Local Engine refactor. Source: grill session 2026-07-08.

**Status: Phase 1 COMPLETE** (verified 2026-07-08 — `npm run checks` green, E2E API smoke tests passed)

## Goals

- VisuDEV runs local-first without Tauri or mandatory Supabase.
- Browser UI stays on Vite (`localhost:3005`) for Cursor Browser Visual Editor.
- Local Engine (`127.0.0.1:4317`) is the control plane.
- Preview Runner (`localhost:4000`) remains execution service.
- AutoGuide is prepared via stub provider only.

## Non-goals (Phase 1) — still deferred to Phase 2+

- Tauri
- Full Supabase removal
- Local App Flow / Data scans
- AutoGuide production integration
- Supabase → local migration/import

## Modes

| Mode       | Entry                  | Backend                 |
| ---------- | ---------------------- | ----------------------- |
| `local`    | `npm run dev`          | Local Engine            |
| `supabase` | `npm run dev:supabase` | Edge Functions (legacy) |
| `hybrid`   | reserved               | throws NotImplemented   |

## Storage

Default: `~/.visudev`

```
projects.json
projects/{id}/blueprint.json
projects/{id}/latest-blueprint-run.json
runs/{runId}/status.json
runs/{runId}/result.json
previews/{projectId}.json
```

## Analysis (Phase 1)

- `POST /api/projects/:id/analyze` with `scanType`
- Only `blueprint` implemented locally
- Async runs with polling from `store.tsx`
- Provider: `legacy-blueprint-runner` → Runner `/blueprint/analyze`

## Preview

- UI → Local Engine → Runner
- Mapping in `.visudev/previews/{projectId}.json`
- Stop via `/stop-project/:projectId`

## Shared modules

- `shared/local-path-security.mjs`
- `shared/visudev-api.types.ts`

## Frontend boundary

- `getVisuDevClient()` singleton
- `LocalVisuDevClient` / `SupabaseVisuDevClient`
- Store uses client for projects, blueprint, preview, browse

## Phase 1 acceptance (all done)

- [x] Shared path security + API types
- [x] Local Engine Hono server + `~/.visudev` storage
- [x] Projects CRUD API
- [x] Blueprint analysis + preview + browse proxy
- [x] Frontend `visudev-api` client layer
- [x] Store + pages migration (blueprint, projects, mode-gating)
- [x] `dev-local.js` orchestration, `npm run dev` → local-first
- [x] Docs, env, lint/typecheck/checks

## Phase 2 roadmap (not started — requires new design)

1. **Local App Flow scan** — Runner + Deno analyzer endpoint (analog `blueprint-local.js`)
2. **Local Data scan** — schema introspection without Supabase Management API
3. **Screenshots / runtime crawl** — via preview runner in local mode
4. **Supabase project import/export** — optional migration tool
5. **AutoGuide provider** — replace `autoguide-stub` when packages exist
