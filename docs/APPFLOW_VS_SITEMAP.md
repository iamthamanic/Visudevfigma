# App Flow vs. Sitemap (z. B. octopus.do)

## Kurzantwort

**VisuDEV baut die App-Previews sitemap-ähnlich**, aber nicht 1:1 wie octopus.do:

- **Struktur:** Eine **Hierarchie nach Navigation** (Tiefe aus Code: Root → navigatesTo → …), pro Screen ein **Knoten**, verbunden durch **Kanten** (Navigation + Flows).
- **Darstellung:** **Live-Iframes** pro Screen (echte App) im Live App Flow; in SitemapFlowView Screenshots/Platzhalter und optional deployed URL.
- **Quelle:** Die Struktur kommt aus **Code-Analyse** (Analyzer), nicht aus Crawl oder manueller Pflege.

Damit ist es **richtig als Sitemap im Sinne von „Seitenstruktur + Verbindungen“**, aber mit anderem Fokus als octopus.do (siehe unten).

---

## Was VisuDEV macht (App Flow)

1. **Screens**  
   Aus dem Repo erkannte Screens (Routen/Seiten) mit `path`, `name`, `navigatesTo`, `flows`.

2. **Layout (sitemap-ähnlich)**
   - **Tiefe (Depth):** BFS von Root-Screens (`/`, `/home`, `/login`, …) über `navigatesTo`.
   - **Position:** Pro Tiefe eine **Spalte**; innerhalb der Spalte alphabetisch nach Namen.  
     → Effekt: **Hierarchie von links nach rechts** (Level 0, 1, 2, …), wie bei einer Sitemap.

3. **Kanten**
   - **Navigation:** `navigatesTo` → Kante von Screen A zu Screen B.
   - **Flows:** Welcher Screen welchen Flow aufruft und welcher Screen „auf der anderen Seite“ liegt → Kante (z. B. API-Call).

4. **Inhalt pro Knoten**
   - **LiveFlowCanvas:** Pro Screen eine **Live-Preview** (iframe mit `previewUrl` + `screen.path`) oder Fehler-/Ladezustand.
   - **SitemapFlowView:** Karten mit Screenshot/Platzhalter, optional deployed URL; Detail-Ansicht pro Screen.

5. **Export**  
   JSON und Mermaid (Flowchart) – keine PNG/PDF-Sitemap wie bei octopus.do.

---

## Vergleich mit octopus.do

| Aspekt              | VisuDEV App Flow                        | octopus.do (typisch)              |
| ------------------- | --------------------------------------- | --------------------------------- |
| **Struktur-Quelle** | Code (Analyzer)                         | Crawl oder manuell                |
| **Layout**          | Tiefe-Spalten (automatisch)             | Frei/draggable, „Content Bricks“  |
| **Pro Seite**       | Live-iframe (echte App) oder Screenshot | Wireframes / Platzhalter / Bricks |
| **Kanten**          | Navigation + Flows (aus Code)           | Interne Links (manuell/crawl)     |
| **Hierarchie**      | Ja (Depth aus navigatesTo)              | Ja (manuell/baumartig)            |
| **Export**          | JSON, Mermaid                           | PNG, PDF, XML, CSV, sitemap.xml   |

**Fazit:**  
VisuDEV zeigt die **Seitenstruktur und Flows** sitemap-artig (Knoten + Kanten, hierarchisch nach Navigation) und nutzt dafür **echte App-Previews** (Live-Iframes). Es ist also **richtig als Sitemap im Sinne von Struktur + Verbindungen**, aber mit Code-Basis und Live-Preview statt manueller Wireframes wie bei octopus.do.

---

## Was „richtig wie octopus.do“ noch heißen könnte

Wenn du dich an octopus.do anlehnst, könntest du ergänzen:

1. **Sitemap-Export**  
   PNG/PDF der gesamten App-Flow-Ansicht (ein großes Bild/PDF der Sitemap).

2. **Freies Layout**  
   Screens per Drag & Drop anordnen (wie Bricks), Speicherung der Positionen (z. B. in Projekt-Meta).

3. **sitemap.xml**  
   Aus Screens + Pfaden eine `sitemap.xml` für SEO generieren (optional mit Priorities).

4. **Crawl-Modus**  
   Zusätzlich zur Code-Analyse: bestehende URL (z. B. deployed_url) crawlen und daraus Seiten + Links ableiten – würde sich octopus.do weiter annähern.

Wenn du sagst, welche dieser Richtungen du willst (z. B. nur Export PNG/PDF oder nur sitemap.xml), kann man die nächsten Schritte konkret ausarbeiten.
