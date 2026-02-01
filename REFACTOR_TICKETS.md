# Refactor Roadmap (Epics & Tickets)

Status-Legende: **TODO** | **IN PROGRESS** | **DONE**

---

## Epic FE-1: Frontend Modularisierung & Styling-Compliance (Tailwind Variante 3)

- **FE-1.1 Logs-Modul migrieren (CSS-Modules, keine Inline-Styles, keine Tailwind-Classes im JSX)** — **DONE**
  - Akzeptanz:
    - Logs-Seite unter `src/modules/logs/pages/`
    - CSS-Module unter `src/modules/logs/styles/`
    - Keine Tailwind-Classes im JSX
    - Keine Inline-Styles (Progress via `<progress>`)

- **FE-1.2 Shell-App + Sidebar in `modules/shell` migrieren** — **DONE**
  - App-Layout & Sidebar ohne Tailwind-Classes/Inline-Styles

- **FE-1.3 Projekte-Modul migrieren** — **DONE**

- **FE-1.4 AppFlow-Modul migrieren** — **DONE**

- **FE-1.5 Blueprint-Modul migrieren** — **DONE**

- **FE-1.6 Data-Modul migrieren** — **DONE**

- **FE-1.7 Settings-Modul migrieren** — **DONE**

---

## Epic FE-2: Services & Typisierung

- **FE-2.1 API-Calls aus UI entfernen (Services/Hooks je Modul)** — **DONE**
  - **FE-2.1a Screenshots-Service (ScreenshotPreview/Settings)** — **DONE**
  - **FE-2.1b Projects-Services (GitHub/Supabase Selector)** — **DONE**
- **FE-2.2 `any` entfernen + DTO/VM-Typen je Modul** — **DONE**
  - **FE-2.2a Projects DTOs (create/update + hooks/api typing)** — **DONE**
  - **FE-2.2b Integrations DTOs + Panel typing** — **DONE**
  - **FE-2.2c Store/Analyzer DTOs (screens/flows/results)** — **DONE**
  - **FE-2.2d Restliche Hooks (`useVisuDev`) typisieren** — **DONE**

---

## Epic FE-3: Styling Tokens & Cleanup

- **FE-3.1 CSS-Variablen vereinheitlichen + Hardcoded Colors entfernen** — **DONE**
  - **FE-3.1a Layer-/Metric-Farbtokens + `utils.ts` auf CSS-Variablen umstellen** — **DONE**
  - **FE-3.1b AppFlow Views (SitemapFlowView/ScreenDetailView/CodePreview) ohne Hardcoded Colors** — **DONE**
    - CodePreview auf CSS-Module + Tokens umgestellt — **DONE**
    - ScreenDetailView auf CSS-Module + Tokens umgestellt — **DONE**
    - SitemapFlowView auf CSS-Module + Tokens umgestellt — **DONE**
  - **FE-3.1c Restliche Komponenten mit Hardcoded Colors (LayerFilter, SitemapView, IntegrationsPanel, IFrameScreenRenderer)** — **DONE**
    - LayerFilter auf CSS-Module + Tokens umgestellt — **DONE**
    - SitemapView auf CSS-Module + Tokens umgestellt — **DONE**
    - IntegrationsPanel auf CSS-Module + Tokens umgestellt — **DONE**
    - IFrameScreenRenderer auf CSS-Module + Tokens umgestellt — **DONE**
  - **FE-3.1d Einzelne CSS-Module mit RGBA/Hex ersetzen (z. B. Settings)** — **DONE**
- **FE-3.2 Restliche Tailwind-Classes im JSX entfernen** — **DONE**
  - **FE-3.2a ScreenshotPreview auf CSS-Module + Tokens** — **DONE**
  - **FE-3.2b UI-Primitives (Button/Input/Label/Card/Badge/Separator/Dialog/Select/Dropdown)** — **DONE**
  - **FE-3.2c Unbenutzte Tailwind-Komponenten aufräumen/archivieren** — **DONE**
  - **FE-3.2d Tailwind-Stylesheets & Deps entfernen (index.css, cva, tailwind-merge)** — **DONE**

---

## Epic BE-1: Edge Functions DDD/DI Refactor

- **BE-1.1 DDD-Template + `visudev-data` refactor** — **DONE**
- **BE-1.2 Weitere Functions refactor (`projects`, `logs`, `integrations`, ...)** — **DONE**
  - **BE-1.2a `visudev-projects` refactor** — **DONE**
  - **BE-1.2b `visudev-logs` refactor** — **DONE**
  - **BE-1.2c `visudev-integrations` refactor** — **DONE**
- **BE-1.3 `visudev-analyzer` refactor (groß)** — **DONE**
