# Blueprint Wave 2 — Visualization Parity (Zielbilder)

Epic: **VISUDEV UI must match reference images — understand code WITHOUT reading code**

Prerequisite: Wave 1 #105–#113 merged.

## ECC Runner queue: `blueprint-wave-2-viz-parity`

1. wave2-cross-cutting-enrichment (#123) — P0
2. wave2-architecture-viz-parity (#124) — P0
3. wave2-dependencies-viz-parity (#125) — P1
4. wave2-execution-viz-parity (#126) — P1
5. wave2-infrastructure-viz-parity (#127) — P1
6. wave2-atlas-viz-parity (#128) — P2
7. wave2-evolution-viz-parity (#129) — P2
8. wave2-diagnostics-viz-parity (#130) — P2

Issues: #123–#130

Reference images: `.qa/evidence/wave-2-references/`

```bash
export ECC_RUNNER_ROOT="$HOME/.cursor/skills/ecc-runner"
cd Visudevfigma
# state.json: featureSlug=blueprint-wave-2-viz-parity, milestoneFilter=blueprint-wave-2-viz-parity
bash "$ECC_RUNNER_ROOT/scripts/sync-queue-to-state.sh"
@ecc-runner-loop continue
```
