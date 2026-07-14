/**
 * Figma-aligned accent colors for the seven canonical architecture layers.
 */

export const ARCHITECTURE_LAYER_TYPES = [
  "presentation",
  "ui",
  "hooks",
  "application",
  "data",
  "shared",
  "config",
] as const;

export type ArchitectureLayerType = (typeof ARCHITECTURE_LAYER_TYPES)[number];

export const LAYER_TYPE_LABELS: Record<ArchitectureLayerType, string> = {
  presentation: "Presentation",
  ui: "UI",
  hooks: "Hooks",
  application: "Application",
  data: "Data",
  shared: "Shared",
  config: "Config",
};

const LAYER_TYPE_SET = new Set<string>(ARCHITECTURE_LAYER_TYPES);

export function resolveLayerType(label: string): ArchitectureLayerType | "unknown" {
  const normalized = label.trim().toLowerCase();
  if (LAYER_TYPE_SET.has(normalized)) {
    return normalized as ArchitectureLayerType;
  }

  const wave2Aliases: Record<string, ArchitectureLayerType> = {
    "experience layer": "presentation",
    "application layer": "ui",
    "domain layer": "application",
    "integration layer": "data",
    "persistence layer": "hooks",
    "processing layer": "shared",
    "platform layer": "config",
  };

  return wave2Aliases[normalized] ?? "unknown";
}

export function layerTypeCssVar(layerType: ArchitectureLayerType | "unknown"): string {
  if (layerType === "unknown") return "--color-graph-arch-layer";
  return `--color-arch-layer-${layerType}`;
}
