/**
 * Legacy Blueprint analysis via Preview Runner /blueprint/analyze.
 * Location: local-engine/src/providers/legacy-visudev-analysis.provider.ts
 */

import type { AnalysisProvider, AnalyzeProjectInput } from "./analysis-provider.js";
import type { BlueprintDocument, LocalEngineAnalysisResult } from "../types/api.types.js";

type RunnerBlueprintResponse = {
  success?: boolean;
  data?: {
    blueprint?: BlueprintDocument;
    analysisId?: string;
    filesAnalyzed?: number;
    workspaceRoot?: string;
  };
  error?: string;
};

export class LegacyVisuDevAnalysisProvider implements AnalysisProvider {
  readonly id = "legacy-blueprint-runner";
  readonly name = "Legacy Blueprint Runner";

  constructor(private readonly runnerUrl: string) {}

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
          message: "Blueprint analysis requires a local project path.",
        },
      };
    }

    const response = await fetch(`${this.runnerUrl.replace(/\/$/, "")}/blueprint/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: input.projectId,
        localPath,
      }),
    });

    const text = await response.text();
    let payload: RunnerBlueprintResponse;
    try {
      payload = text ? (JSON.parse(text) as RunnerBlueprintResponse) : {};
    } catch {
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: {
          code: "RUNNER_INVALID_JSON",
          message: "Preview Runner returned invalid JSON for blueprint analysis.",
        },
      };
    }

    if (!response.ok || !payload.success || !payload.data?.blueprint) {
      const message = payload.error || `Runner error ${response.status}`;
      const code =
        response.status === 503
          ? "DENO_NOT_AVAILABLE"
          : response.status === 403
            ? "LOCAL_PATH_FORBIDDEN"
            : "BLUEPRINT_ANALYSIS_FAILED";
      return {
        kind: "failed",
        projectId: input.projectId,
        runId: "",
        status: "failed",
        error: { code, message },
      };
    }

    const blueprint = payload.data.blueprint;
    const routes = Array.isArray(blueprint.routes) ? blueprint.routes.length : 0;
    const findings = Array.isArray(blueprint.findings) ? blueprint.findings.length : 0;

    return {
      kind: "blueprint",
      projectId: input.projectId,
      runId: "",
      providerId: "legacy-blueprint-runner",
      status: "success",
      createdAt: new Date().toISOString(),
      summary: {
        routesDetected: routes,
        findings,
        filesAnalyzed: payload.data.filesAnalyzed,
        warnings: 0,
        errors: 0,
      },
      blueprint,
      raw: {
        runnerAnalysisId: payload.data.analysisId,
        workspaceRoot: payload.data.workspaceRoot,
      },
    };
  }
}
