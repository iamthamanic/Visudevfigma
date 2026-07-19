# Entscheidungen

## access-control-stack-agnostic (2026-07-19)

**Status:** accepted (Claim: needs-review)

Blueprint prüft abstrakte Sicherheits-Controls (AuthN, AuthZ, Resource Scope, Tenant Isolation, Ownership, Validation, Audit). Konkrete Mechanismen (PostgreSQL RLS, MariaDB Security Views, MongoDB Collection Roles, Repository-Filter) erscheinen im Inspector bzw. über DB-Adapter.

**Konsequenz:** MariaDB/MongoDB ohne native RLS ≠ automatischer Sicherheitsfehler; kritisch erst bei sensiblen/mandantenbezogenen Daten ohne nachweisbare Zugriffseingrenzung.

**Evidence:** `.qa/design/blueprint-access-control.md`
