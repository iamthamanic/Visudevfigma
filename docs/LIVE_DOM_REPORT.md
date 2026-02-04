# Optional: Live-Button-/Route-Report (visudev-dom-report)

Wenn deine App **im VisuDEV Live-Preview-iframe** läuft, kannst du **optional** Route und Buttons/Links aus dem **laufenden DOM** an VisuDEV senden. VisuDEV zeigt dann z. B. „Live: /dashboard · 3 Buttons“ am entsprechenden Preview-Knoten an. Ohne dieses Snippet nutzt VisuDEV weiterhin nur die **Code-Analyse** (AST/Regex).

## Protokoll

Die App im iframe sendet eine `postMessage` an den Parent:

```ts
window.parent.postMessage(
  {
    type: "visudev-dom-report",
    route: string,           // z. B. window.location.pathname
    buttons?: { tagName: string; role?: string; label?: string }[],
    links?: { href: string; text?: string }[],
  },
  "*"
);
```

- **route** (Pflicht): Aktuelle Route, z. B. `window.location.pathname` oder Router-Pfad.
- **buttons** (optional): Liste der erkannten Buttons (z. B. `<button>`, `role="button"`), ggf. mit `label` (Textinhalt).
- **links** (optional): Liste der Links (z. B. `<a href="...">`) mit `href` und optional `text`.

## Snippet (React)

Einmalig oder bei **Route-Änderung** senden (z. B. in einer Layout-Komponente oder im Root):

```tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // oder Next.js usePathname etc.

function VisudevDomReport() {
  const location = useLocation();

  useEffect(() => {
    const sendReport = () => {
      const route = window.location.pathname || location?.pathname || "/";
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map(
        (el) => ({
          tagName: el.tagName.toLowerCase(),
          role: el.getAttribute("role") ?? undefined,
          label: (el.textContent ?? "").trim().slice(0, 80) || undefined,
        }),
      );
      const links = Array.from(document.querySelectorAll('a[href^="/"]')).map((el) => ({
        href: el.getAttribute("href") ?? "",
        text: (el.textContent ?? "").trim().slice(0, 80) || undefined,
      }));
      window.parent.postMessage({ type: "visudev-dom-report", route, buttons, links }, "*");
    };

    sendReport();
  }, [location?.pathname]);

  return null;
}
```

Einbinden z. B. in deinem Router-Layout:

```tsx
<Router>
  <VisudevDomReport />
  <Routes>...</Routes>
</Router>
```

Ohne React Router (z. B. nur `window.location.pathname`):

```tsx
useEffect(() => {
  const route = window.location.pathname || "/";
  const buttons = Array.from(document.querySelectorAll('button, [role="button"]')).map((el) => ({
    tagName: el.tagName.toLowerCase(),
    role: el.getAttribute("role") ?? undefined,
    label: (el.textContent ?? "").trim().slice(0, 80) || undefined,
  }));
  window.parent.postMessage({ type: "visudev-dom-report", route, buttons }, "*");
}, []); // oder bei Route-Change erneut auslösen
```

## Wann sinnvoll?

- **Nur**, wenn die App im **VisuDEV Preview-iframe** läuft (z. B. über den Preview Runner). Dann ist der Parent das VisuDEV-Frontend und wertet die Meldung aus.
- In anderen Kontexten (Standalone-App, andere iframe-Eltern) ignoriert der Parent die Meldung oder sie geht ins Leere – kein Fehler, nur wirkungslos.

## Sicherheit (postMessage target)

- Das Snippet verwendet `"*"` als **targetOrigin**, damit es ohne Konfiguration in jeder Umgebung funktioniert (lokal, Vercel, etc.). In Produktion deiner **eigenen** App (außerhalb des VisuDEV-Iframes) sendet die Meldung an den tatsächlichen Parent; nur VisuDEV reagiert auf `type: "visudev-dom-report"`.
- Wenn du den Report **nur** an VisuDEV senden willst, kannst du vor dem Aufruf prüfen, ob du in einem iframe bist und ob der Parent vermutlich VisuDEV ist (z. B. nur senden wenn `window !== window.top`), und optional eine spezifische `targetOrigin` setzen (z. B. deine VisuDEV-Origin), sobald diese feststeht.

## Kein automatisches Injection

VisuDEV fügt dieses Snippet **nicht** automatisch in dein Repo ein. Du bindest es explizit ein (Copy-Paste oder eigenes Modul). Ein späteres Build-Plugin, das der Nutzer explizit aktiviert, wäre denkbar.
