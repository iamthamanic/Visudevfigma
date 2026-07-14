import type { SoftwareGraphEdgeKind } from "../../types";

export const DEPENDENCY_EDGE_KINDS = [
  "imports",
  "calls",
  "api",
  "event",
  "data",
] as const satisfies readonly SoftwareGraphEdgeKind[];

export type DependencyEdgeKind = (typeof DEPENDENCY_EDGE_KINDS)[number];

export const DEFAULT_VISIBLE_DEPENDENCY_KINDS: DependencyEdgeKind[] = [...DEPENDENCY_EDGE_KINDS];

export const DEPENDENCY_EDGE_LABELS: Record<DependencyEdgeKind, string> = {
  imports: "Import",
  calls: "Call",
  api: "API",
  event: "Event",
  data: "Data",
};
