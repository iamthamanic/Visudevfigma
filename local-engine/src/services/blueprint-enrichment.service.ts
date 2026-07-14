/**
 * Graph-first blueprint enrichment: legacy diagnostics are derived from SoftwareGraph.
 */

import type { BlueprintDocument, RawBlueprintScan } from "../types/api.types.js";
import { deriveDiagnosticsFromGraph } from "../../../shared/blueprint.js";
import { buildSoftwareGraph } from "./software-graph-builder.service.js";

const DEFAULT_PROFILE = {
  appType: "saas",
  expectedUsers: "small",
  dataSensitivity: "low",
  deployment: "self-hosted",
};

export function enrichBlueprint(scan: RawBlueprintScan): BlueprintDocument {
  const graph = buildSoftwareGraph(scan);
  const { routes, securityMatrix, findings, facts } = deriveDiagnosticsFromGraph(graph);

  return {
    version: 1,
    projectId: scan.projectId,
    repo: scan.localPath,
    branch: "local",
    commitSha: "local",
    analyzedAt: scan.analyzedAt,
    projectProfile: DEFAULT_PROFILE,
    routes,
    securityMatrix,
    findings,
    facts,
    concepts: [],
    filesAnalyzed: scan.filesAnalyzed,
    frameworkHints: [scan.providerId],
    providerMetadata: scan.providerMetadata,
    graph,
  };
}
