/**
 * Future AutoGuide integration.
 *
 * Planned dependencies:
 * - @autoguide/core
 * - @autoguide/scanner
 * - @autoguide/runtime
 * - @autoguide/playwright
 *
 * Mapping:
 * AutoGuide Page        -> VisuDEV Screen
 * AutoGuide Element     -> VisuDEV UI Node
 * AutoGuide Feature     -> VisuDEV Flow Root
 * AutoGuide Flow        -> VisuDEV Flow
 * AutoGuide Fact        -> VisuDEV Evidence
 * AutoGuide Relation    -> VisuDEV Graph Edge
 * AutoGuide Confidence  -> VisuDEV Confidence Badge
 * AutoGuide Recommendation -> VisuDEV Recommendation
 *
 * Location: local-engine/src/providers/autoguide-analysis.provider.ts
 */

import type { AnalysisProvider, AnalyzeProjectInput } from "./analysis-provider.js";
import type { LocalEngineAnalysisResult } from "../types/api.types.js";

export class AutoGuideAnalysisProvider implements AnalysisProvider {
  readonly id = "autoguide-stub";
  readonly name = "AutoGuide (stub)";

  async analyzeProject(_input: AnalyzeProjectInput): Promise<LocalEngineAnalysisResult> {
    return {
      kind: "failed",
      projectId: _input.projectId,
      runId: "",
      status: "failed",
      error: {
        code: "AUTOGUIDE_PROVIDER_NOT_IMPLEMENTED",
        message: "AutoGuide provider is reserved but not implemented in Phase 1.",
      },
    };
  }
}
