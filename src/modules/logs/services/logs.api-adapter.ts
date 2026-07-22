/**
 * Why this file exists: keep `utils/api` coupling in one adapter so the
 * domain service stays portable and testable without mocking the facade.
 */
import { api } from "../../../utils/api";
import type { LogsApiPort } from "./logs.port";

export const logsApiAdapter: LogsApiPort = {
  getAll: (projectId) => api.logs.getAll(projectId),
  create: (projectId, data) => api.logs.create(projectId, data),
  deleteAll: (projectId) => api.logs.deleteAll(projectId),
};
