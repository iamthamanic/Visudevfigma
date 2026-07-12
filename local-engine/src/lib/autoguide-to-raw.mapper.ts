/**
 * Map AutoGuide scan artifacts into a RawBlueprintScan for the shared
 * VisuDEV enrichment pipeline.
 * Location: local-engine/src/lib/autoguide-to-raw.mapper.ts
 */

import type {
  BlueprintAnalysisProviderId,
  RawBlueprintFact,
  RawBlueprintRoute,
  RawBlueprintScan,
} from "../types/api.types.js";
import type { AutoGuideScannerModule } from "./autoguide-loader.js";

type AutoGuideSourceScan = Awaited<ReturnType<AutoGuideScannerModule["scanSourceProject"]>>;
type AutoGuideMergedScan = ReturnType<AutoGuideScannerModule["mergeScanResults"]>;

export type AutoGuideRawInput = {
  projectId: string;
  localPath: string;
  sourceDir: string;
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

export function mapAutoGuideToRaw(input: AutoGuideRawInput): RawBlueprintScan {
  const analyzedAt = new Date().toISOString();
  const filesAnalyzed = countSourceFiles(input.source.elements);

  const routes: RawBlueprintRoute[] = input.source.routes.map((route, index) => ({
    id: `ag-route-${index + 1}`,
    method: routeMethod(route.route),
    path: route.route.startsWith("/") ? route.route : `/${route.route}`,
    filePath: route.filePath,
    line: 1,
    pipeline: [],
    concepts: {},
  }));

  const facts: RawBlueprintFact[] = input.merged.facts.map((fact, index) => {
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

  for (const element of input.source.elements) {
    if (element.missingAriaLabel) {
      facts.push({
        id: `ag-aria-${element.filePath}-${element.line ?? 0}`,
        kind: "autoguide:missing-aria-label",
        filePath: element.filePath,
        line: element.line ?? 1,
        snippet: `Missing aria-label on interactive element in ${element.componentName ?? "component"}`,
        metadata: {
          componentName: element.componentName,
          handlerName: element.handlerName,
        },
      });
    }
  }

  const providerId: BlueprintAnalysisProviderId = "autoguide";

  return {
    providerId,
    projectId: input.projectId,
    localPath: input.localPath,
    analyzedAt,
    routes,
    facts,
    filesAnalyzed,
    providerMetadata: {
      autoguide: {
        sourceDir: input.sourceDir,
        pageCount: input.merged.pages.length,
        factCount: input.merged.facts.length,
        elementCount: input.source.elements.length,
        pages: input.merged.pages,
      },
    },
  };
}
