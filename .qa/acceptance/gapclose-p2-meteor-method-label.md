# Feature: [visudev-gapclose P2-3] Meteor: METHOD-Labels statt PAGE für meteor-methods

<!-- seeded by ecc-runner from issue #205 on 2026-07-17 — @implement may refine -->

## Intent
Rocket.Chat Meteor-Methods als `METHOD` labellen (nicht `PAGE /meteor/…`); Extractor/Labeling fertigstellen. Mongo PARTIAL+ bleibt erhalten.

## Happy Path
- [ ] - [ ] Routen/Units aus `meteor-methods/**` tragen Label/Kind **METHOD** (nicht PAGE)
- [ ] - [ ] Mongo collection Tables bleiben ≥ P1 Niveau (keine Regression vs 73 unique)
- [ ] - [ ] Execution zeigt METHOD-Units ehrlich (kein leeres Pseudo-HTTP)
- [ ] - [ ] Unit-Tests: Fixture Meteor.methods → METHOD label
- [ ] - [ ] visudev-gapclose Re-Scan Rocket.Chat; Enrichment OFF; Diff vs [P1-Verification](https://github.com/iamthamanic/visudev-app/blob/main/visudev-test-repos/evidence/VISUDEV-GAPCLOSE-P1-VERIFICATION.md)

## Edge Cases
- [ ] (from .qa/edge-cases.md + @implement)

## Regression
- [ ] Feed and topic routes still load

## Assumptions
- none

## Screenshots
| Step | Filename |
|------|----------|
| 1 | `01-happy-path.png` |

## Implementation Notes
<!-- filled after coding -->
