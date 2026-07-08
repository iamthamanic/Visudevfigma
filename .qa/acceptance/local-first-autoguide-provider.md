# Feature: [Local-First P2] AutoGuide production provider

<!-- seeded by @implement from issue #30 on 2026-07-08 -->

## Intent

Replace `autoguide-stub` with a real `@autoguide/*` integration path when packages are available, while keeping `legacy-blueprint-runner` as the default blueprint provider.

## Preconditions

- Local Engine running on `:4317`
- For real AutoGuide scans: built `@autoguide/*` packages and `VISUDEV_AUTOGUIDE_ROOT` pointing at the monorepo (or packages installed/linked)
- Optional stub mode: `VISUDEV_AUTOGUIDE_STUB=1`

## Happy Path

- [ ] `VISUDEV_ANALYSIS_PROVIDER=autoguide` selects AutoGuide for blueprint scans
- [ ] Default remains `legacy-blueprint-runner` when env unset
- [ ] Provider dynamically loads `@autoguide/scanner` and maps output to `BlueprintDocument`
- [ ] Health/capabilities report AutoGuide package availability
- [ ] Documented in `docs/LOCAL_ENGINE.md`
- [ ] `npm run checks` green

## Edge Cases

- [ ] Missing AutoGuide packages → clear `AUTOGUIDE_PACKAGES_UNAVAILABLE` error (not silent stub)
- [ ] `VISUDEV_AUTOGUIDE_STUB=1` keeps legacy stub behavior for dev/CI without packages
- [ ] Missing `localPath` rejected like legacy blueprint provider

## Regression

- [ ] Blueprint via legacy runner unchanged when `VISUDEV_ANALYSIS_PROVIDER` unset
- [ ] Appflow/data providers unchanged

## Assumptions

- AutoGuide static scan (`scanSourceProject` + `mergeScanResults`) is sufficient for blueprint mapping in P2
- Full CLI pipeline (AI, Playwright crawl) is out of scope; optional env flags may be added later

## Implementation Notes

- `autoguide-loader.ts` — detect/load `@autoguide/scanner` from npm link or `VISUDEV_AUTOGUIDE_ROOT`
- `autoguide-to-blueprint.mapper.ts` — maps pages/routes/facts to `BlueprintDocument`
- `autoguide-analysis.provider.ts` — production provider (`id: autoguide`)
- `autoguide-stub.provider.ts` — behind `VISUDEV_AUTOGUIDE_STUB=1`
- `VISUDEV_ANALYSIS_PROVIDER=autoguide` selects AutoGuide for blueprint scans; default unchanged
- `GET /api/capabilities` → `analysis.autoguide` availability
- Docs: `docs/LOCAL_ENGINE.md` AutoGuide section
