# Analyse: Live Preview vs. Sitemap & Flow (eine Ansicht?) und warum Timeouts entstehen

**Nur Analyse, keine Code-Änderungen.** Ziel: verstehen, warum es zwei getrennte Ansichten gibt, wie es (z. B. Flowmapp) sein sollte, und warum die Logs „Timeout – onLoad wurde nicht ausgelöst“ zeigen.

---

## 1. Warum sind „Live Preview“ und „Sitemap & Flow“ getrennt?

### Aktuelle Architektur in VisuDEV

- **Ein Tab „Live Preview“**
  - Zeigt **LiveFlowCanvas**: ein Canvas mit **Knoten** (pro Screen eine Karte) und **Kanten** (SVG-Pfade zwischen Screens).
  - Jede Karte ist ein **Iframe** mit `previewUrl + screen.path` (z. B. `http://localhost:4007/login`).
  - **Inhalt** = echte gebaute App (Live-Preview), sofern die Preview-URL erreichbar ist und antwortet.
  - Zoom, Pan, Logs-Button, Fortschrittsbalken.
  - **Kein** Sitemap-Baum, **kein** separates „Flow-Graph“-Panel – nur Canvas + Iframes + Kanten.

- **Ein Tab „Sitemap & Flow“**
  - Zeigt **zwei Bereiche untereinander**:
    1. **SitemapFlowView** – Karten-Layout (ähnlich wie Flowmapp: Karten mit Namen, Verbindungslinien, optional Screenshots/Platzhalter, Suchfilter, Layer-Filter).
    2. **FlowGraphView** – kompakte Knoten/Kanten-Ansicht (nur Screen-Namen und Pfade, **keine** Live-Iframes).
  - **Inhalt** pro Karte = Screenshot von deployed_url, oder Platzhalter / Mini-Preview aus Code – **keine** Live-Iframes aus dem Preview-Runner.
  - Der Hinweistext sagt explizit: „Für echte Inhalte in den Karten: Tab ‚Live Preview‘ …“.

### Warum gibt es zwei Tabs?

- **Historisch/konzeptionell**:
  - **LiveFlowCanvas** wurde gebaut, um **echte App-Inhalte** (Iframes gegen Preview-URL) in einem **einzigen** Canvas mit Kanten anzuzeigen.
  - **SitemapFlowView** und **FlowGraphView** kommen aus einer anderen Wurzel: Sitemap-Übersicht, Filter, Detail-Ansicht, Screenshots von deployed_url – **ohne** zwingend den lokalen Preview-Runner einzubinden.
- **Technisch**:
  - LiveFlowCanvas braucht eine **previewUrl** (Runner oder deployed_url). Ohne diese URL zeigt die Seite „Keine Preview-URL“ und kein Canvas.
  - Sitemap & Flow funktionieren **ohne** previewUrl: sie nutzen Screens/Flows aus der Code-Analyse und optional deployed_url für Screenshots.
- **UI-Entscheidung**: Statt eine einzige große Ansicht zu bauen, die sowohl Sitemap-Struktur als auch Live-Iframes enthält, wurden zwei Tabs angeboten: einer „nur Live“, einer „Sitemap + Graph ohne Live“.

**Kurz:** Sie sind getrennt, weil zwei verschiedene Features (Live-Preview-Canvas vs. Sitemap/Graph mit Screenshots/Platzhaltern) in zwei Tabs ausgelagert wurden, statt in **einer** Ansicht kombiniert zu werden.

---

## 2. Wie soll es aussehen? (Referenz: dein Bild + Flowmapp)

### Dein Referenzbild (Flowmapp-ähnlich)

- **Eine** Ansicht: viele **Rechtecke** (Screens), verbunden durch **Pfeile**.
- **Inhalt pro Rechteck**: nicht nur Titel, sondern **innen** sichtbare UI-Elemente (z. B. „Sign Up“, „Log In“, „Home“, „Category“, „Cart“) – also Struktur **und** Inhalt in derselben Karte.
- Klar **eine** Sitemap/Flow-Ansicht mit **echten Inhalten** (oder zumindest aussagekräftigen Platzhaltern/Wireframes) in jedem Knoten.

### Flowmapp (z. B. [rapid sitemapping](https://www.flowmapp.com/features/rapid-sitemapping-with-templates))

- **Eine** Oberfläche: **Visual sitemap** mit **page editor** – Struktur und Seiteninhalte zusammen.
- Pro Seite: entweder **Live-URL** (Crawl) oder **Wireframe/Prototyp** – alles in **demselben** Diagramm.
- Kein separates „Live“-Tab und „Sitemap“-Tab; die Sitemap **ist** die Ansicht, in der jede Seite Inhalt (live oder Wireframe) hat.

### Was das für VisuDEV heißt

- **Gewünscht:** **Eine** Ansicht wie im Bild / wie Flowmapp:
  - Dieselbe **Struktur** (Knoten = Screens, Kanten = Navigation/Flows).
  - In **jedem** Knoten: **echte Inhalte** der Screens (Live-Preview aus der gebauten App), nicht „entweder Live **oder** Sitemap“.
- **Aktuell:**
  - **Live Preview** = genau diese Struktur + Iframes, aber **ohne** die Sitemap-Features (Suchfilter, Layer-Filter, evtl. anderes Layout).
  - **Sitemap & Flow** = Sitemap-Features + Graph, aber **ohne** Live-Iframes in den Karten (nur Screenshots/Platzhalter).
- **Lücke:** Es fehlt die **Vereinheitlichung**: eine einzige „App Flow / Sitemap“-Ansicht, in der dasselbe Diagramm **immer** die echten Screen-Inhalte (Live-Iframes) in den Karten zeigt – optional ergänzt um Suchfilter, Layer-Filter, Export usw., wie in SitemapFlowView.

---

## 3. Warum erscheinen in den Logs „Timeout – onLoad wurde nicht ausgelöst“?

### Ablauf beim Laden einer Screen-Karte

1. VisuDEV setzt **previewUrl** (z. B. `http://localhost:4007`).
2. Pro Screen wird ein **Iframe** mit `previewUrl + screen.path` geladen (z. B. `http://localhost:4007/login`).
3. Der **Preview-Runner** hört auf **Port 4007** (Proxy). Er leitet jede Anfrage an **Port 4008** (App) weiter.
4. **onLoad** im Iframe feuert nur, wenn der **gesamte** Request (von Browser → 4007 → 4008 und Antwort zurück) **abgeschlossen** ist und das Dokument geladen wurde.

### Was die Logs aussagen

- **„Schritt 2: Iframe für … eingebunden. URL: http://localhost:4007/…“** – alle 12 Iframes werden gestartet.
- **„Timeout nach 60 s (onLoad wurde nicht ausgelöst)“** – nach 60 Sekunden hat **kein** Iframe **onLoad** ausgelöst.
- Das heißt: Der Browser hat **innerhalb von 60 s** für **keinen** der 12 Requests an `localhost:4007/…` eine **abgeschlossene** Antwort bekommen, mit der das Iframe-Dokument als „geladen“ gilt.

### Mögliche Ursachen (der Reihe nach)

**A) App auf 4008 antwortet nicht (z. B. ECONNREFUSED)**

- Proxy (4007) baut Verbindung zu 4008 auf; 4008 nimmt keine Verbindung an (kein Prozess, Build fehlgeschlagen, Container down).
- **Ohne Timeout im Proxy**: Der Node-`http.request`-Aufruf im Proxy wartet theoretisch **unbegrenzt** auf Antwort von 4008. Es kommt nie eine Antwort, also sendet der Proxy **nie** eine Antwort an den Browser.
- **Folge**: Der Browser wartet auf die erste Byte-Response von 4007; die kommt nie → Iframe bleibt „loading“ → **onLoad** wird nie gefeuert → nach 60 s meldet VisuDEV „Timeout“.

**B) App auf 4008 antwortet extrem langsam**

- Wenn 4008 z. B. erst nach Minuten antwortet, ist das aus Sicht des Browsers dasselbe: Antwort kommt nicht innerhalb von 60 s → onLoad fehlt → Timeout.

**C) Proxy (4007) hat keinen Timeout für Upstream (4008)**

- Im aktuellen Code (preview-runner) wird beim Weiterleiten an die App **kein** `timeout` auf den Upstream-Request gesetzt.
- Wenn 4008 nie oder sehr spät antwortet, hängt der Proxy ewig und liefert dem Browser nie eine Antwort.
- **Ergebnis**: Genau das beobachtete Verhalten – alle 12 Iframes warten, keiner bekommt onLoad.

**D) X-Frame-Options / CSP (Embedding)**

- **Wenn** die Antwort von 4007 (bzw. 4008) irgendwann käme, aber der Browser das Iframe aus Sicherheitsgründen blockiert, würde man typischerweise **onLoad** trotzdem sehen (z. B. für eine Fehlerseite), oder einen **onError**.
- Dass **gar kein** onLoad kommt, spricht eher dafür, dass **keine vollständige HTTP-Antwort** beim Browser ankommt – also Backend/Proxy-Verhalten (A–C), nicht primär Embedding.

**E) Netzwerk / CORS / andere Blockierung**

- Denkbar, aber weniger naheliegend: Requests zu `localhost:4007` von der VisuDEV-App (z. B. localhost:5173) sind normalerweise möglich. CORS betrifft meist XHR/fetch, nicht das direkte Laden eines Iframe-`src`.

### Plausibelste Erklärung für deine Logs

- Die **Preview-App auf Port 4008** ist **nicht erreichbar** (nicht gestartet, abgestürzt, Build fehlgeschlagen, Docker-Container läuft nicht).
- Der **Proxy auf 4007** leitet weiter, wartet aber **ohne Timeout** auf 4008.
- Dadurch sendet der Proxy **nie** eine Antwort an den Browser.
- **Alle** 12 Iframes warten auf die erste vollständige Response von 4007 → **kein** onLoad innerhalb von 60 s → **alle** 12 Einträge „Timeout – onLoad wurde nicht ausgelöst“.

**Zusammengefasst:**  
Die Timeouts entstehen sehr wahrscheinlich, weil **entweder** die App auf 4008 nicht läuft **oder** der Proxy beim Warten auf 4008 keinen Timeout hat und deshalb nie eine (z. B. 502-)Antwort an den Browser zurückgibt. Beides zusammen führt dazu, dass kein Iframe jemals „loaded“ wird und unser 60-s-Timeout greift.

---

## 4. Übersicht: Was fehlt / was anders sein müsste

| Thema                 | Ist-Zustand                                                                                                             | Soll (Referenz Bild / Flowmapp)                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Anzahl Ansichten**  | Zwei Tabs: „Live Preview“ und „Sitemap & Flow“.                                                                         | **Eine** Ansicht: Sitemap/Flow mit echten Inhalten in jedem Knoten.                                                           |
| **Inhalt pro Knoten** | Live: Iframe. Sitemap: Screenshot/Platzhalter, **kein** Live-Iframe.                                                    | **Eine** Ansicht: dieselben Knoten, alle mit **echtem** Screen-Inhalt (Live-Preview).                                         |
| **Warum Timeouts**    | Proxy wartet ohne Timeout auf 4008; 4008 antwortet nicht → Browser bekommt keine Response → onLoad nie → 60-s-Timeouts. | – (Betriebs-/Implementierungsdetail).                                                                                         |
| **Proxy-Verhalten**   | Kein Upstream-Timeout → bei nicht erreichbarer App hängt die Antwort ewig.                                              | Proxy sollte z. B. nach 10–15 s 502 zurückgeben, damit Iframe onLoad/onError bekommt und Nutzer eine klare Fehlerseite sieht. |

---

## 5. Kurzfassung

- **Warum getrennt?**  
  Zwei getrennte Features (Live-Canvas vs. Sitemap/Graph mit Screenshots) wurden als zwei Tabs umgesetzt statt als **eine** kombinierte „Sitemap + Live-Inhalte“-Ansicht wie bei Flowmapp.

- **Wie soll es sein?**  
  **Eine** Ansicht wie im Referenzbild / Flowmapp: ein Diagramm (Knoten + Kanten), in dem **jede** Karte den **echten** Screen-Inhalt (Live-Preview) zeigt – keine Aufteilung in „nur Live“ und „nur Sitemap“.

- **Warum Timeouts?**  
  Sehr wahrscheinlich: App auf 4008 antwortet nicht; Proxy (4007) hat keinen Timeout beim Weiterleiten an 4008 und sendet deshalb nie eine Antwort an den Browser → alle Iframes bleiben im „loading“-Zustand → nach 60 s „onLoad wurde nicht ausgelöst“.  
  Optional: Wenn die App doch antwortet, aber sehr langsam, führt das ebenfalls zu Timeouts, solange keine Antwort innerhalb von 60 s ankommt.

Diese Analyse beschreibt **nur** Ursachen und Lücken; sie enthält bewusst **keine** Code-Änderungen.
