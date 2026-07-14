/**
 * Groups projected infrastructure nodes into topology tiers for the diagram.
 */

import type { GraphCanvasNode } from "../../types";

export type TopologyTier =
  | "internet"
  | "loadBalancer"
  | "service"
  | "database"
  | "externalApi"
  | "monitoring";

export interface TopologyNodeRef {
  id: string;
  label: string;
  kind: string;
  tier: TopologyTier;
}

const MAX_LABEL_LENGTH = 80;
const MAX_ID_LENGTH = 200;

export const MAX_TOPOLOGY_NODES_PER_TIER = 12;

const MONITORING_LABELS = new Set(["prometheus", "grafana", "loki", "alertmanager"]);

const MONITORING_SYNTHETIC: TopologyNodeRef[] = [
  { id: "infra:monitor:grafana", label: "Grafana", kind: "external", tier: "monitoring" },
  { id: "infra:monitor:loki", label: "Loki", kind: "external", tier: "monitoring" },
  { id: "infra:monitor:alertmanager", label: "Alertmanager", kind: "external", tier: "monitoring" },
];

const EXTERNAL_API_SYNTHETIC: TopologyNodeRef[] = [
  { id: "infra:ext:hr-data", label: "HR Datenanbieter", kind: "external", tier: "externalApi" },
];

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

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function isInternetNode(node: GraphCanvasNode): boolean {
  return node.kind === "runtime" && normalizeLabel(node.label) === "internet";
}

function isLoadBalancerNode(node: GraphCanvasNode): boolean {
  if (node.kind !== "runtime") return false;
  const label = node.label.toUpperCase();
  return label.includes("LOAD BALANCER") || label.includes("GATEWAY");
}

function isMonitoringNode(node: GraphCanvasNode): boolean {
  if (node.kind !== "external") return false;
  return MONITORING_LABELS.has(normalizeLabel(node.label));
}

function isExternalApiNode(node: GraphCanvasNode): boolean {
  if (node.kind === "external") return !isMonitoringNode(node);
  return node.kind === "service" && normalizeLabel(node.label).includes("email");
}

function isInfraServiceNode(node: GraphCanvasNode): boolean {
  if (node.kind !== "service") return false;
  const label = normalizeLabel(node.label);
  return (
    label === "web app" || label === "api service" || label === "worker" || label === "auth service"
  );
}

export function classifyTopologyTier(node: GraphCanvasNode): TopologyTier | null {
  if (isInternetNode(node)) return "internet";
  if (isLoadBalancerNode(node)) return "loadBalancer";
  if (isMonitoringNode(node)) return "monitoring";
  if (isExternalApiNode(node)) return "externalApi";
  if (node.kind === "table") return "database";
  if (isInfraServiceNode(node)) return "service";
  return null;
}

function mergeSyntheticNodes(
  nodes: TopologyNodeRef[],
  synthetic: TopologyNodeRef[],
  matchTier: TopologyTier,
): TopologyNodeRef[] {
  const existingIds = new Set(nodes.map((node) => node.id));
  const existingLabels = new Set(
    nodes.filter((node) => node.tier === matchTier).map((node) => normalizeLabel(node.label)),
  );

  const additions = synthetic.filter((node) => {
    if (existingIds.has(node.id)) return false;
    if (existingLabels.has(normalizeLabel(node.label))) return false;
    return true;
  });

  return additions.length > 0 ? [...nodes, ...additions] : nodes;
}

export function buildTopologyNodes(nodes: GraphCanvasNode[]): TopologyNodeRef[] {
  const built = nodes
    .map((node) => {
      const id = sanitizeNodeId(node.id);
      const tier = classifyTopologyTier(node);
      if (!id || !tier) return null;
      return {
        id,
        label: sanitizeLabel(node.label),
        kind: node.kind,
        tier,
      };
    })
    .filter((entry): entry is TopologyNodeRef => entry != null);

  const withMonitoring = mergeSyntheticNodes(built, MONITORING_SYNTHETIC, "monitoring");
  return mergeSyntheticNodes(withMonitoring, EXTERNAL_API_SYNTHETIC, "externalApi");
}

export const TOPOLOGY_ENV_FILTERS = ["Produktion", "Staging"] as const;
export const TOPOLOGY_REGION_FILTERS = ["eu-central-1", "us-east-1"] as const;
export const TOPOLOGY_VIEW_FILTERS = ["Logische Topologie", "Physische Topologie"] as const;

export type TopologyEnvFilter = (typeof TOPOLOGY_ENV_FILTERS)[number];
export type TopologyRegionFilter = (typeof TOPOLOGY_REGION_FILTERS)[number];
export type TopologyViewFilter = (typeof TOPOLOGY_VIEW_FILTERS)[number];
