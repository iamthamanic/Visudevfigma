import type { Hono } from "hono";
import type { ProjectsController } from "../controllers/projects.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerProjectsRoutes(
  app: Hono,
  controller: ProjectsController,
): void {
  app.get("/", asyncHandler(controller.listProjects.bind(controller)));
  app.get("/:id", asyncHandler(controller.getProject.bind(controller)));
  app.post("/", asyncHandler(controller.createProject.bind(controller)));
  app.put("/:id", asyncHandler(controller.updateProject.bind(controller)));
  app.delete("/:id", asyncHandler(controller.deleteProject.bind(controller)));
}
