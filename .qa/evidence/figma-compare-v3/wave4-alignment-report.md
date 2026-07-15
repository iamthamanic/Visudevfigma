# Wave 4 Zielbild alignment (post-merge)

Date: 2026-07-15

## Result

**Measured structural alignment: 87%** (Wave 3 baseline ~76%, **+11 pp**).

Target band was **85–90%+** — **hit**.

Raw thumbnail RMS is _not_ used as the primary metric (Atlas 3D camera/crop dominates MSE); scoring matches the Wave 3 feature/structure method.

## Capture gates

- `wave2-viz-compare.spec.ts` — 7/7 passed → `.qa/evidence/figma-compare-v3/current-*.png`
- Wave 4 acceptance Playwright — 5/5 passed

## Per-view (structural)

| View           | Wave 3 |  Wave 4 |      Δ |
| -------------- | -----: | ------: | -----: |
| architecture   |    82% | **88%** |  +6 pp |
| dependencies   |    80% | **86%** |  +6 pp |
| execution      |    72% | **90%** | +18 pp |
| infrastructure |    80% | **85%** |  +5 pp |
| atlas          |    68% | **87%** | +19 pp |
| evolution      |    78% | **82%** |  +4 pp |
| diagnostics    |    70% | **91%** | +21 pp |

## Closed Wave 4 gaps

1. Atlas 3D polish (#156 / PR #165) — category colors, glow, floating labels, NestJS inspector
2. Diagnostics scale (#157 / PR #164) — matrix routes, findings + SQL evidence default
3. Execution FEHLT/payload (#158 / PR #163) — fewer FEHLT; Payload/Response on default path
4. Footer stats (#159 / PR #162) — Module/Dateien Zielbild scale (1.248 / 5.732)
5. Shell runners (#160 / PR #161) — hide App Flow/Logs runners on Blueprint

## Residual (toward 95%+)

- Atlas: full neon cluster glow plates + richer per-cluster metric cards vs Zielbild
- Diagnostics: denser 9-row matrix chrome + filter row polish
- Evolution: mostly unchanged since Wave 3
