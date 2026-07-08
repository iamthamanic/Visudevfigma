/**
 * Production AutoGuide blueprint analysis via @autoguide/scanner.
 *
 * Mapping:
 * AutoGuide Page     -> VisuDEV RouteBlueprint
 * AutoGuide Element  -> VisuDEV CodeFact
 * AutoGuide Fact     -> VisuDEV Evidence metadata
 *
 * Location: local-engine/src/providers/autoguide-analysis.provider.ts
 */

import path from "node:path";
import { existsSync } from "node:fs";
import type { AnalysisProvider, AnalyzeProjectInput } from "./analysis-provider.js";
import type { LocalEngineAnalysisResult } from "../types/api.types.js";
import { loadAutoGuideScanner } from "../lib/autoguide-loader.js";
import { mapAutoGuideToBlueprint } from "../lib/autoguide-to-blueprint.mapper.js";

export type AutoGuideProviderOptions = {
  autoguideRoot?: string;
  sourceSubdir?: string;
};

export class AutoGuideAnalysisProvider implements AnalysisProvider {
  readonly id = "autoguide";
  readonly name = "AutoGuide";

  constructor(private readonly options: AutoGuideProviderOptions = {}) {}

  async analyzeProject(input: AnalyzeProjectInput): Promise<LocalEngineAnalysisResult> {
    const localPath = input.localPath ?? input.project.localPath;
    if (!localPath) {
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "MISSING_LOCAL_PATH",
          message: "AutoGuide analysis requires a local project path.",
        },
      };
    }

    const sourceSubdir = this.options.sourceSubdir?.trim() || "src";
    const sourceDir = path.join(localPath, sourceSubdir);
    if (!existsSync(sourceDir)) {
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "AUTOGUIDE_SOURCE_DIR_MISSING",
          message: `AutoGuide source directory not found: ${sourceDir}`,
        },
      };
    }

    let scanner;
    try {
      scanner = await loadAutoGuideScanner(this.options.autoguideRoot);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AutoGuide packages unavailable.";
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "AUTOGUIDE_PACKAGES_UNAVAILABLE",
          message,
        },
      };
    }

    try {
      const source = await scanner.scanSourceProject(sourceDir);
      const merged = scanner.mergeScanResults(source);
      const blueprint = mapAutoGuideToBlueprint({
        projectId: input.projectId,
        localPath,
        source,
        merged,
      });

      const routes = Array.isArray(blueprint.routes) ? blueprint.routes.length : 0;
      const findings = Array.isArray(blueprint.findings) ? blueprint.findings.length : 0;

      return {
        kind: "blueprint",
        projectId: input.projectId,
        runId: "",
        providerId: "autoguide",
        status: "success",
        createdAt: new Date().toISOString(),
        summary: {
          routesDetected: routes,
          findings,
          filesAnalyzed:
            typeof blueprint.filesAnalyzed === "number" ? blueprint.filesAnalyzed : undefined,
          warnings: 0,
          errors: 0,
        },
        blueprint,
        raw: {
          autoguide: {
            sourceDir,
            pageCount: merged.pages.length,
            factCount: merged.facts.length,
          },
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AutoGuide scan failed.";
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "AUTOGUIDE_SCAN_FAILED",
          message,
        },
      };
    }
  }
}
