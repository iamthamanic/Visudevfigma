/**
 * Why this file exists: keep `utils/api` + local client coupling in one adapter
 * so data services stay portable and testable without mocking the facade.
 */
import { getVisuDevClient, isLocalVisuDevMode } from "../../../lib/visudev-api";
import { api } from "../../../utils/api";
import type { ERDData } from "../types";
import type { DataApiPort, DataServiceResult } from "./data.port";

async function getERDViaRuntime(projectId: string): Promise<DataServiceResult<ERDData>> {
  if (isLocalVisuDevMode()) {
    try {
      const latest = await getVisuDevClient().getDataLatest(projectId);
      if (latest) {
        return {
          success: true,
          data: {
            projectId,
            updatedAt: latest.updatedAt,
            nodes: latest.nodes as ERDData["nodes"],
            tables: latest.tables as ERDData["tables"],
            message: latest.message,
          },
        };
      }
      return {
        success: true,
        data: {
          projectId,
          nodes: [],
          tables: [],
          message:
            "Noch keine Tabellen. Schema analysieren oder DATABASE_URL in der Projekt-.env setzen.",
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch ERD",
      };
    }
  }
  return api.data.getERD(projectId);
}

export const dataApiAdapter: DataApiPort = {
  getSchema: (projectId) => api.data.getSchema(projectId),
  updateSchema: (projectId, data) => api.data.updateSchema(projectId, data),
  getMigrations: (projectId) => api.data.getMigrations(projectId),
  updateMigrations: (projectId, data) => api.data.updateMigrations(projectId, data),
  getERD: getERDViaRuntime,
  updateERD: (projectId, data) => api.data.updateERD(projectId, data),
};
