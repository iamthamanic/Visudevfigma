/**
 * Why: enforce projectId rules before a runtime call, and require an explicit
 * port so production wiring and tests share the same path.
 */
import type {
  DataSchema,
  DataSchemaUpdateInput,
  ERDData,
  ERDUpdateInput,
  MigrationEntry,
} from "../types";
import type { DataApiPort, DataServiceResult } from "./data.port";

export type { DataApiPort, DataServiceResult } from "./data.port";

export function normalizeProjectId(projectId: string): string | null {
  const trimmed = projectId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requireProjectId(projectId: string): DataServiceResult<string> {
  const id = normalizeProjectId(projectId);
  if (!id) return { success: false, error: "No project ID" };
  return { success: true, data: id };
}

export async function fetchSchema(
  projectId: string,
  port: DataApiPort,
): Promise<DataServiceResult<DataSchema>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  return port.getSchema(id.data);
}

const MAX_JSON_CHARS = 200_000;
const MAX_MIGRATION_ENTRIES = 2_000;

function payloadSizeOk(value: unknown): boolean {
  try {
    return JSON.stringify(value).length <= MAX_JSON_CHARS;
  } catch {
    return false;
  }
}

export async function saveSchema(
  projectId: string,
  data: DataSchemaUpdateInput,
  port: DataApiPort,
): Promise<DataServiceResult<unknown>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { success: false, error: "Invalid schema payload" };
  }
  if (!payloadSizeOk(data)) {
    return { success: false, error: "Schema payload too large" };
  }
  return port.updateSchema(id.data, data);
}

export async function fetchMigrations(
  projectId: string,
  port: DataApiPort,
): Promise<DataServiceResult<MigrationEntry[]>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  return port.getMigrations(id.data);
}

export async function saveMigrations(
  projectId: string,
  data: MigrationEntry[],
  port: DataApiPort,
): Promise<DataServiceResult<unknown>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  if (!Array.isArray(data)) {
    return { success: false, error: "Invalid migrations payload" };
  }
  if (data.length > MAX_MIGRATION_ENTRIES) {
    return { success: false, error: "Too many migration entries" };
  }
  if (data.some((entry) => entry === null || typeof entry !== "object" || Array.isArray(entry))) {
    return { success: false, error: "Invalid migration entry" };
  }
  if (!payloadSizeOk(data)) {
    return { success: false, error: "Migrations payload too large" };
  }
  return port.updateMigrations(id.data, data);
}

export async function fetchERD(
  projectId: string,
  port: DataApiPort,
): Promise<DataServiceResult<ERDData>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  return port.getERD(id.data);
}

export async function saveERD(
  projectId: string,
  data: ERDUpdateInput,
  port: DataApiPort,
): Promise<DataServiceResult<unknown>> {
  const id = requireProjectId(projectId);
  if (!id.success || !id.data) return { success: false, error: id.error };
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return { success: false, error: "Invalid ERD payload" };
  }
  if ("nodes" in data && data.nodes !== undefined && !Array.isArray(data.nodes)) {
    return { success: false, error: "ERD nodes must be an array" };
  }
  if ("tables" in data && data.tables !== undefined && !Array.isArray(data.tables)) {
    return { success: false, error: "ERD tables must be an array" };
  }
  if (!payloadSizeOk(data)) {
    return { success: false, error: "ERD payload too large" };
  }
  return port.updateERD(id.data, data);
}
