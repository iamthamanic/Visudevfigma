# Theme resolution (memory-live-doc viewer)

## Goal

GitHub Pages viewer matches the **product UI** when known; otherwise a **neutral default** theme. Never invent a second brand for docs.

## Files

| Path | Role |
|------|------|
| `assets/themes/default.json` | Fallback for repos without frontend styleguide |
| `assets/themes/visudev.json` | VisuDEV (`#03ffa3`, black surfaces, Inter) |
| `docs/memory-live-doc/viewer/data/theme.json` | Exported snapshot (Pages) |
| `.project-memory/config.json` → `theme_id` | Optional pin (`"visudev"` / `"default"`) |

## Token schema

```json
{
  "schema_version": 1,
  "id": "default",
  "source": "skill-default",
  "locked": false,
  "tokens": {
    "bg": "#…",
    "bgElev": "#…",
    "ink": "#…",
    "muted": "#…",
    "line": "#…",
    "accent": "#…",
    "accent2": "#…",
    "danger": "#…",
    "radius": "8px",
    "tabRadius": "8px",
    "fontDisplay": "…",
    "fontBody": "…",
    "fontMono": "…",
    "bgGlow1": "#…",
    "bgGlow2": "#…"
  },
  "fonts": { "google": "https://fonts.googleapis.com/css2?…" },
  "mermaid": { "theme": "dark", "themeVariables": { } }
}
```

Set `"locked": true` on a project’s `theme.json` to prevent overwrite on export.

## Adding a product theme

1. Add `assets/themes/<id>.json`
2. Either set `theme_id` in `.project-memory/config.json`, or teach `resolve-viewer-theme.sh` a heuristic
3. Re-run `export-viewer-snapshot.sh`
