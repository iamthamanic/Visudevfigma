# Was VisuDEV schon macht vs. was noch fehlt (Screens, Buttons, AST, Vercel)

Vercel selbst „weiß“ nicht, was ein Screen oder Button ist – das kann nur (a) der Browser zur Laufzeit (DOM) oder (b) Build-/Analyse-Tools über den Quellcode. VisuDEV macht **(b)** – statische Code-Analyse mit **AST** (Babel) und optional **(a)** über **postMessage** aus der Live-Preview. **Keine** Vercel-Integration.

---

## Was VisuDEV **schon** macht (Buildzeit, Quellcode, AST + Regex)

### Screen-Erkennung („Screen“ = Route/Page)

- **Next.js App Router:** `app/**/page.tsx` → Route-Pfad aus Dateipfad (z. B. `app/dashboard/page.tsx` → `/dashboard`).
- **Next.js Pages Router:** `pages/**/*.tsx` → Route-Pfad.
- **React Router:** **AST** für `<Route path="..." element={...}>` und `{ path, element }`-Config; Fallback Regex.
- **Nuxt:** `pages/**/*.vue` → Auto-Routing.
- **Heuristik-Fallback:** Dateipfade wie `screens/`, `pages/`, `views/` + Komponentennamen die auf `Screen`/`Page`/`View` enden.

### Navigation / „navigatesTo“

- **AST** (Babel) für `.tsx`/`.jsx`: Aufrufe von `navigate`, `router.push`, `redirect`; JSX `<Link>`, `<NavLink>`, `<a href>`; Literale, Template-Strings, Variablen (dynamisch). **Fallback:** Regex wie bisher.
- Daraus wird pro Screen `navigatesTo: string[]` (Ziel-Pfade) gefüllt.
- Im App Flow werden **Kanten „navigate“** zwischen Screens aus `navigatesTo` gebaut (welcher Screen verlinkt auf welchen).

### Flow-Erkennung (Buttons, Events, API, DB)

- **AST** (Babel) für **UI-Events** in `.tsx`/`.jsx`: `<button>`, `role="button"`, `onClick`/`onSubmit`/… inkl. Handler-Referenz; **Fallback:** Regex zeilenweise.
- **Regex** weiterhin für: **Handler-Funktionen** (`handleXxx`, `onXxx`), **API** (`fetch`, `axios`), **DB** (Supabase, `.query`/`.execute`).
- **Call-Graph (AST):** Pro Datei werden Funktionsdefinitionen und Aufrufe gesammelt; `flow.calls` für `function-call`-Flows wird mit den aufgerufenen Funktionsnamen gefüllt (Kanten „call“ zwischen Flows/Screens).
- Pro Screen werden **Flows** (ui-event, function-call, api-call, db-query) gesammelt; Kanten „call“ aus `flow.calls` gebaut.

### Keine Vercel-Integration

- VisuDEV nutzt **kein** Vercel-API, um Screens/Routes zu „wissen“.
- Daten kommen aus: **GitHub (Repo-Tree + File-Contents)** → Analyzer (AST + Regex + Framework-Heuristiken) → Screens + Flows.
- Optional: `deployed_url` am Projekt (z. B. Vercel-URL) wird nur für Links/Screenshots genutzt, nicht für die Logik „was ist ein Screen“.

### Laufzeit / DOM (optional, Live-Preview)

- **postMessage-Protokoll** `visudev-dom-report`: Die im iframe laufende App kann optional Route und Buttons/Links an VisuDEV senden.
- VisuDEV speichert den Report pro Preview-Knoten und zeigt z. B. „Live: /dashboard · 3 Buttons“ an.
- **Opt-in:** Ohne Snippet in der User-App kommen keine DOM-Reports; siehe [LIVE_DOM_REPORT.md](./LIVE_DOM_REPORT.md).

---

## Was **noch nicht** integriert ist (und optional wäre)

### Vercel-Anbindung (optional)

- Vercel „weiß“ nicht, was ein Screen/Button ist; VisuDEV braucht Vercel dafür **nicht**.
- **Sinnvolle Integration:** Nur für **Deployment-Infos**: z. B. „Welches Vercel-Projekt gehört zu diesem Repo“, „Deployed URL“, „Letzter Build-Status“. Das wäre eine **separate** Integration (Vercel API), nicht Ersatz für Screen/Button-Erkennung.

---

## Kurzfassung

| Aspekt                                 | VisuDEV heute                                                                   | Noch integrieren?                               |
| -------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Screen-Erkennung**                   | Ja, Framework-Konventionen + AST (React Router) / Regex (Next/Nuxt + Heuristik) | –                                               |
| **„Button“ / UI-Events**               | Ja, AST: `<button>`, `role="button"`, onClick/…; Fallback Regex                 | –                                               |
| **Navigation (navigatesTo)**           | Ja, AST (Literal/Template/Variable) + Fallback Regex                            | –                                               |
| **Flow (Events → Functions → API/DB)** | Ja, AST für UI-Events + Call-Graph; Regex für API/DB                            | –                                               |
| **AST**                                | Ja, @babel/parser im Analyzer (Navigation, Routes, UI-Events, Call-Graph)       | –                                               |
| **Laufzeit/DOM**                       | Optional: postMessage `visudev-dom-report` aus Live-Preview-iframe              | Snippet in User-App (siehe LIVE_DOM_REPORT.md). |
| **Vercel**                             | Nein (nur ggf. `deployed_url` am Projekt)                                       | Optional: Vercel-API nur für Deploy-URL/Status. |

**VisuDEV macht „Buildzeit-Quellcode“ mit AST (Babel) und optional Laufzeit-Daten aus der Live-Preview (postMessage).** Vercel bleibt optional für Deploy-Infos.
