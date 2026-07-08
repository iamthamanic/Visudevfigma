/** Validates RouteScope inputs before VisuDevGraph scoped mapping. */

import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import {
  normalizeHttpMethod,
  normalizeRoutePath,
} from "../internal/route-normalize.util.ts";

const MAX_FILE_PATH_LEN = 260;
const MAX_ROUTE_PATH_LEN = 120;
const MAX_RELATED_FILES = 50;

export function buildRouteScopeId(
  method: string,
  path: string,
  filePath: string,
  line: number,
  usedBaseIds: Set<string>,
): string {
  const baseId = `${method} ${path}`;
  if (!usedBaseIds.has(baseId)) {
    usedBaseIds.add(baseId);
    return baseId;
  }
  return `${baseId}@${filePath}:${line}`;
}

export function validateRouteScope(
  scope: RouteScope,
  usedBaseIds: Set<string>,
): RouteScope | null {
  if (typeof scope.filePath !== "string") return null;
  const filePath = scope.filePath.trim();
  if (filePath.length === 0 || filePath.length > MAX_FILE_PATH_LEN) return null;
  if (typeof scope.method !== "string" || typeof scope.path !== "string") {
    return null;
  }
  const rawMethod = scope.method.trim();
  const rawPath = scope.path.trim();
  if (rawMethod.length === 0 || rawPath.length === 0) return null;
  if (rawPath.length > MAX_ROUTE_PATH_LEN) return null;
  if (!Number.isFinite(scope.line) || scope.line < 1) return null;

  const method = normalizeHttpMethod(rawMethod);
  const path = normalizeRoutePath(rawPath);
  const line = Math.floor(scope.line);
  const relatedFiles = normalizeRelatedFiles(scope.relatedFiles, filePath);

  return {
    id: buildRouteScopeId(method, path, filePath, line, usedBaseIds),
    method,
    path,
    filePath,
    line,
    relatedFiles,
  };
}

export function validateRouteScopes(scopes: RouteScope[]): RouteScope[] {
  if (!Array.isArray(scopes)) return [];
  const validScopes: RouteScope[] = [];
  const seen = new Set<string>();
  const usedBaseIds = new Set<string>();

  for (const scope of scopes) {
    if (!scope || typeof scope !== "object") continue;
    const normalized = validateRouteScope(scope, usedBaseIds);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    validScopes.push(normalized);
  }

  return validScopes;
}

function normalizeRelatedFiles(
  relatedFiles: unknown,
  filePath: string,
): string[] {
  const ordered: string[] = [filePath];
  const seen = new Set<string>([filePath]);
  if (Array.isArray(relatedFiles)) {
    for (const relatedFile of relatedFiles) {
      if (typeof relatedFile !== "string") continue;
      const trimmed = relatedFile.trim().slice(0, MAX_FILE_PATH_LEN);
      if (trimmed.length === 0 || seen.has(trimmed)) continue;
      seen.add(trimmed);
      ordered.push(trimmed);
    }
  }
  return ordered.slice(0, MAX_RELATED_FILES);
}
