export interface DataSchema extends Record<string, unknown> {
  projectId?: string;
  updatedAt?: string;
}

export type DataSchemaUpdateInput = Record<string, unknown>;

export type MigrationEntry = Record<string, unknown>;

export interface ERDData extends Record<string, unknown> {
  projectId?: string;
  updatedAt?: string;
}

export type ERDUpdateInput = Record<string, unknown>;
