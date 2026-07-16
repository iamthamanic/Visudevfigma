# Feature: [visudev-gapclose P0-1] Soft-cap File-Ranking: App-Code vor Specs/Basename

<!-- seeded by ecc-runner from issue #184 on 2026-07-17 — @implement may refine -->

## Intent

Fix soft-cap (FILE_LIMIT≈400) ranking so real app/source files outrank `*.spec.ts` / `*.test.*` / `*.mock.*` and basename-lottery noise. Unblocks correct inputs for Express/Nest/Meteor extractors on Golden Set + Actual/Immich/Discourse/browo-hr.

## Happy Path

- [ ] - [ ] Unit tests: under Cap, no top-root dominated by `*.spec.ts` / `*.test.*` / `*.mock.*` for fixtures mirroring Actual/Immich/Discourse bias
- [ ] - [ ] browo-hr: ranked paths keep module path segments (not basename-only `HrKo_*` / repeated `schema.prisma`)
- [ ] - [ ] Soft-limit Banner remains allowed when Cap still truncates
- [ ] - [ ] visudev-gapclose re-scan (Enrichment **OFF**): Golden Set + Actual + Immich — catalog roots not spec-dominated
- [ ] - [ ] Pin / evidence: VisuDEV `5ee4a4040a60f4fa355bce89baad4dcf4b90c16c`; Actual `501bece3a1a5…`; Immich `f19f30ec6610…`; browo-hr `24dd57cb0cfc…`; checklist IDs from catalogs under soft-cap / ranking notes

## Edge Cases

- [ ] (from .qa/edge-cases.md + @implement)

## Regression

- [ ] Feed and topic routes still load

## Assumptions

- none

## Screenshots

| Step | Filename            |
| ---- | ------------------- |
| 1    | `01-happy-path.png` |

## Implementation Notes

- Updated `prioritizeBlueprintFiles` in `preview-runner/lib/blueprint-local.js` and mirrored in `call-graph.builder.ts`.
- Specs/mocks/test dirs score -100; canonical `packages/database|prisma/schema.prisma` stay 100; other `schema.prisma` demoted to 78.
- Boosts: `/modules/`, `/controllers/`, `/leaves/`, `/apps/meteor/server`; depth tie-break for module segments.
- Tests: `blueprint-local.test.js` covers Actual/Immich-style spec bias and browo basename lottery.
