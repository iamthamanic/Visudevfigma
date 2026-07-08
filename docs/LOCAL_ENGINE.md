# Local Engine

VisuDEV Local Engine is the local-first control plane for projects, blueprint analysis, and previews.

## Why it exists

VisuDEV should run as a developer tool without mandatory Supabase or Tauri. The UI stays in a normal browser (Vite on port **3005**) so Cursor Browser Visual Editor keeps working. The Local Engine owns local project metadata, analysis runs, preview mapping, and path security.

## Why not Tauri

Tauri would move the UI into a WebView and break the Cursor Browser Visual Editor workflow.

## Ports

| Service        | Default                 |
| -------------- | ----------------------- |
| VisuDEV UI     | `http://localhost:3005` |
| Local Engine   | `http://127.0.0.1:4317` |
| Preview Runner | `http://localhost:4000` |

## Scripts

```bash
npm run dev                 # Local-first: UI + Engine + Runner
npm run dev:local           # same as dev
npm run dev:local:no-runner # UI + Engine only
npm run dev:engine          # Engine only
npm run dev:supabase        # Legacy Supabase hybrid stack
```

## Environment

```env
VITE_VISUDEV_MODE=local
VITE_VISUDEV_ENGINE_URL=http://localhost:4317
VISUDEV_ENGINE_PORT=4317
VISUDEV_PREVIEW_RUNNER_URL=http://localhost:4000
# VISUDEV_STORAGE_DIR=~/.visudev
# VISUDEV_ANALYSIS_PROVIDER=autoguide
# VISUDEV_AUTOGUIDE_ROOT=/path/to/autoguide
```

## Modes

- **local** — default, uses Local Engine + `~/.visudev`
- **supabase** — legacy Edge Functions (`npm run dev:supabase`)
- **hybrid** — reserved, not implemented in Phase 1

## Architecture

```
Browser UI (3005)
  → getVisuDevClient()
    → Local Engine (4317)
      → ~/.visudev storage
      → LegacyBlueprintRunnerProvider → Runner /blueprint/analyze
      → LocalPreviewRunnerProvider → Runner /start|status|stop-project
      → Browse proxy → Runner /browse-local-path
```

## AutoGuide-ready adapters

- `legacy-visudev-analysis.provider.ts` — default blueprint path (Preview Runner + Deno pipeline)
- `autoguide-analysis.provider.ts` — optional `@autoguide/scanner` integration
- `autoguide-stub.provider.ts` — dev stub when `VISUDEV_AUTOGUIDE_STUB=1`

### Enable AutoGuide blueprint scans

```env
VISUDEV_ANALYSIS_PROVIDER=autoguide
VISUDEV_AUTOGUIDE_ROOT=/absolute/path/to/autoguide   # built monorepo with packages/*/dist
# optional:
VISUDEV_AUTOGUIDE_SOURCE_DIR=src
VISUDEV_AUTOGUIDE_STUB=1   # keep stub provider registered (no real scan)
```

When `VISUDEV_ANALYSIS_PROVIDER` is unset, blueprint scans use `legacy-blueprint-runner`.

`GET /api/capabilities` reports AutoGuide package availability under `analysis.autoguide`.

## Not migrated yet (Phase 2+)

- WebSocket/SSE progress streaming

## Project migration (Supabase ↔ local)

Optional import/export of **project metadata and analysis artifacts** (no secrets).

### Bundle format

Version `1` JSON with:

- `project` — name, paths, repo, preview/database hints (tokens stripped)
- `artifacts` — optional `blueprint`, `appflow`, `erd`

### Engine API

| Endpoint                                     | Description                                         |
| -------------------------------------------- | --------------------------------------------------- |
| `POST /api/migration/export/supabase`        | Fetch project + artifacts from Supabase Edge        |
| `GET /api/migration/export/local/:projectId` | Export from `~/.visudev`                            |
| `POST /api/migration/import/local`           | Import bundle into `~/.visudev`                     |
| `POST /api/migration/import/supabase`        | Create Supabase project from bundle (auth required) |

### CLI

```bash
# Requires Local Engine on :4317
npm run migrate -- export-local --project-id=<uuid> --out=./bundle.json
npm run migrate -- import-local --file=./bundle.json

npm run migrate -- export-supabase --project-id=<uuid> --out=./bundle.json
npm run migrate -- import-supabase --file=./bundle.json --access-token=<jwt>
```

Environment: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ACCESS_TOKEN` for Supabase calls.

Secrets (`github_access_token`, `supabase_*_key`, integration tokens) are **never** exported or imported.

## Phase 1 verification

```bash
npm run checks          # format, lint, typecheck, test, build
npm run dev             # full stack
curl http://127.0.0.1:4317/health?details=1
```

## Health check

```bash
curl "http://localhost:4317/health?details=1"
```

## Storage location

Default user-global store: `~/.visudev` (not the VisuDEV repo directory).
