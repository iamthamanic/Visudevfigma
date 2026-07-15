# Acceptance: wave4-shell-runner-badges

## Intent

On Blueprint views, App Flow / Logs runner badges are hidden or visually de-emphasized so they do not clutter Zielbild parity screenshots.

## Reference screenshot

`.qa/evidence/figma-compare-v3/ziel-architecture.png` (clean header — no runner strip)

## Visual checklist

- [ ] On Blueprint routes, App Flow Runner and Logs Runner badges are not prominent in the first viewport
- [ ] Prefer `display:none` / unmount on `/blueprint/*` (or data-blueprint-hide-runners)
- [ ] Non-Blueprint pages may still show runner badges
- [ ] Scan-abgeschlossen badge remains visible

## Playwright screenshot gate

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test tests/e2e/wave4-shell-runner-badges.spec.ts --project=chromium
```

- Navigate Blueprint Atlas → assert runner badge testids not visible (or count 0)
- Screenshot shell header

## Criteria

- [ ] All visual checklist items pass
- [ ] `npm run checks` green
