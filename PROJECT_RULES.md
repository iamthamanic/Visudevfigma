# Projektregeln (Vite + Supabase Edge Functions)

Diese Regeln sind die **übersetzte** Version der DDD/Clean‑Code‑Regeln für dieses Repo.
Ziel: **modulare Domänen**, saubere Typisierung, klare Trennung von UI/Logik und stabile Edge Functions.

---

## ✅ Frontend‑Regeln (Vite/React)

**Modularität**

- Jede Fachdomäne lebt unter `src/modules/<domain>/...`.
- Keine Business‑Logik in `src/components` (dort nur UI/Shared).
- Cross‑Module‑Imports sind verboten. Nur über `src/modules/<domain>/index.ts` exportieren.

**Struktur (Zielbild)**

```
src/
  modules/
    <domain>/
      pages/
      components/
      hooks/
      services/
      styles/
      types/
      index.ts
  components/
    ui/
    common/
  lib/
  styles/
```

**Styling (STRICT – Tailwind Variante 3)**

- CSS‑Modules (`.module.css`/`.module.scss`) als Standard.
- Tailwind **nur** via `@apply` in CSS‑Modules; **keine** Tailwind‑Classes im JSX.
- `className` im JSX nur über `styles.*` (oder `clsx` mit `styles`), keine Utility‑Strings.
- Keine Inline‑Styles (`style={{...}}`).
- Keine hardcoded Colors (`#`, `rgb`, `hsl`); nur CSS‑Variablen aus `src/styles/globals.css`.
- Tailwind‑Color‑Utilities sind verboten; Farben kommen ausschließlich über CSS‑Variablen.

**Code‑Qualität**

- Keine `any`‑Typen. DTOs/VMs in `types`.
- Explizite Return‑Typen für Funktionen.
- Datei ≤ 300 Zeilen, Component ≤ 150 Zeilen, Hook ≤ 50 Zeilen.
- Keine `console.log` in Produktionscode.

**Datenzugriff**

- API‑Calls ausschließlich in `services` je Modul oder `src/lib/api.ts`.
- Keine `fetch`‑Calls in UI‑Komponenten.

---

## ✅ Backend‑Regeln (Supabase Edge Functions)

**Modularität**

- Jede Edge Function ist ein eigenes Modul unter `src/supabase/functions/<domain>/`.
- Keine Cross‑Imports zwischen Functions.

**Struktur (Zielbild)**

```
src/supabase/functions/<domain>/
  index.ts
  services/
  internal/
    repositories/
    middleware/
  validators/
  dto/
  interfaces/
  types/
```

**Dependency Injection (Pflicht)**

- Externe Dependencies (Supabase Client, Logger, Config) per DI.
- Keine hardcoded Werte (z. B. Tabellen/Keys/URLs) im Code.
- Env‑Validation mit Zod (z. B. `env.ts`).

**HTTP‑Layer**

- `index.ts` nur Routing/HTTP (keine Business‑Logik).
- Input‑Validation mit Zod vor Service‑Calls.
- Standard‑Responses:
  - Erfolg: `{ success: true, data, meta? }`
  - Fehler: `{ success: false, error: { code, message, details? } }`

**Code‑Qualität**

- Keine `any`‑Typen.
- Datei ≤ 300 Zeilen (harte Grenze 500).
- Keine `console.*` in Services (Logger via DI).

---

## ⛔ Nicht 1:1 anwendbar (Ignorieren/Anpassen)

- Prisma‑Checks/Express‑Patterns (wir nutzen Supabase + Deno/Hono).
- Next.js‑Spezifika (pages, Next‑Auth, next‑i18next) – dieses Projekt ist Vite.

---

## 🔍 Schnell‑Checks (lokal)

Frontend:

```bash
# Tailwind im JSX (muss 0 sein)
rg "className=\"[^\"]*(?:bg-|text-|flex|grid|p-|m-|w-|h-|rounded|border|shadow)" src -g '*.tsx'

# @apply nur in CSS-Modules (muss 0 sein)
rg "@apply" src -g '*.css' -g '*.scss' | rg -v "\\.module\\."

# Inline Styles (muss 0 sein)
rg "style=\{\{" src -g '*.tsx'

# Hardcoded Colors (muss 0 sein)
rg "#[0-9a-fA-F]{3,8}" src -g '*.ts' -g '*.tsx' -g '*.css' -g '*.scss'
rg "rgb\(|rgba\(|hsl\(|hsla\(" src -g '*.ts' -g '*.tsx' -g '*.css' -g '*.scss'

# any (muss 0 sein)
rg "\bany\b" src -g '*.ts' -g '*.tsx'
```

Backend (Edge Functions):

```bash
# any (muss 0 sein)
rg "\bany\b" src/supabase/functions -g '*.ts' -g '*.tsx'

# console.* (muss 0 in Services)
rg "console\.(log|error|warn)" src/supabase/functions
```
