/**
 * Preview routes for Local Engine.
 * Location: local-engine/src/routes/preview.routes.ts
 */

import type { Hono } from "hono";
import type { PreviewService } from "../services/preview.service.js";
import type { StartPreviewInput } from "../types/api.types.js";
import { fail, getErrorStatus, ok } from "./http.js";

export function registerPreviewRoutes(app: Hono, previewService: PreviewService): void {
  app.post("/api/projects/:projectId/preview/start", async (c) => {
    try {
      const body = (await c.req.json().catch(() => ({}))) as Partial<StartPreviewInput>;
      const result = await previewService.startPreview(c.req.param("projectId"), {
        projectId: c.req.param("projectId"),
        ...body,
      });
      return ok(c, result);
    } catch (error) {
      return fail(
        c,
        "PREVIEW_START_FAILED",
        error instanceof Error ? error.message : "Failed to start preview",
        getErrorStatus(error, 500),
      );
    }
  });

  app.get("/api/projects/:projectId/preview/status", async (c) => {
    try {
      const result = await previewService.getPreviewStatus(c.req.param("projectId"));
      return ok(c, result);
    } catch (error) {
      return fail(
        c,
        "PREVIEW_STATUS_FAILED",
        error instanceof Error ? error.message : "Failed to read preview status",
        getErrorStatus(error, 404),
      );
    }
  });

  app.post("/api/projects/:projectId/preview/stop", async (c) => {
    try {
      const result = await previewService.stopPreview(c.req.param("projectId"));
      return ok(c, result);
    } catch (error) {
      return fail(
        c,
        "PREVIEW_STOP_FAILED",
        error instanceof Error ? error.message : "Failed to stop preview",
        getErrorStatus(error, 404),
      );
    }
  });
}
