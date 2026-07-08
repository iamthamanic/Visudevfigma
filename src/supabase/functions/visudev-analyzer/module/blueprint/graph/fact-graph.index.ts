/** Table node dedup helpers for VisuDevGraph mapping. */

import { createUniqueGraphId } from "./graph-id.util.ts";

export function resolveTableNodeId(
  table: string,
  tableByLabel: Map<string, string>,
  idRegistry: Set<string>,
  idStemCounters?: Map<string, number>,
): string {
  const existing = tableByLabel.get(table);
  if (existing) return existing;
  const id = createUniqueGraphId(
    "node-table",
    table,
    idRegistry,
    idStemCounters,
  );
  tableByLabel.set(table, id);
  return id;
}
