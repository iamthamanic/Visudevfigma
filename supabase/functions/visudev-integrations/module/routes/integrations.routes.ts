import type { Hono } from "hono";
import type { IntegrationsController } from "../controllers/integrations.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerIntegrationsRoutes(app: Hono, controller: IntegrationsController): void {
  app.get("/:projectId", asyncHandler(controller.getIntegrations.bind(controller)));
  app.put("/:projectId", asyncHandler(controller.updateIntegrations.bind(controller)));

  app.post("/:projectId/github", asyncHandler(controller.connectGitHub.bind(controller)));
  app.get("/:projectId/github/repos", asyncHandler(controller.getGitHubRepos.bind(controller)));
  app.get(
    "/:projectId/github/branches",
    asyncHandler(controller.getGitHubBranches.bind(controller)),
  );
  app.get("/:projectId/github/content", asyncHandler(controller.getGitHubContent.bind(controller)));
  app.delete("/:projectId/github", asyncHandler(controller.disconnectGitHub.bind(controller)));

  app.post("/:projectId/supabase", asyncHandler(controller.connectSupabase.bind(controller)));
  app.get("/:projectId/supabase", asyncHandler(controller.getSupabaseInfo.bind(controller)));
  app.delete("/:projectId/supabase", asyncHandler(controller.disconnectSupabase.bind(controller)));
}
