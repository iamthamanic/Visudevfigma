# Epic Design: Pluggable Blueprint Engine with AutoGuide Adapter + VisuDEV Enrichment

## Problem & Intent

VisuDEV's blueprint visualization currently depends on a single legacy analysis path (`legacy-blueprint-runner`) and a hard-coded AutoGuide adapter. Provider selection is global via environment variables, and the `parent.childRuns is not iterable` error shows that run-status handling is not robust when parent/leaf-run files are misread.

**Goal:** Build a pluggable blueprint analysis engine so that AutoGuide can act as the **base scanner**, while VisuDEV adds its own **enrichment layers** (Security Matrix, custom Findings, project profile). The legacy runner remains the default; provider selection becomes per-project; and the status-handling bug is fixed.

**MVP cut (Ponytail Rung 1):**

- Common `BlueprintProvider` interface + registry.
- Per-project `blueprintProviderId` field with fallback to env/global default.
- Robust parent/leaf run status handling (fixes `parent.childRuns is not iterable`).
- AutoGuide adapter refactored to produce a **raw intermediate result** (not a final `BlueprintDocument`).
- Shared `BlueprintEnrichmentService` that turns any provider's raw output into a canonical `BlueprintDocument`:
  - Route normalization
  - Security Matrix scaffold
  - VisuDEV-specific findings (missing auth, validation hints)
- No AI enrichment yet; no UI redesign beyond a minimal provider selector.

## Non-goals

- Generalize App Flow or Data providers (out of scope; keep as-is).
- Build a marketplace/plugin discovery system.
- LLM-generated explanations in MVP.
- Containerize AutoGuide or expose it as a service.
- Replace the legacy runner as default.

## Assumptions

- `@autoguide/scanner` API remains `scanSourceProject(rootDir)` + `mergeScanResults(source)`.
- AutoGuide is resolved dynamically from `node_modules` or a sibling monorepo path.
- VisuDEV owns the final `BlueprintDocument` shape and UI contract.
- Local Engine runs on `:4317`, Preview Runner on `:4000`.

## Options Considered

| Option                                                    | Pros                                  | Cons                                | Decision |
| --------------------------------------------------------- | ------------------------------------- | ----------------------------------- | -------- |
| A. Provider-specific mappers per provider (current)       | Simple for one provider               | Enrichment duplicated, hard to swap | Reject   |
| B. Provider returns raw scan → shared enrichment (chosen) | Reusable enrichment, clean separation | Needs intermediate DTO              | Adopt    |
| C. Two-step pipeline per provider                         | Maximum flexibility                   | Over-engineered for 2-3 providers   | Defer    |

## Decision

Implement Option B:

```mermaid
flowchart LR
    SourceProject[Project source path] --> Provider{Provider}
    Provider -->|legacy| LegacyRaw[Legacy raw output]
    Provider -->|autoguide| AutoGuideRaw[AutoGuide source + merged]
    LegacyRaw --> Enrichment[BlueprintEnrichmentService]
    AutoGuideRaw --> Enrichment
    Enrichment --> BlueprintDocument[Canonical BlueprintDocument]
    BlueprintDocument --> Storage[(~/.visudev/projects/{id}/blueprint.json)]
    Storage --> UI[BlueprintPage Security Matrix / Canvas]
```

## Runtime Matrix

| Slice area                     | local      | github | notes                                              |
| ------------------------------ | ---------- | ------ | -------------------------------------------------- |
| Provider interface             | yes        | yes    | shared types live in `shared/visudev-api.types.ts` |
| Per-project provider selection | yes        | yes    | persisted in `projects.json` index                 |
| Status-handling fix            | yes        | yes    | local engine status file reads                     |
| AutoGuide dynamic load         | local only | n/a    | requires local monorepo or linked packages         |
| Enrichment service             | yes        | yes    | pure TypeScript, no external deps                  |
| Provider selector UI           | local only | maybe  | minimal select in project settings / projects page |

## Cross-domain Sign-off

- No Supabase schema changes.
- No new Edge Functions.
- No new secrets.
- Env vars remain unchanged; new optional env `VISUDEV_DEFAULT_BLUEPRINT_PROVIDER` may be added.

## Implementation Sketch

### New / changed files

- `shared/visudev-api.types.ts` — extend `BlueprintAnalysisProviderId`, add `RawBlueprintScan` intermediate type, add `project.blueprintProviderId`.
- `local-engine/src/providers/blueprint-provider.interface.ts` — narrow contract for blueprint providers.
- `local-engine/src/providers/legacy-visudev-analysis.provider.ts` — return `RawBlueprintScan` shape instead of final `BlueprintDocument`.
- `local-engine/src/providers/autoguide-analysis.provider.ts` — return `RawBlueprintScan` with AutoGuide fields.
- `local-engine/src/services/blueprint-enrichment.service.ts` — canonical enrichment pipeline.
- `local-engine/src/services/analysis.service.ts` — use enrichment service, fix parent/leaf run status handling.
- `local-engine/src/services/project.service.ts` — accept and persist `blueprintProviderId`.
- `local-engine/src/routes/projects.routes.ts` — expose provider selection on create/update.
- `src/lib/visudev-api/types.ts` (or shared) — mirror `BlueprintProviderId` for frontend.
- `src/modules/projects/pages/ProjectsPage.tsx` — add provider selector (minimal).
- `src/modules/projects/components/ProjectFormFields.tsx` — same, if it exists.
- `docs/LOCAL_ENGINE.md` — document pluggable provider model.
- `local-engine/src/services/analysis.service.test.ts` or new tests — parent/leaf status handling.

## Deferred to later issues

- AI enrichment layer (OpenAI explanations).
- Provider marketplace / discovery.
- Containerized AutoGuide execution.
- Full project import/export.

## Acceptance (Epic level)

- [ ] `parent.childRuns is not iterable` no longer occurs for fresh projects.
- [ ] `VISUDEV_ANALYSIS_PROVIDER` still selects global default; per-project override works.
- [ ] `legacy-blueprint-runner` remains default when unset.
- [ ] `autoguide` provider produces the same canonical `BlueprintDocument` shape as legacy.
- [ ] Security Matrix and Findings are populated by shared enrichment, not provider-specific mapper.
- [ ] `npm run checks` green.
