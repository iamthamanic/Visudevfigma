# Acceptance: blueprint-shell-header

## Intent

Global Blueprint shell header with project/branch pills, scan status, notifications, avatar, and actions.

## Criteria

- [ ] `BlueprintShellHeader` renders above all blueprint views
- [ ] Project and branch context visible as pills/badges (German)
- [ ] Scan status chip reflects `scanStatuses.blueprint`
- [ ] Rescan and Export JSON accessible from header
- [ ] Notification bell and avatar placeholders with aria-labels
- [ ] Vitest smoke for `BlueprintShellHeader`
- [ ] `npm run checks` green
