/**
 * AutoGuide stub provider — enabled only with VISUDEV_AUTOGUIDE_STUB=1.
 * Location: local-engine/src/providers/autoguide-stub.provider.ts
 */

import type { AnalysisProvider, AnalyzeProjectInput } from "./analysis-provider.js";
import type { LocalEngineAnalysisResult } from "../types/api.types.js";

export class AutoGuideStubProvider implements AnalysisProvider {
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
        message: "AutoGuide stub is enabled (VISUDEV_AUTOGUIDE_STUB=1) but performs no analysis.",
      },
    };
  }
}
