# Architecture history (v1)

## Layout

```text
.project-memory/architecture/
  overview.mermaid                 # current diagram (source of truth for "now")
  history/
    <YYYY-MM-DD>-<slug>.json       # immutable snapshots
```

## History entry schema

File: `.project-memory/architecture/history/<YYYY-MM-DD>-<slug>.json`

```json
{
  "schema_version": 1,
  "id": "2026-07-19-access-control",
  "date": "2026-07-19",
  "title": { "de": "…", "en": "…" },
  "summary": { "de": "…", "en": "…" },
  "commit": "<full-sha-or-short>",
  "mermaid": "flowchart TB\n…",
  "change_ids": ["2026-07-19-bootstrap"],
  "review_status": "needs-review"
}
```

## When to snapshot

On `@memory-live-doc apply`, if `overview.mermaid` changed materially since the last history entry (content hash differs), **append** a new history file dated today **before** overwriting overview — or copy the previous overview into history when replacing it.

Never delete history entries (append-only).

## Export

`export-viewer-snapshot.sh` writes:

- `architecture.json` — current overview (+ embedded latest mermaid)
- `architecture-history.json` — `{ schema_version, versions: [ …sorted by date desc ] }` including current as first entry if not already listed

## Viewer

Architecture tab: date filter / select → render selected Mermaid.
