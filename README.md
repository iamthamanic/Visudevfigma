# VisuDEV

Developer tool to visualize deterministic flows from UI elements through code, API, SQL/RLS to backend systems. Screen-centric view with GitHub as source of truth and Supabase as backend.

## Quick start

```bash
npm i
npm run dev
```

Open the URL shown (e.g. http://localhost:3000). Sign in or create an account, connect GitHub in **Settings → Connections**, then create or select a project and run analysis (App Flow, Blueprint, Data).

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start dev server (Vite)        |
| `npm run build`   | Production build               |
| `npm run preview` | Preview production build       |
| `npm run checks`  | Format, lint, typecheck, tests |
| `npm run format`  | Prettier + Deno fmt            |

## Project layout

- `src/` – Frontend (React, TypeScript, CSS Modules). Modules under `src/modules/` (projects, appflow, blueprint, data, logs, settings, shell).
- `src/supabase/functions/` – Edge Functions source (visudev-auth, visudev-analyzer, visudev-projects, etc.). Deploy with `supabase functions deploy <name>`.
- `supabase/` – Config, migrations, and deployed function copies. See `docs/SUPABASE_SETUP.md`.
- `docs/` – Setup and runbooks (`SUPABASE_SETUP.md`, `GITHUB_SECRETS.md`).

## Configuration

- **Supabase:** The app uses **Supabase Cloud** by default (project ref in code). No `.env` required. For local Supabase, see `docs/SUPABASE_SETUP.md` and `.env.example`.
- **GitHub OAuth:** Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Supabase Dashboard → Edge Functions → Secrets for the auth function.

## Design and scope

- Design: Figma [visudev](https://www.figma.com/design/PtKgTCSh5UDKXJeSQ1WkbG/visudev).
- Scope and comparison to similar tools: `inspiration.md` (dependency/call-graph tools, phased plan).
- Implementation details: `src/IMPLEMENTATION_REPORT.md`, `src/IMPLEMENTATION_DETAILS.md`.
- Open work: `tickets2.md`.
