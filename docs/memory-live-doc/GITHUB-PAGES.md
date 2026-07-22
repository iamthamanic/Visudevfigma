# GitHub Pages policy for memory-live-doc

## Goal

Publish the interactive viewer at `docs/memory-live-doc/viewer/` **without overwriting** an existing GitHub Pages site that serves something else.

## Script

```bash
bash ~/.cursor/skills/memory-live-doc/scripts/github-pages-memory.sh status [--write-config]
bash ~/.cursor/skills/memory-live-doc/scripts/github-pages-memory.sh enable [--write-config]
```

`--write-config` mirrors the JSON report into `.project-memory/config.json` → `.pages`.

## Status values

| `status`                | Meaning                                                                  | Change Pages settings?                             |
| ----------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| `not_enabled`           | No Pages site                                                            | **Yes** on `enable` → legacy `main` + `/docs` only |
| `memory_viewer_active`  | `/docs` Pages + local viewer present, or Pages root is the viewer folder | **No** — only push file updates                    |
| `pages_compatible_docs` | Pages already `/docs` (viewer may not be pushed yet)                     | **No** — add `docs/memory-live-doc/**` only        |
| `pages_other`           | Pages is `/`, other path, other branch, or Actions workflow              | **Never** — exit 2                                 |

## Hard rules

1. **Never** switch an existing Pages source from `/` → `/docs` (would replace the site).
2. **Never** replace or edit an Actions-based Pages workflow.
3. **Never** change `source.path` / `source.branch` when status is `pages_other`.
4. When Pages is already `/docs`, memory-live-doc is **additive** (`docs/memory-live-doc/viewer/`) — that is not an overwrite of other docs.
5. `enable` is a no-op if already compatible/active.
6. Distinguish **“Pages on”** vs **“memory-live-doc viewer published”**:
   - Pages on ≠ our viewer is the site.
   - Our viewer is active only under the statuses above.

## Expected URL (legacy `/docs`)

`https://<owner>.github.io/<repo>/memory-live-doc/viewer/`

## New projects (`@project-setup` Step 9)

1. Bootstrap/apply memory.
2. Run `github-pages-memory.sh status --write-config`.
3. If `not_enabled` and user wants public viewer → `enable --write-config` after first push of `docs/`.
4. If `pages_other` → report URL/reason; do not enable; keep local viewer + docs only.

## Existing projects

Same script. Safe default: **status first**, enable only when `can_enable: true`.

## Updates after apply

`@memory-live-doc apply` refreshes `viewer/data/*.json`. Push updates the public site **only if** Pages already serves `/docs` (or the viewer root). No re-enable needed.
