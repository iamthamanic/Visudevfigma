# Blueprint Wave 3 — Visualization Parity (v3 Zielbild gaps)

Epic: **Close remaining ~70% → ~85-90% Figma alignment from v3 compare report**

Prerequisite: Wave 2 #123–#130 merged on main.

## ECC Runner queue: `blueprint-wave-3-viz-parity`

1. wave3-shell-scan-badge (#149) — P0
2. wave3-inspector-auto-select (#150) — P0
3. wave3-execution-detail-ui (#151) — P1
4. wave3-evolution-git-timeline (#152) — P1
5. wave3-atlas-3d-polish (#153) — P2
6. wave3-diagnostics-scale (#154) — P2

Issues: #149–#154

Reference images: `.qa/evidence/figma-compare-v3/ziel-*.png`

```bash
export ECC_RUNNER_ROOT="$HOME/.cursor/skills/ecc-runner"
cd Visudevfigma
bash "$ECC_RUNNER_ROOT/scripts/sync-queue-to-state.sh"
@ecc-runner-loop continue
```
