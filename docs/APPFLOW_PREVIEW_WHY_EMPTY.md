# Warum die App-Flow-Screens leer sind / nicht sichtbar

## Kurzfassung

**Hauptgrund:** Die **Preview-App** (gebautes Repo) läuft nicht auf dem erwarteten Port. VisuDEV zeigt dir eine **Proxy-URL** (z. B. `http://localhost:4007`). Intern leitet der Proxy auf einen **App-Port** weiter (z. B. 4008). Wenn auf diesem Port nichts hört → **ECONNREFUSED** → du siehst „Bad Gateway“ oder „Preview-App nicht erreichbar“ in den Karten.

**Maestro** ist ein E2E-Test-Tool (YAML-Flows gegen eine URL). Es **zeigt** keine Screens in VisuDEV an – es **testet** eine laufende App. Wenn die Preview nicht läuft, hilft Maestro nicht beim „Sehen“ der Screens; es kann nur prüfen, ob eine erreichbare URL funktioniert.

---

## Architektur (relevant für das Problem)

1. **Preview-Runner** (z. B. Port 4000) vergibt pro Preview ein **Port-Paar**: `[proxyPort, appPort]` (z. B. 4007, 4008).
2. **previewUrl** = `http://localhost:4007` (Proxy).
3. Jede **Screen-Karte** lädt im Iframe: `previewUrl + screen.path` (z. B. `http://localhost:4007/login`).
4. Der **Proxy** (4007) leitet jede Anfrage an die **App** (4008) weiter.
5. Wenn **auf 4008 nichts läuft** (Build fehlgeschlagen, Container beendet, App startet nicht), antwortet der Proxy mit **502** und z. B. „Preview-App nicht erreichbar“ / ECONNREFUSED.

Die Anzeige „Live App Flow (Preview) - http://localhost:4007“ bedeutet also: **Proxy 4007 ist da**, aber die **App auf 4008** ist es, die für den Inhalt verantwortlich ist. Siehst du ECONNREFUSED **127.0.0.1:4008**, dann schlägt genau diese Verbindung Proxy → App fehl.

---

## Typische Ursachen

| Ursache                                    | Was passiert                                                       | Was tun                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **App startet nicht / Build schlägt fehl** | Container oder Host-Prozess kommt nie auf appPort.                 | Runner-Logs prüfen (Terminal von `npm run dev`). Mit Docker: `docker ps` / `docker logs`. Build des Repos lokal prüfen (`npm run build`).       |
| **„Ready“ wurde zu früh gesetzt**          | Früher: Runner hat nach Timeout trotzdem „ready“ gesetzt.          | Ist behoben: „ready“ wird nur gesetzt, wenn die App auf appPort mit 2xx antwortet.                                                              |
| **App läuft, aber auf anderem Port**       | Repo ignoriert `PORT` (z. B. Vite/Dev-Server).                     | Runner nutzt fest zugewiesenen appPort; bei Docker wird im Container auf 3000 gebaut/served und von außen auf appPort gemappt.                  |
| **X-Frame-Options / CSP**                  | App blockiert Einbetten im Iframe.                                 | Proxy setzt bereits `frame-ancestors *` auf die Antwort. Wenn die **App** selbst restriktive Header sendet, werden sie vom Proxy überschrieben. |
| **Route existiert nicht (404)**            | Screen-Pfad (z. B. `/forgot-password`) existiert in der App nicht. | Pfad in der Sitemap/App-Flow-Daten prüfen; ggf. in der gebauten App die Routen prüfen.                                                          |

---

## Wie ähnliche Tools das lösen

- **Storybook**
  - Externe App: `--preview-url=http://localhost:1337/...` (eigener Server).
  - „Connection refused“ = Server nicht erreichbar → gleiches Prinzip: **Ziel muss laufen und erreichbar sein**.

- **Figma Dev Mode / Live Preview**
  - Oft **lokaler MCP-Server** (z. B. 127.0.0.1:3845), direkte Verbindung, kein Iframe zur „fremden“ App.
  - Preview = eigenes Fenster/Prozess, kein Cross-Origin-Iframe.

- **Vercel Preview / Design-to-Code**
  - Preview = **eigener Deployment** mit fester URL.
  - CSP/iframe: `frame-ancestors` konfigurierbar; bei Problemen: **Proxy**, der Header umschreibt (z. B. frame-ancestors lockern).

- **Allgemein**
  - Entweder: **Ziel-App muss laufen und erreichbar sein** (wie bei uns Proxy → App).
  - Oder: **Kein Iframe** (eigener Tab, Screenshot, oder lokaler Prozess).
  - Bei Iframe: **Proxy** oder Server-Header so setzen, dass Einbetten erlaubt ist (bei uns: Proxy setzt CSP).

---

## Was wir konkret geändert haben

1. **waitForAppReady**
   - **Vorher:** Nach Timeout wurde trotzdem „ready“ gesetzt, auch wenn die App nie antwortete.
   - **Jetzt:** Nur bei 2xx von der App → „ready“. Sonst **Reject** mit klarem Fehler (z. B. „Preview-App antwortet nicht auf Port X“).  
     → Du bekommst keinen „ready“-Status mehr, wenn die App auf appPort nicht läuft.

2. **Proxy bei ECONNREFUSED**
   - **Vorher:** Roh-Text „Bad Gateway: connect ECONNREFUSED 127.0.0.1:4008“.
   - **Jetzt:** HTML-Seite mit klarer Meldung („Preview-App nicht erreichbar“, Hinweis: Preview neu starten / Docker prüfen) und CSP für Iframe.

3. **Hinweise in der UI**
   - LOAD_ERROR-Text in LiveFlowCanvas erwähnt ECONNREFUSED und „Preview neu starten“ / Docker explizit.

---

## Was du tun solltest

1. **Preview neu starten** in VisuDEV („Preview beenden“, dann „Preview starten“).
2. **Runner-Log** im Terminal prüfen (wo `npm run dev` läuft): steht dort „Preview ready“ oder ein Build-/Container-Fehler?
3. **Docker:** Wenn du Docker nutzt – `docker ps` (Container läuft?), ggf. `docker logs <container>`.
4. **Ohne Docker:** Sicherstellen, dass das Repo mit `npm run build` und dem vom Runner genutzten Start-Befehl lokal durchläuft und auf dem zugewiesenen Port hört.

Erst wenn die **Preview-App auf dem App-Port (z. B. 4008) antwortet**, können die Screen-Iframes Inhalt anzeigen. Maestro kann danach diese **gleiche URL** (über den Proxy) für E2E-Tests nutzen.
