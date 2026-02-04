# VisuDEV – Repo-Analyse für generische Screen-Erkennung

**Ziel:** VisuDEV soll beliebige Frontend-Projekte (unterschiedliche Frameworks, Routing, Strukturen) zuverlässig analysieren und Screens/Flows visualisieren. Diese Analyse dokumentiert die gescannten Repos und leitet daraus Anforderungen für ein generisches System ab.

**Umsetzungsstand (Analyzer):** Die Empfehlungen aus Abschnitt 4 sind im `visudev-analyzer` umgesetzt: React-Router-Basename, Next.js Route Groups, State-basiertes Routing (`extractStateBasedScreens`), Hash-Routing (`extractHashRoutingScreens`), CLI Commander (`extractCliCommanderScreens`), Single-Page-Fallback (`extractSinglePageFallback`), erweiterte Framework-Erkennung inkl. CLI, Screen-Typ `cli-command`.

**Analysierte Repos (Stand:** Januar 2026):

| Repo                        | Typ               | Framework                               | Routing                                         | Screens erkennbar?   |
| --------------------------- | ----------------- | --------------------------------------- | ----------------------------------------------- | -------------------- |
| esunautapp                  | Web-App           | React + Vite                            | **State-basiert** (currentView)                 | ❌ Kein Router       |
| scriptony_figma make        | Web-App           | React + Vite                            | **Hash-basiert** (#/page/id)                    | ❌ Kein React Router |
| browofieldmanager_figmamake | Web-App           | React + Vite                            | **React Router** (Routes/Route)                 | ✅ Ja                |
| chatthis_figmamake          | Web-App           | React + Vite                            | **Kein Router** (eine Seite)                    | ⚠️ 1 Screen          |
| makemysaga_figmamake        | Web-App           | React + Vite                            | **State-basiert** (currentView)                 | ❌ Kein Router       |
| nectarova_figmamake         | Web-App           | React + Vite                            | **React Router** (Routes/Route)                 | ✅ Ja                |
| letzfetzprototype_figmamake | Web-App           | React + Vite                            | **State-basiert** (currentView)                 | ❌ Kein Router       |
| dadu_figmamake              | Web-App           | React + Vite                            | **State/Modals** (kein URL-Routing)             | ❌ Kein Router       |
| audioflowai (Voiceflowai)   | Desktop/Web       | **Next.js** + Tauri                     | **Next.js App Router** (app/)                   | ✅ File-based        |
| esunautfrontend             | Web-App           | React + Vite                            | **State-basiert** (currentView)                 | ❌ Kein Router       |
| Raggadon                    | Backend + **CLI** | Python (FastAPI) + **Node (Commander)** | **CLI-Commands** (rag save, search, status, …)  | ✅ Als CLI-Screens   |
| areathis (03-game/web)      | Game              | **Next.js** + Phaser                    | Next.js App Router                              | ✅ File-based        |
| browoai-analytics           | Monorepo          | **Next.js** (portal) + Node API         | Next.js App Router (portal)                     | ✅ File-based        |
| MultiagentUltra             | Web-App           | React                                   | **React Router** (basename)                     | ✅ Ja                |
| adaptive_api                | Backend           | **Python**                              | N/A (API)                                       | N/A                  |
| AI Audiobookmaker           | –                 | –                                       | **(Pfad nicht gefunden)**                       | –                    |
| WOARU (WorkaroundUltra)     | **CLI/Tool**      | TypeScript (Node, Commander)            | **CLI-Commands** (woaru init, setup, review, …) | ✅ Als CLI-Screens   |

---

## 1. Routing- und Screen-Muster (Erkenntnisse)

### 1.1 React Router (JSX)

- **Repos:** browofieldmanager, nectarova, MultiagentUltra, hrkoordinator (bereits verbessert).
- **Erkennung:** `<Routes>`, `<Route path="..." element={...}>`, ggf. verschachtelt, `createBrowserRouter`/Config-Objekt.
- **VisuDEV:** Bereits umgesetzt (nested routes, Navigate skip, full path). Sollte **weiter** abdecken:
  - `Router basename="/multiagentultra"` → Pfad-Prefix bei allen Routen berücksichtigen.
  - Route-Config-Arrays (`path`, `children`) neben JSX parsen.

### 1.2 State-basiertes „Routing“ (kein URL)

- **Repos:** esunautapp, esunautfrontend, makemysaga, letzfetzprototype.
- **Muster:** `const [currentView, setCurrentView] = useState('dashboard')` bzw. `currentPage`; `switch(currentView) { case 'dashboard': return <Dashboard />; ... }`.
- **Erkennung:** Kein Router, keine URLs. „Screens“ sind die verschiedenen **Views/Pages**, die per State gewechselt werden.
- **VisuDEV-Anforderung:**
  - In `App.tsx` (oder Haupt-Entry) nach **useState mit Namen wie** `currentView`, `currentPage`, `view`, `page` suchen.
  - **Switch/if-Ketten** auswerten, die auf diesen State reagieren und JSX zurückgeben (z. B. `<Dashboard />`, `<SettingsPage />`).
  - Daraus eine Liste von **logischen Screens** ableiten (Name + zugehörige Komponente), auch ohne URL. Optional: künstliche Pfade wie `/view/dashboard` für Konsistenz.

### 1.3 Hash-basiertes Routing (kein React Router)

- **Repos:** scriptony_figma make.
- **Muster:** `window.location.hash` → `#home`, `#projekte/123`, `#settings`; `validPages`-Array; Navigation setzt Hash; `renderPage()` basiert auf Hash.
- **Erkennung:** Kein `<Route>`. Pfade stehen in:
  - String-Arrays (`validPages`, `pathParts`),
  - Event-Handler wie `onNavigate(page)` / `handleNavigate(page)`.
- **VisuDEV-Anforderung:**
  - Nach **Hash-Routing-Pattern** suchen: `location.hash`, `hash.slice(1)`, Arrays mit Page-Namen, `onNavigate`/`handleNavigate` mit String-Literal.
  - Liste von „Screens“ = Einträge in diesen Arrays bzw. übergebene Literale.

### 1.4 Single-Page ohne Wechsel

- **Repos:** chatthis_figmamake.
- **Muster:** Eine Haupt-UI (Chat, Sidebar, Modals). Kein View-/Page-Wechsel, nur Modals/Drawer.
- **VisuDEV:** Als **ein Screen** (z. B. „Chat“ oder App-Name) erfassen; optional Modals/Tabs als Unter-„Flows“ oder separate minimale Screens.

### 1.5 Next.js App Router (file-based)

- **Repos:** audioflowai (Voiceflowai), areathis/03-game/web, browoai-analytics (portal).
- **Erkennung:** `app/**/page.tsx` (oder `page.js`); dynamische Segmente `[id]`, `[...slug]`.
- **VisuDEV:** Bereits vorgesehen (`extractNextJsAppRouterScreens`). Sicherstellen, dass:
  - `app/`-Struktur auch bei **Next.js 15** und verschiedenen Ordnerlayouts (z. B. `(auth)`, `(dashboard)`) erkannt wird.
  - Route Groups `(group)` nicht als URL-Segment zählen, aber Ordnerstruktur berücksichtigen.

### 1.6 Next.js Pages Router

- **Repos:** (in dieser Liste nicht vertreten, aber VisuDEV unterstützt es.)
- **Erkennung:** `pages/**/*.tsx` mit Dateinamen → Route.

### 1.7 CLI/Terminal-Screens (Commands)

- **Repos:** Raggadon (CLI), WOARU (WorkaroundUltra).
- **Idee:** Im Terminal rufen Nutzer verschiedene **Befehle** auf (z. B. `rag save`, `rag search`, `woaru init`, `woaru review`). Jeder Befehl zeigt eine andere „Seite“ – andere Ausgabe, anderer Flow. Diese können wir wie **Screens** behandeln: **CLI-Screens** = Commands (und Subcommands).
- **Raggadon (rag.js, Commander):** Commands = `save`, `search`, `status`, `start`, `mode`, `init`. Jeder Command = ein „Terminal-Screen“ (eigene Aktion, eigene Ausgabe).
- **WOARU (cli.ts, Commander):** Viele Commands/Subcommands, z. B. `init`, `version`, `version check`, `commands`, `wiki`, `quick-analyze`, `setup`, `ai` (mit `setup`, `status`), `update-db`, `watch`, `status`, `update`, `stop`, `logs`, `recommendations`, `helpers`, `docu` (nopro, pro, forai), `ignore`, `review`, `analyze`, `ai` (analyze), `rollback`, `message`, `config`, `language`. Jeder Command/Subcommand = ein „Terminal-Screen“.
- **VisuDEV-Anforderung:**
  - **Erkennung:** In CLI-Entry-Dateien (z. B. `bin/rag.js`, `src/cli.ts`) nach **Commander**-Pattern suchen: `program.command('...')`, `cmd.command('...')` (Subcommands). Alternativ: `package.json` → `bin`-Eintrag, dann Einstiegsdatei parsen.
  - **Repräsentation:** Dieselbe **Screen**-Struktur wie für Web nutzen, mit z. B. `type: "cli-command"` oder `framework: "cli-commander"`, `path: "/cli/save"` oder `path: "rag save"`, `name: "Save"` (aus Command-Name/Description).
  - **UI:** Diese Einträge in VisuDEV als „Terminal-Screens“ oder „Commands“ anzeigen (eigener Bereich oder Filter „Web vs. CLI“), damit die verschiedenen „Seiten“ des Tools sichtbar sind.

### 1.8 Kein Frontend / reines Backend

- **adaptive_api:** Python API – keine UI- und keine CLI-Commands; nur Endpoints.
- **VisuDEV:** Keine Screen-Liste oder nur ein generischer „API“-Eintrag; Fokus ggf. auf Flows/Endpoints.

---

## 2. Projektstruktur-Varianten

| Muster                            | Beispiele                                      | VisuDEV-Hinweis                                                   |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| `src/App.tsx`                     | chatthis, makemysaga, letzfetz, dadu           | Haupt-Entry für State/Route prüfen.                               |
| `src/app/App.tsx`                 | esunautfrontend, nectarova, browofieldmanager  | App kann in `app/` liegen.                                        |
| `src/app/page.tsx` + `layout.tsx` | audioflowai, areathis, browoai-analytics       | Next.js App Router.                                               |
| Mehrere Einträge (Monorepo)       | browoai-analytics (api, backoffice, portal)    | Pro „Frontend“-Package getrennt analysieren (z. B. nur `portal`). |
| React ohne react-router           | scriptony, esunaut, makemysaga, letzfetz, dadu | State/Hash-Pattern nutzen.                                        |

---

## 3. Technologie-Übersicht

- **Build:** Vite (meiste React-Apps), Next.js (audioflowai, areathis, browoai portal).
- **UI:** Oft Radix + Tailwind; teils MUI (esunautapp, scriptony, audioflowai).
- **State:** useState für View-Wechsel; React Query/TanStack in mehreren Projekten.
- **Backend:** Viele Supabase (Edge Functions, Auth, DB); browoai-analytics zusätzlich eigene Node-API.

---

## 4. Konkrete Empfehlungen für VisuDEV

### 4.1 Priorität 1 – Bereits gut abgedeckt

- React Router (inkl. nested, Navigate skip, full path) – **beibehalten und testen** (z. B. mit browofieldmanager, nectarova, MultiagentUltra).
- Next.js App Router – **beibehalten**; Route Groups und Sonderfälle prüfen.
- Next.js Pages Router – vorhanden, optional mit gleichen Repos abgleichen.

### 4.2 Priorität 2 – State-basiertes „Routing“

- **Neue Heuristik:** In Haupt-App-Datei (`App.tsx` oder `app/App.tsx`):
  - Nach `useState<string>` mit Namen wie `currentView`, `currentPage`, `view`, `page` suchen.
  - Nach `switch (currentView)` / `if (currentView === 'x')` und Rückgabe von JSX (`return <...Page />`, `return <...Screen />`) suchen.
  - Gefundene Cases/Labels als **Screen-Namen** und zugehörige Komponenten als **Screen-Komponenten** speichern.
- **Künstliche Pfade:** z. B. `/view/dashboard`, `/view/settings`, damit Screens in VisuDEV einheitlich ansprechbar sind.

### 4.3 Priorität 3 – Hash-Routing

- **Neue Heuristik:** Nach `location.hash`, `hash.slice(1)`, `pathParts[0]` und Arrays wie `validPages = ["home", "projekte", ...]` suchen.
- **Screens:** Einträge aus `validPages` (oder analog) als Screen-Liste; Pfad z. B. `/#home` oder `/hash/home`.

### 4.4 Priorität 4 – Router-Basename

- Bei React Router **`<Router basename="...">`** oder **`createBrowserRouter(..., { basename })`** auslesen und als Prefix für alle aus diesem Baum erkannten Pfade verwenden.

### 4.5 Priorität 5 – Kein Router, eine Seite

- Wenn weder Router noch State-/Hash-Routing gefunden: **ein Screen** mit Name aus `package.name` oder „App“ anlegen; optional aus `main.tsx`/`index.html` Titel ableiten.

### 4.6 Framework-Erkennung (Reihenfolge)

1. **Next.js:** `next` in dependencies + `app/` oder `pages/` → App/Pages Router.
2. **React Router:** `react-router-dom` + `<Routes>`/`<Route>` oder `createBrowserRouter` → React Router.
3. **Hash/State:** Nur React, keine Router-Deps → State-/Hash-Heuristik.
4. **Nuxt/Vue:** Falls später gewünscht – analog zu Next/React Router.
5. **CLI (Commander):** `commander` in dependencies + `bin` in package.json oder Datei mit `program.command(` → CLI-Command-Extraktion (Terminal-Screens).

### 4.7 CLI/Terminal-Screens (Commands wie Raggadon, WOARU)

- **Konzept:** Jeder CLI-Command (und Subcommand) = ein **Screen** mit „Pfad“ = Aufruf (z. B. `rag save`, `woaru init`).
- **Erkennung:**
  - **Node/Commander:** In der Einstiegsdatei (aus `package.json` → `bin`) nach `program.command('name')` bzw. `cmd.command('name')` suchen; bei Subcommands rekursiv (z. B. `version` → `check`). Optional: `.description()` für Namen/Beschreibung.
  - **Python (Click/argparse):** Analog nach Subcommand-Definitionen suchen (Decorators, `add_parser`).
- **Screen-Mapping:** Gleiches **Screen**-DTO wie für Web:
  - `path`: z. B. `rag save`, `woaru review` oder normiert `/cli/save`, `/cli/review`.
  - `name`: Command-Name (z. B. „Save“, „Review“) oder aus Description.
  - `type`: neu z. B. `"cli-command"` ODER weiter `"screen"` mit `framework: "cli-commander"`.
  - `framework`: `"cli-commander"` (Node) oder `"cli-click"` (Python) usw.
- **UI:** In der Sitemap/App-Flow-Ansicht „Terminal-Screens“ bzw. „Commands“ anzeigen (Tab/Filter oder eigener Bereich), damit alle „Seiten“ des Tools (inkl. Terminal) sichtbar sind.

---

## 5. Repo-Kurzsteckbriefe

### esunautapp (Esunautapp)

- **Struktur:** `src/app/App.tsx`, Vite, MUI/Radix.
- **Routing:** State-basiert (`currentView`: projects, kanban, wizard, chat, settings, …). Keine URLs für Views.
- **Screens:** Viele logische Views (ProjectList, ProjectKanbanView, SettingsView, CodeLibraryView, …), nur über State erkannt.

### scriptony_figma make (Scriptonyapp)

- **Struktur:** `src/App.tsx`, Vite, viele Pages in `components/pages/`.
- **Routing:** Hash: `#home`, `#projekte`, `#worldbuilding`, `#creative-gym`, `#upload`, `#admin`, `#settings`, `#present`, `#auth`, `#migration`, `#reset-password`, `#api-test`, `#project-recovery`.
- **Screens:** 14+ Pages (HomePage, ProjectsPage, WorldbuildingPage, …); Erkennung nur über Hash + `validPages`/`renderPage()`.

### browofieldmanager_figmamake (Browofieldmanager)

- **Struktur:** `src/app/App.tsx`, React Router.
- **Routen:** `/` → redirect `/field`, `/field`, `/vehicle/:vehicleId`, `/team/employees/:employeeId/details`.
- **VisuDEV:** Läuft mit aktueller React-Router-Logik.

### chatthis_figmamake (Chatthis)

- **Struktur:** `src/App.tsx`, eine Seite (Chat + Sidebar + Modals).
- **Routing:** Kein View-Wechsel; Modals (Settings, NewChat).
- **Screens:** 1 Haupt-Screen; Modals optional als Unterpunkte.

### makemysaga_figmamake (Makemysaga)

- **Struktur:** `src/App.tsx`, AuthGate, Layout, `currentView`.
- **Routing:** State: `dashboard`, `character-editor`, `adventure-editor`, `gamemaster`, `marketplace`, `library`, `profile`, `join`, `rulesets-test`, `marketplace-test`.
- **Screens:** 10 Views; nur über State-Switch erkennbar.

### nectarova_figmamake (nectarova)

- **Struktur:** `src/app/App.tsx`, React Router.
- **Routen:** `/` (SearchScreen), `/product/:id` (ProductDetailView).
- **VisuDEV:** Läuft mit React-Router-Erkennung.

### letzfetzprototype_figmamake (Letzfetzprototype)

- **Struktur:** `src/App.tsx`, State `currentView`: `'forge' | 'arena'`; Notes als Modal.
- **Routing:** Nur zwei Views (CardForge, Arena) + Notes.
- **Screens:** 2 (+ optional Notes als „Screen“).

### dadu_figmamake (Dadu)

- **Struktur:** `src/App.tsx`, viele Komponenten (Homepage, ConceptList, ConceptDetail, DaduChat, Modals).
- **Routing:** Kein URL-Routing; Wechsel über State/Modals (ConceptLibrary, ConceptDetail, ContextPanel, Chat, …).
- **Screens:** Logisch mehrere „Bereiche“, aber nur über Komponenten-/State-Analyse erkennbar.

### audioflowai (Voiceflowai)

- **Struktur:** Next.js, `src/app/page.tsx`, `layout.tsx`, API-Routes unter `app/api/`.
- **Routing:** Next.js App Router; Tauri-Desktop-Varianten.
- **Screens:** File-based (page.tsx); ggf. eine Hauptseite + API-Routes als eigene „Endpoints“.

### esunautfrontend (Esunautfrontend)

- **Struktur:** `src/app/App.tsx`, State `currentView` (projects, settings, code-library, …).
- **Routing:** Wie esunautapp state-basiert; viele Views (ProjectList, SettingsView, CodeLibraryView, StatisticsView, AgentsView, RAGView, WorkflowsView, DashboardView, UsersView, AuthView).
- **Screens:** Nur über State-Switch erkennbar.

### Raggadon

- **Struktur:** Python FastAPI (`main.py`, `app/`) + **Node-CLI** (`cli/bin/rag.js`, Commander).
- **Typ:** RAG-Backend + CLI. **Terminal-Screens** = CLI-Commands: `rag save`, `rag search`, `rag status`, `rag start`, `rag mode`, `rag init`. Jeder Command = eine „Seite“ im Terminal (eigene Ausgabe/Flow). Erkennung über `program.command('...')` in `rag.js`.

### areathis (03-game/web)

- **Struktur:** Next.js 15, Phaser, `src/` mit vielen TS-Dateien.
- **Routing:** Next.js App Router (file-based).
- **Screens:** Über `app/**/page.tsx` erkennbar.

### browoai-analytics

- **Struktur:** Monorepo: `src/api/`, `src/backoffice/`, `src/portal/`. Portal = Next.js (App Router).
- **Routing:** Portal: `app/page.tsx`, `app/dashboard/`, `app/auth/sign-in/`, etc.
- **Screens:** Next.js-Erkennung auf `portal` anwenden.

### MultiagentUltra (frontend)

- **Struktur:** React, `frontend/src/App.tsx`, React Router mit **basename="/multiagentultra"**.
- **Routen:** `/dashboard`, `/projekte`, `/crews`, `/agents`, `/agents/new-agent`, `/knowledge`, `/styleguide`, `/settings`, …
- **VisuDEV:** React Router; **basename** muss als Prefix genutzt werden.

### adaptive_api

- **Struktur:** Python, `src/main.py`, `api_connector`, `api_parser`, etc.
- **Typ:** API-Adapter – keine UI-Screens.

### WOARU (WorkaroundUltra)

- **Struktur:** TypeScript CLI (`src/cli.ts`, Commander, Actions, Analyzer, Supervisor).
- **Typ:** Tooling/CLI. **Terminal-Screens** = CLI-Commands/Subcommands: `woaru init`, `woaru version` / `version check`, `woaru commands`, `woaru wiki`, `woaru quick-analyze`, `woaru setup`, `woaru ai` (setup, status), `woaru update-db`, `woaru watch`, `woaru status`, `woaru update`, `woaru stop`, `woaru logs`, `woaru recommendations`, `woaru helpers`, `woaru docu` (nopro, pro, forai), `woaru ignore`, `woaru review`, `woaru analyze`, `woaru ai` (analyze), `woaru rollback`, `woaru message`, `woaru config`, `woaru language` usw. Jeder Command/Subcommand = eine „Seite“ im Terminal. Erkennung über `program.command('...')` und Subcommands in `cli.ts`.

### AI Audiobookmaker

- **Hinweis:** Angegebener Pfad wurde nicht gefunden; ggf. anderer Ordnername oder nicht vorhanden.

---

## 6. Zusammenfassung

- **React Router + Next.js:** Von VisuDEV bereits abgedeckt; Verbesserungen: **basename**, Route-Config-Arrays, Next.js Route Groups.
- **State-basiertes „Routing“:** In vielen Figma-Make-/Lovable-ähnlichen Apps genutzt. **Neue Heuristik** für `currentView`/`currentPage` + Switch/Cases nötig, um Screens ohne URL zu erfassen.
- **Hash-Routing:** Ein Repo (scriptony); **eigene Heuristik** für Hash + Page-Listen sinnvoll.
- **Single-Page ohne Wechsel:** Als ein Screen behandeln; optional Modals/Tabs feiner granularisieren.
- **CLI/Terminal-Screens (Raggadon, WOARU):** Jeder Command/Subcommand = eine „Seite“ im Terminal. **Neue Heuristik** nötig: Commander-Pattern (`program.command('...')`, Subcommands) in CLI-Entry-Datei parsen → gleiches Screen-DTO mit z. B. `framework: "cli-commander"`, `path: "rag save"` bzw. `woaru init`. In der UI als „Terminal-Screens“ oder „Commands“ anzeigen (eigener Bereich/Filter).
- **Reines Backend (z. B. adaptive_api):** Keine Screen-Liste oder nur generischer „API“-Eintrag.

Damit wird VisuDEV **generischer** und kann Web- und CLI-Projekte mit unterschiedlichen Technologien erfassen; alle „Seiten“ (URLs, Views, Commands) werden einheitlich als Screens abgebildet.
