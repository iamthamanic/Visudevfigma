import type { Hono } from "hono";
import type { AuthController } from "../controllers/auth.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerAuthRoutes(app: Hono, controller: AuthController): void {
  app.get("/github/authorize", asyncHandler(controller.githubAuthorize.bind(controller)));
  app.get("/github/callback", asyncHandler(controller.githubCallback.bind(controller)));
  app.post("/github/session", asyncHandler(controller.githubSession.bind(controller)));
  app.post("/github/repos", asyncHandler(controller.githubRepos.bind(controller)));
  app.post("/supabase/validate", asyncHandler(controller.supabaseValidate.bind(controller)));
  app.post("/supabase/projects", asyncHandler(controller.supabaseProjects.bind(controller)));
}
