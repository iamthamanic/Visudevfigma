# VisuDEV Migration: visudev-server → Local State + visudev-analyzer

## ✅ COMPLETED - Option 2: Analyzer-First-Prototyp

### Was wurde geändert?

**visudev-server wurde komplett entfernt!**

Die App funktioniert jetzt mit:

- ✅ **Frontend Local State** (React Context)
- ✅ **visudev-analyzer Edge Function** (einziger Remote Call)
- ✅ **Kein Backend-Polling** mehr
- ✅ **Keine 404-Errors** mehr

---

## Neue Architektur

```
┌─────────────────┐
│   Frontend      │
│  React + TS     │
└────────┬────────┘
         │
         │ (Local State)
         │
         ├──────────────┐
         │              │
         v              v
┌────────────────┐  ┌──────────────────────┐
│ VisudevProvider│  │ visudev-analyzer     │
│ (Context API)  │  │ Edge Function        │
│                │  │                      │
│ • Projects     │  │ Analysiert:          │
│ • Screens      │  │ • GitHub Repo Code   │
│ • Flows        │  │ • Routing            │
│ • Scans        │  │ • Components         │
└────────────────┘  └──────────────────────┘
```

---

## Neue Dateien

### Core Store

- `/lib/visudev/types.ts` - Type Definitions
- `/lib/visudev/sampleData.ts` - Demo-Daten (Scriptony)
- `/lib/visudev/store.tsx` - **Zentraler Local Store**

### Komponenten (Clean Versions)

- `/components/ProjectsOverviewNew.tsx` - Projekt-Verwaltung
- `/components/AppFlowScreenClean.tsx` - Flow-Visualisierung
- `/components/BlueprintClean.tsx` - Blueprint-Screen
- `/components/DataScreenClean.tsx` - Data-Schema-Screen
- `/components/LogsPanelClean.tsx` - Scan-Logs

### Kompatibilitäts-Layer

- `/contexts/ProjectContext.tsx` - Legacy Wrapper (für backward compatibility)

---

## API-Änderungen

### Alt (visudev-server)

```typescript
// ❌ Viele Backend-Calls mit 404 Errors
GET / visudev - server / projects;
POST / visudev - server / projects;
GET / visudev - server / scans / { id } / status;
POST / visudev - server / scans / { id } / appflow;
GET / visudev - server / appflow / { projectId };
```

### Neu (Local State)

```typescript
// ✅ Nur noch ein Edge Function Call
POST /visudev-analyzer/analyze
{
  repo: "owner/repo",
  branch: "main",
  scanType: "appflow" | "blueprint" | "data"
}
```

Alle CRUD-Operationen (Create, Read, Update, Delete) für Projekte passieren **lokal im Browser State**.

---

## Verwendung

### Hook: `useVisudev()`

```typescript
import { useVisudev } from "./lib/visudev/store";

function MyComponent() {
  const {
    // Projects
    projects, // alle Projekte
    activeProject, // aktuelles Projekt
    setActiveProject, // Projekt aktivieren
    addProject, // neues Projekt erstellen
    updateProject, // Projekt updaten
    deleteProject, // Projekt löschen

    // Scans
    scans, // alle Scans
    scanStatuses, // Status für appflow/blueprint/data
    startScan, // Scan starten
    refreshScanStatus, // Status aktualisieren (no-op in local mode)
  } = useVisudev();

  // Beispiel: Projekt erstellen
  const handleCreate = () => {
    addProject({
      name: "Mein Projekt",
      github_repo: "user/repo",
      github_branch: "main",
      deployed_url: "https://myapp.com",
    });
  };

  // Beispiel: Scan starten
  const handleScan = async () => {
    await startScan("appflow");
    // Calls visudev-analyzer, updates local state
  };
}
```

---

## Tradeoffs

### ❌ Was wir VERLIEREN

- Kein Shared State zwischen Browsern/Tabs
- Keine Backend-Persistenz (alles nur im RAM)
- Keine History/Versionen von Scans
- Keine Multi-User-Collaboration

### ✅ Was wir GEWINNEN

- **Keine 404-Errors** mehr
- **Extrem schnell** (kein Network-Roundtrip für CRUD)
- **Einfache Architektur** (nur 1 Edge Function)
- **Weniger Moving Parts**
- **Bessere Developer Experience**

---

## Nächste Schritte (Optional)

Wenn du später wieder Backend-Persistenz willst:

### Option A: localStorage

```typescript
// In store.tsx
useEffect(() => {
  localStorage.setItem("visudev_projects", JSON.stringify(projects));
}, [projects]);
```

### Option B: Supabase Tabellen

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT,
  github_repo TEXT,
  screens JSONB,
  flows JSONB,
  created_at TIMESTAMP
);
```

Dann im Store die `addProject`/`updateProject` Functions anpassen um zusätzlich zu Supabase zu schreiben.

---

## Deployment

### Was muss deployed sein?

✅ **visudev-analyzer** Edge Function (für Code-Analyse)

### Was NICHT deployed sein muss?

❌ **visudev-server** (komplett entfernt)
❌ **visudev-projects** (nicht mehr nötig)
❌ **visudev-screenshots** (noch nicht integriert, wird später über visudev-analyzer gemacht)

---

## Migration Guide für bestehenden Code

```typescript
// Alt
import { useProject } from "./contexts/ProjectContext";

const { activeProject, startScan } = useProject();

// Neu (empfohlen)
import { useVisudev } from "./lib/visudev/store";

const { activeProject, startScan } = useVisudev();
```

Der alte `useProject()` Hook funktioniert noch (Kompatibilitäts-Layer), aber neuer Code sollte `useVisudev()` nutzen.

---

## Debugging

### Console-Logs aktiviert

```
✅ [VisuDEV] Loaded 5 Scriptony screens with 9 flows
🔄 [VisuDEV] Starting appflow scan for project ...
🔗 [VisuDEV] Calling visudev-analyzer for appflow
✅ [VisuDEV] appflow analysis complete!
```

### Typische Probleme

- **"useVisudev must be used within VisudevProvider"** → Provider fehlt in App.tsx
- **"Cannot read property 'screens' of null"** → activeProject ist null, Projekt erst auswählen

---

## Fazit

Du hast jetzt einen **cleanen, Backend-freien Prototyp** mit:

- ✅ Schnellem Local State
- ✅ Code-Analyse via visudev-analyzer
- ✅ Kein visudev-server Müll
- ✅ Sauberer Architektur

**Der Analyzer-first-Prototyp ist ready! 🚀**
