/**
 * Port contract so data domain code depends on behavior, not the legacy facade.
 */
import type {
  DataSchema,
  DataSchemaUpdateInput,
  ERDData,
  ERDUpdateInput,
  MigrationEntry,
} from "../types";

export type DataServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DataApiPort = {
  getSchema: (projectId: string) => Promise<DataServiceResult<DataSchema>>;
  updateSchema: (
    projectId: string,
    data: DataSchemaUpdateInput,
  ) => Promise<DataServiceResult<unknown>>;
  getMigrations: (projectId: string) => Promise<DataServiceResult<MigrationEntry[]>>;
  updateMigrations: (
    projectId: string,
    data: MigrationEntry[],
  ) => Promise<DataServiceResult<unknown>>;
  getERD: (projectId: string) => Promise<DataServiceResult<ERDData>>;
  updateERD: (projectId: string, data: ERDUpdateInput) => Promise<DataServiceResult<unknown>>;
};
