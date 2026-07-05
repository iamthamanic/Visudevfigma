/**
 * Normalize partial/legacy Blueprint KV payloads for UI consumption.
 * Location: src/modules/blueprint/services/normalize-blueprint.ts
 */

import type { BlueprintData } from "../types";

const EMPTY: BlueprintData = {
  routes: [],
  securityMatrix: [],
  findings: [],
  facts: [],
  frameworkHints: [],
};

export function normalizeBlueprintData(
  raw: Record<string, unknown> | BlueprintData | null | undefined,
): BlueprintData {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY };
  }

  return {
    ...raw,
    routes: Array.isArray(raw.routes) ? raw.routes : [],
    securityMatrix: Array.isArray(raw.securityMatrix) ? raw.securityMatrix : [],
    findings: Array.isArray(raw.findings) ? raw.findings : [],
    facts: Array.isArray(raw.facts) ? raw.facts : [],
    frameworkHints: Array.isArray(raw.frameworkHints) ? raw.frameworkHints : [],
  };
}
