# Decisions

## access-control-stack-agnostic (2026-07-19)

**Status:** accepted (claim: needs-review)

Blueprint assesses abstract security controls (AuthN, AuthZ, Resource Scope, Tenant Isolation, Ownership, Validation, Audit). Concrete mechanisms (PostgreSQL RLS, MariaDB security views, MongoDB collection roles, repository filters) appear in the inspector / via DB adapters.

**Consequence:** MariaDB/MongoDB without native RLS ≠ automatic security failure; critical only when sensitive/tenant data lacks evidenced access scoping.

**Evidence:** `.qa/design/blueprint-access-control.md`
