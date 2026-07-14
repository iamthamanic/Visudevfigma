/**
 * IDOR mitigation for Local Engine: only projects registered in ~/.visudev/projects.json
 * may be accessed by project-scoped endpoints.
 */

import type { ProjectService } from "../services/project.service.js";
import type { LocalVisuDevProject } from "../types/api.types.js";

export async function assertRegisteredLocalProject(
  projectService: ProjectService,
  projectId: string,
): Promise<LocalVisuDevProject> {
  const project = await projectService.getProject(projectId);
  if (!project) {
    throw Object.assign(new Error("Project not found"), { statusCode: 404, code: "NOT_FOUND" });
  }
  return project;
}
