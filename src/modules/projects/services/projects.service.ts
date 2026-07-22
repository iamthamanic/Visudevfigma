/**
 * Why: orchestrate projects CRUD through an explicit port after validation.
 */
import type { Project } from "../../../lib/visudev/types";
import type { ProjectCreateInput, ProjectUpdateInput } from "../types";
import type { ProjectsApiPort, ProjectsServiceResult } from "./projects.port";
import {
  normalizeProjectId,
  validateProjectCreateInput,
  validateProjectUpdateInput,
} from "./projects.validation";

export type { ProjectsApiPort, ProjectsServiceResult } from "./projects.port";
export {
  normalizeProjectId,
  validateProjectCreateInput,
  validateProjectUpdateInput,
} from "./projects.validation";

export async function fetchProjects(
  port: ProjectsApiPort,
): Promise<ProjectsServiceResult<Project[]>> {
  return port.getAll();
}

export async function fetchProject(
  projectId: string,
  port: ProjectsApiPort,
): Promise<ProjectsServiceResult<Project>> {
  const resolvedId = normalizeProjectId(projectId);
  if (!resolvedId) return { success: false, error: "No project ID" };
  return port.get(resolvedId);
}

export async function createProject(
  createInput: ProjectCreateInput,
  port: ProjectsApiPort,
): Promise<ProjectsServiceResult<Project>> {
  const validatedCreate = validateProjectCreateInput(createInput);
  if (!validatedCreate.success || !validatedCreate.data) {
    return { success: false, error: validatedCreate.error };
  }
  return port.create(validatedCreate.data);
}

export async function updateProject(
  projectId: string,
  updateInput: ProjectUpdateInput,
  port: ProjectsApiPort,
): Promise<ProjectsServiceResult<unknown>> {
  const resolvedId = normalizeProjectId(projectId);
  if (!resolvedId) return { success: false, error: "No project ID" };
  const validatedUpdate = validateProjectUpdateInput(updateInput);
  if (!validatedUpdate.success || !validatedUpdate.data) {
    return { success: false, error: validatedUpdate.error };
  }
  return port.update(resolvedId, validatedUpdate.data);
}

export async function deleteProject(
  projectId: string,
  port: ProjectsApiPort,
): Promise<ProjectsServiceResult<unknown>> {
  const resolvedId = normalizeProjectId(projectId);
  if (!resolvedId) return { success: false, error: "No project ID" };
  return port.delete(resolvedId);
}
