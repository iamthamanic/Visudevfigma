export interface DbColumn {
  name: string;
  type: string;
  nullable: boolean;
}

export interface DbTable {
  name: string;
  columns: DbColumn[];
  rowCount: number;
}

export interface DbSchema {
  tables: DbTable[];
  timestamp: string;
}
