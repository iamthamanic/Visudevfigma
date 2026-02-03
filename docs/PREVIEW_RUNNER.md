# Preview Runner (Live App)

VisuDEV kann die angebundene App **aus dem Repo bauen und starten**, sodass du dich in der **echten laufenden App** im Tab **Live App** durchklicken kannst – ohne die App selbst zu starten oder auf Vercel/Netlify zu deployen.

## Architektur

1. **Preview Runner** (separater Service): Vergibt **automatisch einen freien Port** pro Lauf, klont/baut/startet die App, liefert die **Preview-URL** (lokal: `http://localhost:PORT`; Produktion: öffentliche URL).
2. **Edge Function `visudev-preview`**: Ruft den Runner auf, speichert Preview-URL und Status in KV.
3. **Frontend**: App Flow mit Sitemap/Integrations/Flow Graph; rechts die **Live App** im **iframe**. Die Preview wird **nur innerhalb von VisuDev im App-Flow-iframe** angezeigt, nicht in einem neuen Browser-Tab.

## Preview Runner einrichten

Der Preview Runner ist ein **eigener Service** (läuft nicht in Supabase). Im Repo liegt eine **MVP-Stub-Version** unter `preview-runner/`.

### Lokal starten (Stub)

```bash
cd preview-runner
npm install
npm start
```

Der Stub antwortet auf:

- `POST /start` – Body: `{ repo, branchOrCommit, projectId }` → weist einen **freien Port** aus dem Pool zu, speichert `previewUrl: http://localhost:PORT` (oder optional `PREVIEW_BASE_URL` + Query), antwortet mit `{ runId, status: "starting" }`
- `GET /status/:runId` – nach ein paar Sekunden: `{ status: "ready", previewUrl }` (z. B. `http://localhost:4001`)
- `POST /stop/:runId` – Port wird wieder freigegeben, `{ status: "stopped" }`

Umgebungsvariablen:

- `PORT` – Server-Port des Runners (Standard: 4000)
- `PREVIEW_PORT_MIN` / `PREVIEW_PORT_MAX` – Port-Pool für Preview-URLs (Standard: 4001–4099). Pro Lauf wird automatisch ein freier Port vergeben.
- `PREVIEW_BASE_URL` – **optional**. Wenn gesetzt (z. B. Tunnel-URL), wird diese Basis + Query als `previewUrl` genutzt; sonst immer `http://localhost:${port}`.
- `SIMULATE_DELAY_MS` – Verzögerung in ms, bis „ready“ (Standard: 3000)

### Hosting (Produktion)

Für echte Builds (Clone, `npm install`, `npm run build`, Start) den Runner auf **VPS, Railway, Render, Fly.io** o. Ä. hosten und dort:

- Repo klonen (GitHub Token aus Env)
- Optional `visudev.config.json` im Repo lesen (siehe unten)
- Build und Start in isoliertem Container; **freien Port** pro Lauf vergeben (Port-Pool oder dynamisch)
- Reverse Proxy oder Subdomain pro Run, damit die **Preview-URL vom Browser aus erreichbar** ist (VisuDev lädt die URL im iframe; bei lokalem Runner reicht `http://localhost:PORT`, bei VisuDev auf Vercel muss die URL öffentlich erreichbar sein)

### Supabase: Runner-URL eintragen

1. Supabase Dashboard → dein Projekt → **Project Settings** → **Edge Functions** → **Secrets**
2. Secret anlegen: `PREVIEW_RUNNER_URL` = Basis-URL des Runners (z. B. `http://localhost:4000` lokal oder `https://preview-runner.example.com` in Produktion)
3. Edge Function `visudev-preview` neu deployen, damit der Secret geladen wird.

## visudev.config (optional)

Im **Root des User-Repos** (z. B. Scriptony) kann optional eine Datei `visudev.config.json` liegen, damit der Preview Runner die App korrekt baut und startet:

```json
{
  "buildCommand": "npm ci && npm run build",
  "startCommand": "npx serve dist",
  "port": 3000
}
```

- **buildCommand** – Befehl zum Bauen (Standard z. B. `npm run build`)
- **startCommand** – Befehl zum Starten der App (z. B. `npx serve dist` oder `npm run start`)
- **port** – Port, auf dem die App läuft

Fehlt die Datei, verwendet der Runner sinnvolle Defaults (z. B. `npm run build` + `npx serve dist`, Port 3000).

## Ablauf in der UI

1. Projekt mit GitHub-Repo auswählen.
2. App Flow öffnen (Sitemap | Integrations | Flow Graph; rechts die Live-App-Leiste).
3. **Preview starten** (oder Auto-Start bei verbundenem Repo) → VisuDEV ruft die Edge Function auf, diese den Runner; der Runner vergibt einen freien Port und liefert die Preview-URL.
4. Nach einigen Sekunden (Stub) bzw. Minuten (echter Build) erscheint die **Preview-URL** und wird **nur im iframe im App Flow** geladen – echte App zum Durchklicken, **nicht in einem neuen Browser-Tab**.
5. Optional: **Preview beenden** zum Stoppen (Port wird im Runner wieder freigegeben).

## Hinweis zu Projekten in KV

Die Edge Function liest das Projekt aus dem KV-Store (`project:${projectId}`). Sind Projekte nur im Frontend-State (nicht über die Projects-API gespeichert), sendet das Frontend beim Start **repo** und **branchOrCommit** mit; die Edge Function nutzt diese dann für den Aufruf des Runners.
