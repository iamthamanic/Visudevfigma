/**
 * Map AutoGuide scan artifacts into VisuDEV BlueprintDocument shape.
 * Location: local-engine/src/lib/autoguide-to-blueprint.mapper.ts
 */

import type { BlueprintDocument } from "../types/api.types.js";
import type { AutoGuideScannerModule } from "./autoguide-loader.js";

type AutoGuideSourceScan = Awaited<ReturnType<AutoGuideScannerModule["scanSourceProject"]>>;
type AutoGuideMergedScan = ReturnType<AutoGuideScannerModule["mergeScanResults"]>;

export type AutoGuideBlueprintInput = {
  projectId: string;
  localPath: string;
  source: AutoGuideSourceScan;
  merged: AutoGuideMergedScan;
};

function countSourceFiles(elements: AutoGuideSourceScan["elements"]): number {
  return new Set(elements.map((element) => element.filePath)).size;
}

function routeMethod(route: string): string {
  if (route.startsWith("api/") || route.includes("/api/")) return "API";
  return "PAGE";
}

export function mapAutoGuideToBlueprint(input: AutoGuideBlueprintInput): BlueprintDocument {
  const analyzedAt = new Date().toISOString();
  const filesAnalyzed = countSourceFiles(input.source.elements);

  const routes = input.source.routes.map((route, index) => ({
    id: `ag-route-${index + 1}`,
    method: routeMethod(route.route),
    path: route.route.startsWith("/") ? route.route : `/${route.route}`,
    filePath: route.filePath,
    line: 1,
    pipeline: [],
    concepts: {},
  }));

  const facts = input.merged.facts.map((fact, index) => {
    const filePath =
      fact.provenance.find((entry) => entry.filePath)?.filePath ??
      input.source.elements[index]?.filePath ??
      "";
    return {
      id: fact.id,
      kind: `autoguide:${fact.key}`,
      filePath,
      line: input.source.elements[index]?.line ?? 1,
      snippet: String(fact.value ?? ""),
      metadata: {
        confidence: fact.confidence,
        provenance: fact.provenance,
      },
    };
  });

  const findings = input.source.elements
    .filter((element) => element.missingAriaLabel)
    .map((element, index) => ({
      id: `ag-finding-${index + 1}`,
      ruleId: "autoguide/missing-aria-label",
      category: "maintainability" as const,
      severity: "low" as const,
      scopeId: element.filePath,
      message: `Missing aria-label on interactive element in ${element.componentName ?? "component"}`,
      expectedState: "labeled",
      actualState: "missing",
      evidenceFactIds: [],
      confidence: 0.8,
    }));

  const securityMatrix = routes.map((route) => ({
    routeId: route.id,
    method: route.method,
    path: route.path,
    auth: { state: "unknown" as const },
    role: { state: "unknown" as const },
    validation: { state: "unknown" as const },
    rateLimit: { state: "n/a" as const },
    db: { state: "n/a" as const },
    rls: { state: "n/a" as const },
    audit: { state: "n/a" as const },
    findingCount: 0,
  }));

  return {
    version: 1,
    projectId: input.projectId,
    repo: input.localPath,
    branch: "local",
    commitSha: "local",
    analyzedAt,
    projectProfile: {
      appType: "saas",
      expectedUsers: "small",
      dataSensitivity: "low",
      deployment: "self-hosted",
    },
    routes,
    securityMatrix,
    findings,
    facts,
    concepts: [],
    filesAnalyzed,
    frameworkHints: ["autoguide"],
    autoguide: {
      pages: input.merged.pages,
      sourceRouteCount: input.source.routes.length,
      elementCount: input.source.elements.length,
    },
  };
}
