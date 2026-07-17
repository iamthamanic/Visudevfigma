# Feature: [visudev-gapclose P2-3] Meteor: METHOD-Labels statt PAGE

<!-- seeded by ecc-runner from issue #205 — refined after implement -->

## Intent

Rocket.Chat Meteor-Methods als `METHOD` labellen (nicht `PAGE /meteor/…`); Mongo PARTIAL+ bleibt erhalten.

## Happy Path

- [x] Routen aus `meteor-methods/**` tragen Label/Kind **METHOD** (nicht PAGE)
- [x] `normalizeRouteMethod` preserves METHOD/PUBLISH
- [x] Unit-Tests: Fixture Meteor METHOD → projected route METHOD
- [ ] visudev-gapclose Re-Scan Rocket.Chat; Enrichment OFF (post-merge)

## Implementation Notes

- `shared/blueprint-graph-routes.ts`: allow METHOD/PUBLISH/API in `normalizeRouteMethod` (was collapsing to PAGE)
- Graph nodes already had METHOD labels; blueprint.routes projection was the bug
