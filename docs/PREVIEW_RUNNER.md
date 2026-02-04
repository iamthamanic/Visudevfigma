# Preview Runner (Live App)

VisuDEV kann die angebundene App **aus dem Repo bauen und starten**, sodass du dich in der **echten laufenden App** im Tab **Live App** durchklicken kannst – ohne die App selbst zu starten oder auf Vercel/Netlify zu deployen.

## Runner lokal vs. feste URL

**Du kannst den Runner lokal hosten.** Es gibt zwei Wege:

| Weg                             | Wer ruft den Runner auf?                      | Runner lokal möglich?                                                                                                                                                                                            | Feste URL nötig?                                                                                                                                      |
| ------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A: Direkt (empfohlen lokal)** | Das **Frontend** (Browser auf deinem Rechner) | **Ja** – Browser und Runner sind auf derselben Maschine, `localhost:4000` funktioniert.                                                                                                                          | Nein – du setzt nur `VITE_PREVIEW_RUNNER_URL=http://localhost:4000` in `.env`.                                                                        |
| **B: Über Edge Function**       | Die **Edge Function** (läuft bei Supabase)    | **Nur wenn Supabase auch lokal läuft** (`supabase start`). Wenn Supabase in der **Cloud** läuft, kann die Function deinen Rechner nicht erreichen – dann brauchst du eine **öffentlich erreichbare** Runner-URL. | Nur bei **Supabase in der Cloud**: Ja, feste URL (z. B. `https://runner.example.com`), weil die Function von Supabase-Servern aus den Runner aufruft. |

**Kurz:** Runner lokal ist möglich. Setze `VITE_PREVIEW_RUNNER_URL=http://localhost:4000`, starte den Runner lokal – dann spricht das Frontend den Runner direkt an, **kein Supabase-Secret und keine feste öffentliche URL** nötig. Eine feste URL brauchst du nur, wenn du den Umweg über die Edge Function (in der Cloud) nutzen willst.

## Architektur

1. **Preview Runner** (separater Service): Vergibt **automatisch einen freien Port** pro Lauf (z. B. 4001, 4002, …), klont/baut/startet die App, liefert die **Preview-URL** (lokal: `http://localhost:PORT`; Produktion: öffentliche URL).
2. **Edge Function `visudev-preview`** (optional): Ruft den Runner auf, speichert Preview-URL und Status in KV. Wird nicht genutzt, wenn `VITE_PREVIEW_RUNNER_URL` gesetzt ist.
3. **Frontend**: App Flow mit Live-Preview-Iframes. Ruft entweder den Runner **direkt** (bei `VITE_PREVIEW_RUNNER_URL`) oder die Edge Function auf.

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
- `POST /refresh` – Body: `{ runId }`. **Live-Update:** `git pull`, Rebuild, App neu starten (gleicher Port).
- `POST /webhook/github` – **GitHub Webhook:** Bei Push ruft GitHub diese URL auf; der Runner findet die passende Preview (repo + branch) und startet automatisch Refresh (pull + rebuild + restart). So siehst du Änderungen **live**, ohne „Preview aktualisieren“ zu klicken.

Umgebungsvariablen:

- `PORT` – Server-Port des Runners (Standard: 4000)
- `USE_REAL_BUILD` – **optional**. Wenn `1` oder `true`: echter Clone/Build/Start (Repo klonen, bauen, App auf zugewiesenem Port starten). Ohne: Stub (Platzhalter-Seite).
- `GITHUB_TOKEN` – **optional**. Für private Repos: Token mit Lese-Recht, damit der Runner klonen kann.
- `GITHUB_WEBHOOK_SECRET` – **optional**. Secret, das du in den GitHub-Webhook-Einstellungen einträgst; der Runner prüft damit die Signatur (X-Hub-Signature-256) und lehnt unbefugte Aufrufe ab.
- `PREVIEW_PORT_MIN` / `PREVIEW_PORT_MAX` – Port-Pool für Preview-URLs (Standard: 4001–4099). Pro Lauf wird automatisch ein freier Port vergeben.
- `PREVIEW_BASE_URL` – **optional**. Wenn gesetzt (z. B. Tunnel-URL), wird diese Basis + Query als `previewUrl` genutzt; sonst immer `http://localhost:${port}`.
- `SIMULATE_DELAY_MS` – Verzögerung in ms, bis „ready“ (nur im Stub-Modus; Standard: 3000)

### Hosting (Produktion)

Für echte Builds (Clone, `npm install`, `npm run build`, Start) den Runner auf **VPS, Railway, Render, Fly.io** o. Ä. hosten und dort:

- Repo klonen (GitHub Token aus Env)
- Optional `visudev.config.json` im Repo lesen (siehe unten)
- Build und Start in isoliertem Container; **freien Port** pro Lauf vergeben (Port-Pool oder dynamisch)
- Reverse Proxy oder Subdomain pro Run, damit die **Preview-URL vom Browser aus erreichbar** ist (VisuDev lädt die URL im iframe; bei lokalem Runner reicht `http://localhost:PORT`, bei VisuDev auf Vercel muss die URL öffentlich erreichbar sein)

### Lokal ohne Supabase-Secret (empfohlen für Entwicklung)

Du musst **keinen** freien Port als Secret eintragen. Du trägst nur **eine** URL ein: die des **Runner-Services** (API mit `/start`, `/status`, `/stop`). Der Runner vergibt **intern** freie Ports pro Preview (z. B. 4001, 4002, …).

**Lokal ohne Edge Function:** Setze in `.env` (oder `.env.local`):

```bash
VITE_PREVIEW_RUNNER_URL=http://localhost:4000
```

Dann starte den Runner (`cd preview-runner && npm start`). Das Frontend spricht den Runner direkt an – **kein Supabase-Secret nötig**. Der Runner läuft auf Port 4000 (API); die einzelnen Previews bekommen automatisch freie Ports (4001–4099).

### Supabase: Runner-URL eintragen (Produktion / mit Edge Function)

1. Supabase Dashboard → dein Projekt → **Edge Functions** → **Secrets**
2. Secret anlegen: `PREVIEW_RUNNER_URL` = **Runner-API-URL** (z. B. `https://preview-runner.example.com`). Das ist die **eine** feste URL, unter der der Runner-Service erreichbar ist – **nicht** die Ports der einzelnen Previews (die vergibt der Runner selbst).
3. Edge Function `visudev-preview` deployen: `supabase functions deploy visudev-preview`

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

## Checkliste: alles lokal (ohne Supabase-Secret)

1. **Runner starten:** `cd preview-runner && npm install && npm start` (läuft auf `http://localhost:4000`).
2. **In `.env` oder `.env.local`:** `VITE_PREVIEW_RUNNER_URL=http://localhost:4000`
3. **VisuDev starten:** `npm run dev` (Frontend spricht Runner direkt an).
4. Im App Flow **Preview starten** – der Runner vergibt intern einen freien Port (z. B. 4001) und liefert die Preview-URL.
5. **Preview beenden** gibt den Port im Runner wieder frei.

Kein Supabase-Secret, keine feste URL – der Runner kann lokal laufen.

## GitHub Webhook (Live bei Push)

Wenn jemand ins Repo pusht (z. B. Button blau → grün), kann die Preview **automatisch** aktualisiert werden – ohne „Preview aktualisieren“ zu klicken.

1. **Runner muss von GitHub erreichbar sein:** Lokal z. B. mit [ngrok](https://ngrok.com): `ngrok http 4000` → du bekommst eine URL wie `https://abc123.ngrok.io`. Oder Runner auf einem Server mit öffentlicher URL deployen.
2. **Webhook in GitHub anlegen:** Repo auf GitHub → **Settings** → **Webhooks** → **Add webhook**
   - **Payload URL:** `https://deine-runner-url/webhook/github` (z. B. `https://abc123.ngrok.io/webhook/github`)
   - **Content type:** `application/json`
   - **Secret:** Beliebiges geheimes Passwort (z. B. mit `openssl rand -hex 32` erzeugen). Dasselbe Secret als `GITHUB_WEBHOOK_SECRET` im Runner setzen (Env oder `.env` im `preview-runner`-Ordner).
   - **Events:** „Just the push event“ reicht.
3. **Runner mit Secret starten:** `GITHUB_WEBHOOK_SECRET=dein-secret USE_REAL_BUILD=1 npm start`
4. **Ablauf:** Push ins Repo → GitHub ruft deine Webhook-URL auf → Runner findet die laufende Preview für dieses Repo+Branch → führt `git pull`, Rebuild und Neustart aus → die Preview zeigt den neuesten Stand.

Ohne Webhook: **„Preview aktualisieren“** in VisuDEV klicken erzeugt denselben Effekt (Pull + Rebuild + Restart).

## Ablauf in der UI

1. Projekt mit GitHub-Repo auswählen.
2. App Flow öffnen (Live-Preview-Iframes oder Einzel-iframe).
3. **Preview starten** (oder Auto-Start bei verbundenem Repo) → VisuDEV ruft entweder den Runner **direkt** (wenn `VITE_PREVIEW_RUNNER_URL` gesetzt) oder die Edge Function auf; der Runner vergibt einen freien Port und liefert die Preview-URL.
4. Nach einigen Sekunden (Stub) bzw. Minuten (echter Build) erscheint die **Preview-URL** im iframe.
5. **Live:** Nach Push ins Repo wird die Preview automatisch aktualisiert (wenn Webhook konfiguriert), sonst **„Preview aktualisieren“** klicken.
6. Optional: **Preview beenden** zum Stoppen (Port wird im Runner wieder freigegeben).
7. Optional: **Live Route/Buttons** anzeigen – wenn deine App im iframe `postMessage` mit Typ `visudev-dom-report` sendet, zeigt VisuDEV z. B. „Live: /dashboard · 3 Buttons“ am Preview-Knoten. Snippet und Doku: [LIVE_DOM_REPORT.md](./LIVE_DOM_REPORT.md).

## Hinweis zu Projekten in KV

Die Edge Function liest das Projekt aus dem KV-Store (`project:${projectId}`). Sind Projekte nur im Frontend-State (nicht über die Projects-API gespeichert), sendet das Frontend beim Start **repo** und **branchOrCommit** mit; die Edge Function nutzt diese dann für den Aufruf des Runners.
