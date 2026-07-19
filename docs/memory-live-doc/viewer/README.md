# GitHub Pages setup — memory-live-doc viewer

## Safe automation (preferred)

From the **repo root**:

```bash
# 1) Detect: memory viewer vs other Pages site
bash ~/.cursor/skills/memory-live-doc/scripts/github-pages-memory.sh status --write-config

# 2) Enable ONLY if status is not_enabled (never overwrites other sites)
bash ~/.cursor/skills/memory-live-doc/scripts/github-pages-memory.sh enable --write-config
```

Policy: [references/github-pages-policy.md](../../../references/github-pages-policy.md) (in the skill package).

### Status meanings (short)

| status | Meaning |
|--------|---------|
| `not_enabled` | Pages off → enable is allowed |
| `memory_viewer_active` | `/docs` Pages + viewer present → push updates only |
| `pages_compatible_docs` | Pages already `/docs` → add viewer files; do not change settings |
| `pages_other` | Pages serves something else → **refused** (exit 2) |

## Manual enable (same end state)

1. Push `docs/memory-live-doc/viewer/` (with `data/*.json` snapshot) to your default branch.
2. Repo → **Settings** → **Pages**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or your default) → folder **`/docs`**
3. Open: `https://<user>.github.io/<repo>/memory-live-doc/viewer/`

Do **not** change Pages to `/docs` if the repo already publishes `/` or an Actions site.

### Alternative: viewer as Pages root

Set Pages folder to `/docs/memory-live-doc/viewer` if your host supports a nested docs path. Then the site URL is the viewer root and `./data/*.json` still works. Only do this when Pages is free or already that path.

## Private repositories

GitHub Pages on private repos may require a paid plan and has visibility limits. Prefer a public docs site or export the viewer elsewhere if Pages is unavailable.

## Local smoke check

From the skill package or a repo copy:

```bash
cd ~/.cursor/skills/memory-live-doc/assets/viewer
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

`file://` often blocks `fetch` of JSON — use a local static server.

## Data snapshot

On `@memory-live-doc apply`, the skill writes:

- `data/project.json`
- `data/features.json`
- `data/changes.json`
- `data/current-state.json`

Keep the viewer self-contained; do not rely on fetching `.project-memory/` outside `docs/` from Pages.
