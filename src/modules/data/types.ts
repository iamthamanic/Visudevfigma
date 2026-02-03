export interface DataSchema extends Record<string, unknown> {
  projectId?: string;
  updatedAt?: string;
}

export type DataSchemaUpdateInput = Record<string, unknown>;

export type MigrationEntry = Record<string, unknown>;

export interface ERDColumn {
  name: string;
  type?: string;
  nullable?: boolean;
  default?: string;
}

export interface ERDTableNode {
  id: string;
  label?: string;
  name?: string;
  columns?: ERDColumn[];
  rls?: unknown;
  sample?: unknown[] | Record<string, unknown>[];
}

export interface ERDData extends Record<string, unknown> {
  projectId?: string;
  updatedAt?: string;
  nodes?: ERDTableNode[];
  tables?: ERDTableNode[];
}

export type ERDUpdateInput = Record<string, unknown>;
