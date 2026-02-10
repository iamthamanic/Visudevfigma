# AGENTS.md (VisuDEV)

## Purpose

This repo enforces strict modular architecture and quality gates. Agents must follow these rules to keep code clean, secure, and consistent.

## Mandatory Workflow (Do NOT bypass)

- Always run checks before push/deploy.
- Preferred: `npm run checks`
- `npm run push` or `git push` run pre-push checks automatically (AI review required; no skip).
- `supabase ...` uses the shim and runs checks automatically before invoking Supabase.
- Never call the real Supabase binary directly. Use the shim (`supabase`) or `npm run supabase:checked`. The package exposes `supabase` and `push` in `bin` (postinstall symlinks in `node_modules/.bin`).
- If any check fails, fix it before proceeding. Do not bypass the shim or hooks.
- **Zero warnings policy:** Lint and AI review must pass with **no warnings**. ESLint is run with `--max-warnings 0`; any warning fails the pipeline. Push/deploy is only allowed when all checks pass.
- AI review (Codex) runs by default after checks. You can skip it for the shim with `--no-ai-review` or `SKIP_AI_REVIEW=1`, but **pushes require AI review** (no skip). AI review is a **required** check in the pipeline (not optional): if it fails, the pipeline fails.
- **AI review pass criteria:** Strict architect checklist (SOLID, performance, security, robustness, maintainability). Only **score ≥ 95%** and **verdict ACCEPT** count as PASS. Deductions are listed per checklist point; fix and re-run until the review passes. No push with verdict REJECT or score &lt; 95%.
- **When AI review REJECTs — address broadly:** Do not fix only the single mentioned point. For each **affected file** from the deductions, do **one pass** over the full checklist (IDOR / auth, rate limiting, input validation, error handling, edge cases). Then commit and re-run. This avoids the loop where the next run flags another item in the same code. See `docs/AI_REVIEW_WHY_NEW_ERRORS_AFTER_FIXES.md` for rationale and a per-route checklist.
- **Agent after failed AI review (diff or full):** When the AI review fails (REJECT or score &lt; 95%), the agent must **automatically** read the latest review in `.shimwrapper/reviews/` (most recent file), address all deductions in the affected files (broad pass per file as above), then **re-run the full check pipeline** (including AI review in the same mode: diff or full). Repeat until the review passes or the user instructs otherwise. This applies to both CHECK_MODE=diff and CHECK_MODE=full (chunked); in full mode, fix issues from all chunk sections before re-running.
- **AI review timeout:** If the AI review aborts with "timed out", increase `TIMEOUT_SEC` in `scripts/ai-code-review.sh` (e.g. 420 → 600) and re-run until the review completes. Do not reduce scope or skip the review; raise the timeout until it passes.
- **CHECK_MODE (AI review scope):** Default may be `full` or `diff` (see `scripts/ai-code-review.sh`). With **CHECK_MODE=full**, the AI review runs **per directory** (src, supabase, scripts): each chunk is sent in full (up to ~150KB per chunk), so feedback is based on the real code, not a truncated head/tail. With **CHECK_MODE=diff**, only changes (staged/unstaged or pushed commits) are reviewed. Run full-codebase review: `CHECK_MODE=full bash scripts/run-checks.sh`. **Full-Modus mit Loop (bis alle Chunks ≥95%):** `bash scripts/run-checks.sh --until-95` — Teil des Full-Modus; führt den vollen Check wiederholt aus, nach jedem Fehlschlag: Review anzeigen, „Fix, commit, Enter zum Retry“; stoppt erst wenn die gesamte Codebase durchfällt (alle Chunks ≥95%). Kein `--chunk` zusammen mit `--until-95`. Format, lint, typecheck, etc. always run on the full codebase.
- Reviews are saved to `.shimwrapper/reviews/` (gitignored). If the shim or push prints Token usage + review output, include it in your response.

## Repository Structure

### Frontend (Vite + React)

- Domain modules live in `src/modules/<domain>/...`.
- No cross-module imports. Export only via each module's `index.ts`.
- `src/components/` is for shared UI only (no business logic).
- `src/lib/` is for shared utilities, API client, and helpers.

Recommended module layout:

```
src/modules/<domain>/
  pages/
  components/
  hooks/
  services/
  styles/
  types/
  index.ts
```

### Backend (Supabase Edge Functions)

- Each function is isolated under `src/supabase/functions/<domain>/`.
- No cross-imports between functions.

Recommended function layout:

```
src/supabase/functions/<domain>/
  index.tsx            # HTTP routing only
  services/
  internal/
    repositories/
    middleware/
  validators/
  dto/
  types/
```

## Frontend Rules (Strict)

### TypeScript

- `strict: true`, `noImplicitAny: true`.
- No `any` in new code.
- Explicit return types for exported functions.
- File size <= 300 lines; component <= 150 lines; hook <= 50 lines.
- No `console.log` in production code.
- No `@ts-ignore` without a ticket/reference.

### Styling

- CSS Modules only (`.module.css/.module.scss`).
- No Tailwind classes in JSX. `@apply` only in CSS Modules, used sparingly.
- No inline styles (`style={{ ... }}` forbidden).
- No hardcoded colors outside `src/styles/globals.css`. Use CSS variables.

### Data Access

- API calls only in module services or `src/lib/api.ts`.
- No `fetch`/`axios` in UI components.
- Pages should be thin; move logic into hooks/services.
- Prefer `react-hook-form` + Zod for forms and validation.

### Accessibility

- Semantic HTML for interactive elements (no `<div>` as buttons).
- Keyboard navigation and `aria-label` for icon-only controls.

## Backend Rules (Supabase Edge Functions)

- Dependency Injection required (Supabase client, logger, config).
- No hardcoded secrets or URLs. Use env + validation (Zod).
- Validate all inputs with Zod.
- `index.tsx` should only handle routing/HTTP.
- Standard response format:
  - Success: `{ success: true, data, meta? }`
  - Error: `{ success: false, error: { code, message, details? } }`
- Avoid `console.*` in services; use injected logger.
- Logger is required (never optional).
- No Prisma/Next patterns in backend (Deno + Hono only).

## Naming Conventions

- Components: `PascalCase` (e.g., `UserCard.tsx`)
- Hooks: `useX` (e.g., `useAuth.ts`)
- Services: `camelCase` (e.g., `authService.ts`)
- DTOs/Types: `PascalCase` (e.g., `UserDto`)
- CSS Modules: `kebab-case.module.scss`

## Security

- Never expose secrets in responses or logs.
- Validate and sanitize all inputs.
- Do not store tokens in localStorage.

## Testing

- Frontend: Vitest (`npm run test:run`).
- Backend: Deno tests when introduced (`deno test`).

## Quality Gates (what `npm run checks` does)

- Frontend: format check, lint, typecheck, tests, project rules, build (build always).
- Backend (only when backend files change): `deno fmt --check`, `deno lint`.
- Shim/push add-ons: AI review (Codex), `npm audit` (frontend), `deno audit` (backend), optional Snyk (`SKIP_SNYK=1` to skip).

## Required Setup (damit alles funktioniert)

1. **Git Hooks (einmalig):** `npm run hooks:setup` — setzt `core.hooksPath=.githooks`, damit bei `git push` der Pre-Push-Hook (Checks + AI-Review) läuft.
2. **Supabase-Shim:** `~/.local/bin` zuerst in der `PATH`, damit `supabase` das Projekt-Shim (checks vor Supabase-Befehlen) nutzt.
3. **AI-Review (Codex):** Codex CLI installieren und `codex login` — sonst wird die AI-Review übersprungen (Push kann dann trotzdem durchgehen, wenn der Hook sie nicht erzwingt). Für vollständige Bewertung (inkl. Deductions-Parsing) optional **jq** installieren.
4. **Runner (optional):** Für AppFlow/Preview: `npx visudev-runner` starten (oder im Repo `npm run dev`, dann startet der Runner mit). Keine weiteren Code-Änderungen nötig.
5. **Push mit Checks:** `npm run push` oder `git push` — beides läuft über Checks; bei Push ist AI-Review Pflicht (kein Skip). Bei Problemen: `npm run checks` einzeln ausführen und Fehler beheben.

## Notes

- Backend stack is Deno/Hono + Supabase (NOT Prisma/Next). Translate generic DDD rules accordingly.
