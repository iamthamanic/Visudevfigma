# Supabase-Projekt im Repo sichern & wiederherstellen

Dieses Repo enthält alles, um das Supabase-Projekt später neu aufzusetzen (z. B. nach Löschen des Cloud-Projekts).

## PROJECT_REF

- **PROJECT_REF:** `tzfxbgxnjkthxwvoeyse`
- Dashboard: https://supabase.com/dashboard/project/tzfxbgxnjkthxwvoeyse
- API-URL: `https://tzfxbgxnjkthxwvoeyse.supabase.co`

## Voraussetzungen

- Git-Repo ausgecheckt
- **Supabase CLI:** `brew install supabase/tap/supabase` (macOS)
- **Docker** läuft (für `supabase db dump` und lokale Entwicklung)
- Optional: `jq` für JSON (ansonsten Python)

## Supabase lokal auf dem Mac hosten

Ja – du kannst die **komplette Supabase-Umgebung lokal** auf deinem Mac betreiben (Datenbank, Auth, Storage, Edge Functions, Studio). Alles läuft in Docker.

### 1. Voraussetzungen

- **Docker Desktop** für Mac: [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) – installieren und starten (Docker muss laufen).
- **Supabase CLI** (falls noch nicht vorhanden):
  ```bash
  brew install supabase/tap/supabase
  ```

### 2. Lokalen Stack starten

Am **Repo-Root** (dort liegt `supabase/config.toml`):

```bash
cd /path/to/Visudevfigma
supabase start
```

Beim ersten Mal werden die Docker-Images geladen – das kann einige Minuten dauern. Danach laufen:

- **API (Kong):** `http://localhost:54321`
- **Postgres:** `postgresql://postgres:postgres@localhost:54322/postgres`
- **Supabase Studio (Dashboard):** `http://localhost:54323`
- **Mailpit (E-Mails):** `http://localhost:54324`

Die **Anon Key** und **Service Role Key** für lokal zeigt dir:

```bash
supabase status
```

### 3. Datenbank-Schema anwenden (Migrationen)

Nach dem ersten Start die Migrationen aus dem Repo anwenden:

```bash
supabase db reset
```

Das wendet alle Dateien in `supabase/migrations/` auf die lokale DB an (inkl. Tabelle `kv_store_edf036ef`).

### 4. Edge Functions lokal ausführen (optional)

Functions einzeln testen:

```bash
supabase functions serve
# oder eine Function: supabase functions serve visudev-analyzer
```

Dann erreichst du sie z. B. unter `http://localhost:54321/functions/v1/<function-name>`.

### 5. Frontend auf lokales Supabase umstellen (optional)

Damit die Vite-App gegen die lokale Supabase-Instanz geht:

- In **Supabase Studio** unter `http://localhost:54323` → Project Settings → API: **Project URL** und **anon key** kopieren.
- In `src/utils/supabase/info.tsx` vorübergehend `projectId` und `publicAnonKey` durch die lokalen Werte ersetzen (oder per Env-Variablen steuern).  
  Lokale API-URL ist `http://localhost:54321` (nicht `https://xxx.supabase.co`), die Keys stehen in `supabase status`.

### 6. Nützliche Befehle

| Befehl                      | Bedeutung                                    |
| --------------------------- | -------------------------------------------- |
| `supabase start`            | Lokalen Stack starten                        |
| `supabase stop`             | Stack anhalten (Daten bleiben)               |
| `supabase stop --no-backup` | Anhalten und Daten löschen                   |
| `supabase status`           | URLs und Keys anzeigen                       |
| `supabase db reset`         | DB zurücksetzen und Migrationen neu anwenden |

Damit hast du Datenbank und alles Supabase-Relevante lokal auf deinem Mac.

## Repo-Layout (Standard am Root)

| Pfad                     | Inhalt                                                      |
| ------------------------ | ----------------------------------------------------------- |
| `supabase/config.toml`   | Function-Entrypoints (index.tsx)                            |
| `supabase/migrations/`   | SQL-Migrationen (Schema)                                    |
| `supabase/functions/`    | Edge Functions Source (server, visudev-\*)                  |
| `supabase/backups/`      | DB-Dumps; nur `schema_and_data_LATEST.sql` wird versioniert |
| `docs/SUPABASE_SETUP.md` | Diese Anleitung                                             |
| `src/supabase/`          | Aktuelles Deploy mit `--workdir src` (unverändert)          |

## Login & Link

```bash
# Einmalig: Login (öffnet Browser)
supabase login

# Projekt verlinken (am Repo-Root)
cd /path/to/Visudevfigma
supabase link --project-ref tzfxbgxnjkthxwvoeyse
```

Bei DB-Passwort-Abfrage: Passwort aus Supabase Dashboard → Project Settings → Database verwenden oder `SUPABASE_DB_PASSWORD` setzen.

## Backup erstellen (Schema + Daten)

Docker muss laufen. Am Repo-Root:

```bash
# 1) Schema-Dump
supabase db dump -f supabase/backups/schema_and_data_$(date +%Y%m%d_%H%M%S).sql

# 2) Daten-Dump anhängen (gleicher Timestamp wie oben verwenden oder LATEST nutzen)
# Zuerst Schema in schema_and_data_LATEST.sql, dann:
supabase db dump --data-only -f supabase/backups/_data.sql
cat supabase/backups/_data.sql >> supabase/backups/schema_and_data_LATEST.sql
rm supabase/backups/_data.sql
```

Oder Schema und Daten getrennt halten:

```bash
supabase db dump -f supabase/backups/schema_$(date +%Y%m%d).sql
supabase db dump --data-only -f supabase/backups/data_$(date +%Y%m%d).sql
cp supabase/backups/schema_*.sql supabase/backups/schema_and_data_LATEST.sql
cat supabase/backups/data_*.sql >> supabase/backups/schema_and_data_LATEST.sql
```

## Restore (neues Projekt)

1. Neues Supabase-Projekt im Dashboard anlegen.
2. `supabase link --project-ref <NEUER_REF>`
3. Migrationen anwenden: `supabase db push` (oder SQL aus `supabase/migrations/` im SQL Editor ausführen).
4. Optional: Daten wiederherstellen: `psql` mit Connection-String aus Dashboard, dann `\i supabase/backups/schema_and_data_LATEST.sql` (oder nur Daten-Teil einspielen).
5. Edge Functions deployen: `supabase functions deploy <name>` für jede Function unter `supabase/functions/`.
6. Secrets setzen (Dashboard → Edge Functions → Secrets): z. B. `SCREENSHOT_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (werden beim Deploy gesetzt).

## Im Repo vs. separat sichern

| Im Repo (versioniert)                                        | Separat sichern                                          |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `supabase/config.toml`                                       | DB-Passwort (Dashboard)                                  |
| `supabase/migrations/*.sql`                                  | Service Role Key (Dashboard)                             |
| `supabase/functions/*` (Source)                              | Anon Key (in `src/utils/supabase/info.tsx` für Frontend) |
| `supabase/backups/schema_and_data_LATEST.sql` (ein Snapshot) | Weitere Backup-Dateien (z. B. ältere Dumps)              |
| `docs/SUPABASE_SETUP.md`                                     | GitHub/Supabase OAuth-Tokens (falls genutzt)             |
| PROJECT_REF in Doku und `src/utils/supabase/info.tsx`        |                                                          |

## Edge Functions deployen (Root-Layout)

Am Repo-Root (nach `supabase link`):

```bash
supabase functions deploy server
supabase functions deploy visudev-analyzer
supabase functions deploy visudev-integrations
# … weitere: visudev-data, visudev-logs, visudev-projects, visudev-screenshots, visudev-auth, visudev-appflow, visudev-blueprint, visudev-account, visudev-server
```

Hinweis: Das Frontend und die bestehenden Scripts nutzen weiterhin `src/supabase/` mit `--workdir src`. Das Root-`supabase/` dient der vollständigen Sicherung und dem Restore auf ein neues Projekt.
