# Preview Runner (Live App)

VisuDEV kann die angebundene App **aus dem Repo bauen und starten**, sodass du dich in der **echten laufenden App** im Tab **Live App** durchklicken kannst – ohne die App selbst zu starten oder auf Vercel/Netlify zu deployen.

## Architektur

1. **Preview Runner** (separater Service): Klont Repo, baut die App, startet sie, stellt eine öffentliche URL bereit.
2. **Edge Function `visudev-preview`**: Ruft den Runner auf, speichert Preview-URL und Status in KV.
3. **Frontend**: Tab „Live App“ mit „Preview starten“, Polling, iframe mit der echten App.

## Preview Runner einrichten

Der Preview Runner ist ein **eigener Service** (läuft nicht in Supabase). Im Repo liegt eine **MVP-Stub-Version** unter `preview-runner/`.

### Lokal starten (Stub)

```bash
cd preview-runner
npm install
npm start
```

Der Stub antwortet auf:

- `POST /start` – Body: `{ repo, branchOrCommit, projectId }` → `{ runId, status: "starting" }`
- `GET /status/:runId` – nach ein paar Sekunden: `{ status: "ready", previewUrl }`
- `POST /stop/:runId` – `{ status: "stopped" }`

Umgebungsvariablen:

- `PORT` – Server-Port (Standard: 4000)
- `PREVIEW_BASE_URL` – Basis-URL für die Stub-Preview (z. B. `https://example.com`)
- `SIMULATE_DELAY_MS` – Verzögerung in ms, bis „ready“ (Standard: 3000)

### Hosting (Produktion)

Für echte Builds (Clone, `npm install`, `npm run build`, Start) den Runner auf **VPS, Railway, Render, Fly.io** o. Ä. hosten und dort:

- Repo klonen (GitHub Token aus Env)
- Optional `visudev.config.json` im Repo lesen (siehe unten)
- Build und Start in isoliertem Container
- Reverse Proxy für eine stabile Preview-URL

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
2. App Flow öffnen → Tab **Live App**.
3. **Preview starten** klicken → VisuDEV ruft die Edge Function auf, diese den Runner.
4. Nach einigen Sekunden (Stub) bzw. Minuten (echter Build) erscheint die **Preview-URL** und wird im **iframe** geladen – echte App zum Durchklicken.
5. Optional: **Preview beenden** zum Stoppen.

## Hinweis zu Projekten in KV

Die Edge Function liest das Projekt aus dem KV-Store (`project:${projectId}`). Sind Projekte nur im Frontend-State (nicht über die Projects-API gespeichert), sendet das Frontend beim Start **repo** und **branchOrCommit** mit; die Edge Function nutzt diese dann für den Aufruf des Runners.
