/**
 * Graph-first blueprint enrichment: legacy diagnostics are derived from SoftwareGraph.
 */

import type { BlueprintDocument, RawBlueprintScan } from "../types/api.types.js";
import { deriveDiagnosticsFromGraph } from "../../../shared/blueprint.js";
import { enrichSoftwareGraphIfThin } from "../../../shared/demo-graph-thin.js";
import { buildSoftwareGraph } from "./software-graph-builder.service.js";

const DEFAULT_PROFILE = {
  appType: "saas",
  expectedUsers: "small",
  dataSensitivity: "low",
  deployment: "self-hosted",
};

export function enrichBlueprint(scan: RawBlueprintScan): BlueprintDocument {
  const built = buildSoftwareGraph(scan);
  const demoEnrichmentEnabled = process.env.VISUDEV_DEMO_ENRICHMENT !== "false";
  const graph = demoEnrichmentEnabled ? enrichSoftwareGraphIfThin(built, scan.projectId) : built;
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
