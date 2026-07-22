/**
 * Why this file exists: route projects CRUD through VisuDevApiClient so the
 * slice depends on the dispatch layer, not the legacy utils/api facade.
 */
import { getVisuDevClient } from "../../../lib/visudev-api";
import type { ProjectCreateInput, ProjectUpdateInput } from "../types";
import { logProjectsAdapterFailure } from "./projects.errors";
import type { ProjectsApiPort, ProjectsServiceResult } from "./projects.port";

async function wrap<T>(
  operationName: string,
  operation: () => Promise<T>,
  fallbackError: string,
): Promise<ProjectsServiceResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (cause) {
    logProjectsAdapterFailure(operationName, cause);
    return { success: false, error: fallbackError };
  }
}

export const projectsApiAdapter: ProjectsApiPort = {
  getAll: () =>
    wrap("listProjects", () => getVisuDevClient().listProjects(), "Failed to fetch projects"),
  get: (projectId) =>
    wrap("getProject", () => getVisuDevClient().getProject(projectId), "Failed to fetch project"),
  create: (createInput: ProjectCreateInput) =>
    wrap(
      "createProject",
      () => getVisuDevClient().createProject(createInput),
      "Failed to create project",
    ),
  update: (projectId, updateInput: ProjectUpdateInput) =>
    wrap(
      "updateProject",
      async () => {
        await getVisuDevClient().updateProject(projectId, updateInput);
        return undefined;
      },
      "Failed to update project",
    ),
  delete: (projectId) =>
    wrap(
      "deleteProject",
      async () => {
        await getVisuDevClient().deleteProject(projectId);
        return undefined;
      },
      "Failed to delete project",
    ),
};
