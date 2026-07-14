import type {
  SoftwareGraphEdge,
  SoftwareGraphEdgeKind,
  SoftwareGraphNode,
  SoftwareGraphNodeKind,
} from "./software-graph-types";

export const MAX_NODES = 2_500;
export const MAX_EDGES = 5_000;
export const MAX_STRING_LEN = 256;

const NODE_KINDS = new Set<SoftwareGraphNodeKind>([
  "organization",
  "application",
  "domain",
  "layer",
  "module",
  "route",
  "service",
  "repository",
  "table",
  "external",
  "file",
  "symbol",
  "runtime",
]);

const EDGE_KINDS = new Set<SoftwareGraphEdgeKind>([
  "contains",
  "references",
  "implements",
  "imports",
  "calls",
  "api",
  "event",
  "data",
  "external-dependency",
  "validates",
  "authenticates",
]);

function isNodeKind(value: string): value is SoftwareGraphNodeKind {
  return NODE_KINDS.has(value as SoftwareGraphNodeKind);
}

export function isSoftwareGraphNodeKind(value: string): value is SoftwareGraphNodeKind {
  return isNodeKind(value);
}

function isEdgeKind(value: string): value is SoftwareGraphEdgeKind {
  return EDGE_KINDS.has(value as SoftwareGraphEdgeKind);
}

function positiveLine(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

export function isIsoTimestamp(value: string): boolean {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) {
    return false;
  }
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > maxDay) return false;

  return Number.isFinite(Date.parse(value));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export function boundedString(value: unknown, max = MAX_STRING_LEN): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

export function exactString(value: unknown, max = MAX_STRING_LEN): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > max) return undefined;
  return value;
}

export function boundedArray<T>(
  value: unknown,
  maxItems: number,
  guard: (item: unknown) => item is T,
): T[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).filter(guard);
}

export function isSoftwareGraphNode(value: unknown): value is SoftwareGraphNode {
  if (!isRecord(value)) return false;
  const id = exactString(value.id);
  const kind = boundedString(value.kind, 64);
  const label = boundedString(value.label);
  if (!id || !kind || !label || !isNodeKind(kind)) return false;
  if (value.scopeId !== undefined && !exactString(value.scopeId)) return false;
  if (value.filePath !== undefined && !boundedString(value.filePath, 512)) return false;
  if (value.line !== undefined && !positiveLine(value.line)) return false;
  return isRecord(value.metadata);
}

export function isSoftwareGraphEdge(value: unknown): value is SoftwareGraphEdge {
  if (!isRecord(value)) return false;
  const id = exactString(value.id);
  const kind = boundedString(value.kind, 64);
  const sourceId = exactString(value.sourceId);
  const targetId = exactString(value.targetId);
  if (!id || !kind || !sourceId || !targetId || !isEdgeKind(kind)) return false;
  return isRecord(value.metadata);
}
