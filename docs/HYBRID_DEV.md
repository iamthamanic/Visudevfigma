# Hybrid Dev (lokal Supabase + lokale Runner)

VisuDEV im **Cursor-Browser** entwickeln, ohne Cloud-Pause oder Deploy-Abhängigkeit. Schwere Preview-Arbeit läuft lokal; Supabase Cloud bleibt optional als Backup/Deploy-Ziel.

## Architektur

```
Cursor Browser (Vite :3005)
    ├── Lokales Supabase (:54321) — Auth, KV, Edge Functions
    ├── Preview Runner (:4000+) — Clone/Build/Preview
    └── Logs Runner (:5000) — optional

Cloud (tzfxbgxnjkthxwvoeyse) — optional: Backup, Deploy, Demo
```

## Standard: `npm run dev`

Seit dem Hybrid-Default startet **`npm run dev`** automatisch lokalen Supabase (Docker), Edge Functions, Vite und Runner. **`dev:hybrid`** ist ein Alias.

Cloud nur bei Bedarf: **`npm run dev:cloud`** (siehe unten „Zurück zu Cloud“).

## Cloud-Anon-Key (nur für `npm run dev:cloud`)

Der anon key liegt **nicht** im Repo. Vor dem ersten Cloud-Dev:

```bash
cp .env.cloud.example .env.local
# VITE_SUPABASE_ANON_KEY aus Supabase Dashboard → Settings → API eintragen
```

**Rotation:** Neuen anon key im Dashboard erzeugen, `.env.local` aktualisieren, Frontend neu bauen/deployen.

Ohne `.env.local` bricht die App beim Start mit klarer Fehlermeldung ab (kein stiller leerer Key).

## Schnellstart

**Voraussetzungen:** Docker Desktop, Supabase CLI (`brew install supabase/tap/supabase`)

```bash
cd visudev-app
npm run dev
```

Das Script:

1. startet `supabase start` (falls nötig)
2. setzt `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` aus `supabase status`
3. startet `supabase functions serve --workdir src`
4. startet Vite + Preview-Runner + Logs-Runner (`dev-auto`)

**Erster Login:** `npm run dev` legt automatisch einen Demo-User an und zeigt die Zugangsdaten in der Konsole.

| Feld     | Wert                 |
| -------- | -------------------- |
| E-Mail   | `demo@visudev.local` |
| Passwort | `visudev-demo`       |

In der App: Sidebar → **Anmelden** → **Als Demo anmelden** (oder Zugangsdaten eingeben).

Manuell anlegen: `npm run seed:demo-user`. Studio: `http://127.0.0.1:54323` → Authentication.

## Manueller Workflow (zwei Terminals)

Terminal 1:

```bash
supabase start --workdir src
supabase functions serve --workdir src
```

Terminal 2:

```bash
# .env.local mit lokalen Keys (siehe .env.hybrid.example)
npm run dev
```

## Cloud-Dev (optional)

```bash
cp .env.cloud.example .env.local   # VITE_SUPABASE_ANON_KEY eintragen
npm run dev:cloud
```

## GitHub OAuth (lokal, optional)

```bash
supabase secrets set --workdir src \
  GITHUB_CLIENT_ID=... \
  GITHUB_CLIENT_SECRET=... \
  GITHUB_REDIRECT_URI=http://127.0.0.1:54321/functions/v1/visudev-auth/github/callback
```

In der GitHub OAuth App die Callback-URL für `127.0.0.1:54321` eintragen.

## Cloud-Backup / Pause vermeiden

Free-Tier-Projekte pausieren nach ~7 Tagen Inaktivität.

**Wöchentlich anpingen:**

```bash
npm run ping:cloud
# oder: bash scripts/ping-cloud-supabase.sh
```

Optional Cron (montags 9:00):

```cron
0 9 * * 1 cd /path/to/visudev-app && bash scripts/ping-cloud-supabase.sh
```

**Cloud reaktivieren:** [Dashboard](https://supabase.com/dashboard/project/tzfxbgxnjkthxwvoeyse) → Restore.

**Deploy Analyzer (wenn Cloud aktiv):**

```bash
bash scripts/supabase-checked.sh functions deploy visudev-analyzer
```

`deno.lock` muss Lockfile v3/v4 sein (Deno 1.46) — siehe `docs/SUPABASE_SETUP.md`.

## Health-Checks

| URL                                                       | Erwartung              |
| --------------------------------------------------------- | ---------------------- |
| `http://127.0.0.1:54321/functions/v1/visudev-auth/health` | `{"success":true,...}` |
| `http://127.0.0.1:3005`                                   | VisuDEV UI             |
| `http://127.0.0.1:4000/health`                            | Preview Runner         |

## Fehlerbehebung

| Problem                                                      | Lösung                                                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Docker nicht erreichbar`                                    | Docker Desktop starten                                                                                       |
| `Lokales Supabase nicht erreichbar`                          | Docker Desktop starten; `supabase start --workdir src` prüfen                                                |
| Login schlägt fehl (lokal)                                   | Neuen User anlegen; E-Mail-Bestätigung in Studio deaktivieren                                                |
| `Unsupported lockfile version 5`                             | `deno.lock` mit Deno 1.46 regenerieren (`docs/SUPABASE_SETUP.md`)                                            |
| `REPOSITORY_ERROR: name resolution failed` (Projekt anlegen) | `npm run dev` neu starten — Edge Functions nutzen dann `http://127.0.0.1:54321` statt docker-internem `kong` |
| CORS auf Logs-Runner (`/health`)                             | Harmlos im Gastmodus; Runner-Ports optional starten                                                          |

## Siehe auch

- `docs/SUPABASE_SETUP.md` — lokaler Stack, Migrationen, Deploy
- `docs/PREVIEW_RUNNER.md` — Preview-Architektur
- `.env.hybrid.example` — Vorlage für `.env.local`
