/** BFS call-path expansion across import graph (Blueprint v1). */

import { collectAstCallTargets } from "./ast-call-graph.ts";
import { extractImports } from "./import-resolver.ts";

export interface FileIndexEntry {
  path: string;
  content: string;
}

const MAX_DEPTH = 8;
const MAX_FILES = 40;

export function collectRelatedFiles(
  entryPath: string,
  fileIndex: Map<string, FileIndexEntry>,
): string[] {
  const visited = new Set<string>();
  const queue: Array<{ path: string; depth: number }> = [
    { path: entryPath, depth: 0 },
  ];
  const ordered: string[] = [];

  while (queue.length > 0 && ordered.length < MAX_FILES) {
    const current = queue.shift();
    if (!current || visited.has(current.path)) continue;
    visited.add(current.path);
    if (!fileIndex.has(current.path)) continue;
    ordered.push(current.path);
    if (current.depth >= MAX_DEPTH) continue;

    const entry = fileIndex.get(current.path)!;
    const knownPaths = new Set(fileIndex.keys());
    const astTargets = collectAstCallTargets(
      entry.content,
      current.path,
      knownPaths,
    );
    for (const targetPath of astTargets) {
      if (fileIndex.has(targetPath)) {
        queue.push({ path: targetPath, depth: current.depth + 1 });
      }
    }

    const imports = extractImports(entry.content, current.path, knownPaths);
    for (const imp of imports) {
      if (imp.resolvedPath && fileIndex.has(imp.resolvedPath)) {
        queue.push({ path: imp.resolvedPath, depth: current.depth + 1 });
      }
    }
  }

  return ordered;
}

export function prioritizeBlueprintFiles<T extends { path: string }>(
  files: T[],
): T[] {
  const score = (p: string): number => {
    const path = p.toLowerCase();
    if (/(?:^|\/)schema\.prisma$/.test(path) || path.endsWith(".prisma")) {
      return 100;
    }
    if (/(?:^|\/)manage\.py$/.test(path)) return 99;
    if (/(?:^|\/)urls\.py$/.test(path)) return 98;
    if (/(?:^|\/)(views|viewsets|serializers)\.py$/.test(path)) return 96;
    if (path.includes("supabase/functions")) return 95;
    if (/(?:^|\/)route\.(tsx?|jsx?)$/.test(path)) return 94;
    if (/(?:^|\/)pages\/api\//.test(path)) return 90;
    if (/(?:^|\/)(models|permissions|settings)\.py$/.test(path)) return 88;
    if (path.includes("/apps/meteor/") || path.includes("/apps/api/")) {
      return 86;
    }
    if (path.includes("/validators/")) return 85;
    if (
      path.includes("/repositories/") || path.includes("/packages/database/")
    ) {
      return 80;
    }
    if (path.includes("/services/")) return 75;
    if (path.includes("/middleware")) return 70;
    if (path.includes("/routes/") || path.includes("/api/")) return 65;
    if (path.endsWith(".py")) return 55;
    if (path.includes("server/")) return 60;
    return 0;
  };
  return [...files].sort((a, b) => score(b.path) - score(a.path));
}
