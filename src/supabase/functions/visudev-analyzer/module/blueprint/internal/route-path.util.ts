/** Route path normalization for Blueprint route scopes and fact indexing. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { normalizeRoutePath } from "./route-normalize.util.ts";

export function resolveRoutePath(fact: CodeFact): string {
  return normalizeRoutePath(fact.metadata.path ?? "/");
}
