#!/usr/bin/env bash
# Create GitHub issues for Local-First VisuDEV Phase 1 + Phase 2.
# Phase 1 issues are closed immediately (implemented locally, PR pending).
# Usage: bash scripts/create-local-first-github-issues.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO="${1:-iamthamanic/Visudevfigma}"
ECC_ROOT="${ECC_RUNNER_ROOT:-$HOME/.cursor/skills/ecc-runner}"

gh auth status >/dev/null
bash "${ECC_ROOT}/scripts/bootstrap-labels.sh" "${REPO}" >/dev/null

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local num
  num=$(gh issue create --repo "${REPO}" --title "${title}" --body "${body}" --label "${labels}")
  echo "${num}" | grep -oE '[0-9]+$'
}

close_issue() {
  local num="$1"
  local reason="$2"
  gh issue close "${num}" --repo "${REPO}" --comment "${reason}"
  gh issue edit "${num}" --repo "${REPO}" --add-label agent-done --remove-label agent-ready 2>/dev/null || true
}

DESIGN=".qa/design/local-first-visudev.md"
PHASE1_DONE="Implemented locally on 2026-07-08. \`npm run checks\` green. Awaiting dedicated PR branch (code currently on \`issue/10-visudev-graph-dto\` — split before merge)."

echo "Creating Local-First Phase 1 issues (will close as done)..."

P1_ISSUES=()

# 1
n=$(create_issue \
  "[Local-First P1] Shared foundation: path security + API types" \
  "## Intent
Canonical shared modules for Local Engine and Preview Runner.

## Acceptance
- [x] Single canonical path jail in \`shared/local-path-security.mjs\`
- [x] Preview Runner re-exports shared module
- [x] \`shared/visudev-api.types.ts\` exported for engine + frontend

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-shared-foundation phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 2
n=$(create_issue \
  "[Local-First P1] Local Engine: Hono server + file storage + health" \
  "## Intent
Node/Hono control plane on 127.0.0.1:4317 with ~/.visudev storage.

## Acceptance
- [x] GET /health returns ok
- [x] Storage defaults to ~/.visudev
- [x] Atomic JSON writes

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-engine-core phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 3
n=$(create_issue \
  "[Local-First P1] Local Engine: projects CRUD API" \
  "## Intent
Local project metadata without Supabase KV.

## Acceptance
- [x] GET/POST/PATCH/DELETE /api/projects
- [x] Projects persist in projects.json

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-projects-crud phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 4
n=$(create_issue \
  "[Local-First P1] Local Engine: blueprint + preview + browse" \
  "## Intent
Async blueprint analysis, preview proxy, native folder browse proxy.

## Acceptance
- [x] POST analyze returns 202 with runId
- [x] Blueprint via legacy runner provider
- [x] Preview proxied to runner
- [x] Browse proxies /browse-local-path

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-engine-analysis-preview phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 5
n=$(create_issue \
  "[Local-First P1] Frontend: visudev-api client layer" \
  "## Intent
Mode-aware API boundary for local vs supabase.

## Acceptance
- [x] getVisuDevClient() factory
- [x] Local + Supabase clients
- [x] isLocalVisuDevMode() helper

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-visudev-api phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 6
n=$(create_issue \
  "[Local-First P1] Frontend: store + pages migration" \
  "## Intent
Default dev flows use Local Engine via VisuDevApiClient.

## Acceptance
- [x] Projects CRUD via client
- [x] Blueprint scan + polling in local mode
- [x] Local path browse via engine
- [x] AppFlow/Data scans disabled in local mode

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-frontend-migration phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 7
n=$(create_issue \
  "[Local-First P1] Dev orchestration: dev-local.js + scripts" \
  "## Intent
npm run dev starts local-first stack by default.

## Acceptance
- [x] npm run dev starts UI + engine + runner
- [x] dev:supabase preserves legacy stack
- [x] Port checks for 3005/4317/4000

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-dev-orchestration phase:1 -->" \
  "P0,P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

# 8
n=$(create_issue \
  "[Local-First P1] Docs + env + CI checks" \
  "## Intent
Document Local Engine and wire checks for local-engine + shared.

## Acceptance
- [x] docs/LOCAL_ENGINE.md
- [x] typecheck covers app + engine
- [x] eslint includes local-engine and shared
- [x] npm run checks passes

## Design
Epic: ${DESIGN}

<!-- feature-intake slug: local-first-docs-checks phase:1 -->" \
  "P1")
P1_ISSUES+=("$n")
close_issue "$n" "${PHASE1_DONE}"

echo "Creating Local-First Phase 2 issues (open, agent-ready)..."

P2_ISSUES=()

# P2-1
n=$(create_issue \
  "[Local-First P2] Local App Flow scan via Runner + Engine" \
  "## Intent
Enable scanType=appflow in local mode (Engine orchestrator + Runner Deno CLI).

## Problem
App Flow scan only works via Supabase Edge today; local mode blocks appflow.

## Solution
- Preview Runner: POST /appflow/analyze (analog blueprint-local.js)
- Deno CLI for static analyzer on local file walk
- Engine: legacy-appflow-runner provider + storage for screens/flows
- Frontend: re-enable AppFlow scan in local mode via client

## Acceptance
- [ ] POST /api/projects/:id/analyze { scanType: appflow } succeeds locally
- [ ] AppFlowPage shows screens after scan on local_path project
- [ ] npm run checks green

## Design
Epic: ${DESIGN} (Phase 2)

Depends on #${P1_ISSUES[3]} (closed — engine analysis foundation)

<!-- feature-intake slug: local-first-appflow-scan phase:2 -->" \
  "P0,P1,agent-ready")
P2_ISSUES+=("$n")

# P2-2
n=$(create_issue \
  "[Local-First P2] Local Data / ERD scan" \
  "## Intent
Enable scanType=data in local mode without Supabase Management API.

## Solution
- Engine provider for schema introspection (local PostgreSQL connection string or sqlite)
- Store ERD JSON under ~/.visudev/projects/{id}/
- Frontend: re-enable Data page scan in local mode

## Acceptance
- [ ] POST analyze { scanType: data } works in local mode
- [ ] DataPage renders tables from local ERD cache
- [ ] Graceful empty state when no DB configured

## Design
Epic: ${DESIGN} (Phase 2)

Depends on #${P2_ISSUES[0]}

<!-- feature-intake slug: local-first-data-scan phase:2 -->" \
  "P1,agent-ready")
P2_ISSUES+=("$n")

# P2-3
n=$(create_issue \
  "[Local-First P2] Runtime screenshots in local mode" \
  "## Intent
App Flow thumbnails via preview runner crawl in local-first stack.

## Solution
- Route preview crawl through Engine → Runner (not direct UI → previewAPI)
- Persist screenshot refs in ~/.visudev or project metadata

## Acceptance
- [ ] Local project App Flow shows thumbnails after preview + crawl
- [ ] No direct Supabase edge calls in local mode for screenshots

## Design
Epic: ${DESIGN} (Phase 2)

Depends on #${P2_ISSUES[0]}

<!-- feature-intake slug: local-first-runtime-screenshots phase:2 -->" \
  "P1,agent-ready")
P2_ISSUES+=("$n")

# P2-4
n=$(create_issue \
  "[Local-First P2] Supabase project import/export" \
  "## Intent
Optional migration between Supabase KV projects and ~/.visudev.

## Acceptance
- [ ] CLI or API: export supabase project → local JSON
- [ ] Import local project metadata (no secrets) into supabase mode
- [ ] Documented in LOCAL_ENGINE.md

## Design
Epic: ${DESIGN} (Phase 2)

<!-- feature-intake slug: local-first-supabase-migration phase:2 -->" \
  "P2,agent-ready")
P2_ISSUES+=("$n")

# P2-5
n=$(create_issue \
  "[Local-First P2] AutoGuide production provider" \
  "## Intent
Replace autoguide-stub with real @autoguide/* integration when packages exist.

## Acceptance
- [ ] autoguide-analysis.provider calls real packages
- [ ] Feature-flagged; legacy-blueprint-runner remains default
- [ ] Stub removed or kept behind env flag

## Design
Epic: ${DESIGN} (Phase 2)

<!-- feature-intake slug: local-first-autoguide-provider phase:2 -->" \
  "P2,agent-ready")
P2_ISSUES+=("$n")

echo ""
echo "Phase 1 (closed): ${P1_ISSUES[*]}"
echo "Phase 2 (open):   ${P2_ISSUES[*]}"
echo ""
echo "Update .qa/queue/state.json completedIssues with Phase 1 numbers."
printf '%s\n' "${P1_ISSUES[@]}" > /tmp/local-first-p1-issues.txt
printf '%s\n' "${P2_ISSUES[@]}" > /tmp/local-first-p2-issues.txt
