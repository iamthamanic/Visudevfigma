import { BaseService } from "./base.service.ts";
import type { DbColumn, DbSchema, DbTable } from "../dto/index.ts";

const EXEC_SQL_QUERY = `
  SELECT 
    t.table_name,
    json_agg(
      json_build_object(
        'name', c.column_name,
        'type', c.data_type,
        'nullable', c.is_nullable = 'YES'
      ) ORDER BY c.ordinal_position
    ) as columns
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c ON c.table_name = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'kv_store%'
  GROUP BY t.table_name
  ORDER BY t.table_name;
`;

const FALLBACK_TABLES = [
  "projects",
  "scenes",
  "characters",
  "worlds",
  "shots",
  "beats",
  "films",
];

export class DbIntrospectionService extends BaseService {
  public async introspectDatabase(): Promise<DbSchema> {
    this.logger.info("Introspecting database schema");

    const { data, error } = await this.supabase.rpc<unknown>("exec_sql", {
      sql: EXEC_SQL_QUERY,
    });

    if (error || !Array.isArray(data)) {
      this.logger.warn("exec_sql unavailable, using fallback", {
        error: error?.message,
      });
      return await this.fallbackIntrospection();
    }

    const tables = data
      .map((row) => this.parseTableRow(row))
      .filter((row): row is DbTable => Boolean(row));

    this.logger.info("Schema introspection complete", {
      tables: tables.length,
    });
    return {
      tables,
      timestamp: new Date().toISOString(),
    };
  }

  private async fallbackIntrospection(): Promise<DbSchema> {
    const tables: DbTable[] = [];

    for (const tableName of FALLBACK_TABLES) {
      const { count, error } = await this.supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error || count === null) {
        continue;
      }

      tables.push({
        name: tableName,
        columns: [],
        rowCount: count,
      });
      this.logger.info("Table detected", { tableName, rowCount: count });
    }

    return {
      tables,
      timestamp: new Date().toISOString(),
    };
  }

  private parseTableRow(row: unknown): DbTable | null {
    if (!row || typeof row !== "object") {
      return null;
    }

    const record = row as Record<string, unknown>;
    const name = typeof record.table_name === "string"
      ? record.table_name
      : null;
    if (!name) {
      return null;
    }

    const columns = Array.isArray(record.columns)
      ? record.columns
        .map((column) => this.parseColumn(column))
        .filter((column): column is DbColumn => Boolean(column))
      : [];

    return {
      name,
      columns,
      rowCount: 0,
    };
  }

  private parseColumn(column: unknown): DbColumn | null {
    if (!column || typeof column !== "object") {
      return null;
    }

    const record = column as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : null;
    const type = typeof record.type === "string" ? record.type : "unknown";
    const nullable = typeof record.nullable === "boolean"
      ? record.nullable
      : false;

    if (!name) {
      return null;
    }

    return { name, type, nullable };
  }
}
