# VisuDEV - UI/UX Implementation Tickets

**Version**: 1.0  
**Ziel**: 1:1 Nachbau der VisuDEV UI/UX für professionelle Flow-Visualisierung  
**Stand**: Januar 2025

---

## 🎨 Foundation & Design System

### Ticket #001: Design System & Styleguide Implementation

**Kontext:**  
VisuDEV benötigt ein konsistentes Design System basierend auf dem minimalistischen, developer-freundlichen Styleguide mit türkis/grünem Farbschema (#03ffa3).

**Problem:**  
Ohne einheitliches Design System werden Komponenten inkonsistent gestaltet, was zu schlechter UX und Maintenance-Problemen führt.

**Lösung:**  
- Implementierung aller Farbtokens aus dem Styleguide in `/styles/globals.css`
- Definition von wiederverwendbaren Tailwind-Klassen für Buttons, Cards, Inputs
- Einrichtung von Typography-System mit Inter und JetBrains Mono
- 4px-Grid-basiertes Spacing System

**User Journey:**  
1. Designer öffnet Styleguide (`/STYLEGUIDE.md`)
2. Entwickler implementiert Design-Tokens in CSS
3. Alle Komponenten nutzen konsistente Styles
4. User erlebt durchgängig cleanes, professionelles Design

**Akzeptanzkriterien:**  
- [ ] Alle Farben aus Styleguide in CSS definiert
- [ ] Primary Color #03ffa3 korrekt verwendet
- [ ] Hover/Active States implementiert (#02e591, #02cc80)
- [ ] Typography mit Inter und JetBrains Mono funktioniert
- [ ] 4px-Grid Spacing funktioniert (xs:4px bis 3xl:64px)
- [ ] Dark Theme mit #000000 Background aktiv
- [ ] Alle Layer-Farben für Flow-Knoten definiert

---

### Ticket #002: Responsive Layout & Grid System

**Kontext:**  
VisuDEV ist primär für Desktop (1440px+) optimiert, sollte aber auf verschiedenen Bildschirmgrößen nutzbar sein.

**Problem:**  
Ohne responsives Layout ist die Anwendung auf kleineren Screens oder größeren Monitoren nicht optimal nutzbar.

**Lösung:**  
- Implementierung eines 12-Column Grid Systems
- Breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (1024-1440px), Large Desktop (>1440px)
- Max-Width von 1600px für Hauptinhalt
- Flexible Sidebar (240px fixed)

**User Journey:**  
1. User öffnet VisuDEV auf verschiedenen Geräten
2. Layout passt sich automatisch an Bildschirmgröße an
3. Alle Inhalte bleiben lesbar und zugänglich
4. Optimale Nutzung auf Desktop-Monitoren

**Akzeptanzkriterien:**  
- [ ] Layout funktioniert auf allen definierten Breakpoints
- [ ] Sidebar bleibt auf Desktop fixed (240px)
- [ ] Main Content Area hat korrekten Margin Left (240px)
- [ ] Max-Width von 1600px für Content implementiert
- [ ] Gutter von 24px zwischen Grid-Columns
- [ ] Content zentriert auf großen Screens (>1600px)

---

## 🧭 Navigation & Sidebar

### Ticket #003: Sidebar Navigation - Struktur & Layout

**Kontext:**  
Die Sidebar ist die Hauptnavigation von VisuDEV und muss alle Screens zugänglich machen.

**Problem:**  
User müssen schnell zwischen verschiedenen Views (Projekte, App/Flow, Blueprint, Data, Logs, Settings) navigieren können.

**Lösung:**  
- Fixed Sidebar links mit 240px Breite
- Header mit Logo und "VisuDEV - Visualize Code" Branding
- Navigation Items für alle Screens
- Active State Highlighting mit türkiser Farbe
- Footer mit "Neues Projekt" Button

**User Journey:**  
1. User öffnet VisuDEV
2. Sieht Logo und Branding im Sidebar Header
3. Klickt auf Navigation Item (z.B. "App/Flow")
4. Navigation Item wird türkis hervorgehoben
5. Entsprechender Screen wird geladen
6. User kann jederzeit neues Projekt über Footer-Button erstellen

**Akzeptanzkriterien:**  
- [ ] Sidebar fixed left mit 240px Breite
- [ ] Background #000000, Border Right #222222
- [ ] VisuDEV Logo korrekt angezeigt (40x40px, rund)
- [ ] "VisuDEV" Titel und "Visualize Code" Tagline sichtbar
- [ ] 6 Navigation Items: Projekte, App/Flow, Blueprint, Data, Logs, Settings
- [ ] Active State mit türkiser Farbe (#03ffa3)
- [ ] Disabled State für projekt-abhängige Items (opacity 50%)
- [ ] "Neues Projekt" Button im Footer mit Hover-Effect
- [ ] Smooth Transitions (0.2s ease)

---

### Ticket #004: Sidebar - Active Project Display

**Kontext:**  
User müssen immer sehen, welches Projekt aktuell aktiv ist.

**Problem:**  
Bei mehreren Projekten verliert man schnell den Überblick über das aktuelle Arbeitsprojekt.

**Lösung:**  
- Einblendung des aktiven Projektnamens zwischen "Projekte" und "App/Flow"
- Türkise Farbe (#03ffa3) für Hervorhebung
- Truncate bei langen Projektnamen (max-w-180px)
- Nur sichtbar wenn Projekt aktiv

**User Journey:**  
1. User erstellt oder wählt Projekt aus
2. Projektname erscheint in Sidebar
3. User sieht immer, welches Projekt aktiv ist
4. Bei langem Namen wird Text mit "..." gekürzt
5. Projekt bleibt während Navigation sichtbar

**Akzeptanzkriterien:**  
- [ ] Projektname zwischen "Projekte" und "App/Flow" angezeigt
- [ ] Textfarbe #03ffa3 (türkis)
- [ ] Max-Width 180px mit Truncate
- [ ] Nur sichtbar wenn activeProject gesetzt
- [ ] 48px Höhe konsistent mit anderen Items
- [ ] 16px Padding Left

---

### Ticket #005: Sidebar - Scan Progress Indicators

**Kontext:**  
Bei laufenden Scans (App/Flow, Blueprint, Data) muss User Fortschritt sehen.

**Problem:**  
Lange Scan-Vorgänge ohne Feedback führen zu Unsicherheit und schlechter UX.

**Lösung:**  
- Spinner-Icon rechts neben Navigation Item
- Prozentanzeige neben Spinner
- Türkise Farbe (#03ffa3) für Spinner und Text
- Auto-Hide wenn Scan beendet

**User Journey:**  
1. User startet Scan (z.B. "App/Flow Scan")
2. Spinner und "0%" erscheinen rechts im Nav Item
3. Prozent-Zahl updated kontinuierlich (z.B. "45%")
4. Nach Completion verschwinden Spinner und Prozent
5. User kann andere Screens nutzen während Scan läuft

**Akzeptanzkriterien:**  
- [ ] Loader2 Icon von lucide-react verwendet
- [ ] Spinner animiert sich (animate-spin)
- [ ] Farbe #03ffa3 für Icon und Prozent-Text
- [ ] Position: ml-auto mr-4
- [ ] Text Size: 12px
- [ ] Nur angezeigt bei scanStatus === 'running'
- [ ] Icon 16x16px (w-4 h-4)

---

## 📁 Projects Screen

### Ticket #006: Projects Screen - Header & Title

**Kontext:**  
Der Projects Screen ist der Einstiegspunkt für alle Projekte und muss übersichtlich sein.

**Problem:**  
User brauchen klare Überschrift und Kontext, was auf diesem Screen passiert.

**Lösung:**  
- Großer Title "Projekte" (32px, Bold)
- Subtitle "Verbundene GitHub Repositories" (14px, #a0a0a0)
- Background #0a0a0a mit 32px Padding
- Clean, minimalistisch ohne Ablenkung

**User Journey:**  
1. User navigiert zu "Projekte"
2. Sieht sofort "Projekte" als Hauptüberschrift
3. Versteht durch Subtitle, dass GitHub Repos angezeigt werden
4. Screen lädt Projektliste

**Akzeptanzkriterien:**  
- [ ] Title "Projekte" mit 32px Font Size, Bold
- [ ] Subtitle "Verbundene GitHub Repositories" mit 14px, Farbe #a0a0a0
- [ ] Background #0a0a0a
- [ ] Padding 32px Top, 48px Left/Right
- [ ] Title: Font Inter Regular
- [ ] Margin Bottom 8px zwischen Title und Subtitle

---

### Ticket #007: Projects Screen - GitHub Connection Card

**Kontext:**  
User müssen GitHub Account verbinden, um Repositories zu scannen.

**Problem:**  
Ohne GitHub-Verbindung kann VisuDEV keine Repos analysieren - User muss zur Connection geleitet werden.

**Lösung:**  
- Card mit GitHub Icon und Text "GitHub verbinden"
- Grüner "Verbinden" Button
- Info-Text über OAuth-Flow
- Card nur sichtbar wenn nicht verbunden

**User Journey:**  
1. User öffnet Projects Screen (noch nicht verbunden)
2. Sieht GitHub Connection Card
3. Klickt auf "Verbinden" Button
4. OAuth-Flow startet
5. Nach erfolgreicher Verbindung verschwindet Card
6. Repository-Liste wird angezeigt

**Akzeptanzkriterien:**  
- [ ] Card Background #111111, Border #222222
- [ ] Border Radius 8px, Padding 24px
- [ ] GitHub Icon (24x24px) von lucide-react
- [ ] "GitHub verbinden" als Headline (18px, Bold)
- [ ] Info-Text über OAuth-Scopes (14px, #a0a0a0)
- [ ] "Verbinden" Button: Primary Style, Background #03ffa3
- [ ] Button Hover: #02e591
- [ ] Card nur bei !isGitHubConnected

---

### Ticket #008: Projects Screen - Repository Grid

**Kontext:**  
User müssen alle verfügbaren GitHub Repositories in übersichtlicher Grid-Ansicht sehen.

**Problem:**  
Viele Repositories unstrukturiert aufgelistet führt zu Unübersichtlichkeit.

**Lösung:**  
- Grid Layout mit 3 Columns auf Desktop
- Responsive auf 2 Columns (Tablet) und 1 Column (Mobile)
- Gap von 24px zwischen Cards
- Jede Card zeigt Repo-Name, Owner, Stats

**User Journey:**  
1. User hat GitHub verbunden
2. Sieht Grid mit allen verfügbaren Repositories
3. Kann schnell Repo finden durch visuelle Struktur
4. Klickt auf Repo-Card zum Öffnen
5. Card zeigt Hover-Effect für Feedback

**Akzeptanzkriterien:**  
- [ ] Grid mit 3 Columns (Desktop 1024px+)
- [ ] 2 Columns auf Tablet (640-1024px)
- [ ] 1 Column auf Mobile (<640px)
- [ ] Gap 24px zwischen Cards
- [ ] Smooth Transitions für Grid-Changes
- [ ] Cards haben gleiche Höhe
- [ ] Auto-Fill für dynamische Anzahl

---

### Ticket #009: Projects Screen - Repository Card

**Kontext:**  
Jede Repository-Card muss wichtige Infos auf einen Blick zeigen.

**Problem:**  
User muss schnell Repo-Details erfassen können ohne klicken zu müssen.

**Lösung:**  
- Card mit Repo-Name als Headline
- Owner/Organization unter Name
- Stats: Stars, Forks, Last Update
- Primary Language Badge
- Hover-Effect: Border color change + translateY
- Click-Action: Projekt auswählen und zu App/Flow navigieren

**User Journey:**  
1. User sieht Repository-Card in Grid
2. Liest Repo-Name (z.B. "visudev-main")
3. Sieht Owner (z.B. "johndoe")
4. Checkt Stats (Stars: 42, Forks: 7)
5. Sieht Primary Language (z.B. "TypeScript")
6. Hovert über Card → Border wird türkis
7. Klickt → Projekt wird aktiviert → Navigation zu App/Flow

**Akzeptanzkriterien:**  
- [ ] Card Background #111111, Border #222222
- [ ] Border Radius 8px, Padding 24px
- [ ] Hover: Border #03ffa3, translateY(-2px)
- [ ] Transition 0.2s ease
- [ ] Repo-Name: 18px, Bold, White
- [ ] Owner: 14px, #a0a0a0
- [ ] Stats Row mit Icons (Star, GitFork, Clock)
- [ ] Language Badge: Background rgba(3,255,163,0.1), Text #03ffa3
- [ ] Cursor pointer
- [ ] Click aktiviert Projekt und navigiert zu App/Flow

---

### Ticket #010: Projects Screen - Empty State

**Kontext:**  
Wenn User GitHub verbunden hat, aber keine Repos verfügbar sind.

**Problem:**  
Leerer Screen ohne Feedback ist verwirrend und frustrierend.

**Lösung:**  
- Zentrierte Message "Keine Repositories gefunden"
- Icon (FolderX) zur Visualisierung
- Hilfetext mit nächsten Schritten
- Link zu GitHub zum Repo erstellen

**User Journey:**  
1. User verbindet GitHub Account
2. API liefert leere Liste
3. Sieht zentrierten Empty State mit Icon
4. Liest Hilfetext
5. Klickt auf GitHub-Link
6. Erstellt neues Repo
7. Refreshed VisuDEV → Repo erscheint

**Akzeptanzkriterien:**  
- [ ] FolderX Icon (48x48px) von lucide-react
- [ ] Farbe #666666
- [ ] "Keine Repositories gefunden" (20px, Bold)
- [ ] Hilfetext (14px, #a0a0a0)
- [ ] Link zu GitHub mit türkiser Farbe
- [ ] Zentriert: flex justify-center items-center
- [ ] Mindesthöhe 400px
- [ ] Nur bei isGitHubConnected && repositories.length === 0

---

### Ticket #011: Projects Screen - Loading State

**Kontext:**  
Während GitHub Repositories geladen werden, braucht User Feedback.

**Problem:**  
Ohne Loading-Indikator weiß User nicht, ob App arbeitet oder frozen ist.

**Lösung:**  
- Spinner mit türkiser Farbe (#03ffa3)
- "Lade Repositories..." Text
- Zentriert im Content-Bereich
- Smooth Animation

**User Journey:**  
1. User klickt "Verbinden" oder refreshed Projects Screen
2. API-Call startet
3. Sofort erscheint Spinner + Text
4. User sieht, dass geladen wird
5. Nach 1-3 Sekunden erscheinen Repositories

**Akzeptanzkriterien:**  
- [ ] Loader2 Icon von lucide-react
- [ ] Icon Size 32x32px
- [ ] Farbe #03ffa3
- [ ] animate-spin aktiv
- [ ] "Lade Repositories..." Text (16px, #a0a0a0)
- [ ] Zentriert: flex justify-center items-center
- [ ] Mindesthöhe 400px
- [ ] Nur bei isLoading === true

---

## 🌊 App/Flow Screen

### Ticket #012: App/Flow Screen - Header & Actions

**Kontext:**  
Der App/Flow Screen zeigt alle UI-Flows eines Projekts und bietet Scan-Funktionalität.

**Problem:**  
User muss Flow-Liste sehen und neue Scans triggern können.

**Lösung:**  
- Header mit "App/Flow" Title (32px)
- Subtitle mit Flow-Count (z.B. "434 Flows analysiert")
- "Scan starten" Button rechts oben
- Stats: Screens, Components, Events

**User Journey:**  
1. User navigiert zu App/Flow (Projekt muss aktiv sein)
2. Sieht Header mit Flow-Count
3. Checkt Stats (z.B. "45 Screens, 234 Components")
4. Klickt "Scan starten" für neue Analyse
5. Scan-Progress wird in Sidebar angezeigt
6. Flow-Liste updated automatisch

**Akzeptanzkriterien:**  
- [ ] Title "App/Flow" (32px, Bold)
- [ ] Subtitle mit Flow-Count (14px, #a0a0a0)
- [ ] "Scan starten" Button Primary Style (#03ffa3)
- [ ] Button Position: absolute right top
- [ ] Stats Row mit Icons (Monitor, Component, Zap)
- [ ] Stats-Cards: Background #111111, Border #222222
- [ ] Gap 16px zwischen Stats-Cards
- [ ] Responsive: Stats stapeln auf Mobile

---

### Ticket #013: App/Flow Screen - Flow List Table

**Kontext:**  
User muss alle analysierten Flows in übersichtlicher Tabelle sehen.

**Problem:**  
434 Flows ohne Struktur sind nicht navigierbar oder durchsuchbar.

**Lösung:**  
- Tabelle mit Columns: Screen, Flow Name, Layers, Actions, Screenshot
- Hover-Effect auf Rows
- Click öffnet Flow-Detail-View
- Alternating Row Colors für bessere Lesbarkeit

**User Journey:**  
1. User sieht Flow-Tabelle
2. Scrollt durch Liste
3. Liest Flow-Details (Screen, Name, Layer-Count)
4. Hovert über Row → Background ändert sich
5. Klickt auf Row → Flow-Detail-View öffnet sich
6. Kann zurück zur Liste navigieren

**Akzeptanzkriterien:**  
- [ ] Table Header: Background #111111, Border #222222
- [ ] Header Text: 12px, Bold, #a0a0a0, Uppercase
- [ ] Row Height: 64px
- [ ] Row Hover: Background #1a1a1a
- [ ] Row Click: Navigation zu Flow-Detail
- [ ] Columns: Screen (20%), Flow (30%), Layers (15%), Actions (15%), Screenshot (20%)
- [ ] Border Bottom #222222 zwischen Rows
- [ ] Smooth Transitions (0.2s ease)

---

### Ticket #014: App/Flow Screen - Flow Table Row Content

**Kontext:**  
Jede Flow-Row muss aussagekräftige Informationen darstellen.

**Problem:**  
User muss Flow schnell identifizieren und verstehen können.

**Lösung:**  
- Screen Name mit Icon
- Flow Name in White (#ffffff)
- Layer Count mit farbigen Badges
- Action Count als Zahl
- Screenshot Thumbnail (100x60px)

**User Journey:**  
1. User sieht Row in Tabelle
2. Identifiziert Screen (z.B. "LoginScreen")
3. Liest Flow-Name (z.B. "User Login Flow")
4. Checkt Layer-Count mit Color Codes (UI: 3, API: 2, DB: 1)
5. Sieht Action-Count (z.B. "7 Actions")
6. Thumbnail zeigt Screenshot-Preview
7. Klickt für Details

**Akzeptanzkriterien:**  
- [ ] Screen Name: 14px, Medium, White
- [ ] Screen Icon (Monitor) türkis (#03ffa3)
- [ ] Flow Name: 14px, Regular, White
- [ ] Layer Badges farbkodiert (UI: #03ffa3, API: #ff9500, DB: #af52de)
- [ ] Badge: Border Radius 12px, Padding 4px 8px
- [ ] Action Count: 14px, #a0a0a0
- [ ] Screenshot: 100x60px, Border Radius 4px, Object-fit cover
- [ ] Screenshot Placeholder wenn nicht verfügbar: Background #222222

---

### Ticket #015: App/Flow Screen - Flow Detail View (Modal)

**Kontext:**  
User klickt auf Flow-Row und braucht detaillierte Visualisierung.

**Problem:**  
Flow-Details in Tabelle zu zeigen ist zu komplex - Modal notwendig.

**Lösung:**  
- Full-Screen Modal (Overlay #000000 80% opacity)
- Content Card zentriert (Max-Width 1200px)
- Header mit Flow-Name und Close-Button
- Screenshot oben (Full-Width)
- Flow-Graph mit Layer-Knoten
- Layer-Details expandierbar

**User Journey:**  
1. User klickt Flow-Row
2. Modal faded in (0.3s)
3. Sieht Flow-Name im Header
4. Screenshot zeigt UI-Context
5. Flow-Graph visualisiert Layers
6. Kann Layer-Knoten anklicken für Details
7. Schließt Modal mit X oder ESC

**Akzeptanzkriterien:**  
- [ ] Overlay Background rgba(0,0,0,0.8)
- [ ] Modal zentriert: flex justify-center items-center
- [ ] Content Max-Width 1200px, Max-Height 90vh
- [ ] Background #111111, Border #222222
- [ ] Header: Padding 24px, Border-Bottom #222222
- [ ] Close Button (X Icon) rechts oben, Hover #03ffa3
- [ ] Screenshot: Full-Width, Max-Height 400px, Object-fit contain
- [ ] Flow-Graph darunter mit vertical spacing
- [ ] ESC-Key schließt Modal

---

### Ticket #016: App/Flow Screen - Flow Graph Visualization

**Kontext:**  
Flow-Graph muss Layer-Knoten visuell darstellen mit Connections.

**Problem:**  
Komplexe Flows mit vielen Layers sind schwer zu verstehen ohne visuelle Darstellung.

**Lösung:**  
- SVG-basierter Graph mit React-Flow oder Custom SVG
- Layer-Knoten farbkodiert (UI: türkis, Code: cyan, API: orange, DB: lila, RLS: rot)
- Vertikale Anordnung (Top-Down: UI → Code → API → DB → RLS)
- Connections als Linien mit Arrows
- Hover-Effect auf Knoten
- Click öffnet Layer-Details

**User Journey:**  
1. User öffnet Flow-Detail-Modal
2. Sieht Flow-Graph unter Screenshot
3. Identifiziert Layers durch Farben
4. Versteht Flow-Richtung durch Connections
5. Hovert über Knoten → Highlight + Tooltip
6. Klickt Knoten → Layer-Details expandieren
7. Kann zwischen Layers navigieren

**Akzeptanzkriterien:**  
- [ ] Layer-Knoten: Min-Width 160px, Min-Height 80px
- [ ] Border Radius 8px, Border 2px solid [Layer-Color]
- [ ] Background rgba([Layer-Color], 0.05)
- [ ] Box-Shadow 0 4px 12px rgba([Layer-Color], 0.15)
- [ ] Hover: scale(1.05), Box-Shadow 0 6px 20px rgba([Layer-Color], 0.25)
- [ ] Connection Lines: Stroke #333333, Width 2px
- [ ] Active Path: Stroke #03ffa3, Width 3px
- [ ] Node Label: 12px Bold White
- [ ] Node Description: 11px #a0a0a0
- [ ] Transitions 0.2s ease

---

### Ticket #017: App/Flow Screen - Search & Filter

**Kontext:**  
Bei 434 Flows muss User schnell filtern können.

**Problem:**  
Ohne Search/Filter ist gesuchter Flow schwer zu finden.

**Lösung:**  
- Search Input über Tabelle
- Real-time Filtering beim Tippen
- Filter-Buttons für Layer-Types (UI, API, DB)
- Filter-Count Badge
- Clear-Button

**User Journey:**  
1. User sieht 434 Flows in Tabelle
2. Tippt "login" in Search-Input
3. Tabelle filtert sofort auf Login-Flows (z.B. 12 Ergebnisse)
4. Klickt "API" Filter-Button
5. Nur Flows mit API-Layer werden angezeigt (z.B. 5 Ergebnisse)
6. Klickt Clear-Button
7. Alle Flows wieder sichtbar

**Akzeptanzkriterien:**  
- [ ] Search Input: Width 100%, Max-Width 400px
- [ ] Background #0a0a0a, Border #222222
- [ ] Padding 10px 16px, Border Radius 6px
- [ ] Placeholder: "Flows durchsuchen..." (#666666)
- [ ] Focus: Border #03ffa3, Box-Shadow rgba(3,255,163,0.1)
- [ ] Search Icon (Search) links im Input
- [ ] Filter-Buttons: Background transparent, Border #03ffa3
- [ ] Active Filter: Background #03ffa3, Color #000000
- [ ] Clear-Button (X Icon) rechts, nur wenn gefiltert
- [ ] Real-time Update (no delay)

---

### Ticket #018: App/Flow Screen - Empty State (No Flows)

**Kontext:**  
Neues Projekt hat noch keine Flows analysiert.

**Problem:**  
Leerer Flow-Screen ohne Anleitung ist verwirrend.

**Lösung:**  
- Zentrierte Message "Noch keine Flows analysiert"
- Icon (Workflow)
- "Scan starten" Call-to-Action Button
- Info-Text über Scan-Process

**User Journey:**  
1. User wählt neues Projekt
2. Navigiert zu App/Flow
3. Sieht Empty State
4. Liest Info-Text
5. Klickt "Scan starten"
6. Scan läuft → Progress in Sidebar
7. Nach Completion erscheinen Flows

**Akzeptanzkriterien:**  
- [ ] Workflow Icon (48x48px) #666666
- [ ] "Noch keine Flows analysiert" (20px Bold)
- [ ] Info-Text (14px #a0a0a0)
- [ ] "Scan starten" Button Primary Style
- [ ] Zentriert: flex justify-center items-center
- [ ] Min-Height 500px
- [ ] Nur bei flows.length === 0 && !isScanning

---

## 📐 Blueprint Screen

### Ticket #019: Blueprint Screen - Architecture Overview

**Kontext:**  
Blueprint zeigt Projekt-Architektur auf Komponenten-Ebene.

**Problem:**  
User muss Projekt-Struktur verstehen ohne Code zu lesen.

**Lösung:**  
- Tree-View der Ordnerstruktur
- Component-Count pro Ordner
- Dependency-Graph
- Architecture-Metrics (Complexity, Coupling)

**User Journey:**  
1. User navigiert zu Blueprint
2. Sieht Folder-Tree links
3. Klickt Ordner zum Expandieren
4. Sieht Components im Ordner
5. Klickt Component → Dependency-Graph rechts
6. Versteht Component-Dependencies
7. Checkt Metrics für Code-Quality

**Akzeptanzkriterien:**  
- [ ] 2-Column Layout: Tree (30%) + Graph (70%)
- [ ] Tree: Expandierbare Folder mit Chevron Icons
- [ ] Component Count Badge an jedem Ordner
- [ ] Dependency Graph als Interactive SVG
- [ ] Metrics Cards: Complexity, Coupling, Depth
- [ ] Background #0a0a0a
- [ ] Tree Item Hover: Background #1a1a1a

---

### Ticket #020: Blueprint Screen - Component Detail Panel

**Kontext:**  
User klickt Component im Tree und braucht Details.

**Problem:**  
Component-Infos (Props, Dependencies, Usage) ohne Panel schwer darstellbar.

**Lösung:**  
- Sliding Panel von rechts
- Component-Name als Header
- Tabs: Props, Dependencies, Used By
- Code-Preview mit Syntax Highlighting

**User Journey:**  
1. User klickt Component in Tree
2. Panel slide in von rechts (0.3s)
3. Sieht Component-Name im Header
4. Klickt "Props" Tab → Sieht alle Props
5. Klickt "Dependencies" → Sieht Imports
6. Klickt "Used By" → Sieht wo Component verwendet wird
7. Code-Preview zeigt Component-Code
8. Schließt Panel mit X oder ESC

**Akzeptanzkriterien:**  
- [ ] Panel Width 400px, Full-Height
- [ ] Slide-in Animation from right (0.3s ease-out)
- [ ] Background #111111, Border-Left #222222
- [ ] Header: 24px Bold, Close-Button (X)
- [ ] Tabs: Background transparent, Active Border-Bottom #03ffa3
- [ ] Code-Preview: Background #0a0a0a, JetBrains Mono Font
- [ ] Syntax Highlighting mit Prism.js oder Highlight.js
- [ ] ESC-Key schließt Panel

---

### Ticket #021: Blueprint Screen - Dependency Graph Visualization

**Kontext:**  
Component-Dependencies müssen visuell dargestellt werden.

**Problem:**  
Text-Listen von Dependencies sind schwer zu verstehen bei komplexen Projekten.

**Lösung:**  
- Interactive Graph mit D3.js oder React-Flow
- Nodes für Components
- Edges für Import-Dependencies
- Zoom & Pan Funktionalität
- Highlight beim Hover

**User Journey:**  
1. User wählt Component in Tree
2. Dependency-Graph zeigt Component als zentralen Node
3. Dependencies als verbundene Nodes
4. User hovert über Dependency → Highlight
5. User klickt Dependency → Navigiert zu diesem Component
6. Zoomed mit Scroll-Wheel
7. Panned mit Drag

**Akzeptanzkriterien:**  
- [ ] D3.js Force Layout oder React-Flow
- [ ] Node Size: 80px Durchmesser
- [ ] Node Color: #03ffa3 für aktiv, #666666 für Dependencies
- [ ] Edge Color: #333333, Width 2px
- [ ] Hover: Node scale(1.2), Stroke #03ffa3
- [ ] Zoom-Range: 0.5x - 2x
- [ ] Pan unbegrenzt
- [ ] Minimap in Corner für Orientation

---

## 💾 Data Screen

### Ticket #022: Data Screen - Database Schema Visualization

**Kontext:**  
User muss Supabase-Datenbank-Schema verstehen.

**Problem:**  
SQL-Tables und Relationships sind ohne Visualisierung komplex.

**Lösung:**  
- ER-Diagram mit Tables als Boxes
- Columns mit Data-Types
- Foreign Key Relationships als Connections
- RLS-Policies als Badges
- Zoom & Pan

**User Journey:**  
1. User navigiert zu Data
2. Sieht ER-Diagram mit allen Tables
3. Jede Table zeigt Columns und Types
4. Foreign Keys als Linien zwischen Tables
5. RLS-Policy-Badge an Tables mit Policies
6. Klickt Table → Table-Detail Panel
7. Zoomed & Panned für große Schemas

**Akzeptanzkriterien:**  
- [ ] Table Boxes: Background #111111, Border #222222
- [ ] Header: Table-Name (16px Bold), Record-Count Badge
- [ ] Columns: Column-Name + Data-Type (12px #a0a0a0)
- [ ] Primary Key: Icon (Key) türkis
- [ ] Foreign Keys: Linien mit Arrow, Color #ff9500
- [ ] RLS Badge: Background rgba(255,59,48,0.1), Color #ff3b30
- [ ] Zoom-Range: 0.5x - 2x
- [ ] Interactive: Drag Tables, Click für Details

---

### Ticket #023: Data Screen - Table Detail Panel

**Kontext:**  
User klickt Table in ER-Diagram für Details.

**Problem:**  
Table-Details (Columns, Indexes, RLS, Sample-Data) ohne Panel nicht darstellbar.

**Lösung:**  
- Sliding Panel von rechts
- Tabs: Columns, Indexes, RLS Policies, Sample Data
- Query-Builder für Custom Queries
- Export-Button für CSV

**User Journey:**  
1. User klickt Table-Box im ER-Diagram
2. Panel slide in von rechts
3. Sieht Table-Name im Header
4. "Columns" Tab zeigt alle Columns mit Details
5. "Indexes" Tab zeigt Performance-Indexes
6. "RLS Policies" zeigt Row-Level-Security Rules
7. "Sample Data" zeigt erste 10 Rows
8. Query-Builder ermöglicht Custom Queries
9. Export-Button downloaded CSV

**Akzeptanzkriterien:**  
- [ ] Panel Width 500px, Full-Height
- [ ] Slide-in Animation (0.3s ease-out)
- [ ] Background #111111, Border-Left #222222
- [ ] Header: Table-Name (20px Bold) + Close-Button
- [ ] 4 Tabs mit Active-State Border-Bottom #03ffa3
- [ ] Columns: List mit Name, Type, Nullable, Default
- [ ] RLS Policies: Color-coded (Allow: #34c759, Deny: #ff3b30)
- [ ] Sample Data: Table mit max 10 Rows
- [ ] Export-Button: Primary Style, Icon Download

---

### Ticket #024: Data Screen - RLS Policy Visualization

**Kontext:**  
Row-Level-Security Policies sind kritisch für Sicherheit.

**Problem:**  
RLS-Policies als Text schwer verständlich - visuelle Darstellung nötig.

**Lösung:**  
- Policy-Liste mit Color-Coding
- Policy-Name, Type (SELECT, INSERT, UPDATE, DELETE)
- USING-Clause als Code-Block
- WITH CHECK-Clause als Code-Block
- Test-Button zum Testen von Policies

**User Journey:**  
1. User öffnet Table-Detail-Panel
2. Klickt "RLS Policies" Tab
3. Sieht Liste aller Policies
4. Policy-Type color-coded (SELECT: grün, DELETE: rot)
5. USING-Clause zeigt SQL-Logic
6. Klickt "Test" Button
7. Test-Dialog öffnet sich
8. Gibt Test-User-ID ein
9. Sieht Policy-Result (Allow/Deny)

**Akzeptanzkriterien:**  
- [ ] Policy-Card: Background #0a0a0a, Border #222222
- [ ] Type Badge color-coded (SELECT: #34c759, INSERT: #00d4ff, UPDATE: #ff9500, DELETE: #ff3b30)
- [ ] USING-Clause: JetBrains Mono, Background #000000
- [ ] WITH CHECK-Clause: gleicher Style
- [ ] Test-Button: Secondary Style, Border #03ffa3
- [ ] Test-Dialog: Modal mit Input für user_id
- [ ] Result-Badge: Allow (#34c759) oder Deny (#ff3b30)

---

## 📋 Logs Screen

### Ticket #025: Logs Screen - Real-time Log Viewer

**Kontext:**  
User muss Supabase Edge Function Logs live sehen.

**Problem:**  
Ohne Logs kann User Errors nicht debuggen oder System-Status nicht verstehen.

**Lösung:**  
- Real-time Log-Stream
- Filter nach Log-Level (INFO, WARN, ERROR)
- Search-Funktion
- Auto-scroll Toggle
- Timestamp für jeden Log-Entry

**User Journey:**  
1. User navigiert zu Logs
2. Sieht Live-Log-Stream
3. Neue Logs erscheinen automatisch oben
4. Filtert auf ERROR-Level
5. Sieht nur Errors
6. Sucht nach "database"
7. Relevante Logs highlighted
8. Deaktiviert Auto-scroll für genaues Lesen
9. Kopiert Log-Entry mit Copy-Button

**Akzeptanzkriterien:**  
- [ ] Log-Entry: Background #0a0a0a, Border-Bottom #222222
- [ ] Timestamp: 12px, #666666, Monospace
- [ ] Log-Level Badge color-coded (INFO: #00d4ff, WARN: #ff9500, ERROR: #ff3b30)
- [ ] Log-Message: 13px, JetBrains Mono
- [ ] Auto-scroll aktiv per default
- [ ] Toggle-Button für Auto-scroll
- [ ] Filter-Buttons: INFO, WARN, ERROR
- [ ] Search-Input mit Real-time Highlight
- [ ] Copy-Button (Icon) bei Hover auf Log-Entry
- [ ] Max 1000 Logs im Viewer (Performance)

---

### Ticket #026: Logs Screen - Log Detail Modal

**Kontext:**  
User klickt Log-Entry für vollständige Details.

**Problem:**  
Lange Logs oder Stack-Traces nicht vollständig in List-View darstellbar.

**Lösung:**  
- Modal mit Full-Log-Content
- JSON-Formatter für strukturierte Logs
- Stack-Trace mit Syntax-Highlighting
- Copy-Button für gesamten Log

**User Journey:**  
1. User sieht Log-Entry in Liste
2. Log ist abgeschnitten "Error: Database connection..."
3. Klickt auf Log-Entry
4. Modal öffnet sich
5. Sieht vollständigen Log-Text
6. JSON-Data formatiert und farbig
7. Stack-Trace übersichtlich
8. Klickt Copy-Button → Gesamter Log in Clipboard
9. Schließt Modal

**Akzeptanzkriterien:**  
- [ ] Modal: Max-Width 900px, Max-Height 80vh
- [ ] Background #111111, Border #222222
- [ ] Header: Timestamp + Log-Level Badge
- [ ] Content: JetBrains Mono, 13px
- [ ] JSON-Formatter: Collapsible Keys, Color-coded Values
- [ ] Stack-Trace: Line-Numbers, File-Paths clickable
- [ ] Copy-Button: Primary Style, rechts oben
- [ ] Close-Button (X) und ESC-Key

---

## ⚙️ Settings Screen

### Ticket #027: Settings Screen - GitHub Connection Management

**Kontext:**  
User muss GitHub-Connection verwalten können.

**Problem:**  
Keine Möglichkeit, GitHub zu disconnecten oder Permissions zu ändern.

**Lösung:**  
- GitHub-Card mit Connection-Status
- "Disconnect" Button wenn verbunden
- "Reconnect" Button um Permissions zu aktualisieren
- OAuth-Scopes anzeigen
- Last Sync Timestamp

**User Journey:**  
1. User navigiert zu Settings
2. Sieht GitHub-Card mit Status "Verbunden"
3. Checkt OAuth-Scopes (repo, read:user)
4. Sieht Last Sync: "vor 2 Stunden"
5. Klickt "Disconnect"
6. Confirmation-Dialog öffnet sich
7. Bestätigt → GitHub disconnected
8. Kann "Verbinden" klicken um neu zu verbinden

**Akzeptanzkriterien:**  
- [ ] GitHub-Card: Background #111111, Border #222222
- [ ] Status Badge: Verbunden (#34c759) / Nicht verbunden (#666666)
- [ ] Scopes-Liste: Chips mit Background rgba(3,255,163,0.1)
- [ ] Last Sync: 14px, #a0a0a0, Relative Time (z.B. "vor 2 Stunden")
- [ ] "Disconnect" Button: Secondary Style, Color #ff3b30
- [ ] Confirmation-Dialog: Modal mit "Abbrechen" + "Disconnect" Buttons
- [ ] "Reconnect" Button: Secondary Style, Border #03ffa3

---

### Ticket #028: Settings Screen - Supabase Configuration

**Kontext:**  
User muss Supabase-Settings einsehen (nicht editieren).

**Problem:**  
User weiß nicht, welches Supabase-Projekt verbunden ist.

**Lösung:**  
- Supabase-Card mit Project-ID
- Region anzeigen
- Database Connection Status
- Edge Function Status
- Read-only (keine Edits möglich)

**User Journey:**  
1. User öffnet Settings
2. Sieht Supabase-Card
3. Checkt Project-ID (z.B. "abc123xyz")
4. Sieht Region: "eu-central-1"
5. Database Status: "Connected" (grün)
6. Edge Function Status: "Active" (grün)
7. Weiß, dass alles funktioniert

**Akzeptanzkriterien:**  
- [ ] Supabase-Card: Background #111111, Border #222222
- [ ] Project-ID: Monospace Font, Copy-Button
- [ ] Region: 14px, #a0a0a0
- [ ] Status Badges: Connected (#34c759), Disconnected (#ff3b30)
- [ ] Info-Icon mit Tooltip: "Konfiguration über Supabase Dashboard"
- [ ] Alle Felder Read-only (kein Input)

---

### Ticket #029: Settings Screen - Screenshot API Configuration

**Kontext:**  
User muss ScreenshotOne API-Key verwalten.

**Problem:**  
Ohne gültigen API-Key funktioniert Screenshot-Feature nicht.

**Lösung:**  
- ScreenshotOne-Card mit API-Key Input
- Masked Input (***) mit Show/Hide Toggle
- "Testen" Button zum Validieren
- Test-Status: Success/Error
- "Speichern" Button

**User Journey:**  
1. User öffnet Settings
2. Sieht ScreenshotOne-Card
3. API-Key ist masked (********)
4. Klickt Eye-Icon zum Anzeigen
5: Sieht vollständigen Key
6. Klickt "Testen"
7. Test-Request an ScreenshotOne-API
8. Sieht "API-Key gültig" (grün)
9. Klickt "Speichern"
10. Key wird in Supabase Secrets gespeichert

**Akzeptanzkriterien:**  
- [ ] Card: Background #111111, Border #222222
- [ ] Input: Type "password", Monospace Font
- [ ] Eye-Icon Toggle zum Show/Hide
- [ ] "Testen" Button: Secondary Style
- [ ] Test-Status Badge: Valid (#34c759) / Invalid (#ff3b30)
- [ ] "Speichern" Button: Primary Style, Disabled wenn nicht geändert
- [ ] Success-Toast nach Speichern: "API-Key gespeichert"
- [ ] Error-Toast bei Fehler: "Speichern fehlgeschlagen"

---

### Ticket #030: Settings Screen - Theme & Appearance (Future)

**Kontext:**  
Placeholder für zukünftige Theme-Settings.

**Problem:**  
User könnte verschiedene Themes wollen (z.B. Light Mode).

**Lösung:**  
- Theme-Card mit "Coming Soon" Badge
- Info-Text: "Light Mode und Custom Themes kommen bald"
- Newsletter-Anmeldung für Updates
- Disabled State für alle Inputs

**User Journey:**  
1. User öffnet Settings
2. Sieht Theme-Card
3. "Coming Soon" Badge signalisiert Future-Feature
4. Liest Info-Text
5. Kann Email für Updates hinterlassen
6. Alle Theme-Options sind disabled

**Akzeptanzkriterien:**  
- [ ] Card: Background #111111, Border #222222
- [ ] "Coming Soon" Badge: Background #ff9500, Color #000000
- [ ] Info-Text: 14px, #a0a0a0
- [ ] Email-Input: Disabled State
- [ ] Theme-Options (Radio Buttons): Alle disabled
- [ ] Opacity 50% für gesamte Card

---

## 🔌 Backend Integration

### Ticket #031: GitHub OAuth Integration

**Kontext:**  
User muss GitHub-Account sicher verbinden.

**Problem:**  
Ohne OAuth können keine Repos geladen werden.

**Lösung:**  
- OAuth-Flow mit GitHub App
- Supabase Auth für Token-Management
- Scopes: `repo`, `read:user`
- Token-Refresh automatisch
- Error-Handling für Failed Auth

**User Journey:**  
1. User klickt "GitHub verbinden"
2. Redirect zu GitHub OAuth-Page
3. Authorized VisuDEV App
4. Redirect zurück zu VisuDEV
5. Token wird in Supabase gespeichert
6. User ist verbunden
7. Repositories werden geladen

**Akzeptanzkriterien:**  
- [ ] GitHub App erstellt mit OAuth
- [ ] Client-ID und Secret in Supabase Secrets
- [ ] OAuth-Scopes: `repo`, `read:user`
- [ ] Callback-URL: `/auth/github/callback`
- [ ] Token-Speicherung in Supabase Auth
- [ ] Token-Refresh vor Expiry
- [ ] Error-Handling: Invalid Token, Network Error
- [ ] Toast-Notification bei Success/Error

---

### Ticket #032: GitHub API - Repository Fetching

**Kontext:**  
Nach GitHub-Connection müssen Repos geladen werden.

**Problem:**  
GitHub-API muss aufgerufen und Daten verarbeitet werden.

**Lösung:**  
- Edge Function `visudev-github-repos`
- GET `/repos` Endpoint
- GitHub API v3 Integration
- Pagination für viele Repos
- Caching für Performance

**User Journey:**  
1. User verbindet GitHub
2. Frontend called Edge Function `/repos`
3. Edge Function called GitHub API mit OAuth Token
4. Lädt alle Repos (inkl. Pagination)
5. Returned JSON mit Repo-Liste
6. Frontend speichert in State
7. Repos werden in Grid angezeigt

**Akzeptanzkriterien:**  
- [ ] Edge Function `visudev-github-repos` deployed
- [ ] Route: `/make-server-edf036ef/repos`
- [ ] Authorization: Bearer Token required
- [ ] GitHub API Call: `GET /user/repos`
- [ ] Pagination: per_page=100, alle Pages laden
- [ ] Response: Array mit name, owner, stars, forks, language
- [ ] Error-Handling: 401, 403, 500
- [ ] Logging: Console.log für Debug

---

### Ticket #033: GitHub API - File Tree Fetching

**Kontext:**  
Für Blueprint-Screen muss File-Tree von Repo geladen werden.

**Problem:**  
GitHub-API gibt nur einzelne Files, nicht ganzen Tree.

**Lösung:**  
- Edge Function `visudev-github-tree`
- GET `/tree/:owner/:repo` Endpoint
- Recursive Tree-Building
- Filter auf React/TypeScript Files
- Return als nested JSON

**User Journey:**  
1. User wählt Projekt aus
2. Navigiert zu Blueprint
3. Frontend called `/tree/:owner/:repo`
4. Edge Function lädt Tree von GitHub
5. Filtert auf .tsx, .ts, .jsx, .js Files
6. Returned nested Tree-Structure
7. Frontend rendered Tree-View

**Akzeptanzkriterien:**  
- [ ] Edge Function `visudev-github-tree` deployed
- [ ] Route: `/make-server-edf036ef/tree/:owner/:repo`
- [ ] GitHub API: `GET /repos/:owner/:repo/git/trees/:sha?recursive=1`
- [ ] Filter: .tsx, .ts, .jsx, .js, .json
- [ ] Response: Nested JSON mit folders und files
- [ ] Folder-Structure: `{ name, type: 'folder', children: [] }`
- [ ] File-Structure: `{ name, type: 'file', path, sha }`
- [ ] Error-Handling: Repo not found, Network Error

---

### Ticket #034: Flow Analysis Engine - Code Parsing

**Kontext:**  
VisuDEV muss Code analysieren, um Flows zu extrahieren.

**Problem:**  
React-Code muss geparst werden, um UI-Events, API-Calls, DB-Queries zu identifizieren.

**Lösung:**  
- Edge Function `visudev-scan-appflow`
- POST `/scan/appflow/:owner/:repo` Endpoint
- AST-Parsing mit Babel/TypeScript Compiler
- Pattern-Detection für Events (onClick, onChange, onSubmit)
- Pattern-Detection für API-Calls (fetch, axios, supabase)
- Flow-Storage in KV-Store

**User Journey:**  
1. User klickt "Scan starten" im App/Flow-Screen
2. Frontend POST zu `/scan/appflow/:owner/:repo`
3. Edge Function lädt alle React-Files
4. Parsed Code mit AST
5. Detected UI-Events (z.B. onClick)
6. Traced Event-Handler zu API-Calls
7. Traced API-Calls zu Supabase-Queries
8. Created Flow-Object mit Layers
9. Saved Flow in KV-Store
10. Returned Flow-Count
11. Frontend refreshed Flow-Liste

**Akzeptanzkriterien:**  
- [ ] Edge Function `visudev-scan-appflow` deployed
- [ ] Route: `/make-server-edf036ef/scan/appflow/:owner/:repo`
- [ ] AST-Parsing: @babel/parser oder TypeScript Compiler API
- [ ] Event-Detection: onClick, onChange, onSubmit, onBlur, onFocus
- [ ] API-Detection: fetch, axios, supabase.from()
- [ ] Flow-Object: `{ id, screen, name, layers: [], actions: [] }`
- [ ] Layer-Types: UI, Code, API, Database, RLS
- [ ] KV-Store: Key pattern `flow:${projectId}:${flowId}`
- [ ] Response: `{ flowCount, flows: [] }`
- [ ] Progress-Updates via Server-Sent-Events

---

### Ticket #035: Screenshot Pipeline - ScreenshotOne Integration

**Kontext:**  
Für jeden Screen muss Screenshot erstellt werden.

**Problem:**  
Screenshots müssen von URLs oder Local-Servers gemacht werden.

**Lösung:**  
- Edge Function `visudev-screenshot`
- POST `/screenshot` Endpoint mit URL
- Integration mit ScreenshotOne API
- Storage in Supabase Storage Bucket
- Signed URLs für Frontend

**User Journey:**  
1. Flow-Scan identifiziert Screen-URL
2. Edge Function called `/screenshot` mit URL
3. Edge Function called ScreenshotOne API
4. Screenshot rendered (1920x1080)
5. Image returned als Buffer
6. Uploaded zu Supabase Storage
7. Signed-URL generiert
8. URL saved in Flow-Object
9. Screenshot im Frontend angezeigt

**Akzeptanzkriterien:**  
- [ ] Edge Function `visudev-screenshot` deployed
- [ ] Route: `/make-server-edf036ef/screenshot`
- [ ] Body: `{ url, flowId }`
- [ ] ScreenshotOne API-Call mit SCREENSHOTONE_KEY
- [ ] Options: viewport_width 1920, viewport_height 1080
- [ ] Supabase Storage Bucket: `visudev-edf036ef-screenshots`
- [ ] Upload: Path `${projectId}/${flowId}.png`
- [ ] Signed-URL: 1 Stunde Expiry
- [ ] Response: `{ signedUrl }`
- [ ] Error-Handling: API-Key Invalid, URL not reachable

---

### Ticket #036: Data Schema Fetching - Supabase Introspection

**Kontext:**  
Data-Screen muss Supabase-Schema laden.

**Problem:**  
Postgres-Schema muss via Supabase API introspected werden.

**Lösung:**  
- Edge Function `visudev-data-schema`
- GET `/data/schema` Endpoint
- Supabase Management API oder Direct DB-Query
- Return Tables, Columns, Foreign-Keys, RLS-Policies

**User Journey:**  
1. User navigiert zu Data-Screen
2. Frontend called `/data/schema`
3. Edge Function queried Postgres Information Schema
4. Lädt alle Tables mit Columns
5. Lädt Foreign-Key-Relations
6. Lädt RLS-Policies
7. Returned JSON mit Schema
8. Frontend rendered ER-Diagram

**Akzeptanzkriterien:**  
- [ ] Edge Function `visudev-data-schema` deployed
- [ ] Route: `/make-server-edf036ef/data/schema`
- [ ] SQL-Query: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
- [ ] Columns: `SELECT * FROM information_schema.columns WHERE table_schema = 'public'`
- [ ] Foreign-Keys: `SELECT * FROM information_schema.table_constraints`
- [ ] RLS-Policies: `SELECT * FROM pg_policies`
- [ ] Response: `{ tables: [{ name, columns: [], foreignKeys: [], rlsPolicies: [] }] }`
- [ ] Caching: 5 Minuten

---

### Ticket #037: Logs Fetching - Supabase Edge Function Logs

**Kontext:**  
Logs-Screen muss Edge Function Logs anzeigen.

**Problem:**  
Supabase Logs müssen via Management API geladen werden.

**Lösung:**  
- Edge Function `visudev-logs`
- GET `/logs` Endpoint
- Query-Params: level, limit, offset
- Supabase Management API Integration
- Return Logs als JSON-Array

**User Journey:**  
1. User navigiert zu Logs-Screen
2. Frontend called `/logs?level=ERROR&limit=100`
3. Edge Function called Supabase Management API
4. Lädt Logs von allen Edge Functions mit Prefix `visudev-`
5. Filtered auf ERROR-Level
6. Returned 100 neueste Logs
7. Frontend rendered Log-Liste
8. Auto-refresh alle 5 Sekunden

**Akzeptanzkriterien:**  
- [ ] Edge Function `visudev-logs` deployed
- [ ] Route: `/make-server-edf036ef/logs`
- [ ] Query-Params: level (INFO/WARN/ERROR), limit, offset
- [ ] Supabase Management API: `/projects/{ref}/functions/{id}/logs`
- [ ] Filter: Edge Functions mit Prefix `visudev-`
- [ ] Response: `{ logs: [{ timestamp, level, message, metadata }] }`
- [ ] Limit max 1000 Logs
- [ ] Sort: DESC by timestamp

---

## 🎯 User Experience Enhancements

### Ticket #038: Loading States & Skeletons

**Kontext:**  
Alle API-Calls brauchen Loading-States.

**Problem:**  
Ohne Loading-Feedback wirkt App frozen oder kaputt.

**Lösung:**  
- Skeleton-Screens für alle Listen/Grids
- Spinner für Buttons mit laufenden Actions
- Progress-Bars für lange Operations (Scans)
- Smooth Transitions zwischen States

**User Journey:**  
1. User triggered Action (z.B. "Scan starten")
2. Button zeigt Spinner
3. Button disabled während Action
4. Wenn Liste lädt → Skeleton-Cards angezeigt
5. Skeleton animiert (shimmer-effect)
6. Nach Load → Smooth Fade-in von echten Daten
7. User erhält konstantes Feedback

**Akzeptanzkriterien:**  
- [ ] Skeleton-Component für Cards: Background #111111, Animated Shimmer
- [ ] Skeleton für Table-Rows: 64px Höhe, gleicher Shimmer
- [ ] Spinner in Buttons: Loader2 Icon, 16x16px
- [ ] Button disabled während Loading (opacity 50%, cursor not-allowed)
- [ ] Progress-Bar für Scans: Linear-Gradient Türkis
- [ ] Fade-in Transition: 0.3s ease-in
- [ ] Skeleton Count: Realistische Anzahl (z.B. 6 Cards)

---

### Ticket #039: Error Handling & User Feedback

**Kontext:**  
Alle API-Errors müssen user-friendly kommuniziert werden.

**Problem:**  
Raw API-Errors (500, 404) sind verwirrend für User.

**Lösung:**  
- Toast-Notifications für Errors
- Error-Messages user-friendly formuliert
- Retry-Button für transiente Errors
- Error-Boundary für Critical Errors

**User Journey:**  
1. User triggered Action (z.B. Projekt öffnen)
2. API-Call failed (Network Error)
3. Toast erscheint: "Projekt konnte nicht geladen werden. Bitte erneut versuchen."
4. Toast hat "Retry" Button
5. User klickt Retry
6. Action wird wiederholt
7. Bei Success: Toast verschwindet

**Akzeptanzkriterien:**  
- [ ] Toast-Library: Sonner (sonner@2.0.3)
- [ ] Error-Toast: Background #111111, Border #ff3b30
- [ ] Icon: XCircle (lucide-react)
- [ ] Duration: 5 Sekunden (auto-dismiss)
- [ ] Retry-Button: Secondary Style
- [ ] Error-Messages: Mapping von API-Codes zu User-Text
- [ ] Error-Boundary: Catch-All für Uncaught Exceptions
- [ ] Fallback-UI: "Etwas ist schiefgelaufen" + Reload-Button

---

### Ticket #040: Keyboard Shortcuts

**Kontext:**  
Power-User wollen mit Keyboard navigieren.

**Problem:**  
Maus-only Navigation ist langsam für häufige Actions.

**Lösung:**  
- Global Keyboard-Shortcuts
- Cmd/Ctrl + K für Command-Palette
- Cmd/Ctrl + P für Projekte
- Cmd/Ctrl + F für Search
- ESC für Modal-Close

**User Journey:**  
1. User drückt Cmd+K
2. Command-Palette öffnet sich
3. User tippt "app" → "App/Flow" wird vorgeschlagen
4. User drückt Enter → Navigiert zu App/Flow
5. User drückt Cmd+F → Search-Input focused
6. User drückt ESC → Modal/Panel schließt

**Akzeptanzkriterien:**  
- [ ] Keyboard-Event-Listener global registriert
- [ ] Cmd+K / Ctrl+K: Command-Palette Toggle
- [ ] Cmd+P / Ctrl+P: Projects-Screen
- [ ] Cmd+F / Ctrl+F: Focus Search-Input
- [ ] ESC: Close Modal/Panel/Overlay
- [ ] Command-Palette: Fuzzy-Search über alle Screens
- [ ] Visual Indicator: Keyboard-Shortcuts in Tooltips

---

### Ticket #041: Responsive Mobile View

**Kontext:**  
VisuDEV sollte auf Mobile devices grundlegend nutzbar sein.

**Problem:**  
Desktop-Layout bricht auf Mobile komplett zusammen.

**Lösung:**  
- Collapsible Sidebar (Hamburger-Menu)
- Stacked Layout statt Grid
- Touch-optimierte Buttons (44x44px)
- Bottom-Navigation für Mobile

**User Journey:**  
1. User öffnet VisuDEV auf iPhone
2. Sidebar ist collapsed (nur Icons)
3. Hamburger-Icon links oben
4. User tappt Hamburger → Sidebar slide in
5. User navigiert zu Screen
6. Sidebar auto-closes
7. Content full-width
8. Bottom-Navigation zeigt häufigste Screens

**Akzeptanzkriterien:**  
- [ ] Breakpoint Mobile: <640px
- [ ] Sidebar collapsed: Width 60px (nur Icons)
- [ ] Hamburger-Menu: Icon (Menu) türkis
- [ ] Sidebar-Overlay: Background rgba(0,0,0,0.5)
- [ ] Swipe-Gesture: Swipe-right öffnet Sidebar
- [ ] Bottom-Nav: Fixed, 60px Höhe, 4 Icons
- [ ] Touch-Targets: Min 44x44px
- [ ] Grid → Stack: 1 Column auf Mobile

---

### Ticket #042: Accessibility (a11y) Basics

**Kontext:**  
VisuDEV muss grundlegende Accessibility-Standards erfüllen.

**Problem:**  
Ohne a11y sind Screen-Reader-User und Keyboard-User ausgeschlossen.

**Lösung:**  
- Semantic HTML (nav, main, article)
- ARIA-Labels für Icons
- Focus-Indicators (2px solid #03ffa3)
- Skip-Links für Navigation
- Alt-Texts für Screenshots

**User Journey:**  
1. Screen-Reader-User öffnet VisuDEV
2. Screen-Reader announced: "VisuDEV - Visualize Code"
3. User navigiert mit Tab durch Sidebar
4. Jeder Button wird announced: "App/Flow, Button"
5. Focus-Indicator (türkis) zeigt aktuelle Position
6. User aktiviert "Skip to Content" Link
7. Springt direkt zum Hauptinhalt

**Akzeptanzkriterien:**  
- [ ] Semantic HTML: <nav>, <main>, <article>, <section>
- [ ] ARIA-Labels: aria-label für alle Icon-Buttons
- [ ] Focus-Indicator: 2px solid #03ffa3, offset 2px
- [ ] Skip-Link: "Skip to Content" am Anfang, türkis
- [ ] Alt-Texts: Alle Screenshots haben beschreibenden alt-Text
- [ ] Contrast-Ratio: Min 4.5:1 für Text, 3:1 für UI
- [ ] Keyboard-Navigation: Alle interaktiven Elemente mit Tab erreichbar

---

### Ticket #043: Performance Optimization - Code Splitting

**Kontext:**  
VisuDEV Bundle-Size muss klein bleiben für schnelle Ladezeiten.

**Problem:**  
Alle Screens im Initial-Bundle laden langsam.

**Lösung:**  
- React.lazy für Screen-Components
- Route-based Code-Splitting
- Dynamic Imports für Libraries (D3, React-Flow)
- Preload Critical Resources

**User Journey:**  
1. User öffnet VisuDEV
2. Initial Load: Nur Sidebar + Projects-Screen (klein)
3. Load-Time: <2 Sekunden
4. User navigiert zu App/Flow
5. App/Flow-Chunk loaded on-demand
6. Loading-Spinner kurz sichtbar
7. Screen rendered

**Akzeptanzkriterien:**  
- [ ] React.lazy für alle Screen-Components
- [ ] Suspense mit Loading-Fallback (Spinner)
- [ ] Dynamic Import für D3: `const d3 = await import('d3')`
- [ ] Dynamic Import für React-Flow
- [ ] Initial Bundle-Size: <200kb (gzipped)
- [ ] Screen-Chunks: <100kb each
- [ ] Preload: <link rel="preload"> für Fonts

---

### Ticket #044: Performance Optimization - Virtualization

**Kontext:**  
434 Flows in Table müssen performant rendered werden.

**Problem:**  
Alle Rows auf einmal rendern ist langsam und scrollt nicht smooth.

**Lösung:**  
- Virtual Scrolling mit react-window
- Nur sichtbare Rows rendered
- Fixed Row-Height (64px)
- Smooth Scrolling

**User Journey:**  
1. User öffnet App/Flow mit 434 Flows
2. Nur erste 20 Rows rendered (sichtbarer Bereich)
3. User scrolled → Neue Rows werden dynamisch rendered
4. Scrolling ist smooth (60fps)
5. Alte Rows werden unmounted
6. Memory bleibt konstant

**Akzeptanzkriterien:**  
- [ ] react-window Library installiert
- [ ] FixedSizeList Component verwendet
- [ ] Row-Height: 64px
- [ ] Overscan: 5 Rows (Smoother Scroll)
- [ ] Scroll-Performance: 60fps
- [ ] Memory: Max 50 Rows rendered gleichzeitig
- [ ] Works mit Search/Filter

---

## 🧪 Testing & Quality

### Ticket #045: E2E Tests - Critical User Flows

**Kontext:**  
Kritische User-Flows müssen automatisch getestet werden.

**Problem:**  
Manuelle Tests sind fehleranfällig und zeitaufwändig.

**Lösung:**  
- Playwright für E2E-Tests
- Test-Scenarios: GitHub-Connect, Projekt-Auswahl, Flow-Scan
- CI-Integration
- Screenshot-Diffing

**User Journey:**  
1. Developer pusht Code
2. CI triggered Playwright-Tests
3. Test: User connects GitHub
4. Test: User wählt Projekt
5. Test: User startet Scan
6. Test: Flow-Liste wird angezeigt
7. Alle Tests passed → Deployment
8. Test failed → PR blocked

**Akzeptanzkriterien:**  
- [ ] Playwright installiert und konfiguriert
- [ ] Test: GitHub-OAuth-Flow (Mocked)
- [ ] Test: Repository-Grid angezeigt
- [ ] Test: Projekt-Auswahl aktiviert Navigation
- [ ] Test: Scan-Progress in Sidebar
- [ ] Test: Flow-Tabelle angezeigt
- [ ] Screenshot-Diffing für Visual-Regression
- [ ] CI-Integration: GitHub Actions

---

### Ticket #046: Unit Tests - Business Logic

**Kontext:**  
Business-Logic (Flow-Parsing, Data-Transformation) muss getestet werden.

**Problem:**  
Ohne Unit-Tests sind Bugs schwer zu finden und Refactoring riskant.

**Lösung:**  
- Vitest für Unit-Tests
- Test-Coverage: Flow-Parser, Schema-Transformer
- Mocking von API-Calls
- TDD für neue Features

**User Journey:**  
1. Developer implementiert Flow-Parser
2. Schreibt Tests parallel (TDD)
3. Test: Event-Detection erkennt onClick
4. Test: API-Call-Tracking findet fetch()
5. Test: Layer-Building erstellt korrektes Flow-Object
6. Alle Tests passed
7. Code wird committed

**Akzeptanzkriterien:**  
- [ ] Vitest installiert und konfiguriert
- [ ] Test: Flow-Parser erkennt UI-Events
- [ ] Test: API-Call-Detection funktioniert
- [ ] Test: Layer-Building korrekt
- [ ] Test: Schema-Transformation valide
- [ ] Code-Coverage: Min 70%
- [ ] Mocking: GitHub API, Supabase API

---

## 📚 Documentation

### Ticket #047: Developer Documentation

**Kontext:**  
Neue Developer müssen schnell onboarden können.

**Problem:**  
Ohne Docs ist Setup und Development komplex.

**Lösung:**  
- README.md mit Setup-Instructions
- ARCHITECTURE.md mit System-Overview
- CONTRIBUTING.md mit Development-Guidelines
- API.md mit Edge-Function-Docs

**Akzeptanzkriterien:**  
- [ ] README.md: Project-Description, Setup, Running
- [ ] ARCHITECTURE.md: System-Diagram, Tech-Stack, Data-Flow
- [ ] CONTRIBUTING.md: Code-Style, PR-Process, Testing
- [ ] API.md: Alle Edge-Functions mit Endpoints, Params, Responses
- [ ] Code-Comments: JSDoc für alle Public-Functions
- [ ] Markdown-Format mit Code-Blocks und Diagrams

---

### Ticket #048: User Documentation

**Kontext:**  
User müssen VisuDEV verstehen und effektiv nutzen können.

**Problem:**  
Komplexe Features ohne Anleitung sind nicht nutzbar.

**Lösung:**  
- USER_GUIDE.md mit Screen-by-Screen Erklärungen
- Video-Tutorials (optional)
- In-App-Tooltips für Features
- FAQ-Section

**Akzeptanzkriterien:**  
- [ ] USER_GUIDE.md: Intro, GitHub-Setup, Screens, Features
- [ ] Screenshots mit Annotations
- [ ] Step-by-Step Tutorials
- [ ] FAQ: Häufige Fragen und Antworten
- [ ] In-App-Tooltips: Icon (Info) mit Hover-Text
- [ ] Tooltips: Background #111111, Border #03ffa3

---

## 🚀 Deployment & DevOps

### Ticket #049: CI/CD Pipeline

**Kontext:**  
Deployment muss automatisiert und fehlerfrei sein.

**Problem:**  
Manuelle Deployments sind fehleranfällig und langsam.

**Lösung:**  
- GitHub Actions Workflow
- Stages: Lint → Test → Build → Deploy
- Auto-Deploy von main-Branch
- Deployment zu Figma Make (automatisch)

**Akzeptanzkriterien:**  
- [ ] GitHub Actions Workflow: `.github/workflows/deploy.yml`
- [ ] Stage 1: ESLint + TypeScript Check
- [ ] Stage 2: Vitest Unit-Tests
- [ ] Stage 3: Playwright E2E-Tests
- [ ] Stage 4: Build (Vite)
- [ ] Stage 5: Deploy to Figma Make
- [ ] Notification bei Failed-Build (Slack/Email)

---

### Ticket #050: Supabase Edge Functions Deployment

**Kontext:**  
Alle Edge Functions müssen über Dashboard deployed werden.

**Problem:**  
Figma Make hat keinen CLI-Zugriff - nur Dashboard-Deployment möglich.

**Lösung:**  
- Manuelle Deployment-Checkliste
- README mit Deployment-Instructions
- Naming-Convention: Alle Functions mit `visudev-` Prefix
- Version-Tagging für Tracking

**Akzeptanzkriterien:**  
- [ ] DEPLOYMENT.md mit Step-by-Step Instructions
- [ ] Checklist: Function-Name, Code-Upload, Secrets-Config
- [ ] Naming-Convention documented: `visudev-{feature}`
- [ ] Secrets-Liste: GITHUB_CLIENT_ID, SCREENSHOTONE_KEY, etc.
- [ ] Test-Instructions nach Deployment
- [ ] Rollback-Instructions bei Errors

---

## ✅ Final Polish

### Ticket #051: Animations & Micro-Interactions

**Kontext:**  
Subtle Animationen verbessern UX und machen App "alive".

**Problem:**  
Statische UI ohne Transitions wirkt tot.

**Lösung:**  
- Hover-Animations für Buttons und Cards
- Fade-in für Modal/Panel
- Slide-in für Sidebar auf Mobile
- Skeleton Shimmer-Effect
- Success-Checkmarks mit Animation

**Akzeptanzkriterien:**  
- [ ] Button Hover: scale(1.02), 0.2s ease
- [ ] Card Hover: translateY(-2px), 0.2s ease
- [ ] Modal Fade-in: opacity 0→1, 0.3s ease-in
- [ ] Panel Slide-in: translateX(400px)→0, 0.3s ease-out
- [ ] Skeleton Shimmer: Linear-Gradient Animation, 1.5s infinite
- [ ] Checkmark: SVG-Path-Animation, 0.5s ease-in-out
- [ ] Alle Transitions: Respektiert prefers-reduced-motion

---

### Ticket #052: Empty States & Placeholder Content

**Kontext:**  
Alle leeren Zustände brauchen hilfreiche Placeholder.

**Problem:**  
Leere Screens ohne Guidance sind verwirrend.

**Lösung:**  
- Illustrative Icons (lucide-react)
- Hilfreiche Messages
- Call-to-Action Buttons
- Konsistentes Design für alle Empty-States

**Akzeptanzkriterien:**  
- [ ] Alle Screens haben Empty-State
- [ ] Icon: 48x48px, Color #666666
- [ ] Message: 20px Bold, White
- [ ] Subtext: 14px, #a0a0a0
- [ ] CTA-Button: Primary Style
- [ ] Zentriert: min-height 400px

---

### Ticket #053: Final UI Polish & Consistency Check

**Kontext:**  
Alle Screens müssen Styleguide 1:1 folgen.

**Problem:**  
Inkonsistenzen in Spacing, Colors, Typography.

**Lösung:**  
- Manual-Review aller Screens
- Styleguide-Checklist durchgehen
- Design-Tokens validieren
- Cross-Browser-Testing

**Akzeptanzkriterien:**  
- [ ] Alle Colors matchen Styleguide
- [ ] Spacing: 4px-Grid überall
- [ ] Typography: Inter + JetBrains Mono
- [ ] Border-Radius: 6-8px konsistent
- [ ] Hover-States: #02e591 überall
- [ ] Tested: Chrome, Firefox, Safari, Edge
- [ ] Tested: 1920x1080, 1440x900, 1366x768
- [ ] No Console Errors

---

## 📊 Summary

**Total Tickets**: 53  
**Categories**:
- Foundation: 2
- Navigation: 5
- Projects: 6
- App/Flow: 7
- Blueprint: 3
- Data: 3
- Logs: 2
- Settings: 4
- Backend: 7
- UX Enhancements: 7
- Testing: 2
- Documentation: 2
- Deployment: 2
- Final Polish: 3

**Estimated Timeline**: 8-12 Wochen  
**Priority**: P0 (Must-Have) → P2 (Nice-to-Have) → P3 (Future)

---

**Version**: 1.0  
**Last Updated**: Januar 2025  
**Maintained by**: VisuDEV Team
