# Feature: [visudev-gapclose P1-4] Meteor METHOD + Mongo after Walk-Seed

## Intent

Prefer `meteor-methods` / `models.ts` / publications in walk seeds so P0-5 extractors see real METHOD + Mongo surfaces.

## Happy Path

- [ ] Seeds include `apps/meteor/server/meteor-methods/**` and `models.ts`
- [ ] Seed ordering prefers methods/models over generic meteor fill
- [ ] Unit tests cover ordering
- [ ] Enrichment OFF for acceptance scans

## Implementation Notes

- `collectCriticalSeedRelPaths` walks `meteor-methods`, publications, `models.ts` before generic server fill.
- Smoke: Rocket.Chat clone → 66 meteor-methods seeds, ~47 with `Meteor.methods`.
