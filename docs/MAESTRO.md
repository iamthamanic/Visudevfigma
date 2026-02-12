# Maestro E2E (Web) – UI-/Screen-Tests

[Maestro](https://github.com/mobile-dev-inc/maestro) ist ein E2E-Framework für Mobile und **Web**: YAML-Flows, wenig Code, robust gegen Flakiness. Wir nutzen es ergänzend zu Playwright, um die VisuDEV-UI und die **Preview-Apps** (verbundene Repos) zu testen.

## Warum Maestro?

- **YAML-Flows** – lesbar, schnell anpassbar (z. B. `tapOn`, `assertVisible`).
- **Web-Support** – dieselbe Syntax wie für Mobile; `url:` statt `appId:`.
- **Preview testen** – sobald App Flow eine Preview-URL hat, können wir mit Maestro prüfen, ob die Screens der gebauten App funktionieren.

## Installation

Maestro wird per Script installiert (nicht über npm):

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

Voraussetzung: **Java 17+** (`java -version`).

## VisuDEV-App testen

1. App starten (z. B. `npm run dev` → Vite auf 5173, oder `npm run build && npx vite preview --port 3000`).
2. Maestro-Smoke ausführen:

   ```bash
   npm run e2e:maestro
   ```

   Nutzt standardmäßig `http://127.0.0.1:3000`. Anderen Port (z. B. Vite Dev 5173):

   ```bash
   BASE_URL=http://localhost:5173 npm run e2e:maestro
   ```

Flows liegen in `maestro/visudev-smoke.yaml`.

## Preview-App (verbundenes Repo) testen

So prüfst du, ob die **gebauten Screens** der verbundenen App erreichbar sind:

1. **Preview starten**  
   In VisuDEV: Repo verbinden → App Flow → Preview starten. Die Preview-URL erscheint in der App (z. B. `http://localhost:4001`).

2. **Maestro gegen diese URL laufen lassen:**

   ```bash
   npm run e2e:maestro:preview -- http://localhost:4001
   ```

   Oder mit Umgebungsvariable:

   ```bash
   PREVIEW_URL=http://localhost:4001 npm run e2e:maestro:preview
   ```

Flows: `maestro/preview-smoke.yaml` (nutzt `PREVIEW_URL`).

Wenn die Preview nicht lädt (z. B. „Bad Gateway“ / ECONNREFUSED), zuerst App Flow/Preview-Runner prüfen (Docker, `npm run dev`). Ausführliche Ursachen und Lösungen: [APPFLOW_PREVIEW_WHY_EMPTY.md](APPFLOW_PREVIEW_WHY_EMPTY.md). Siehe auch [PREVIEW_RUNNER.md](PREVIEW_RUNNER.md).

## Bezug zu App Flow

- **App Flow** zeigt Screens und Flows der verbundenen App; die **Live-Preview** lädt die gebaute App in einem iframe (URL vom Preview-Runner).
- **Maestro** testet diese Preview-URL direkt im Browser: Seite öffnen, ggf. Elemente prüfen. So siehst du, ob die UI/Screens der gebauten App funktionieren.
- Playwright testet weiterhin die **VisuDEV-Oberfläche** (Login, Projekte, App Flow, Scan); Maestro ergänzt mit einfachen YAML-Flows für VisuDEV und für die Preview-App.

## Eigene Flows erweitern

- **VisuDEV:** `maestro/visudev-smoke.yaml` – `assertVisible`, `tapOn` etc. anpassen.
- **Preview:** `maestro/preview-smoke.yaml` – z. B. spezifische Texte/IDs deiner App asserten.

Dokumentation: [maestro.mobile.dev](https://maestro.mobile.dev), [GitHub – mobile-dev-inc/maestro](https://github.com/mobile-dev-inc/maestro).
