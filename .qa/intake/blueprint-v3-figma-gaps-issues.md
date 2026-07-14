# Blueprint v3 — Remaining Figma Gaps (Wave 2)

Epic: **Blueprint Figma alignment — shell, footer, and per-view polish**

Prerequisite: UI phase #85–#94 merged.

## ECC Runner queue order

1. blueprint-shell-header (P0)
2. blueprint-footer-status (P0)
3. architecture-layer-stack (P0)
4. infrastructure-topology (P1)
5. execution-trace-ui (P1)
6. dependencies-graph-polish (P1)
7. evolution-timeline (P2)
8. atlas-3d-polish (P2)
9. diagnostics-inspector (P2)

Issues created: #105–#113 (2026-07-14). Bodies are on GitHub; acceptance files in `.qa/acceptance/`.

```bash
export ECC_RUNNER_ROOT="$HOME/.cursor/skills/ecc-runner"
bash "$ECC_RUNNER_ROOT/scripts/sync-queue-to-state.sh"
@ecc-runner-loop continue
```
