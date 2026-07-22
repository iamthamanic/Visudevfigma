/**
 * Why this file exists: keep utils/api coupling in one adapter so the
 * domain service stays portable and testable without mocking the facade.
 */
import { api } from "../../../utils/api";
import type { AppflowApiPort } from "./appflow.port";

export const appflowApiAdapter: AppflowApiPort = {
  getAll: (projectId) => api.appflow.getAll(projectId),
  create: (projectId, data) => api.appflow.create(projectId, data),
  update: (projectId, flowId, data) => api.appflow.update(projectId, flowId, data),
  delete: (projectId, flowId) => api.appflow.delete(projectId, flowId),
};
