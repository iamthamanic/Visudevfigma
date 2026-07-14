# Acceptance — Graph-derived legacy retirement (#75)

## Intent

SoftwareGraph is the single source of truth; legacy report fields are deprecated shims.

## Criteria

- [x] Legacy fields marked `@deprecated` in TypeScript types
- [x] Enrichment derives legacy diagnostics from graph (graph-first)
- [x] `normalizeBlueprintData` synthesizes legacy fields from graph when graph present
- [x] Parity test for graph-only document normalization
- [x] npm run checks green
