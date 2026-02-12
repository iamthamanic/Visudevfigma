# App Flow: Ist-Zustand, Zielbild und Lücken

Dieses Dokument hält fest, was das Tool **aktuell liefert**, warum es das beschriebene Ziel (**„Button→Screen“-Sitemap mit echten Screens**) nicht trifft, und was **„richtig gemacht“** bedeuten würde. Keine Bewertung, keine Priorisierung – nur klare Abgrenzung und Anforderungen.

---

## Was das Tool aktuell tatsächlich liefert (Referenz: REPO_INSPECTOR_REPORT.md)

- **Nodes/Screens:** Statische Extraktion aus dem User-Repo (Next App/Pages, React Router, Nuxt, Heuristik). Ergebnis: `screens[]` mit `path`, `filePath`, `navigatesTo`, `flows`.

- **„Live Screen“-Ansicht:** Kein gerendertes Thumbnail aus dem Build, sondern **ein Iframe pro Screen** auf `previewUrl` + `screen.path`. Der Preview-Runner baut/served die App; jede Route wird in einem eigenen Iframe geladen.

- **Thumbnails/Screenshots:** Werden **nicht** aus dem lokalen Preview gerendert, sondern optional über eine **externe Screenshot-API** gegen eine **deployed_url** erzeugt und in Supabase Storage abgelegt.

- **Edges:** Kommen fast vollständig aus **statischer Navigationsextraktion** (`<Link to>`, `<a href>`, `navigate("/x")`, `router.push("/x")` usw.). Ergebnis: `screen.navigatesTo[]`. Im UI daraus Kanten `type="navigate"`. Zusätzlich „call“-Kanten aus Flow-Calls.

**Fazit Ist-Zustand:** Das System ist heute eine **Route-/Code-Map + Live-Iframe-Preview**, keine **„Button→Screen“-Sitemap**.

---

## Warum es das beschriebene Ziel nicht trifft

### 1) Keine „Button → Zielscreen“-Kanten (nicht trigger-spezifisch)

- Es gibt `navigatesTo: string[]` als **Screen-level**-Vereinigung aller Zielrouten.
- Es fehlt **pro Kante:**
  - welches **konkrete Element** (Button/Tab/Link) der Auslöser war
  - **Label / Selector / TestId**
  - ob der Klick **wirklich** zur Zielseite führt

Ohne diesen Trigger-Bezug kann die Map nicht so aussehen wie: „Login-Button zeigt Pfeil auf Startseite“.

### 2) Keine Runtime-Verifikation

- Es gibt **keinen Crawl/Click** in einer laufenden App zur Kantenerzeugung:
  - keine Beobachtung von **URL-Wechsel / Router-Transitions** nach einem Klick
  - keine Behandlung von „Klick macht State-Change statt Route-Change“ (Tabs, Accordion, Modals)
  - keine Behandlung von **konditionaler Navigation** (API-Response, Auth, Feature Flags)

Statische Analyse bleibt hier zwangsläufig lückenhaft und erzeugt gleichzeitig falsche Kanten.

### 3) „Echte Screens als Sitemap-Nodes“ ist technisch zweigeteilt

- **In der Map:** Iframes = live, aber **schwer skalierbar** (viele Screens → viele Iframes).
- **Für Bilder/Thumbnails:** Nur über **deployed_url** + externen Screenshot-Dienst – also **nicht live** aus dem lokalen Codezustand.

Gewünscht: „Echte Inhalte live“ als Node-Visuals. Heute: Echte Inhalte sind live (Iframes), aber nicht als robuste **Thumbnail-Sitemap-Visualisierung**; die Thumbnail-Pipeline ist **nicht** an den lokalen Build gekoppelt.

### 4) Dynamische Routen sind im UI praktisch unauflösbar

- Extractor normalisiert Parameter (`:id`).
- Ohne **Runtime-Fixtures** (Beispielwerte) sind solche Screens weder zuverlässig rendern noch crawlbar.

---

## Was „richtig gemacht“ bedeutet (Zielbild)

### A) Nodes müssen aus dem laufenden Preview gerendert werden (nicht nur optional deployed_url)

**Minimaler Standard:**

- Preview-Runner baut/startet die App für **einen** Commit.
- Für **jede Route** wird ein **Screenshot aus dem lokalen Preview** erzeugt (Playwright im Runner ist die pragmatische Lösung).
- Node zeigt standardmäßig **Thumbnail**; optional „Open live“ als Iframe/Tab.

Damit ist die Sitemap visuell „echt“ und bleibt performant.

### B) Edges müssen runtime erzeugt oder runtime verifiziert werden

Mindestens eine der beiden Varianten (praktisch: **Hybrid**):

**Variante 1: Runtime-Crawl (empfohlen für das Zielbild)**

- Pro Screen-Route laden.
- Klickbare Elemente enumerieren: `a`, `button`, `[role=button]`, plus Tabs.
- Safe-Click-Regeln (z. B. destructive Aktionen blockieren).
- Nach Klick prüfen:
  - **URL/Route hat sich geändert** → Edge `(fromRoute, toRoute, triggerMeta)`.
  - **Nur DOM-State geändert** → ignorieren oder als „state-edge“ markieren (falls States als Nodes gewünscht).
- Rücksprung / Reset (z. B. `history.back` oder Reload).

Ergebnis: „Dieser Button erzeugt diese Kante.“

**Variante 2: Statisch + Element-Mapping**

- Nicht nur „Targets im File finden“, sondern dem **konkreten JSX-Element** zuordnen (AST: JSXOpeningElement, Props, SourceLocation).
- `edge.trigger = { text, aria-label, testid, file, line }`.
- Runtime nur noch als **Verifikation** für Unsicheres (TemplateLiteral, Identifier, Conditionals).

Ohne Element-Mapping bleibt es „Screen navigates somewhere“, nicht „dieser Button navigiert dorthin“.

### C) Einheitlicher Commit-/Run-Handshake zwischen Analyzer und Preview

**Heute:**

- Analyzer nutzt GitHub API Tree/Contents (Commit A).
- Preview-Runner kann lokal einen anderen Stand/Build haben (Commit B), wenn Refresh/Timing nicht exakt gleich sind.

**Erforderlich:**

- `analysis.commitSha` als **single source of truth**.
- Preview-Runner startet **exakt diesen SHA**.
- Screenshots/Edges referenzieren **exakt diesen SHA**.

Sonst: „Edges passen nicht zu dem Screen, den ich live sehe.“

### D) Parameter-/Auth-Fixtures sind kein Nice-to-have

Sobald runtime gecrawlt werden soll:

- **Dynamische Routen** brauchen Beispiel-Parameter.
- **Geschützte Routen** brauchen Login-Seeds oder Cookie-Injection.

Ohne Fixtures bricht „live site map“ bei echten Apps sofort auseinander.

---

## Der konkrete Gap im aktuellen Tool (Kern)

- Es gibt **keine Kanten, die an konkrete Buttons gebunden sind**.
- Kanten werden **nicht aus Interaktionen in der laufenden App** erzeugt.
- Die **Thumbnail-Pipeline** ist nicht „live aus dem Code“, sondern „optional aus deployed_url“.
- Das **Datenmodell** hat keinen Platz für **Trigger-Metadaten** (Selector, Label, SourceLocation, Confidence).

Das ist der Kern, warum es „nicht richtig funktioniert“, wenn das Ziel **„echte Screens + Button-Verbindungen“** ist.

---

## Umsetzungsplan (Tickets)

Reihenfolge nach Abhängigkeiten; jede Zeile = ein Ticket mit Kurztitel und Akzeptanz.

### Phase 1: Commit-Handshake (Grundlage für alles)

| ID     | Titel                                 | Akzeptanz                                                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C1** | Commit-SHA als Single Source of Truth | Analyzer liefert `commitSha` in Analyse-Ergebnis und speichert es am Projekt/Run. Preview-Runner akzeptiert optional `commitSha` (oder `branch`/Tag) und checked out **exakt** diesen SHA vor Build. Frontend/API können „Preview für diesen Analyse-Stand“ anfordern (Run = f(projectId, commitSha)). |

**Abhängigkeiten:** keine.  
**Betroffen:** Analyzer (bereits `commitSha` in Record), Preview-Runner (`/start` Body um `commitSha` erweitern, Clone/Pull auf diesen SHA), Frontend/Store (commitSha bei Start/Refresh mitschicken).

---

### Phase 2: Fixtures (für dynamische + geschützte Routen)

| ID     | Titel                               | Akzeptanz                                                                                                                                                                                                                                                      |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | Fixtures für dynamische Routen      | Konfiguration (z. B. im Projekt oder `visudev.config.json`): Map Route-Pattern → Beispiel-Parameter (z. B. `/product/:id` → `{ id: "123" }`). Preview-Runner und Crawler nutzen diese Werte, um konkrete URLs zu erzeugen und Screenshots/Crawl durchzuführen. |
| **D2** | Fixtures für Auth/geschützte Routen | Optionale Konfiguration: Login-Seeds (User/Pass) oder Cookie-Injection (Session-Cookie), damit geschützte Routen im Preview/Crawl erreichbar sind. Runner/Crawler injiziert vor Request/Click.                                                                 |

**Abhängigkeiten:** keine (parallel zu C1 möglich). Für A und B sinnvoll, bevor viele Routen unterstützt werden.

---

### Phase 3: Thumbnails aus lokalem Preview (A)

| ID     | Titel                                                  | Akzeptanz                                                                                                                                                                                                                                                                                                                                                                |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A1** | Screenshots aus lokalem Preview (Playwright im Runner) | Preview-Runner (oder separater Service, der denselben Commit/URL nutzt) hat Playwright. Nach Build/Start: für jede Route (aus Analyse oder Fixture-URLs) wird die Seite geladen und ein Screenshot erzeugt. Bilder werden in Storage abgelegt und mit `commitSha`/Run referenziert. Node in der UI zeigt **standardmäßig Thumbnail**, optional „Open live“ (Iframe/Tab). |

**Abhängigkeiten:** C1 (Run = f(commitSha)), idealerweise D1 (für dynamische Routen).  
**Betroffen:** Preview-Runner (Playwright, Screenshot-Job), Speicherung/URL-Rückgabe, Frontend (Node = Thumbnail, optional Live).

---

### Phase 4: Edges mit Trigger-Metadaten (B)

**Datenmodell zuerst:** Kanten haben nicht nur `fromId`, `toId`, `type`, sondern optional `trigger?: { label?, selector?, testId?, file?, line?, confidence? }`. UI kann „dieser Button → dieser Screen“ anzeigen.

| ID     | Titel                                                   | Akzeptanz                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **B2** | Statisches Element-Mapping (Trigger pro Kante)          | Pro Navigation-Target aus AST: zugehöriges JSX-Element (Link/Button) mit SourceLocation und sichtbaren Props (text, aria-label, data-testid) extrahieren. Edge-Schema erweitern: `edge.trigger = { text, ariaLabel, testId, file, line }`. Bestehende Kanten aus `navigatesTo` werden schrittweise mit Trigger angereichert; neue Kanten werden nur noch mit Trigger erzeugt.                                                                                                                                            |
| **B1** | Runtime-Crawl (Kanten aus Klicks verifizieren/erzeugen) | Pro Screen-Route (mit Fixtures): Seite im Preview laden, klickbare Elemente enumerieren (`a`, `button`, `[role=button]`, Tabs). Safe-Click-Regeln (kein Submit auf „Delete“, etc.). Nach Klick: URL/Route-Change prüfen → bei Wechsel Edge `(fromRoute, toRoute, triggerMeta)` speichern/verifizieren. Nur DOM-State-Change → ignorieren oder als „state-edge“ markieren. Rücksprung (history.back/reload) für nächsten Test. Ergebnis: Kanten sind an konkrete Buttons/Links gebunden und optional runtime-verifiziert. |

**Abhängigkeiten:** B2 unabhängig von B1 (nur Datenmodell + AST). B1 braucht laufenden Preview (A1), Fixtures (D1/D2), und ein Kanten-Schema mit Trigger (B2).  
**Betroffen:** Analyzer (AST-Element-Mapping, Edge-Schema), Preview-Runner oder Crawler-Service (Playwright-Click-Logik), Store/API (Kanten mit `trigger` speichern/laden), UI (Kante mit „von Button X nach Screen Y“ anzeigen).

---

### Übersicht Reihenfolge

```
C1 (Commit-Handshake)
  ↓
D1, D2 (Fixtures)  ← parallel
  ↓
A1 (Thumbnails aus lokalem Preview)
  ↓
B2 (Trigger im Datenmodell + statisches Element-Mapping)
  ↓
B1 (Runtime-Crawl)
```

**Minimaler erster Meilenstein („Button→Screen“ sichtbar):** C1 + B2. Dann siehst du pro Kante ein konkretes Element (Label/Datei/Zeile), auch ohne Runtime-Crawl. **Vollständiges Zielbild:** C1 + D1/D2 + A1 + B2 + B1.

---

_Referenz: REPO_INSPECTOR_REPORT.md (Pipeline und Schemas)._
