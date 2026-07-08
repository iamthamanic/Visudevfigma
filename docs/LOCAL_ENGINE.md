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

- `legacy-visudev-analysis.provider.ts` — production blueprint path today
- `autoguide-analysis.provider.ts` — stub/TODO for future `@autoguide/*` packages

## Not migrated yet (Phase 2+)

- Local App Flow scans
- Local Data scans
- Screenshot capture
- Supabase project import/export
- WebSocket/SSE progress streaming

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
