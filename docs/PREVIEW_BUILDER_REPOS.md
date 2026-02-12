# Preview-Builder-Repos auf GitHub (zum Forken)

Kurze Übersicht von Open-Source-Repos, die für „Clone → Build → Serve“-Previews oder iframe-freundliche Proxies infrage kommen, **mit passenden Lizenzen** (MIT, Apache 2.0, ggf. BSD).

---

## 1. **Uffizzi (UffizziCloud/uffizzi)** – Preview-Umgebungen

- **Repo:** https://github.com/UffizziCloud/uffizzi
- **Lizenz:** **Apache License 2.0**
- **Beschreibung:** Ephemeral Preview Environments (z. B. pro PR), self-hosted oder SaaS.
- **Features:** Docker Compose, CI-Integration, Preview-URLs pro Environment.
- **Einschränkung:** Self-Hosting braucht **Kubernetes** (Helm). Kein einfacher „ein Prozess“-Runner wie bei eurem aktuellen Setup.

**Fork geeignet:** Ja, wenn ihr Kubernetes habt und Preview-Environments pro PR/Commit wollt.

---

## 2. **fipso/runner** – Vercel-ähnliche Preview-Deployments

- **Repo:** https://github.com/fipso/runner
- **Lizenz:** Im Repo nicht explizit genannt – vor Fork **LICENSE-Datei prüfen** (ggf. anfragen).
- **Beschreibung:** „Zero config vercel like preview deployments using docker“.
- **Features:** Web-UI, GitHub/GitLab-Webhooks, Docker-Builds, Templates (NextJS; Vite/React/Static laut README „in Arbeit“).
- **Sprache:** Go (Backend) + Bun (Frontend).

**Fork geeignet:** Nur wenn Lizenz geklärt ist (z. B. MIT/Apache oder explizite Erlaubnis).

---

## 3. **cispa/framing-control-proxy** – X-Frame-Options ↔ CSP frame-ancestors

- **Repo:** https://github.com/cispa/framing-control-proxy
- **Lizenz:** **AGPL-3.0** (stark copyleft – Weitergabe/Modifikation unter AGPL).
- **Beschreibung:** Server-Proxy, der X-Frame-Options in CSP `frame-ancestors` (und umgekehrt) übersetzt.
- **Einschränkung:** Python, nutzt **iptables** (Linux), kein „Clone/Build/Serve“, nur Header-Übersetzung.

**Fork geeignet:** Nur wenn ihr AGPL-Kompatibilität wollt; für reines „iframe erlauben“ reicht ggf. euer eigener kleiner Proxy (wie im aktuellen preview-runner).

---

## 4. **vercel/serve** – Statische Dateien ausgeben

- **Repo:** https://github.com/vercel/serve
- **Lizenz:** **MIT**
- **Beschreibung:** Statische Dateien/SPA aus einem Ordner (z. B. `dist`) servieren. Respektiert `process.env.PORT`.
- **Rolle:** Kein „Preview Builder“, aber **MIT** und gut geeignet als **Start-Befehl** in eurem Runner (z. B. `npx serve dist`).

**Fork:** Meist nicht nötig; als Dependency/`npx serve` nutzbar.

---

## 5. **nuotsu/github-iframe** – Live-Code in iframe

- **Repo:** https://github.com/nuotsu/github-iframe
- **Lizenz:** Im Repo nicht angegeben – vor Nutzung/Fork **LICENSE prüfen**.
- **Beschreibung:** Zeigt GitHub-Code live in einem iframe (Demo: github-iframe.vercel.app).
- **Hinweis:** Fokus auf „Code anzeigen“, nicht auf vollständigem „Clone → Build → App in iframe“.

**Fork geeignet:** Nur nach Klärung der Lizenz.

---

## Empfehlung für VisuDEV

1. **Ohne Kubernetes:**  
   Euren **eigenen preview-runner** (Clone → Build → Start mit Proxy + `frame-ancestors`) beibehalten und **stabilisieren**.
   - Port-Zuweisung und `--port` für Dev-Server (Vite etc.) sind bereits angepasst.
   - Nächster Schritt: **hrkoordinator** konkret prüfen (Build-Output, Start-Befehl, `visudev.config.json`), damit die App wirklich auf dem zugewiesenen Port läuft (kein ECONNREFUSED 127.0.0.1:4002).

2. **Zum Forken mit klarer Lizenz:**
   - **Uffizzi** (Apache 2.0), wenn ihr Kubernetes einsetzen wollt.
   - **fipso/runner** nur nach Klärung der Lizenz (und ggf. Vite-Template prüfen).

3. **Nur Header/iframe:**
   - Eigenen Mini-Proxy (wie bereits im preview-runner) mit `frame-ancestors *` weiterverwenden; **cispa/framing-control-proxy** nur bei AGPL-Ok.

4. **Statik ausliefern:**
   - **vercel/serve** (MIT) als Start-Befehl im Runner nutzen, wo passend (`npx serve dist`).

---

## Nächster Schritt im aktuellen Projekt

Ursache „Bad Gateway: ECONNREFUSED 127.0.0.1:4002“: Die gebaute/gestartete App hört nicht auf dem vom Proxy erwarteten Port.

Sinnvoll:

- Im **Runner-Log** prüfen: Wird die App gestartet? Welcher Befehl (z. B. `npx serve dist` oder `npm run dev -- --port 4002`)?
- Im **hrkoordinator-Repo** prüfen:
  - Gibt es `visudev.config.json` mit `startCommand`?
  - Liegt der Build-Output in `dist` (oder anderer Ordner)?
  - Nutzt der Start-Befehl `process.env.PORT` bzw. `--port` (z. B. bei Vite)?

Wenn du willst, können wir als Nächstes den **hrkoordinator-Workspace** (nach einem Preview-Start) und die **Runner-Logs** gezielt durchgehen und den Start-Befehl/Port anpassen.
