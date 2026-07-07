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

## Cloud-Anon-Key (Pflicht für `npm run dev`)

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
cd Visudevfigma
npm run dev:hybrid
```

Das Script:

1. startet `supabase start` (falls nötig)
2. setzt `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` aus `supabase status`
3. startet `supabase functions serve --workdir src`
4. startet Vite + Preview-Runner + Logs-Runner (`dev-auto`)

**Erster Login:** Lokal existieren keine Cloud-User. In der App **Konto erstellen** oder User in Studio anlegen (`http://127.0.0.1:54323`).

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

## Zurück zu Cloud

`.env.local` löschen oder `VITE_SUPABASE_URL` entfernen → App nutzt wieder Cloud-URL + anon key aus `.env.local` (siehe `.env.cloud.example`).

```bash
npm run dev   # Cloud + lokale Preview-Runner (benötigt .env.local mit VITE_SUPABASE_ANON_KEY)
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
0 9 * * 1 cd /path/to/Visudevfigma && bash scripts/ping-cloud-supabase.sh
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

| Problem                             | Lösung                                                            |
| ----------------------------------- | ----------------------------------------------------------------- |
| `Docker nicht erreichbar`           | Docker Desktop starten                                            |
| `Lokales Supabase nicht erreichbar` | `npm run dev:hybrid` statt `npm run dev`                          |
| Login schlägt fehl (lokal)          | Neuen User anlegen; E-Mail-Bestätigung in Studio deaktivieren     |
| `Unsupported lockfile version 5`    | `deno.lock` mit Deno 1.46 regenerieren (`docs/SUPABASE_SETUP.md`) |
| Cloud `INACTIVE`                    | Dashboard → Restore                                               |

## Siehe auch

- `docs/SUPABASE_SETUP.md` — lokaler Stack, Migrationen, Deploy
- `docs/PREVIEW_RUNNER.md` — Preview-Architektur
- `.env.hybrid.example` — Vorlage für `.env.local`
