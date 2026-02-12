# Repo-Inspector Report – VisuDEV

Nur Fakten aus dem Repo; keine Bewertung, keine Lösungsvorschläge. Secrets/Tokens/Keys/Private URLs redigiert (\*\*\*).

---

## 0) Snapshot

- **Repo-Root:** `Visudevfigma` (Workspace-Pfad: …/arsvivai/visudevfigma/Visudevfigma)
- **Branch/Commit (falls verfügbar):** `main`, Commit `77c4344`
- **Package Manager / Node-Version Hinweise:** `package.json` enthält keine `engines`- oder `volta`-Angaben; kein `.nvmrc` im Repo-Root. Lockfile: `package-lock.json` (npm).
- **Wie startet man das Tool lokal?** Aus README/scripts abgeleitet: `npm i` → `npm run dev`. Startet VisuDEV-App (Vite, Port 3005) und Preview-Runner (Port 4000). Alternativ: `npm run dev:app` (nur Vite), `npm run dev:runner` (nur Runner). Build: `npm run build`; Preview des Builds: `npm run preview` (ebenfalls Port 3005).

---

## 1) Repo-Struktur (max depth 3)

```
Visudevfigma/
├── .github/workflows/
│   └── e2e.yml
├── .githooks/
├── docs/                    # PREVIEW_RUNNER.md, APPFLOW_VS_SITEMAP.md, E2E.md, MAESTRO.md, …
├── index.html
├── maestro/                 # Maestro E2E YAML (visudev-smoke.yaml, preview-smoke.yaml)
├── package.json
├── playwright.config.ts
├── preview-runner/          # Eigenständiger Service (Node): index.js, build.js, docker.js
├── scripts/                 # run-preview-runner.js, kill-preview-port.sh, checks/, …
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/          # Auth, CodePreview, IFrameScreenRenderer, SitemapView, …
│   ├── contexts/
│   ├── lib/visudev/         # store.tsx, types.ts, analyzer.ts
│   ├── modules/
│   │   ├── appflow/         # AppFlowPage, LiveFlowCanvas, FlowGraphView, layout.ts
│   │   ├── blueprint/
│   │   ├── data/
│   │   ├── logs/
│   │   ├── projects/
│   │   ├── settings/
│   │   └── shell/
│   ├── styles/
│   ├── supabase/functions/ # Spiegel der Edge Functions (visudev-analyzer, -screenshots, …)
│   ├── types/
│   └── utils/
├── supabase/
│   ├── config.toml
│   ├── functions/           # visudev-analyzer, visudev-appflow, visudev-auth, visudev-data, …
│   └── migrations/
│       └── 20250101000000_create_kv_store_edf036ef.sql
├── tests/e2e/
│   └── critical-paths.spec.ts
├── vite.config.ts
└── vitest.config.ts
```

**Relevante Pakete/Apps:** Kein Monorepo. Ein Hauptpaket `visudev` (Frontend + Scripts). `preview-runner/` hat eigenes `package.json` (eigenständiger Node-Service). Supabase Edge Functions (Deno) unter `supabase/functions/` (visudev-analyzer, visudev-auth, visudev-integrations, visudev-projects, visudev-screenshots, visudev-server, …).

---

## 2) „App under analysis“ Erkennung

- **Wo liegt die App, die gescannt wird?** Die zu analysierende App liegt **nicht** im VisuDEV-Repo. Sie wird über **GitHub** referenziert: Projekt hat `github_repo` (z. B. `owner/repo`) und `github_branch`. Code wird per GitHub API (Tree + Contents) geholt; optional wird die App lokal durch den Preview-Runner geklont, gebaut und gestartet (Ports 4001–4099).
- **Framework/Router der App:** Erkannt im Analyzer anhand der **Dateien des User-Repos** (package.json dependencies + Dateistruktur). Belege:
  - `supabase/functions/visudev-analyzer/module/services/screen.service.ts`: `detectFrameworks(files)` prüft z. B. `deps.next` → next.js, `deps["react-router-dom"]` → react-router, `deps.nuxt` → nuxt.
  - `supabase/functions/visudev-analyzer/module/services/screen-extraction.service.ts`: `extractNextJsAppRouterScreens`, `extractNextJsPagesRouterScreens`, `extractReactRouterScreens`, `extractNuxtScreens`, `extractScreensHeuristic`.
- **Route-Quellen:**

| Framework            | Quelle im User-Repo (vom Analyzer gelesen)                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js App Router   | `app/`-Struktur + dynamische Segmente                                                                                                             |
| Next.js Pages Router | `pages/`-Struktur                                                                                                                                 |
| React Router         | JSX: `<Routes>`, `<Route path="..." />`, ggf. `createBrowserRouter`; Basename aus `Router basename=…` oder `createBrowserRouter(…, { basename })` |
| Nuxt                 | Nuxt-spezifische Erkennung                                                                                                                        |
| Fallback             | Heuristik (z. B. State/Hash) oder konfigurierte `fallbackRoutes`                                                                                  |

- **Ausgabe erkannte Routen:** Nicht als separate Tabelle im Repo gespeichert; die Analyzer-Antwort enthält `screens[]` mit je `path`, `name`, `filePath`, `navigatesTo`, `flows`. Dynamische Segmente werden in den Extractor-Services normalisiert (z. B. `:id` in Pfaden).

---

## 3) Tool-Zielbild (Zitate aus Repo)

- **Was sind „Screens“ im Tool?**  
  Aus `docs/APPFLOW_VS_SITEMAP.md`: „Aus dem Repo erkannte Screens (Routen/Seiten) mit `path`, `name`, `navigatesTo`, `flows`.“  
  Aus `supabase/functions/visudev-analyzer/module/dto/screen/screen.dto.ts`: Screen hat u. a. `id`, `name`, `path`, `filePath`, `type` (page/screen/view), `flows`, `navigatesTo`, `framework`.

- **Was sind „Edges/Verbindungen“ im Tool?**  
  Aus `docs/APPFLOW_VS_SITEMAP.md`: „Kanten: Navigation: `navigatesTo` → Kante von Screen A zu Screen B. Flows: Welcher Screen welchen Flow aufruft und welcher Screen ‚auf der anderen Seite‘ liegt → Kante (z. B. API-Call).“  
  Aus `src/modules/appflow/layout.ts`: `GraphEdge`: `fromId`, `toId`, `type: "navigate" | "call"`; `buildEdges(screens, flows)` baut Kanten aus `navigatesTo` (navigate) und aus Flow-`calls` (call).

- **Was bedeutet „live“ im Tool?**  
  Aus `docs/PREVIEW_RUNNER.md`: „VisuDEV kann die angebundene App aus dem Repo bauen und starten, sodass du dich in der **echten laufenden App** im Tab **Live App** durchklicken kannst.“  
  Aus `docs/APPFLOW_VS_SITEMAP.md`: „LiveFlowCanvas: Pro Screen eine **Live-Preview** (iframe mit `previewUrl` + `screen.path`) oder Fehler-/Ladezustand.“

---

## 4) Pipeline: Von Repo → Nodes → Edges → UI

### 4.1 Repo-Integration (GitHub/Clone/Fetch/Webhook)

- **GitHub OAuth/Token:** Konfiguration über Supabase Dashboard → Edge Functions → Secrets (README: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` für Auth). Projekt-seitiger Zugriff: `visudev-integrations` speichert GitHub-Zugriff; Token wird im Repository pro Projekt geholt (`getGitHubToken(projectId)`). Frontend sendet beim Analyze-Aufruf nur `repo` und `branch` (kein Token im Body); Analyzer-Request-DTO erlaubt optional `access_token`.
- **Clone/Fetch:**
  - **Analyzer (Code-Quelle):** `supabase/functions/visudev-analyzer/module/services/github.service.ts`: `getCurrentCommitSha`, `fetchRepoTree` (GitHub API `git/trees/…?recursive=1`), `fetchFileContent` (GitHub API `repos/…/contents/{path}`). Kein lokaler Clone; nur API-Aufrufe.
  - **Preview (laufende App):** `preview-runner/build.js`: `cloneOrPull(repo, branch, workspaceDir)` – führt `git clone` (oder `git pull`) aus; Clone-URL mit optionalem Token: `getCloneUrl(repo)` nutzt `process.env.GITHUB_TOKEN` (\*\*\*).
- **Webhooks:** `preview-runner/index.js`: `handleWebhookGitHub`; Route `POST /webhook/github`; prüft `x-github-event` (push/ping), Signatur optional über `GITHUB_WEBHOOK_SECRET` (\*\*\*). Bei Push: passende Runs (repo+branch) werden per Refresh (pull + rebuild + restart) aktualisiert.

### 4.2 Build/Run der App (zum Rendern)

- **Wie wird die App gebaut/gestartet?**
  - Scripts: `preview-runner/build.js`: `runBuild`/`runBuildNodeDirect` (npm/pnpm/yarn je nach Lockfile), `startApp` (startCommand aus `visudev.config.json` oder Default). `preview-runner/index.js`: bei `USE_REAL_BUILD` oder `USE_DOCKER` wird nach Clone/Build die App gestartet; bei `USE_DOCKER` wird `preview-runner/docker.js` verwendet: `runContainer(workspaceDir, appPort, runId)` – ein Container pro Preview, darin `npm ci`/`npm install`, `npm run build`, dann `npx serve dist|build|out|. -s -l 3000`.
  - Docker: Image `VISUDEV_DOCKER_IMAGE` (Default `node:20-alpine`), Container-Port 3000, Host-Port aus Pool (PREVIEW_PORT_MIN/MAX).
- **Ports/URLs:** `preview-runner/index.js`: `PORT` (Runner-API, Default 4000), `PREVIEW_PORT_MIN`/`PREVIEW_PORT_MAX` (Default 4001–4099). Pro Lauf werden zwei aufeinanderfolgende Ports reserviert: Proxy-Port (an Frontend als `previewUrl` zurückgegeben) und App-Port (App läuft hier; Proxy leitet an App weiter). `PREVIEW_BASE_URL` optional für öffentliche Basis-URL.
- **Preconditions:** Im Code erwähnt: Docker muss laufen, wenn `USE_DOCKER=1`; für private Repos optional `GITHUB_TOKEN`. Keine expliziten DB/Seeds für die User-App.

### 4.3 Screen/Node-Erzeugung (wie Screens gefunden werden)

- **Strategie:** Statische Route-Enumeration aus Repo-Dateien (kein Runtime-Crawl). Framework wird aus `package.json` + Dateien erkannt; je Framework wird ein anderer Extractor aufgerufen.
- **Code-Stellen:**
  - Routen sammeln: `supabase/functions/visudev-analyzer/module/services/screen.service.ts`: `extractScreens(files)` → je nach `framework.primary`: `extractNextJsAppRouterScreens`, `extractNextJsPagesRouterScreens`, `extractReactRouterScreens`, `extractNuxtScreens`; sonst `extractScreensHeuristic`. Quelle: `ScreenExtractionService` in `screen-extraction.service.ts`.
  - Parameter/dynamische Routen: `screen-extraction.service.ts` (z. B. `normalizeRoutePath`); React Router: `parseReactRouterRoutes`, vollständige Pfade aus verschachtelten Routes.
  - Auth/Redirects: `screen-extraction.service.ts`: `isRouteRedirect`, `isLayoutOnlyRoute` – Routen mit `<Navigate to=…>` oder reine Layout-Routen werden übersprungen (keine eigenen Screen-Nodes).
- **Output:** Node-Liste = `screens` im Analyzer-Ergebnis (`AnalysisResultDto`); wird im Frontend in den Store übernommen und in `LiveFlowCanvas`/FlowGraph genutzt.

### 4.4 Rendering + Thumbnails (echte Screens)

- **Browser-Automation:** Im Repo wird **kein** Playwright/Puppeteer/Selenium für das Erzeugen von Screenshots der User-App verwendet. Playwright nur in `devDependencies` für E2E-Tests der VisuDEV-UI (`tests/e2e/critical-paths.spec.ts`).
- **Screenshot-Pipeline:**
  - **Externer Dienst:** `supabase/functions/visudev-analyzer/module/services/screenshot.service.ts`: `captureScreenshot(url, apiKey)` baut eine URL zum externen Screenshot-API-Dienst (Base-URL und API-Key aus Env; in Index erwähnt: ScreenshotOne-ähnlicher Endpunkt); Parameter: `access_key`, `url`, viewport, format, etc. Antwort: Bild als ArrayBuffer → Upload in Supabase Storage → signed URL. Konfiguration: `viewportWidth`, `viewportHeight`, `deviceScaleFactor`, `format`, `delayMs`, etc. aus Env (nur Variablennamen: SCREENSHOT_VIEWPORT_WIDTH, SCREENSHOT_VIEWPORT_HEIGHT, …).
  - **Wann:** Nach dem Analyze; Frontend ruft optional `visudev-analyzer/screenshots` mit `projectId`, `baseUrl`, `screens` auf; nur wenn `deployed_url` gesetzt ist.
  - **Live-Preview (kein Screenshot):** „Echte Screens“ im App Flow sind Live-Iframes: jede Screen-URL = `previewUrl` + `screen.path`; kein Screenshot-Schritt dafür. Iframe-Load-Timeout 60 s; bei Fehler/Timeout wird ein Fehlertext angezeigt (z. B. ECONNREFUSED, Timeout).
- **Speicherort Thumbnails:** Supabase Storage Bucket (Name aus Env: VISUDEV*SCREENSHOT_BUCKET / SCREENSHOT_BUCKET_NAME); Dateiname-Schema: `{projectId}/{cleanPath}*{timestamp}.{format}` (`screenshot.service.ts`).

Zentrales Snippet (Screenshot-URL-Bau, kein wörtliches Secret):

```72:105:supabase/functions/visudev-analyzer/module/services/screenshot.service.ts
  private async captureScreenshot(url: string, apiKey: string): Promise<ArrayBuffer> {
    const screenshotApiUrl = new URL(this.config.screenshot.apiBaseUrl);
    screenshotApiUrl.searchParams.set("access_key", apiKey);
    screenshotApiUrl.searchParams.set("url", url);
    // ... viewport, format, etc.
    const response = await fetch(screenshotApiUrl.toString());
```

### 4.5 Edge-Erzeugung (Buttons/Links → Zielscreen)

- **Strategie:** Überwiegend **statische Analyse** (AST + Regex). Kein Runtime-Click-Crawl im Repo.
- **Statisch – Patterns:**
  - `supabase/functions/visudev-analyzer/module/services/ast-navigation.service.ts`: `extractNavigationFromAst`: CallExpression mit Callee `navigate`, `navigateTo`, `redirect`, `push`, `replace`, `history.push`, `history.replace`; Router-Objekt: `router`, `navigate`, `history`. JSX: `<Link to="...">`, `<NavLink to="...">`, `<a href="...">`. Literale Pfade werden gesammelt; TemplateLiteral/Identifier → `"dynamic"`.
  - `screen-extraction.service.ts`: `extractNavigationLinks` (Regex): z. B. `navigate\s*\(\s*["']([^"']+)["']`, `<Link[^>]*to=["']([^"']+)["']`, `<a[^>]*href=["']([^"']+)["']`.
- **Zielbestimmung:** `navigatesTo` pro Screen = Liste von Pfad-Strings. Edges im UI: `buildEdges(screens, flows)` in `src/modules/appflow/layout.ts` – für jedes `navigatesTo` wird ein Ziel-Screen per Pfad-Match gesucht; zusätzlich Kanten vom Typ `call` über Flow-`calls` (Flow A ruft Flow B → Screen von A → Screen von B).
- **Tabs/State-only:** Nicht explizit unterschieden; nur URL-Pfade aus Navigation werden als Kanten genutzt. Optional: App im Iframe kann `postMessage` mit Typ `visudev-dom-report` senden (Route, buttons, links) – dient nur der Anzeige „Live: /path · N Buttons“, nicht der Edge-Erzeugung.
- **Output:** Edge-Liste entsteht im Frontend aus `screens` + `flows` via `buildEdges(screens, flows)`; persistiert nicht separat, nur als Teil der Projekt-Daten (screens/flows).

### 4.6 Graph-Storage / Schema

- **Node-Schema (Screen):**  
  `supabase/functions/visudev-analyzer/module/dto/screen/screen.dto.ts`:  
  `id`, `name`, `path`, `filePath`, `type` (page|screen|view), `flows: string[]`, `navigatesTo: string[]`, `framework`, optional: `componentCode`, `lastAnalyzedCommit`, `screenshotStatus`, `screenshotUrl`, `lastScreenshotCommit`, `tableName`, `description`.

- **Edge-Schema:** Kein separates DB-Schema. Im Frontend: `GraphEdge` in `src/modules/appflow/layout.ts`: `fromId`, `toId`, `type: "navigate" | "call"`.

- **Flow-Schema (CodeFlow):**  
  `supabase/functions/visudev-analyzer/module/dto/flow/code-flow.dto.ts`:  
  `id`, `type` (ui-event|function-call|api-call|db-query), `name`, `file`, `line`, `code`, `calls: string[]`, `color`.

- **Persistenz:**
  - Analyzer: `AnalysisRecord` (screens, flows, framework, …) wird unter Key `analysis:{analysisId}` in Supabase-Tabelle `kv_store_edf036ef` (key TEXT, value JSONB) gespeichert. Stelle: `supabase/functions/visudev-analyzer/module/internal/repositories/analysis.repository.ts` (`saveAnalysis`, `getAnalysis`).
  - Projekte (inkl. zuletzt übernommene screens/flows): über `visudev-server` bzw. Projekt-API; Projekte können in derselben KV-Tabelle oder projektspezifischen Strukturen liegen (nicht im Detail geprüft; KV-Tabelle wird für Analyzer-Ergebnisse explizit genutzt).

- **Beispiel (aus Typen abgeleitet):**  
  Ein Node: `{ id: "screen:...", name: "Login", path: "/login", filePath: "src/App.tsx", type: "page", flows: ["..."], navigatesTo: ["/"], framework: "react-router" }`.  
  Eine Kante: `{ fromId: "screen:...", toId: "screen:...", type: "navigate" }`.

### 4.7 UI/Visualisierung

- **Graph-Library:** **Weder React Flow noch Cytoscape noch D3 für den Flow-Graphen.** Der App-Flow-Graph ist **eigenes SVG**: Knoten = divs mit Iframes/Karten, Kanten = SVG `<path>` (Bezier), Layout aus `src/modules/appflow/layout.ts` (`computePositions`, `getScreenDepths`, `buildEdges`). Recharts (und damit indirekt d3-\* Pakete) nur für **Charts** (z. B. Data-Modul), nicht für den Sitemap-Graphen.
- **Datenquelle:** Nodes/Edges aus Projekt-Kontext (Store): `activeProject.screens`, `activeProject.flows`; diese stammen vom letzten Analyze-Aufruf (visudev-analyzer/analyze) und werden im Store gespeichert.
- **Thumbnails:** In LiveFlowCanvas pro Node ein Iframe (Live-URL). Optionale Screenshot-URLs aus Analyze/Screenshot-API werden im Screen-Objekt als `screenshotUrl` geführt und können z. B. in SitemapFlowView/ScreenDetailView genutzt werden; in der primären Live-Ansicht dominiert das Iframe.
- **Zentrale Dateien:**
  - UI-Entry: `src/modules/appflow/pages/AppFlowPage.tsx` (rendert je nach Daten `LiveFlowCanvas` oder leeren Zustand / Preview-Only mit Drawer).
  - Graph-Render: `src/modules/appflow/components/LiveFlowCanvas.tsx` (Positions aus `computePositions`, Edges aus `buildEdges`, SVG-Pfade, Iframes pro Screen).

---

## 5) Konfiguration & Environment

Nur **Variablennamen**; keine Werte, keine .env-Inhalte.

- **Frontend (Vite):** In Code/Docs erwähnt: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PREVIEW_RUNNER_URL`. Port fest in `vite.config.ts`: server.port / preview.port 3005.
- **Preview-Runner:** `PORT`, `USE_REAL_BUILD`, `USE_DOCKER`, `GITHUB_TOKEN`, `GITHUB_WEBHOOK_SECRET`, `PREVIEW_PORT_MIN`, `PREVIEW_PORT_MAX`, `PREVIEW_BASE_URL`, `SIMULATE_DELAY_MS`, `AUTO_REFRESH_INTERVAL_MS`, `VISUDEV_DOCKER_IMAGE`.
- **Supabase/Edge Functions (Analyzer):** `VISUDEV_KV_TABLE` / `KV_TABLE_NAME`, `SCREENSHOT_API_KEY`, `SCREENSHOT_API_BASE_URL` / `SCREENSHOTONE_API_BASE_URL`, `VISUDEV_SCREENSHOT_BUCKET` / `SCREENSHOT_BUCKET_NAME`, `SCREENSHOT_VIEWPORT_WIDTH`, `SCREENSHOT_VIEWPORT_HEIGHT`, `SCREENSHOT_DEVICE_SCALE_FACTOR`, `SCREENSHOT_FORMAT`, `SCREENSHOT_DELAY_MS`, weitere Screenshot-Optionen (blockAds, cacheTtlSeconds, signedUrlTtlSeconds, …). GitHub API Base URL konfigurierbar (Analyzer).
- **Auth/GitHub:** Supabase Dashboard → Secrets: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (für visudev-auth). Keine .env-Inhalte wörtlich ausgegeben.

---

_Ende des Reports. Nur Fakten aus dem Repo; keine Bewertung, keine Lösungsvorschläge._
