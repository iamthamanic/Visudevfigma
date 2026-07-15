/**
 * Default architecture layer for inspector auto-select (Figma Zielbild: Application Layer).
 */

import type { SoftwareGraph } from "../types";

const PREFERRED_LAYER_LABEL = "Application Layer";

export function resolveDefaultLayerId(graph: SoftwareGraph | null | undefined): string | null {
  const layers = (graph?.nodes ?? []).filter((node) => node.kind === "layer");
  if (layers.length === 0) return null;

  const preferred = layers.find((layer) => layer.label === PREFERRED_LAYER_LABEL);
  return preferred?.id ?? layers[0]?.id ?? null;
}
