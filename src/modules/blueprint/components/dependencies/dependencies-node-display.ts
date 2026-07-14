/**
 * Display helpers for Dependencies inspector — safe text from graph metadata.
 */

import type { SoftwareGraphNode } from "../../types";

const MAX_INSPECTOR_TEXT_LEN = 240;

function truncate(value: string, maxLen = MAX_INSPECTOR_TEXT_LEN): string {
  if (maxLen <= 1) return value.trim().slice(0, 1);
  const trimmed = value.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readDependencyNodeDescription(node: SoftwareGraphNode): string {
  const fromMetadata = readNonEmptyString(node.metadata?.description);
  if (fromMetadata) return truncate(fromMetadata);
  return truncate(`${node.label} — Modul im Abhängigkeits-Graph.`);
}

export function readDependencyNodeFilePath(node: SoftwareGraphNode): string {
  const fromNode = readNonEmptyString(node.filePath);
  if (fromNode) return truncate(fromNode, 120);
  const fromMetadata = readNonEmptyString(node.metadata?.filePath);
  if (fromMetadata) return truncate(fromMetadata, 120);
  return "—";
}

export function readDependencyNodeModuleLabel(node: SoftwareGraphNode): string {
  const fromMetadata = readNonEmptyString(node.metadata?.type);
  if (fromMetadata) return truncate(fromMetadata, 64);
  return node.kind;
}

export function formatDependencyAnalyzedAt(analyzedAt: string): string {
  const parsed = Date.parse(analyzedAt);
  if (Number.isNaN(parsed)) return "—";
  return new Date(parsed).toLocaleDateString("de-DE");
}

export function readDependencyOwner(node: SoftwareGraphNode): string {
  const fromMetadata = readNonEmptyString(node.metadata?.owner);
  return fromMetadata ? truncate(fromMetadata, 64) : "—";
}
