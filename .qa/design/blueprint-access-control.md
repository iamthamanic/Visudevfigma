# Epic Design: Stack-Agnostic Access Control for Blueprint Diagnostics

## Problem & Intent

Blueprint Diagnostics treats **RLS** as a universal security column and implicitly expects PostgreSQL-style row policies. That is wrong semantically:

- **RLS** is one possible implementation of **Resource Scope**, **Tenant Isolation**, or **Ownership Enforcement**.
- MariaDB has grants, views, and stored procedures — not native RLS.
- MongoDB has collection roles and query filters — not RLS.
- A project can be **fully protected** without RLS if tenant scoping is enforced in middleware + repository + query.

**Goal:** Blueprint must ask stack-independent questions:

1. Who may access which resource?
2. How is access constrained?
3. Where is the rule enforced?
4. Is it effective across all access paths?
5. What evidence exists?

Technology-specific mechanisms (PostgreSQL RLS, MariaDB security views, MongoDB collection roles, Firestore rules, Prisma middleware) are detected by **adapters** and shown in the **Inspector**, not as fixed matrix columns.

**Depends on:** Wave 2 viz parity (Diagnostics shell, matrix, inspector) and Blueprint v2 Software Graph (neutral IR).

**Non-goals (MVP):**

- Full static analysis of every ORM query variant.
- Runtime penetration testing or live DB credential scans.
- Replacing the separate **Data** view ERD; adapters may reuse schema introspection where available.

## Core Principle

| Layer                         | Stack-independent?          | Notes                                                          |
| ----------------------------- | --------------------------- | -------------------------------------------------------------- |
| Graph schema                  | ✅                          | `SoftwareGraph` nodes/edges/evidence                           |
| Security control model        | ✅                          | `AccessControlFinding`, abstract controls                      |
| Status vocabulary             | ✅                          | protected / partial / unverified / missing / n/a / unsupported |
| Blueprint UI (matrix columns) | ✅                          | Auth, AuthZ, Scope, Tenant, Ownership, Validation, Audit       |
| Mechanism display (inspector) | ⚠️ labels are tech-specific | "PostgreSQL RLS", "Repository Query Filter", …                 |
| Parsers & detection rules     | ❌                          | Per database / framework adapter                               |

## Abstract Security Model

```
Access Control
├── Authentication
├── Authorization
├── Resource Scope
├── Tenant Isolation
├── Ownership Enforcement
├── Read Restrictions
├── Write Restrictions
├── Input Validation
├── Privileged Access
├── Audit Logging
└── Encryption
```

RLS maps to **Resource Scope** and/or **Tenant Isolation** — never as a top-level universal requirement.

## Types (canonical)

Defined in `shared/access-control.types.ts`:

- `AccessControlMechanism` — how protection is implemented (e.g. `database-row-policy`, `repository-filter`).
- `AccessControlControl` — what is being protected (e.g. `tenant-isolation`, `ownership`).
- `AccessControlStatus` — outcome (protected, partial, unverified, missing, not-applicable, unsupported).
- `EnforcementLayer` — where enforced (client, api, service, repository, database, infrastructure).
- `AccessControlEvidence` — file/line/snippet reference.
- `AccessControlFinding` — one control assessment for one resource (route, table, collection).
- `AccessControlMatrixRow` — route-level summary derived from findings (replaces RLS column).

## Analysis Pipeline

```mermaid
flowchart TD
  Scan[RawBlueprintScan + optional DB config] --> Graph[SoftwareGraph]
  Graph --> AppChain[Application Chain Analyzer]
  Graph --> DbDetect[Database Kind Detection]
  DbDetect --> Adapter{Security Adapter}
  Adapter -->|postgres| Pg[PostgreSQL Adapter]
  Adapter -->|mariadb| My[MariaDB Adapter]
  Adapter -->|mongodb| Mo[MongoDB Adapter]
  Adapter -->|sqlite| Sq[SQLite Adapter]
  Adapter -->|unknown| Un[Unknown Adapter]
  AppChain --> Findings[AccessControlFinding[]]
  Pg --> Findings
  My --> Findings
  Mo --> Findings
  Sq --> Findings
  Un --> Findings
  Findings --> Matrix[AccessControlMatrixRow[]]
  Findings --> Legacy[Legacy securityMatrix compat layer]
  Matrix --> UI[DiagnosticsView]
```

### Application chain (all stacks)

Trace per route / data path:

```
Identity → Auth Middleware → AuthZ / Role Check → Use Case → Repository → Query Scope → DB Operation
```

**Protected** when the chain is evidenced end-to-end. **Critical** when a shortcut bypasses scope (e.g. `db.collection("x").findOne({ _id })` without `ownerId`).

### Database adapters (technology-specific)

| Adapter             | Detects                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **PostgreSQL**      | `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`, grants, roles, views                                                       |
| **MariaDB / MySQL** | grants, `SQL SECURITY` views, stored procedures, repo `WHERE tenant_id`                                                  |
| **MongoDB**         | built-in/custom roles, collection permissions, `tenantId`/`ownerId` filters, schema validation (→ Validation, not AuthZ) |
| **SQLite**          | application guards, repository filters (no server-side RLS)                                                              |
| **Firestore**       | security rules files                                                                                                     |
| **Supabase**        | PostgreSQL RLS + auth hooks (extends PostgreSQL adapter)                                                                 |
| **Unknown**         | application-layer evidence only; DB mechanisms → `unsupported`                                                           |

## Security Matrix Migration

### Before (current)

| Route | Auth | Role | Validation | Rate Limit | DB | **RLS** | Audit |

### After (target)

| Route | AuthN | AuthZ | Scope | Tenant | Ownership | Validation | Rate Limit | Audit | Status |

- **Scope / Tenant / Ownership** cells summarize `AccessControlFinding` status for that route.
- Clicking a cell opens Inspector with **mechanisms** and **evidence**.
- **RLS** removed from matrix; appears as mechanism label when adapter finds PostgreSQL policies.

### Status rules

| Situation                                              | Status                                                  |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Mechanism evidenced on all paths                       | `protected`                                             |
| Some paths scoped, one bypass found                    | `partial`                                               |
| Sensitive data inferred, no scope evidence             | `missing`                                               |
| Cannot analyze (no DB facts)                           | `unverified`                                            |
| Control not relevant (e.g. ownership on list endpoint) | `not-applicable`                                        |
| DB kind lacks native feature (MariaDB + "RLS")         | `unsupported` for mechanism, **not** automatic critical |

**MariaDB without RLS ≠ security failure.** Critical only when: sensitive/tenant data exists **and** no access constraint is evidenced.

## BlueprintDocument Changes

Additive (backward compatible):

```typescript
interface BlueprintDocument {
  // existing fields …
  /** Stack-agnostic access control assessments. Source of truth for Diagnostics v3+. */
  accessControlFindings?: AccessControlFinding[];
  /** Route-level matrix derived from accessControlFindings. */
  accessControlMatrix?: AccessControlMatrixRow[];

  /** @deprecated Synthesize from accessControlMatrix when absent. Remove after Phase 8. */
  securityMatrix?: SecurityMatrixRow[];
}
```

`normalizeBlueprintData` continues to synthesize legacy `securityMatrix` (including `rls: n/a`) from new fields until UI migration completes.

## File Plan

| Path                                                                      | Purpose                                 |
| ------------------------------------------------------------------------- | --------------------------------------- |
| `shared/access-control.types.ts`                                          | Canonical types                         |
| `src/lib/visudev/access-control-types.ts`                                 | UI re-export                            |
| `shared/access-control-matrix.ts`                                         | Derive matrix rows from findings        |
| `shared/access-control-matrix.test.ts`                                    | Unit tests                              |
| `local-engine/src/services/access-control/`                               | Adapter registry + app-chain analyzer   |
| `local-engine/src/services/access-control/adapters/postgres.adapter.ts`   | PostgreSQL detection                    |
| `local-engine/src/services/access-control/adapters/unknown.adapter.ts`    | Fallback                                |
| `local-engine/src/services/blueprint-enrichment.service.ts`               | Attach findings to document             |
| `src/modules/blueprint/components/SecurityMatrix.tsx`                     | New columns (feature-flagged or phased) |
| `src/modules/blueprint/components/diagnostics/AccessControlInspector.tsx` | Mechanism + evidence panel              |

## Migration Plan (phased)

### Phase 0 — Schema & contracts (this epic start)

- Add `shared/access-control.types.ts`.
- Add optional fields to `BlueprintDocument` / `BlueprintData`.
- Add `deriveAccessControlMatrixFromFindings()` with tests.
- No UI or analyzer changes yet.

### Phase 1 — Application chain analyzer

- Walk SoftwareGraph route → handler → repository → query facts.
- Emit findings for auth, authz, validation, tenant-filter, ownership-check, query-scope.
- Wire into `blueprint-enrichment.service.ts` alongside legacy matrix.

### Phase 2 — PostgreSQL / Supabase adapter

- Detect RLS policies, grants, roles from SQL migrations and fact snippets.
- Map to `database-row-policy`, `database-grant`, `database-role` mechanisms.
- Findings for tenant-isolation / resource-scope with PostgreSQL-specific evidence labels.

### Phase 3 — Diagnostics UI

- Replace RLS column with Scope / Tenant / Ownership.
- Inspector shows mechanisms (e.g. "PostgreSQL RLS", "Repository Query Filter").
- Keep legacy matrix via normalization for one release.

### Phase 4 — Additional DB adapters

- MariaDB, MongoDB, SQLite, Firestore adapters (incremental).
- Unknown adapter: app-layer only, honest `unsupported` for DB-native mechanisms.

### Phase 5 — Policy engine & deprecation

- Replace `db.rls-missing` rule with `access-control.tenant-isolation-missing`.
- Retire `rls-policy` concept type; map to access control findings.
- Remove RLS column from UI; drop legacy synthesis.

## Cross-Domain Sign-off

| Domain          | Status | Notes                                                  |
| --------------- | ------ | ------------------------------------------------------ |
| KISS            | ✅     | Adapters are optional plugins; unknown DB still works  |
| Security        | ✅     | No live DB credentials required for code-only analysis |
| UI/UX           | ✅     | Abstract matrix + detailed inspector                   |
| Testability     | ✅     | Pure functions over fixtures per adapter               |
| Backward compat | ✅     | Legacy `securityMatrix` synthesized until Phase 5      |

## Open Questions

1. Feature flag `VITE_ACCESS_CONTROL_V2` for new matrix columns during Wave 2 overlap?
2. AutoGuide fact kinds — need stable mapping to `AccessControlMechanism`?
3. Data scan dialect detection — reuse `resolve-database-config.ts` for adapter selection?

## Confidence: 90%

Ready for phased `@implement` starting with Phase 0 (types + derivation helpers).
