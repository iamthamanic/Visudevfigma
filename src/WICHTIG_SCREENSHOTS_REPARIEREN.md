# 🚨 WICHTIG: Screenshots funktionieren nicht

## **Problem:**

Die Screenshot-API gibt `400 Bad Request` zurück (oder Screenshots fehlen).

## **Ursache:**

Der `SCREENSHOT_API_KEY` in Supabase ist nicht gesetzt oder ungültig.

## **Temporäre Lösung:**

Placeholder-Bilder werden automatisch verwendet, wenn die API fehlschlägt:

```
https://placehold.co/1200x800/1a1a1a/03ffa3?text=Home
```

## **Permanente Lösung**

→ **Siehe [SCREENSHOTS_SETUP.md](../../SCREENSHOTS_SETUP.md)** im Repo-Root für die genauen Schritte:

1. API-Key besorgen (screenshotone.com, apiflash.com, …)
2. In Supabase: **Project Settings → Edge Functions → Secrets** → `SCREENSHOT_API_KEY` setzen
3. `visudev-analyzer` neu deployen
4. Erneut **Analyze** in der App ausführen

**Kein Frontend-Change nötig** – sobald die API erfolgreich antwortet, zeigt die App automatisch echte Screenshots.

---

## **Flows funktionieren jetzt!**

✅ **432 Flows werden erkannt**
✅ **4 Screens werden erkannt** (Home, Projects, Gym, Worlds)
✅ **Flow-Mapping funktioniert** - aber nur für Screens die Code-Dateien haben

**Warum haben manche Screens 0 Flows?**
→ Weil diese Screens aus dem **Fallback** kommen (`/projects`, `/gym`, `/worlds`) und **keine echte Code-Datei** im GitHub Repo haben.

**Lösung:**
Sobald du echte React-Komponenten für diese Screens im Repo hast, werden die Flows automatisch gemapped!
