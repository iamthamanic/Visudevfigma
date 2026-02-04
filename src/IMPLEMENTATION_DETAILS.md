# 📊 VISUDEV - KOMPLETTE IMPLEMENTIERUNGS-DOKUMENTATION

**Version:** 2.0.0  
**Stand:** November 2024  
**Zweck:** Professionelle Entwickler-Plattform zur Visualisierung deterministischer Flows von UI-Elementen durch Code, API, SQL/RLS bis zu ERP-Systemen

---

## 🎯 PROJEKT-OVERVIEW

### Vision

Screen-zentrierte Visualisierung kompletter Ausführungspfade durch alle Schichten (UI → Code → API → SQL → ERP) mit farbkodierten Knoten für schnelle Architektur-Überblicke, Impact-Analysen und DB-Transparenz.

### Zielgruppe

- Entwickler
- Tech Leads
- CTOs

### Design Philosophy

- Minimalistisch
- Türkis/Grünes Farbschema (#03ffa3)
- Schwarze Sidebar-Navigation links
- Cleane Cards ohne Mock-Daten
- GitHub als Source of Truth
- Supabase als Backend

---

## 🏗️ ARCHITEKTUR

```
Frontend (React + Tailwind)
    ↓
Supabase Edge Functions (Deno + Hono)
    ↓
GitHub API + Supabase Database (KV Store)
```

### Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase Edge Functions (Deno Runtime)
- **Web Framework:** Hono
- **Database:** Supabase PostgreSQL (KV Store Table)
- **API:** GitHub REST API
- **Auth:** GitHub OAuth (über Supabase)

---

## 📁 PROJEKT-STRUKTUR

```
/
├── App.tsx                          # Main App mit Sidebar Navigation
├── components/
│   ├── AppFlowScreen.tsx           # Haupt-Screen für Flow-Visualisierung
│   ├── SitemapFlowView.tsx         # Visuelles Sitemap mit Screen Cards
│   ├── ScreenDetailView.tsx        # Detail-Ansicht eines Screens
│   ├── CodePreview.tsx             # Code-Vorschau Component
│   ├── FlowGraph.tsx               # Flow-Graph Visualisierung
│   ├── ProjectsOverview.tsx        # Projekt-Übersicht
│   ├── ProjectCard.tsx             # Projekt-Card Component
│   ├── GitHubRepoSelector.tsx      # GitHub Repo Auswahl
│   ├── SupabaseProjectSelector.tsx # Supabase Projekt Auswahl
│   ├── Blueprint.tsx               # Blueprint Screen (geplant)
│   ├── DataScreen.tsx              # Data/DB Screen (geplant)
│   ├── LogsPanel.tsx               # Logs Panel (geplant)
│   ├── SettingsPanel.tsx           # Settings Panel (geplant)
│   └── ui/                         # Shadcn UI Components
│
├── supabase/functions/
│   ├── visudev-projects/           # Projekt-Management
│   ├── visudev-analyzer/           # Code-Analyse Engine
│   ├── visudev-auth/               # GitHub OAuth
│   ├── visudev-appflow/            # Flow-Generierung (geplant)
│   ├── visudev-blueprint/          # Blueprint (geplant)
│   ├── visudev-data/               # Data Analysis (geplant)
│   ├── visudev-logs/               # Logging (geplant)
│   └── visudev-integrations/       # Integrationen (geplant)
│
├── utils/
│   ├── api.ts                      # API Helper Functions
│   ├── useVisuDev.ts               # Custom React Hook
│   └── supabase/info.tsx           # Supabase Config
│
├── types.ts                        # TypeScript Type Definitions
├── utils.ts                        # Utility Functions
└── mockData.ts                     # Mock Data (für Development)
```

---

## ✅ IMPLEMENTIERTE FEATURES (DETAILS)

### 1. FRONTEND COMPONENTS

#### 1.1 App.tsx - Main Application

**Status:** ✅ Vollständig implementiert

**Features:**

- Schwarze Sidebar Navigation (links)
- 6 Navigation-Items: Projekte, App/Flow, Blueprint, Data, Logs, Settings
- Screen-basierte Navigation (kein Routing)
- Project Selection State Management
- "Neues Projekt" Button mit Primary Color (#03ffa3)
- Responsive Layout (Sidebar + Main Content)

**Code Structure:**

```typescript
- State: activeScreen, selectedProject
- Navigation: navItems Array
- Event Handler: handleProjectSelect()
- Screens: ProjectsOverview, AppFlowScreen, Blueprint, DataScreen, LogsPanel, SettingsPanel
```

---

#### 1.2 ProjectsOverview.tsx - Projekt-Übersicht

**Status:** ✅ Vollständig implementiert

**Features:**

- Grid-Layout für Projekt-Cards
- "Neues Projekt erstellen" Dialog
- GitHub Repo Selector Integration
- Supabase Project Selector Integration
- Projekt-Erstellung mit Validierung
- Projekt-Liste anzeigen
- Click Handler für Projekt-Auswahl

**API Calls:**

- `POST /visudev-projects/create` - Projekt erstellen
- `GET /visudev-projects/list` - Projekte auflisten

**Form Validation:**

- Project Name (required)
- GitHub Repo (optional)
- GitHub Branch (default: "main")
- Supabase Project ID (optional)

---

#### 1.3 AppFlowScreen.tsx - Haupt-Analyse-Screen

**Status:** ✅ Vollständig implementiert

**Features:**

- **Tab Navigation:**
  - Sitemap Tab (visuelles Sitemap)
  - Flows Tab (Liste aller Flows)
  - Settings Tab (Analyse-Einstellungen)

- **Analyse-Workflow:**
  1. "Analyze" Button → Startet Code-Analyse
  2. Loading State mit Progress
  3. GitHub API Call → Files laden
  4. Code-Parsing → Screens & Flows extrahieren
  5. Results anzeigen

- **Stats Display:**
  - X Screens erkannt
  - X Flows gefunden
  - Framework Detection

**State Management:**

```typescript
- screens: Screen[]
- flows: CodeFlow[]
- framework: FrameworkInfo
- isAnalyzing: boolean
- analysisProgress: string
```

**API Integration:**

- `POST /visudev-analyzer/analyze` - Code-Analyse durchführen

---

#### 1.4 SitemapFlowView.tsx - Visuelles Sitemap

**Status:** ✅ Vollständig implementiert (mit Grid Layout)

**Features:**

**Layout Modes:**

1. **Grid Layout** (wenn keine Navigation-Links gefunden):
   - 6 Screens pro Zeile
   - Automatisches Wrapping
   - Gleichmäßiges Spacing

2. **Depth-Based Layout** (wenn Navigation-Links vorhanden):
   - Breadth-First-Search für Screen-Depths
   - Spalten basierend auf Navigation-Tiefe
   - Connection Lines zwischen Screens

**Screen Cards:**

- **Header:** Screen Name + Route Path
- **Preview:** Live-Preview des React Components in iframe
- **Footer:** Flow Statistics (⚡ UI Events, 🌐 API Calls, 🔴 DB Queries)
- **Depth Indicator:** Zeigt Navigation-Tiefe

**Interaktivität:**

- Click auf Card → ScreenDetailView öffnen
- Pan & Zoom (Maus Drag + Zoom Controls)
- Hover Effects

**Connection Lines:**

- SVG Bezier Curves
- Türkis (#03ffa3)
- Arrows am Ende
- Opacity 0.4

**Technical Details:**

```typescript
interface ScreenPosition {
  x: number;
  y: number;
  depth: number;
}

Layout Algorithm:
1. Calculate Screen Depths (BFS)
2. Group by Depth → Columns
3. If all Depth 0 → Use Grid Layout
4. Position Screens
5. Render Connection Lines
```

**Debug Logging:**

- Layout screens count
- Screen details (name, path, navigatesTo)
- Depth calculation results
- Column distribution
- Position calculations

---

#### 1.5 ScreenDetailView.tsx - Screen Detail Modal

**Status:** ✅ Vollständig implementiert

**Features:**

**Split View:**

- **Links (40%):** Screen Info + Flows Liste
- **Rechts (60%):** Live Preview oder Code View

**Screen Info:**

- Name, Path, File, Type
- Framework Badge
- Navigation Links (navigatesTo)

**Flows Liste:**

- Gruppiert nach Type (UI Events, Function Calls, API Calls, DB Queries)
- Farb-kodierte Icons
- Click → Flow Details expandieren
- Code-Snippet Anzeige

**Live Preview:**

- Toggle: Preview ↔ Code View
- iframe-basiertes Rendering
- Tailwind CSS CDN
- Scaled Preview (0.5x)
- Fallback bei Render-Errors

**Code View:**

- Syntax Highlighting
- Line Numbers
- Full Component Source Code

**Technical:**

```typescript
interface Props {
  screen: Screen;
  flows: CodeFlow[];
  onClose: () => void;
}

Preview Rendering:
- iframe mit srcDoc
- Tailwind CDN
- Scale Transform für bessere Übersicht
- Error Handling
```

---

#### 1.6 CodePreview.tsx - Code-Vorschau Component

**Status:** ✅ Vollständig implementiert

**Features:**

- Syntax-highlighted Code Display
- Line Numbers
- Copy-to-Clipboard
- Scroll Support
- Dark Theme

**Props:**

```typescript
interface CodePreviewProps {
  code: string;
  language?: string;
  maxHeight?: string;
}
```

---

#### 1.7 GitHubRepoSelector.tsx - GitHub Integration

**Status:** ✅ Vollständig implementiert

**Features:**

- GitHub OAuth Login
- Repository Search & Selection
- Branch Selection
- Access Token Management
- User Info Display (Avatar, Name)

**OAuth Flow:**

1. User klickt "Connect GitHub"
2. Redirect zu GitHub OAuth
3. Callback mit Code
4. Exchange Code → Access Token
5. Store Token + Fetch Repos

**API Calls:**

- GitHub OAuth
- GET /user/repos - Repository Liste
- GET /repos/:owner/:repo/branches - Branch Liste

---

#### 1.8 SupabaseProjectSelector.tsx - Supabase Integration

**Status:** ✅ Vollständig implementiert

**Features:**

- Supabase Project Selection
- Manual Project ID Input
- Anon Key Input
- Validation

**Integration:**

- Für Data Screen (DB-Analyse)
- Für RLS Policy Visualization
- Für Migration Tracking

---

### 2. BACKEND - EDGE FUNCTIONS

#### 2.1 visudev-projects/index.tsx - Projekt-Management

**Status:** ✅ Vollständig implementiert

**Endpoints:**

**POST /create**

```typescript
Request: {
  user_id: string;
  name: string;
  github_repo?: string;
  github_branch?: string;
  github_access_token?: string;
  supabase_project_id?: string;
  supabase_anon_key?: string;
}

Response: {
  project_id: string;
  name: string;
  created_at: string;
}
```

**GET /list**

```typescript
Request: {
  user_id: string;
}

Response: {
  projects: Project[]
}
```

**Storage:**

- KV Store: `projects:{user_id}`
- KV Store: `project:{project_id}`

---

#### 2.2 visudev-analyzer/index.tsx - Code-Analyse Engine

**Status:** ✅ Vollständig implementiert

**Endpoint:**

**POST /analyze**

```typescript
Request: {
  access_token: string;
  repo: string; // "owner/repo"
  branch: string;
}

Response: {
  screens: Screen[];
  flows: CodeFlow[];
  framework: FrameworkInfo;
  stats: {
    totalFiles: number;
    analyzedFiles: number;
    screens: number;
    flows: number;
  }
}
```

**Analyse-Pipeline:**

- **AST (Babel):** Navigation, React Router routes, UI events (buttons/onClick), and call-graph are extracted via `@babel/parser` in `.tsx`/`.jsx` files; Regex fallback on parse error or non-JSX files. API/DB flows remain Regex-based.

1. **GitHub File Fetching:**

   ```
   GET /repos/:owner/:repo/git/trees/:sha?recursive=1
   → Alle Dateien im Repo
   → Filter: .tsx, .ts, .jsx, .js, .vue
   → Download File Contents via GitHub API
   ```

2. **Framework Detection:**
   - Next.js App Router (app/ directory)
   - Next.js Pages Router (pages/ directory)
   - React Router (Route components)
   - Nuxt.js (pages/ directory + .vue files)
   - Vue Router

   **Detection Logic:**

   ```typescript
   - Check for app/page.tsx → Next.js App Router
   - Check for pages/index.tsx → Next.js Pages
   - Check for <Route> components → React Router
   - Check for pages/*.vue → Nuxt.js
   - Confidence Score: 0-1
   ```

3. **Screen Detection:**

   **Next.js App Router:**

   ```typescript
   Pattern: app/**/page.tsx
   Route Path: app/dashboard/page.tsx → /dashboard
   Root: app/page.tsx → /
   Dynamic: app/user/[id]/page.tsx → /user/:id
   ```

   **Next.js Pages Router:**

   ```typescript
   Pattern: pages/**/index.tsx, pages/**/*.tsx
   Route Path: pages/about.tsx → /about
   Root: pages/index.tsx → /
   Dynamic: pages/user/[id].tsx → /user/:id
   ```

   **React Router:**

   ```typescript
   Pattern: <Route path="/dashboard" element={<Dashboard />} />
   Regex: /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)/g
   Also: createBrowserRouter configs
   ```

   **Nuxt.js:**

   ```typescript
   Pattern: pages/**/*.vue
   Route Path: pages/about.vue → /about
   Root: pages/index.vue → /
   Dynamic: pages/user/[id].vue → /user/:id
   ```

4. **Navigation Link Extraction:**

   ```typescript
   Patterns:
   - <Link to="/dashboard">
   - <a href="/about">
   - router.push('/settings')
   - navigate('/profile')
   - useRouter().push('/home')

   → navigatesTo: string[]
   ```

5. **Flow Detection:**

   **UI Events:**

   ```typescript
   Patterns:
   - onClick={handleClick}
   - onSubmit={handleSubmit}
   - onChange={handleChange}

   Extract: Function name, File, Line number
   Color: Yellow (#fbbf24)
   ```

   **Function Calls:**

   ```typescript
   Patterns:
   - function handleClick()
   - const getData = async ()
   - export function processData

   Extract: Function body, Dependencies
   Color: Blue (#3b82f6)
   ```

   **API Calls:**

   ```typescript
   Patterns:
   - fetch('/api/users')
   - axios.get('/api/data')
   - await api.post('/endpoint')
   - supabase.from('table')

   Extract: Endpoint, Method, File, Line
   Color: Green (#10b981)
   ```

   **DB Queries:**

   ```typescript
   Patterns:
   - supabase.from('users').select()
   - db.query('SELECT * FROM')
   - prisma.user.findMany()

   Extract: Table, Query type, File, Line
   Color: Red (#ef4444)
   ```

6. **Flow Graph Construction:**

   ```typescript
   For each screen:
     - Find all flows in screen file
     - Build dependency graph
     - Link flows via function calls
     - Attach flows to screen.flows[]

   Flow.calls = [callee names or flow IDs]
   - Filled from AST call-graph (visudev-analyzer): which functions each
     function-call flow invokes. Frontend (buildEdges) resolves by flow name or id.
   ```

7. **Component Code Extraction:**

   ```typescript
   For each screen:
     screen.componentCode = fileContent

   → Wird für Live Preview verwendet
   ```

**Performance:**

- Caching: GitHub File Tree gecacht (1h)
- Parallel Processing: Alle Files parallel laden
- Regex Optimization: Pre-compiled Patterns
- Max Files: 1000 (Limit)

**Current Stats:**

- **Scriptony App:** 57 Screens erkannt, 1036 Flows gefunden

---

#### 2.3 visudev-auth/index.tsx - Authentication

**Status:** ✅ Vollständig implementiert

**GitHub OAuth Flow:**

**GET /github/authorize**

```typescript
Response: Redirect to GitHub OAuth
URL: https://github.com/login/oauth/authorize?
  client_id={GITHUB_CLIENT_ID}&
  redirect_uri={CALLBACK_URL}&
  scope=repo,read:user
```

**GET /github/callback**

```typescript
Request: { code: string }

Process:
1. Exchange code for access_token
2. Fetch user info (/user)
3. Store in session/KV
4. Return access_token + user_info

Response: {
  access_token: string;
  user: {
    id: number;
    login: string;
    name: string;
    avatar_url: string;
  }
}
```

**Environment Variables:**

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

---

#### 2.4 Weitere Edge Functions (Geplant)

**visudev-appflow:** Flow-Generierung & Click-Path Simulation  
**visudev-blueprint:** Code Generation & Architecture Planning  
**visudev-data:** Database Schema Analysis  
**visudev-logs:** Activity Logging & Analytics  
**visudev-integrations:** External API Integrations

**Status:** ⏳ Noch nicht implementiert (Stubs vorhanden)

---

### 3. DATENMODELLE

#### 3.1 Project

```typescript
interface Project {
  id: string; // UUID
  name: string; // Projekt-Name
  github_repo?: string; // "owner/repo"
  github_branch?: string; // "main"
  github_access_token?: string;
  supabase_project_id?: string;
  supabase_anon_key?: string;
  createdAt: string; // ISO Date
}
```

#### 3.2 Screen

```typescript
interface Screen {
  id: string; // "screen:path/to/file.tsx"
  name: string; // "Dashboard", "Settings"
  path: string; // "/dashboard", "/settings"
  file: string; // "app/dashboard/page.tsx"
  type: "page" | "screen" | "view";
  flows: string[]; // Flow IDs in this screen
  navigatesTo: string[]; // ["/settings", "/profile"]
  framework: string; // "nextjs-app", "react-router"
  componentCode?: string; // Full source code
}
```

#### 3.3 CodeFlow

```typescript
interface CodeFlow {
  id: string; // "flow:file.tsx:line:name"
  type: "ui-event" | "function-call" | "api-call" | "db-query";
  name: string; // "handleSubmit", "fetchUsers"
  file: string; // "src/components/Form.tsx"
  line: number; // Line number in file
  code: string; // Code snippet
  calls: string[]; // Callee names (or flow IDs); filled from AST call-graph for function-call flows
  color: string; // "#fbbf24", "#3b82f6", etc.
}
```

#### 3.4 FrameworkInfo

```typescript
interface FrameworkInfo {
  detected: string[]; // ["nextjs-app", "react"]
  primary: string | null; // "nextjs-app"
  confidence: number; // 0.95
}
```

---

### 4. DATABASE (KV STORE)

**Table:** `kv_store_edf036ef`

**Schema:**

```sql
CREATE TABLE kv_store_edf036ef (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Keys:**

```
projects:{user_id}           → Project[]
project:{project_id}         → Project
analysis:{project_id}        → { screens, flows, framework }
github_cache:{repo}:{branch} → FileTree (1h cache)
```

**Operations:**

- `kvSet(key, value)` - Upsert
- `kvGet(key)` - Get single value
- `kvDel(key)` - Delete

---

## 🚧 AKTUELLE PROBLEME & LIMITATIONEN

### 1. Screen Preview Problem

**Status:** ❌ Teilweise funktional

**Problem:**

- Wir extrahieren `componentCode` aus GitHub
- Wir rendern es in einem iframe mit Tailwind CDN
- **ABER:** Imports fehlen (andere Components, Images, Icons)
- **ERGEBNIS:** Preview zeigt nur Basic JSX, keine echten Screens

**Beispiel:**

```tsx
// screen.componentCode
import { Button } from "./components/Button"; // ❌ Nicht verfügbar im iframe
import { UserIcon } from "lucide-react"; // ❌ Nicht verfügbar

export default function Dashboard() {
  return (
    <div>
      <Button>Click</Button>
    </div>
  ); // ❌ Button ist undefined
}
```

**Aktueller Workaround:**

- Wir zeigen den JSX ohne Imports
- Viele Components rendern nicht
- Zeigt nur Struktur, nicht echtes UI

---

### 2. Keine Navigation Links

**Status:** ⚠️ Teilweise funktional

**Problem:**

- Screens haben `navigatesTo: []` (leer)
- Deshalb alle Screens auf Depth 0
- Deshalb nur 1 Spalte statt hierarchischer Layout
- Keine Connection Lines sichtbar

**Grund:**

- `extractNavigationLinks()` findet nicht alle Patterns
- Dynamische Navigation (z.B. onClick → router.push) schwer zu detecten

**Aktueller Workaround:**

- Grid Layout (6x10) wenn alle Depth 0
- Funktioniert, aber zeigt keine App-Struktur

---

### 3. Performance bei großen Repos

**Status:** ⚠️ Akzeptabel, aber nicht optimal

**Problem:**

- GitHub API Rate Limit: 5000 requests/hour
- Große Repos (1000+ Files) = 1000+ API Calls
- Langsam bei erster Analyse (~60 Sekunden)

**Optimierungen:**

- File Tree Caching (1h)
- Parallel Fetching
- Limit auf 1000 Files

**Verbesserungspotential:**

- Incremental Analysis (nur changed files)
- Better Caching Strategy
- Webhook-based Updates

---

## 🎯 NÄCHSTE SCHRITTE (DISKUTIERT)

### Screenshot-basierte Screen Previews

**Status:** 💡 Konzept-Phase

**Idee:**
Statt Code zu rendern → Echte Screenshots von deployed/lokaler App

**Workflow:**

1. Clone Repo nach /tmp
2. npm install
3. npm run dev
4. Puppeteer Screenshots von allen Screens
5. Upload zu Supabase Storage
6. Zeige Screenshots in Sitemap

**Vorteile:**

- ✅ Echte UI mit allen Styles
- ✅ Echte Components
- ✅ Mit Daten
- ✅ Funktioniert immer

**Herausforderungen:**

- ⏱️ Zeit (90 Sekunden pro Analyse)
- 💾 Storage (57 Screenshots \* ~100KB = 5.7MB)
- 🔐 Auth-protected Screens
- 🐛 Build-Errors

---

## 📊 STATISTIKEN

### Codebase

- **Frontend Components:** 25+
- **Edge Functions:** 8
- **Lines of Code:** ~5000
- **TypeScript Files:** ~30

### Features

- ✅ **Vollständig:** 60%
- 🚧 **In Arbeit:** 20%
- 📋 **Geplant:** 20%

### Test-Projekt (Scriptony)

- **Screens erkannt:** 57
- **Flows gefunden:** 1036
- **Framework:** Next.js + React
- **Files analyzed:** ~200

---

## 🔧 TECHNISCHE DETAILS

### API Endpoints (Alle)

**visudev-projects:**

- `POST /create` - Projekt erstellen
- `GET /list` - Projekte auflisten

**visudev-analyzer:**

- `POST /analyze` - Code analysieren

**visudev-auth:**

- `GET /github/authorize` - GitHub OAuth Start
- `GET /github/callback` - OAuth Callback

**Geplant:**

- `POST /visudev-appflow/generate` - Flow-Diagramm generieren
- `GET /visudev-data/schema` - DB Schema analysieren
- `GET /visudev-logs/events` - Logs abrufen

### Environment Variables

**Erforderlich:**

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
```

**Optional:**

```
SUPABASE_DB_URL (für direkte DB-Queries)
```

### Dependencies

**Frontend:**

```json
{
  "react": "^18.x",
  "lucide-react": "latest",
  "tailwindcss": "^4.0"
}
```

**Backend (Edge Functions):**

```typescript
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
```

---

## 🎨 DESIGN SYSTEM

### Farben

- **Primary:** #03ffa3 (Türkis/Grün)
- **Background:** #000000 (Sidebar), #f9fafb (Main)
- **Text:** #ffffff (Sidebar), #111827 (Main)
- **Borders:** #1f2937 (Sidebar), #e5e7eb (Main)

### Flow Colors

- **UI Event:** #fbbf24 (Yellow)
- **Function Call:** #3b82f6 (Blue)
- **API Call:** #10b981 (Green)
- **DB Query:** #ef4444 (Red)

### Typography

- **Font:** System UI Stack
- **Headings:** Default weights
- **Code:** Monospace

### Spacing

- Sidebar: 256px (w-64)
- Padding: 4 (p-4), 6 (p-6)
- Gap: 2-4 (gap-2, gap-4)

---

## 🐛 BEKANNTE BUGS

1. **iframe Preview Errors:**
   - Viele Components rendern nicht (fehlende Imports)
   - Console Errors: `<path> attribute d: Expected moveto`

2. **Navigation Detection:**
   - Dynamische Routes nicht erkannt
   - onClick-based Navigation nicht geparst

3. **Performance:**
   - Erste Analyse langsam (60s)
   - Viele GitHub API Calls

---

## ✅ ABGESCHLOSSENE MEILENSTEINE

### Phase 1: Foundation (✅ Done)

- ✅ Project Structure Setup
- ✅ Supabase Integration
- ✅ GitHub OAuth
- ✅ KV Store Implementation
- ✅ Basic UI Components

### Phase 2: Code Analysis (✅ Done)

- ✅ GitHub File Fetching
- ✅ Framework Detection (4 Frameworks)
- ✅ Screen Detection (57 Screens)
- ✅ Flow Detection (1036 Flows)
- ✅ Navigation Link Extraction

### Phase 3: Visualization (✅ Done)

- ✅ Sitemap View (Grid Layout)
- ✅ Screen Cards mit Preview
- ✅ Screen Detail Modal
- ✅ Flow Statistics
- ✅ Pan & Zoom Controls

### Phase 4: Current - Screen Previews (🚧 In Progress)

- ✅ iframe-based Code Rendering
- ⏳ Screenshot-based Rendering (Geplant)
- ⏳ Better Navigation Detection

---

## 📋 TODO / ROADMAP

### Kurzfristig (Next 2 Weeks)

1. **Screenshot Integration:**
   - Puppeteer in Edge Function
   - Repo clonen + npm install
   - Dev Server starten
   - Screenshots aufnehmen
   - Supabase Storage Upload

2. **Navigation Verbesserungen:**
   - Bessere Link-Detection
   - Dynamische Route-Analyse
   - onClick-Handler Parsing

3. **Performance:**
   - Incremental Analysis
   - Better Caching
   - Progress Indicators

### Mittelfristig (Next Month)

1. **Blueprint Screen:**
   - Architecture Visualization
   - Component Dependencies
   - Code Generation

2. **Data Screen:**
   - DB Schema ERD
   - RLS Policy Matrix
   - Migration Timeline

3. **Flow Graph:**
   - Interactive Flow Diagram
   - Click-Path Simulation
   - Impact Analysis

### Langfristig (Next Quarter)

1. **Commenting & Planning:**
   - Screen Annotations
   - Feature Planning
   - Team Collaboration

2. **Integrations:**
   - Jira/Linear
   - Figma
   - Slack Notifications

3. **AI Features:**
   - Code Understanding
   - Impact Prediction
   - Auto-Documentation

---

## 🎓 LESSONS LEARNED

### Was funktioniert gut:

- ✅ GitHub API Integration robust
- ✅ Framework Detection sehr genau
- ✅ KV Store als einfache DB-Lösung
- ✅ Edge Functions Performance
- ✅ Component-based Architecture

### Was schwierig ist:

- ❌ Code → Live Preview ohne Build
- ❌ Dynamische Navigation Detection
- ❌ GitHub Rate Limits bei großen Repos
- ❌ AST Parsing in Deno (fehlende Tools)

### Was wir ändern würden:

- 🔄 Früher auf Screenshots statt Code-Rendering setzen
- 🔄 AST-Parser statt Regex für präzisere Analyse
- 🔄 WebSocket für Live-Updates statt Polling

---

## 📞 SUPPORT & HILFE

### Debugging

- Console Logs: `[ComponentName]` Präfix
- Edge Function Logs: Supabase Dashboard
- GitHub API Errors: Prüfe Rate Limits

### Common Issues

**"No screens found":**

- Repo hat keinen `/pages` oder `/app` Ordner
- Framework nicht supportet

**"Analysis takes too long":**

- Großes Repo (1000+ Files)
- GitHub API Rate Limit reached
- Lösung: Caching, kleineres Repo testen

**"Preview not working":**

- Component hat externe Imports
- Aktuell normal, warte auf Screenshot-Feature

---

## 📄 CHANGELOG

### v2.0.0 (Current)

- ✅ Grid Layout für Sitemap
- ✅ Screen Detail Modal mit Live Preview
- ✅ 57 Screens Detection
- ✅ 1036 Flows Detection
- ✅ Debug Logging

### v1.5.0

- ✅ Code Preview Component
- ✅ Flow Statistics
- ✅ Navigation Link Extraction

### v1.0.0

- ✅ Initial Release
- ✅ Basic Code Analysis
- ✅ GitHub Integration
- ✅ Project Management

---

## 🎯 CONCLUSION

**VisuDEV ist eine funktionierende Code-Analyse-Plattform** mit:

- ✅ Robuster GitHub Integration
- ✅ Präziser Framework & Screen Detection
- ✅ Sauberer Architektur
- ✅ Guter Developer Experience

**Nächster großer Schritt:** Screenshot-basierte Screen Previews für echte UI-Visualisierung.

**Status:** 60% Feature-Complete, 80% Architecture-Solid

---

**Ende der Dokumentation**
