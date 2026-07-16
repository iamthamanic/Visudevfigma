/** Express app.use mount prefix helpers for module route scopes. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";

function dirnameOf(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "");
}

function normalizeMount(raw: string): string {
  const mount = raw.trim();
  if (!mount.startsWith("/")) return "";
  return mount.replace(/\/$/, "") || "/";
}

/**
 * Build dir → mount map. Only dirs with exactly one unambiguous route-mount
 * are included (avoids wrong prefixes when multiple app.use exist).
 */
export function buildExpressMountPrefixByDir(
  facts: CodeFact[],
): Map<string, string> {
  const mountsByDir = new Map<string, string[]>();
  for (const fact of facts) {
    if (fact.kind !== "route-mount") continue;
    const mount = normalizeMount(String(fact.metadata.path ?? ""));
    if (!mount) continue;
    const dir = dirnameOf(fact.filePath);
    const list = mountsByDir.get(dir) ?? [];
    list.push(mount);
    mountsByDir.set(dir, list);
  }

  const unique = new Map<string, string>();
  for (const [dir, mounts] of mountsByDir) {
    const distinct = [...new Set(mounts)];
    if (distinct.length === 1) unique.set(dir, distinct[0]!);
  }
  return unique;
}

export function lookupExpressMountPrefix(
  routeFilePath: string,
  mountsByDir: Map<string, string>,
): string | null {
  return mountsByDir.get(dirnameOf(routeFilePath)) ?? null;
}

/** Join mount + route path; no-op if path already under mount. */
export function joinMountPrefix(mount: string | null, path: string): string {
  if (!mount || mount === "/") return path;
  if (!path || path === "/") return mount;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (
    normalizedPath === mount ||
    normalizedPath.startsWith(`${mount}/`)
  ) {
    return normalizedPath;
  }
  return `${mount}${normalizedPath}`;
}
