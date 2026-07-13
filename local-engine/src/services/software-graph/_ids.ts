/**
 * Id generation and deduplication for the Software Graph builder.
 */

import type { IdRegistry } from "./_types.js";

export function createId(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.map((p) => String(p).replace(/[:\s]+/g, "-")).join(":")}`;
}

export function uniqueId(
  registry: IdRegistry,
  kind: "node" | "edge" | "scope",
  id: string,
): string {
  const set = kind === "node" ? registry.nodes : kind === "edge" ? registry.edges : registry.scopes;
  if (!set.has(id)) {
    set.add(id);
    return id;
  }
  let counter = 1;
  let candidate = `${id}~${counter}`;
  while (set.has(candidate)) {
    counter += 1;
    candidate = `${id}~${counter}`;
  }
  set.add(candidate);
  return candidate;
}
