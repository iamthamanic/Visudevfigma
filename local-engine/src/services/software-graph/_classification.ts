/**
 * Fact classification into node/edge kinds.
 */

import type { Classification } from "./_types.js";

export function classifyFactKind(kind: string): Classification {
  if (kind.startsWith("route") || kind.includes("api-route")) return { nodeKind: "route" };
  if (kind.includes("repository") || kind.includes("repo-read") || kind.includes("repo-write"))
    return { nodeKind: "repository", edgeKind: "implements" };
  if (kind.includes("db-read") || kind.includes("db-write"))
    return { nodeKind: "table", edgeKind: "data" };
  if (kind.includes("external-api") || kind.includes("fetch"))
    return { nodeKind: "external", edgeKind: "external-dependency" };
  if (kind.includes("auth") || kind.includes("session"))
    return { nodeKind: "service", edgeKind: "authenticates" };
  if (kind.includes("validation") || kind.includes("zod") || kind.includes("schema"))
    return { nodeKind: "service", edgeKind: "validates" };
  if (kind.includes("missing-aria")) return { nodeKind: "symbol" };
  return {};
}
