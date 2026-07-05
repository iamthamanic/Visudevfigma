# Feature Intake: blueprint-engine-v1

Epic design: `.qa/design/blueprint-engine-v1.md`

> **DRAFT** — Issues noch nicht auf GitHub. Bei OK: `@feature-intake create blueprint-engine-v1`

## Slices

| #   | Title                                                    | Priority | dependsOn |
| --- | -------------------------------------------------------- | -------- | --------- |
| 1   | Blueprint IR types + fact extractors (Hono/Supabase/Zod) | P0       | —         |
| 2   | POST /blueprint/analyze + BlueprintAnalysisService       | P0       | 1         |
| 3   | Concept + Policy engine (7 core rules)                   | P0       | 2         |
| 4   | store.tsx blueprint scan wiring + KV persist             | P0       | 2         |
| 5   | Security Matrix + Finding Inspector UI                   | P0       | 4         |
| 6   | Route Blueprint Canvas (linear pipeline)                 | P0       | 5         |
| 7   | Framework packs: Express + Fastify + Next route.ts       | P1       | 3         |
| 8   | Local Runner + project local_path                        | P1       | 2         |
| 9   | Monorepo app-root detection                              | P1       | 2         |
| 10  | Acceptance dogfood (hrkoordinator, competeer, visudev)   | P1       | 7,8       |

## MVP cut (deferred)

- SWC/AST call graph (v1.1)
- Incremental cache
- LLM explanations
- Python FastAPI parser
- Accepted-risk workflow
