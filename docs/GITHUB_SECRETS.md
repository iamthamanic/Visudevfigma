# GitHub Repository Secrets (via CLI)

Repository-Secrets für GitHub Actions (oder Dependabot/Codespaces) lassen sich **nicht per MCP** in diesem Projekt setzen (GitHub-MCP-Server hat hier keine Secret-Tools). Mit der **GitHub CLI** geht es zuverlässig.

## Voraussetzungen

- **GitHub CLI:** `brew install gh` (macOS)
- Einmal anmelden: `gh auth login` (Browser oder Token)

## Einzelne Secrets setzen

```bash
# Aus Terminal (Wert wird interaktiv abgefragt)
gh secret set MY_SECRET_NAME

# Wert direkt übergeben (nicht in History speichern)
gh secret set MY_SECRET_NAME --body "geheimer_wert"

# Aus Umgebungsvariable
gh secret set MY_SECRET_NAME --body "$MY_ENV_VAR"

# Aus Datei (z. B. ein einzelner Key)
gh secret set MY_SECRET_NAME < path/to/secret.txt
```

## Supabase-Secrets (dieses Projekt)

Für dieses Repo: **Supabase-URL und Service-Role-Key** einmalig in GitHub setzen:

```bash
./scripts/github-secrets-supabase.sh
```

Das Script liest `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` aus dem lokalen Supabase (`supabase status -o json`) oder aus den Umgebungsvariablen und setzt sie als Repository-Secrets. Optional: Datei `.env.gh-secrets` (in `.gitignore`) mit weiteren Werten (z. B. `SCREENSHOT_API_KEY`, `ANTHROPIC_API_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) – dann werden diese beim Lauf mit gesetzt.

## Mehrere Secrets aus .env-Datei

Alle Variablen aus einer `.env`-Datei (ohne Kommentare, Format `NAME=value`) als Repo-Secrets setzen:

```bash
./scripts/github-secrets-from-env.sh path/to/.env.ci
```

Die Datei **darf nicht** ins Repo committet werden (in `.gitignore` eintragen).  
Siehe `scripts/github-secrets-from-env.sh` für Details.

## Nützliche Befehle

```bash
gh secret list                    # Alle Repo-Secrets auflisten (Werte werden nicht angezeigt)
gh secret set -f .env.production   # Alle Keys aus .env.production als Secrets setzen
gh secret delete MY_SECRET_NAME    # Secret löschen
```

## Hinweis

- Secrets sind **Repository-** oder **Organization-**weit. Für **Supabase Edge Functions** werden Secrets im Supabase Dashboard (Project Settings → Edge Functions → Secrets) gesetzt, nicht in GitHub – es sei denn, du nutzt GitHub Actions zum Deploy und übergibst sie an `supabase functions deploy`.
- Für **CI/CD** (z. B. Vercel, GitHub Actions): Secrets hier in GitHub hinterlegen und in der Pipeline als Umgebungsvariablen nutzen.
