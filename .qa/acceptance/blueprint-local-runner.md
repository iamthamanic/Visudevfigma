# Feature: Blueprint Local Runner

<!-- seed for @implement — epic blueprint-local-runner -->

## Intent

Lokale Projekte (`source_mode: local`, `local_path`) durchlaufen die Blueprint-Pipeline (Facts → Concepts → Policies) über den Preview Runner — ohne GitHub. Ergebnis in KV; UI zeigt Security Matrix, Route Canvas, Finding Inspector.

Design: `.qa/design/blueprint-local-runner.md`

## Preconditions

- `npm run dev` (Supabase + Preview Runner + Vite)
- `deno` im PATH
- Lokales Projekt mit **absolutem** `local_path` unter erlaubten Roots (`~/` oder `VISUDEV_ALLOWED_LOCAL_ROOTS`)
- Projektordner enthält TS/JS mit erkennbaren API-Routes (Hono/Next)

## Happy Path

- [ ] Lokales Projekt öffnen → Blueprint-Tab startet Scan (oder „Neu analysieren“)
- [ ] `POST /blueprint/analyze` am Runner → 200
- [ ] `blueprint:{projectId}` in KV gespeichert
- [ ] Security Matrix zeigt ≥1 Route
- [ ] Route-Klick → Pipeline-Canvas aktualisiert
- [ ] Finding-Klick → Inspector mit Datei/Zeile

## Edge Cases

- [ ] Kein `local_path` und kein `github_repo` → klare Meldung, kein Crash
- [ ] Runner nicht erreichbar → Fehlertext mit „npm run dev“
- [ ] Pfad außerhalb Jail → Runner 403, UI zeigt Meldung
- [ ] `deno` fehlt → 503 mit Hinweis

## Regression

- [ ] GitHub-Projekt: Blueprint weiterhin über Edge Analyze
- [ ] App-Flow-Scan unverändert

## Assumptions

- Gastmodus auf localhost für KV und optional GitHub-Analyze
- Monorepo v1: Auto-Detection (kein manueller App-Picker)

## Implementation Notes

- Shared pipeline: `blueprint-pipeline.service.ts`
- Deno CLI: `module/blueprint/cli/analyze-local.ts`
- Runner: `POST /blueprint/analyze` in `preview-runner/index.js`
- Frontend: `blueprint-runner-client.ts`, `blueprint-scan.ts` local branch
- Dogfood visudev repo: 54 routes, 22 findings (local analyze smoke test)
