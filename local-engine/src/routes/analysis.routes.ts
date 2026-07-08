/**
 * Analysis routes for Local Engine.
 * Location: local-engine/src/routes/analysis.routes.ts
 */

import type { Hono } from "hono";
import type { AnalysisService } from "../services/analysis.service.js";
import type { AnalyzeProjectRequest } from "../types/api.types.js";
import { fail, getErrorStatus, ok } from "./http.js";

export function registerAnalysisRoutes(
  app: Hono,
  analysisService: AnalysisService,
  baseUrl: string,
): void {
  app.post("/api/projects/:projectId/analyze", async (c) => {
    try {
      const body = (await c.req.json()) as AnalyzeProjectRequest;
      const response = await analysisService.startAnalysis(c.req.param("projectId"), body, baseUrl);
      return ok(c, response, 202);
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code?: string }).code)
          : "ANALYSIS_START_FAILED";
      return fail(
        c,
        code,
        error instanceof Error ? error.message : "Failed to start analysis",
        getErrorStatus(error, 500),
      );
    }
  });

  app.get("/api/projects/:projectId/analyze/:runId", async (c) => {
    try {
      const status = await analysisService.getStatus(
        c.req.param("projectId"),
        c.req.param("runId"),
      );
      return ok(c, status);
    } catch (error) {
      return fail(
        c,
        "ANALYSIS_STATUS_FAILED",
        error instanceof Error ? error.message : "Failed to read analysis status",
        getErrorStatus(error, 404),
      );
    }
  });

  app.get("/api/projects/:projectId/analyze/:runId/result", async (c) => {
    try {
      const result = await analysisService.getResult(
        c.req.param("projectId"),
        c.req.param("runId"),
      );
      return ok(c, result);
    } catch (error) {
      return fail(
        c,
        "ANALYSIS_RESULT_FAILED",
        error instanceof Error ? error.message : "Failed to read analysis result",
        getErrorStatus(error, 404),
      );
    }
  });

  app.get("/api/projects/:projectId/blueprint/latest", async (c) => {
    const latest = await analysisService.getBlueprintLatest(c.req.param("projectId"));
    return ok(c, latest);
  });
}
