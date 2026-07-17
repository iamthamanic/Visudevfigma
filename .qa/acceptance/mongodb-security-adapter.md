# Feature: MongoDB security adapter

## Intent

Collection roles, `tenantId`/`ownerId` filters, middleware; schema validation → validation only.

## Happy Path

- [x] `mongodb.adapter.ts` + fixtures
- [x] Unscoped `find({})` → partial + warning

## Edge Cases

- [x] Schema validation does not imply tenant isolation
- [x] Resource-scoped fact matching

## Assumptions

- Code/fact scan only; no live MongoDB

## Implementation Notes

- Registered in default database security registry
