/**
 * Aggregated graph counters for Blueprint footer status bar.
 * Prefers graph.metrics (Zielbild demo scale) when present.
 * Location: src/modules/blueprint/components/
 */

import type { SoftwareGraph } from "../types";

export interface BlueprintGraphStats {
  moduleCount: number;
  fileCount: number;
  dependencyCount: number;
}

const MODULE_KINDS = new Set(["module", "domain", "service"]);
const FILE_KIND = "file";

const DEPENDENCY_EDGE_KINDS = new Set([
  "imports",
  "calls",
  "api_call",
  "database",
  "event",
  "auth",
  "validation",
  "references",
  "depends_on",
]);

function metricValue(graph: SoftwareGraph, name: string): number | null {
  const metrics = Array.isArray(graph.metrics) ? graph.metrics : [];
  const match = metrics.find((metric) => metric.name === name);
  if (!match || !Number.isFinite(match.value)) return null;
  return Math.max(0, Math.round(match.value));
}

export function computeBlueprintGraphStats(
  graph: SoftwareGraph | null | undefined,
  filesAnalyzed = 0,
): BlueprintGraphStats {
  if (!graph) {
    return { moduleCount: 0, fileCount: 0, dependencyCount: 0 };
  }

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  let moduleCount = 0;
  let fileCount = 0;

  for (const node of nodes) {
    if (MODULE_KINDS.has(node.kind)) moduleCount += 1;
    if (node.kind === FILE_KIND) fileCount += 1;
  }

  const dependencyCount = edges.filter((edge) => DEPENDENCY_EDGE_KINDS.has(edge.kind)).length;
  const metricModules = metricValue(graph, "modules");
  const metricFiles = metricValue(graph, "files");

  return {
    moduleCount: metricModules ?? moduleCount,
    fileCount: metricFiles ?? (filesAnalyzed > 0 ? filesAnalyzed : fileCount),
    dependencyCount,
  };
}

export function formatRelativeFreshness(updatedAt: string | undefined): string {
  if (!updatedAt) return "—";
  const parsed = Date.parse(updatedAt);
  if (!Number.isFinite(parsed)) return "—";

  const deltaMs = Date.now() - parsed;
  if (deltaMs < 0) return "gerade eben";

  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std`;

  const days = Math.floor(hours / 24);
  return `vor ${days} Tg`;
}
