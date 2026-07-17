# Feature: MariaDB / MySQL security adapter

## Intent

Grants, SQL SECURITY views, stored procedures, repo `tenant_id` filters — no RLS requirement.

## Happy Path

- [x] `mariadb.adapter.ts` + fixtures
- [x] Dual mechanism display (view + repo filter)

## Edge Cases

- [x] Repo filter alone → partial (not RLS critical)
- [x] mysql dialect shares adapter logic

## Assumptions

- Detection is code/SQL fact based; no live DB

## Implementation Notes

- Registered for `mariadb` and `mysql` in default registry
