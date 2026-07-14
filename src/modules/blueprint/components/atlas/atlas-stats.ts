/**
 * Atlas aggregate stats derived from SoftwareGraph nodes and blueprint file counts.
 */

import type { BlueprintData, SoftwareGraph } from "../../types";

export interface AtlasAggregateStats {
  systems: number;
  services: number;
  modules: number;
  files: number;
  coveragePercent: number;
}

export function computeAtlasStats(
  graph: SoftwareGraph,
  filesAnalyzed: number,
): AtlasAggregateStats {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const modules = nodes.filter((node) => node.kind === "module").length;
  const services = nodes.filter((node) => node.kind === "service").length;
  const fileNodes = nodes.filter((node) => node.kind === "file").length;
  const systems = nodes.filter((node) =>
    ["application", "service", "runtime"].includes(node.kind),
  ).length;
  const files = filesAnalyzed > 0 ? filesAnalyzed : fileNodes;
  const coveragePercent =
    nodes.length > 0 ? Math.min(100, Math.round((modules / nodes.length) * 100)) : 0;

  return {
    systems,
    services,
    modules,
    files,
    coveragePercent,
  };
}

export function atlasStatsFromBlueprint(blueprint: BlueprintData): AtlasAggregateStats | null {
  if (!blueprint.graph) return null;
  return computeAtlasStats(blueprint.graph, blueprint.filesAnalyzed ?? 0);
}
