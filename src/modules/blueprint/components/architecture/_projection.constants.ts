import type { SoftwareGraphEdgeKind, SoftwareGraphNodeKind } from "../../types";

export const ARCHITECTURE_NODE_KINDS: SoftwareGraphNodeKind[] = [
  "domain",
  "layer",
  "module",
  "route",
  "service",
  "repository",
  "table",
  "file",
];

export const DEFAULT_VISIBLE_KINDS: SoftwareGraphNodeKind[] = [
  "domain",
  "layer",
  "module",
  "route",
  "service",
  "repository",
  "table",
];

export const ARCHITECTURE_RELATION_EDGE_KINDS = new Set<SoftwareGraphEdgeKind>([
  "contains",
  "references",
  "implements",
  "data",
]);

export const MAX_ARCHITECTURE_LABEL_LEN = 48;
