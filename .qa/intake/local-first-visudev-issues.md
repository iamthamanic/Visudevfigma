# Feature Intake: local-first-visudev

Epic design: `.qa/design/local-first-visudev.md`

## GitHub issues (created 2026-07-08)

### Phase 1 — DONE (closed #18–#25)

| #   | Title                                             | Status |
| --- | ------------------------------------------------- | ------ |
| 18  | Shared foundation: path security + API types      | CLOSED |
| 19  | Local Engine: Hono server + file storage + health | CLOSED |
| 20  | Local Engine: projects CRUD API                   | CLOSED |
| 21  | Local Engine: blueprint + preview + browse        | CLOSED |
| 22  | Frontend: visudev-api client layer                | CLOSED |
| 23  | Frontend: store + pages migration                 | CLOSED |
| 24  | Dev orchestration: dev-local.js + scripts         | CLOSED |
| 25  | Docs + env + CI checks                            | CLOSED |

Code implemented locally; `npm run checks` green. **PR still pending** (split from `issue/10-visudev-graph-dto` branch).

### Phase 2 — OPEN (#26–#30)

| #   | Title                             | Priority | Depends on |
| --- | --------------------------------- | -------- | ---------- |
| 26  | Local App Flow scan via Runner    | P0       | P1 engine  |
| 27  | Local Data / ERD scan             | P1       | #26        |
| 28  | Runtime screenshots in local mode | P1       | #26        |
| 29  | Supabase project import/export    | P2       | —          |
| 30  | AutoGuide production provider     | P2       | —          |

### Parallel epic: VisuDevGraph DTO (#10–#17)

Finish **before** Phase 2 local-first. Issue **#10** is `agent-blocked` (AI review 45%).

## ECC Runner queue order

1. `#10` → `#17` (graph-dto)
2. `#26` → `#30` (local-first phase 2)

```bash
@ecc-runner          # batch mode
# or
@ecc-runner step     # one phase only
```

Recreate issues: `bash scripts/create-local-first-github-issues.sh` (idempotent only for new repos).
