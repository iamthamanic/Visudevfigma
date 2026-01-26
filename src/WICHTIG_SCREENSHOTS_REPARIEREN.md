# 🚨 WICHTIG: Screenshots funktionieren nicht

## **Problem:**
Die Screenshot-API gibt `400 Bad Request` zurück.

## **Ursache:**
Der `SCREENSHOT_API_KEY` in deinem Supabase Dashboard ist entweder:
- ❌ **Nicht gesetzt**
- ❌ **Ungültig**
- ❌ **Falsch konfiguriert**

## **Temporäre Lösung:**
Ich habe Placeholder-Bilder aktiviert:
```
https://placehold.co/1200x800/1a1a1a/03ffa3?text=Home
```

## **Permanente Lösung:**

### **Option 1: screenshotone.com reparieren**
1. Gehe zu https://screenshotone.com
2. Erstelle einen Account (falls nicht vorhanden)
3. Kopiere deinen API Key
4. Öffne Supabase Dashboard → Project Settings → Edge Functions → Secrets
5. Setze `SCREENSHOT_API_KEY` = dein screenshotone.com API Key
6. Deploy die visudev-analyzer Function neu
7. Deaktiviere Placeholder in `/lib/visudev/store.tsx`:
   ```ts
   // ✅ RE-ENABLE: Uncomment this block
   if (activeProject.deployed_url && screensWithScreenshots.length > 0) {
     console.log(`📸 [VisuDEV] Capturing screenshots for ${screensWithScreenshots.length} screens...`);
     // ... screenshot code
   }
   ```

### **Option 2: Anderen Screenshot-Service nutzen**
Falls screenshotone.com zu teuer ist:

**Alternativen:**
- https://apiflash.com (3000 free screenshots/month)
- https://screenshotapi.net (100 free/month)
- https://urlbox.io (free tier)

Ändere in `/supabase/functions/visudev-analyzer/index.tsx`:
```ts
async function captureScreenshot(url: string, apiKey: string): Promise<string> {
  // Beispiel: apiflash.com
  const screenshotApiUrl = new URL('https://api.apiflash.com/v1/urltoimage');
  screenshotApiUrl.searchParams.set('access_key', apiKey);
  screenshotApiUrl.searchParams.set('url', url);
  // ... rest bleibt gleich
}
```

---

## **Flows funktionieren jetzt!**

✅ **432 Flows werden erkannt**
✅ **4 Screens werden erkannt** (Home, Projects, Gym, Worlds)
✅ **Flow-Mapping funktioniert** - aber nur für Screens die Code-Dateien haben

**Warum haben manche Screens 0 Flows?**
→ Weil diese Screens aus dem **Fallback** kommen (`/projects`, `/gym`, `/worlds`) und **keine echte Code-Datei** im GitHub Repo haben.

**Lösung:**
Sobald du echte React-Komponenten für diese Screens im Repo hast, werden die Flows automatisch gemapped!
