/**
 * Atlas cluster category → CSS color variable mapping.
 * Location: src/modules/blueprint/components/atlas/
 */

import { readCssColorVar } from "./atlas-css-color.js";

export type AtlasClusterCategory =
  | "frontend"
  | "backend"
  | "worker"
  | "data"
  | "storage"
  | "external"
  | "security"
  | "default";

const LABEL_CATEGORY: Record<string, AtlasClusterCategory> = {
  "WEB APP": "frontend",
  "API SERVICE": "backend",
  WORKER: "worker",
  DATEN: "data",
  SPEICHER: "storage",
  EXTERN: "external",
  "EXTERNAL APIS": "external",
  SICHERHEIT: "security",
  AUTH: "security",
  POSTGRESQL: "data",
  STORAGE: "storage",
  "AI SERVICE": "backend",
};

const CATEGORY_COLOR_VAR: Record<AtlasClusterCategory, string> = {
  frontend: "--color-graph-module",
  backend: "--color-graph-service",
  worker: "--color-graph-runtime",
  data: "--color-graph-database",
  storage: "--color-graph-repository",
  external: "--color-graph-external",
  security: "--color-bp-rel-auth",
  default: "--color-muted-foreground",
};

export function resolveAtlasClusterCategory(label: string, kind?: string): AtlasClusterCategory {
  const fromLabel = LABEL_CATEGORY[label.trim().toUpperCase()];
  if (fromLabel) return fromLabel;
  if (kind === "table") return "data";
  if (kind === "external") return "external";
  if (kind === "service") return "backend";
  if (kind === "module") return "frontend";
  return "default";
}

export function atlasClusterColorVar(category: AtlasClusterCategory): string {
  return CATEGORY_COLOR_VAR[category];
}

export function resolveClusterPalette(
  categories: AtlasClusterCategory[],
): Record<AtlasClusterCategory, string> {
  const palette = {} as Record<AtlasClusterCategory, string>;
  for (const category of categories) {
    palette[category] = readCssColorVar(atlasClusterColorVar(category));
  }
  return palette;
}
