# Feature Intake: blueprint-local-runner

Epic design: `.qa/design/blueprint-local-runner.md`  
Parent epic: `blueprint-engine-v1` (Slices 1–6 ✅, Slice 8 dieses Epic)

> **DRAFT** — Issues noch nicht auf GitHub. Bei OK: **„Issues anlegen“** oder `@feature-intake create blueprint-local-runner`

## Slices

| #   | Title                                                      | Priority | dependsOn |
| --- | ---------------------------------------------------------- | -------- | --------- |
| 1   | Shared Deno Blueprint pipeline (`analyzeFromFileEntries`)  | P0       | —         |
| 2   | Deno CLI `analyze-local` (stdin files → BlueprintDocument) | P0       | 1         |
| 3   | Preview Runner `POST /blueprint/analyze` + FS walk         | P0       | 2         |
| 4   | Frontend `runBlueprintScan` local_path → Runner            | P0       | 3         |
| 5   | BlueprintPage Fehlertexte + Local-Projekt-Subtitle         | P1       | 4         |
| 6   | Gastmodus für GitHub-Blueprint-Analyze (Edge IDOR)         | P1       | —         |
| 7   | Acceptance: lokales Projekt → Matrix mit Routes            | P1       | 4, 5      |

## MVP cut (deferred)

- Incremental file-hash cache (blueprint-engine v2)
- SWC/AST call graph
- Manuelle Monorepo-App-Auswahl in UI
- App-Flow Local Scan
- LLM Finding-Erklärungen

## Review gate

Wenn OK → `@feature-intake create blueprint-local-runner` → danach `@ecc-runner`
