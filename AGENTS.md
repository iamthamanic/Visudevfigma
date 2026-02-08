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
- **AI review pass criteria:** Only **95% or higher** with **no warnings and no errors** counts as PASS. If the review fails, fix the code and re-run (`bash scripts/run-checks.sh` or push again) until the review passes (rating ≥ 95%, WARNINGS: None, ERRORS: None). No push with &lt; 95% or with any warnings/errors.
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

## Required Setup

- Run `npm run hooks:setup` once to install git hooks.
- Ensure `~/.local/bin` is first in `PATH` so the Supabase shim is used.

## Notes

- Backend stack is Deno/Hono + Supabase (NOT Prisma/Next). Translate generic DDD rules accordingly.
