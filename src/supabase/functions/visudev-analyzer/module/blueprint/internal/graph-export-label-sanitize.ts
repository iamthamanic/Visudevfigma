/** Label and file-path sanitization for VisuDevGraph export. */

import type { VisuDevNode } from "../../dto/graph/visudev-graph.dto.ts";
import {
  redactPiiInText,
  sanitizeSnippetForExport,
  sanitizeUrlForExport,
} from "./snippet-sanitizer.ts";

export function sanitizeFilePathForExport(filePath: string): string {
  return redactPiiInText(filePath.trim()).slice(0, 260);
}

export function sanitizeNodeLabelForExport(node: VisuDevNode): string {
  if (node.kind === "external_api") {
    return sanitizeUrlForExport(node.label);
  }
  return redactPiiInText(sanitizeSnippetForExport(node.label));
}

export function sanitizeScopeLabelForExport(label: string): string {
  return redactPiiInText(sanitizeSnippetForExport(label));
}
