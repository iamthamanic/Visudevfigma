# E2E Tests (Playwright) – T2-020

Kritische User-Flows werden mit Playwright automatisch getestet.

## Voraussetzungen

- Node.js und `npm install`
- Chromium für Playwright: `npm run e2e:install` (einmalig)

## Lokal ausführen

1. **App starten** (in einem Terminal):

   ```bash
   npm run dev
   ```

   App läuft auf http://localhost:3000 (bzw. dem in `vite.config.ts` konfigurierten Port).

2. **E2E-Tests starten** (in einem zweiten Terminal):

   ```bash
   npm run e2e
   ```

   Verwendet standardmäßig `http://127.0.0.1:3000` als Basis-URL. Andere URL:

   ```bash
   PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run e2e
   ```

3. **Mit UI** (zum Debuggen):
   ```bash
   npm run e2e:ui
   ```

## Test-Szenarien

- **Login / Shell:** Beim Laden erscheint entweder die Login-Ansicht (VisuDEV Titel) oder die Shell (Navigation + main).
- **Projekte:** Wenn eingeloggt, ist die Projekte-Navigation erreichbar.
- **App Flow:** Nach Wechsel zu App Flow erscheinen Header oder Empty State.
- **Scan-Button:** Auf App Flow ist ein „Scan starten“- oder „Neu analysieren“-Button bzw. Export/Tabs sichtbar.

Tests überspringen Schritte, wenn z. B. kein Login nötig ist oder die erwarteten Elemente nicht gefunden werden (robust gegen Auth-Konfiguration).

## CI

In GitHub Actions (oder anderer CI):

1. `npm ci`
2. `npx playwright install chromium` (oder `npm run e2e:install`)
3. Build + Preview:
   ```bash
   npm run build && npx vite preview --port 3000
   ```
4. In einem anderen Job/Step: `npm run e2e` mit `CI=true` und ggf. `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`.

Die Konfiguration in `playwright.config.ts` startet bei `CI` automatisch einen Web-Server (build + preview), falls kein `webServer` anders vorgegeben wird.

## Artefakte bei Fehlern

- Bei Retry: Trace (optional)
- Bei Fehler: Screenshot
- HTML-Report: `npx playwright show-report` nach einem Lauf mit `reporter: ["html"]`
