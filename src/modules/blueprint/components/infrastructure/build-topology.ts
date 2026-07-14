/**
 * Groups projected infrastructure nodes into topology tiers for the diagram.
 */

import type { GraphCanvasNode } from "../../types";

export type TopologyTier = "internet" | "loadBalancer" | "service" | "database";

export interface TopologyNodeRef {
  id: string;
  label: string;
  kind: string;
  tier: TopologyTier;
}

const DATABASE_KINDS = new Set(["table"]);
const SERVICE_KINDS = new Set(["service", "file", "route", "runtime", "external"]);
const MAX_LABEL_LENGTH = 80;
const MAX_ID_LENGTH = 200;

export const MAX_TOPOLOGY_NODES_PER_TIER = 12;

function sanitizeLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Unbenannt";
  return trimmed.length > MAX_LABEL_LENGTH ? `${trimmed.slice(0, MAX_LABEL_LENGTH - 1)}…` : trimmed;
}

function sanitizeNodeId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > MAX_ID_LENGTH) return null;
  return trimmed;
}

export function classifyTopologyTier(kind: string): TopologyTier | null {
  if (DATABASE_KINDS.has(kind)) return "database";
  if (SERVICE_KINDS.has(kind)) return "service";
  return null;
}

export function buildTopologyNodes(nodes: GraphCanvasNode[]): TopologyNodeRef[] {
  return nodes
    .map((node) => {
      const id = sanitizeNodeId(node.id);
      const tier = classifyTopologyTier(node.kind);
      if (!id || !tier) return null;
      return {
        id,
        label: sanitizeLabel(node.label),
        kind: node.kind,
        tier,
      };
    })
    .filter((entry): entry is TopologyNodeRef => entry != null);
}

export const TOPOLOGY_ENV_FILTERS = ["prod", "staging"] as const;
export const TOPOLOGY_REGION_FILTERS = ["eu-west", "us-east"] as const;

export type TopologyEnvFilter = (typeof TOPOLOGY_ENV_FILTERS)[number];
export type TopologyRegionFilter = (typeof TOPOLOGY_REGION_FILTERS)[number];
