/**
 * Project CRUD routes for Local Engine.
 * Location: local-engine/src/routes/projects.routes.ts
 */

import type { Hono } from "hono";
import type { ProjectService } from "../services/project.service.js";
import type { CreateProjectInput, UpdateProjectInput } from "../types/api.types.js";
import { fail, getErrorStatus, ok } from "./http.js";

export function registerProjectRoutes(app: Hono, projectService: ProjectService): void {
  app.get("/api/projects", async (c) => {
    const projects = await projectService.listProjects();
    return ok(c, projects);
  });

  app.post("/api/projects", async (c) => {
    try {
      const body = (await c.req.json()) as CreateProjectInput;
      if (!body?.name?.trim()) {
        return fail(c, "VALIDATION_ERROR", "name is required", 400);
      }
      const project = await projectService.createProject(body);
      return ok(c, project, 201);
    } catch (error) {
      return fail(
        c,
        "PROJECT_CREATE_FAILED",
        error instanceof Error ? error.message : "Failed to create project",
        getErrorStatus(error, 400),
      );
    }
  });

  app.get("/api/projects/:projectId", async (c) => {
    const project = await projectService.getProject(c.req.param("projectId"));
    if (!project) return fail(c, "PROJECT_NOT_FOUND", "Project not found", 404);
    return ok(c, project);
  });

  app.patch("/api/projects/:projectId", async (c) => {
    try {
      const body = (await c.req.json()) as UpdateProjectInput;
      const project = await projectService.updateProject(c.req.param("projectId"), body);
      return ok(c, project);
    } catch (error) {
      return fail(
        c,
        "PROJECT_UPDATE_FAILED",
        error instanceof Error ? error.message : "Failed to update project",
        getErrorStatus(error, 400),
      );
    }
  });

  app.delete("/api/projects/:projectId", async (c) => {
    try {
      await projectService.deleteProject(c.req.param("projectId"));
      return ok(c, { deleted: true });
    } catch (error) {
      return fail(
        c,
        "PROJECT_DELETE_FAILED",
        error instanceof Error ? error.message : "Failed to delete project",
        getErrorStatus(error, 404),
      );
    }
  });
}
