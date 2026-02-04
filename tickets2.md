# VisuDEV – Offene Tickets (tickets2.md)

Alle noch zu erledigenden Arbeiten, priorisiert und abarbeitbar.  
Basis: TICKETS.md (unchecked), inspiration.md (Phasen/UX), IMPLEMENTATION_REPORT (geplant).

**Legende:** `[ ]` offen · `[x]` erledigt

---

## Priorität 1: MVP-Lücken & sofort sichtbar

### T2-001: README.md im Root ergänzen
- **Ziel:** Projekt beschreiben, Start/Build, Link zu Doku (kein reines „Figma code bundle“).
- **Akzeptanz:** README enthält: Was ist VisuDEV, `npm i` / `npm run dev` / `npm run build`, Verweis auf docs/SUPABASE_SETUP.md und inspiration.md.
- [x] Erledigt

### T2-002: App/Flow – Suche & Filter für Flows (Ticket #017)
- **Ziel:** Flows durchsuchbar und nach Layer filterbar.
- **Akzeptanz:** Suchfeld über der Flow-Liste, Echtzeit-Filter; Filter-Buttons für Layer (UI, API, DB); Clear-Button; keine neuen Tailwind/Inline-Styles.
- [x] Erledigt

### T2-003: App/Flow – Empty State „Noch keine Flows“ (Ticket #018)
- **Ziel:** Klarer Hinweis + CTA, wenn noch keine Flows analysiert.
- **Akzeptanz:** Zentrierte Meldung „Noch keine Flows analysiert“, Workflow-Icon, „Scan starten“-Button, nur bei `flows.length === 0 && !isScanning`.
- [x] Erledigt

### T2-004: Tooltips – einheitliches Styling & Info-Icons
- **Ziel:** Wo nötig Info-Tooltips (z. B. Konfiguration, Shortcuts); einheitliches Styling (STYLEGUIDE: Background #111111, Border #03ffa3).
- **Akzeptanz:** Tooltip-Komponente oder bestehende nutzen; mind. ein Einsatz (z. B. Settings „Konfiguration über Supabase Dashboard“); Styling per CSS-Variablen/globals.
- [x] Erledigt

### T2-005: Code-View – Copy-Button (IMPLEMENTATION_REPORT „geplant“)
- **Ziel:** In ScreenDetailView Code-View einen Copy-Button für den angezeigten Code.
- **Akzeptanz:** Button kopiert Code in Clipboard; kurzes Feedback (Toast oder Label).
- [x] Erledigt

---

## Priorität 2: Blueprint & inspiration.md UX

### T2-006: Blueprint – Rule-Violations-Panel (inspiration 3.1)
- **Ziel:** Optionales Panel/Subpanel „Rules“ mit Verstößen (z. B. dependency-cruiser-Style: ruleId, severity, source, target, message).
- **Akzeptanz:** Wenn Analyzer Violations liefert, Anzeige in Blueprint; sonst leer oder „Keine Violations“. Kein Pflicht-Backend-Change für MVP.
- [x] Erledigt

### T2-007: Blueprint – Cycle-Toggle / Zyklen-Hinweis (inspiration 3.2)
- **Ziel:** Zyklische Abhängigkeiten erkennbar (Toggle oder Badge „Zyklus“).
- **Akzeptanz:** Entweder Backend liefert cycles[] und Frontend zeigt sie an, oder UI-Platzhalter + Doku; keine neuen Tailwind/Inline-Styles.
- [x] Erledigt

### T2-008: Export – Mermaid oder JSON (inspiration §6)
- **Ziel:** Export-Button für Blueprint oder App/Flow (Format: Mermaid oder JSON).
- **Akzeptanz:** Ein Export-Button pro View; Download einer Datei (Mermaid-.md oder .json); Daten aus aktuellem Graph/Flow.
- [x] Erledigt

---

## Priorität 3: Settings, Logs, Data-Polish

### T2-009: Settings – GitHub Disconnect + Bestätigung (Ticket #027)
- **Ziel:** „Disconnect“-Button mit Bestätigungs-Dialog; nach Bestätigung GitHub getrennt.
- **Akzeptanz:** Disconnect-Button sichtbar wenn verbunden; Modal „Wirklich trennen?“ mit Abbrechen/Disconnect; API-Call zum Trennen; UI-Update.
- [x] Erledigt

### T2-010: Settings – Supabase-Info read-only (Ticket #028)
- **Ziel:** Anzeige Project-ID, Region, DB/Edge-Status (read-only); Tooltip „Konfiguration über Supabase Dashboard“.
- **Akzeptanz:** Card mit Project-ID (Copy-Button), Region, Status-Badges; alle Felder read-only; Tooltip wie T2-004.
- [x] Erledigt

### T2-011: Logs – Filter nach Level + Suche (Ticket #025)
- **Ziel:** Filter INFO/WARN/ERROR; Suchfeld mit Hervorhebung; Auto-Scroll-Toggle.
- **Akzeptanz:** Filter-Buttons; Suchinput; Toggle Auto-Scroll; max. 1000 Einträge; Styling über CSS-Module.
- [x] Erledigt

### T2-012: Data – ER-Diagramm Interaktion (Ticket #022)
- **Ziel:** Klick auf Tabelle öffnet Detail-Panel (rechts); Tabs Columns, RLS, Sample optional.
- **Akzeptanz:** Klick auf Table-Box öffnet Panel; Panel mit Tabs oder einfacher Liste; Schließen per X/ESC.
- [x] Erledigt

---

## Priorität 4: UX & Qualität

### T2-013: Loading States – Skeleton/Spinner konsistent (Ticket #038)
- **Ziel:** Wo Listen/Grids laden: Skeleton oder Spinner; Buttons während Action: Spinner + disabled.
- **Akzeptanz:** Projekte-Grid, Flow-Liste, Repo-Dropdown haben Loading-State; Buttons mit Loading zeigen Spinner und sind disabled.
- [x] Erledigt

### T2-014: Error Handling – Toast + Retry (Ticket #039)
- **Ziel:** API-Fehler als Toast; wo sinnvoll Retry-Button; einheitliche Fehlertexte.
- **Akzeptanz:** Sonner/Toast für Fehler; mind. ein Retry-Einsatz (z. B. „Projekt laden“); keine rohen API-Messages im UI.
- [x] Erledigt

### T2-015: Keyboard – ESC schließt Modals (Ticket #040 Teil)
- **Ziel:** ESC schließt alle Modals/Panels (Dialog, Detail-Panel, etc.).
- **Akzeptanz:** Jedes geöffnete Modal/Panel reagiert auf ESC; keine neuen Shortcuts nötig für MVP.
- [x] Erledigt

### T2-016: Accessibility – Fokus & ARIA (Ticket #042 Basis)
- **Ziel:** Fokus-Indikator (z. B. 2px solid #03ffa3); aria-label für Icon-Buttons in Sidebar/Header.
- **Akzeptanz:** Fokus sichtbar; mind. Sidebar-Nav und primäre Buttons mit aria-label; semantisches HTML wo schon möglich.
- [x] Erledigt

---

## Priorität 5: Optional / Später

### T2-017: Integrations-Tab im App/Flow (IMPLEMENTATION_REPORT „geplant“)
- **Ziel:** Tab „Integrations“ neben Sitemap mit ERP/Connections-Info aus visudev-integrations.
- **Akzeptanz:** Tab vorhanden; lädt Daten von Integrations-API; Darstellung als Liste/Cards.
- [ ] Erledigt

### T2-018: Flow-Graph-Tab (IMPLEMENTATION_REPORT „geplant“)
- **Ziel:** Eigenes Tab „Flow Graph“ mit Graph-Visualisierung (Knoten/Layer, Kanten).
- **Akzeptanz:** Tab; Graph aus aktuellen Flow-Daten; Zoom/Pan optional.
- [ ] Erledigt

### T2-019: Performance – Code-Splitting (Ticket #043)
- **Ziel:** React.lazy für Screen-Module; Suspense mit Fallback.
- **Akzeptanz:** Lazy-Load pro Route/Modul; Initial-Bundle reduziert; keine Regression bei Navigation.
- [ ] Erledigt

### T2-020: E2E – kritischer Pfad (Ticket #045)
- **Ziel:** Playwright (oder vergleichbar) für: Login, Projekt wählen, Scan starten (gemockt wo nötig).
- **Akzeptanz:** Mind. 1 E2E-Test pro kritischem Pfad; in CI ausführbar.
- [ ] Erledigt

---

## Abarbeitungs-Log

- [2025-01-30] T2-001: README.md im Root ergänzt
- [2025-01-30] T2-002: App/Flow Suche & Filter (SitemapFlowView)
- [2025-01-30] T2-003: App/Flow Empty State „Noch keine Flows“
- [2025-01-30] T2-004: Tooltip-Komponente (ui/Tooltip) + Settings Supabase-Info
- [2025-01-30] T2-005: Code-View Copy-Button
- [2025-01-30] T2-006: Blueprint Rules-Panel (Violations oder „Keine Violations“)
- [2025-01-30] T2-007: Blueprint Zyklen-Panel (Badge + cycles[] oder Platzhalter)
- [2025-01-30] T2-008: Export JSON/Mermaid in Blueprint + App/Flow
- [2025-01-30] T2-010: Settings Supabase-Info read-only (Projekt-ID, Region, DB/Edge, Copy, Tooltip)
- [2025-01-30] T2-011: Logs Filter Level (INFO/WARN/ERROR), Suche mit Hervorhebung, Auto-Scroll, max. 1000
- [2025-01-30] T2-012: Data ER-Diagramm – Klick auf Tabelle öffnet Detail-Panel (Columns, RLS, Sample), X/ESC schließt
- [2025-01-30] T2-013: Loading States – Skeleton (Projekte-Grid), Spinner + disabled Buttons, Repo-Dropdown/Flow-Liste Loading
- [2025-01-30] T2-014: Toaster (Sonner) in App; Toast bei API-Fehler; Retry auf Logs-Seite; Projekte-Fehler als Toast
- [2025-01-30] T2-015: ESC schließt Modals (Radix Dialog + Data Detail-Panel)
- [2025-01-30] T2-016: Focus-visible 2px solid #03ffa3; aria-label Sidebar-Nav, Neues Projekt, Anmelden/Abmelden
- Erledigte Tickets hier mit Datum eintragen.
- Format: `[YYYY-MM-DD] T2-XXX: Kurzbeschreibung`
