# Screenshots einrichten

Damit die App echte Screenshots statt Placeholder-Bilder anzeigt, muss der Screenshot-API-Key in Supabase gesetzt werden.

## Schritte (einmalig)

1. **API-Key besorgen**
   - Option A: [screenshotone.com](https://screenshotone.com) – Account erstellen, API Key kopieren
   - Option B: [apiflash.com](https://apiflash.com) (z. B. 3000 free/month), [screenshotapi.net](https://screenshotapi.net), [urlbox.io](https://urlbox.io)

2. **Key in Supabase eintragen**
   - [Supabase Dashboard](https://supabase.com/dashboard) → dein Projekt → **Project Settings** (Zahnrad) → **Edge Functions** → **Secrets**
   - Neuen Secret anlegen:
     - Name: `SCREENSHOT_API_KEY`
     - Value: dein API Key (z. B. von screenshotone.com)

3. **Edge Function neu deployen** (damit der neue Secret geladen wird)

   ```bash
   /opt/homebrew/bin/supabase --workdir src functions deploy visudev-analyzer
   ```

   Oder mit Projekt-Shim (nach `brew install ripgrep`):

   ```bash
   npm run supabase:checked -- functions deploy visudev-analyzer --workdir src
   ```

   bzw. falls `supabase` im PATH die echte CLI ist:

   ```bash
   supabase --workdir src functions deploy visudev-analyzer
   ```

4. **Testen**
   - In der App ein Projekt mit **Deployed URL** auswählen und **Analyze** (z. B. App/Flow) starten.
   - Wenn der Key gültig ist, erscheinen echte Screenshots; bei Fehler oder fehlendem Key werden weiterhin Placeholder angezeigt.

## Hinweis

- Das Frontend (`src/lib/visudev/store.tsx`) nutzt bereits echte Screenshot-URLs, sobald die API erfolgreich antwortet.
- Es ist **kein** Code-Change nötig, um Placeholder zu „deaktivieren“ – die App schaltet automatisch auf echte Screenshots, sobald die API funktioniert.
