# Feature Intake: blueprint-engine-pluggable

Epic design: `.qa/design/blueprint-engine-pluggable.md`

> **DRAFT** — Issues noch nicht auf GitHub. Bei OK: `@feature-intake create blueprint-engine-pluggable`

## Slices

| #   | Title                                               | Priority | dependsOn |
| --- | --------------------------------------------------- | -------- | --------- |
| 1   | Blueprint provider interface + registry refactor    | P0       | —         |
| 2   | Robust parent/leaf run status handling              | P0       | 1         |
| 3   | Per-project blueprint provider selection + API      | P0       | 1         |
| 4   | Raw-to-canonical Blueprint DTO + enrichment service | P0       | 1         |
| 5   | Refactor legacy blueprint provider to raw DTO       | P0       | 4         |
| 6   | Refactor AutoGuide adapter to raw DTO               | P0       | 4         |
| 7   | Security Matrix + Findings enrichment               | P1       | 5,6       |
| 8   | Minimal provider selector UI                        | P1       | 3         |
| 9   | Update docs + env examples                          | P1       | 3,7       |
| 10  | Regression tests + `npm run checks` green           | P0       | 2,7       |

## MVP cut (deferred)

- AI enrichment layer
- Provider marketplace / discovery
- Containerized AutoGuide execution

## Design link

[`.qa/design/blueprint-engine-pluggable.md`](.qa/design/blueprint-engine-pluggable.md)
