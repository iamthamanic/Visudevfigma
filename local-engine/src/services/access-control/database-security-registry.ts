/**
 * Registry selecting DatabaseSecurityAdapter by dialect.
 * Prefer `createDatabaseSecurityRegistry()` for isolated instances (tests);
 * `defaultDatabaseSecurityRegistry` is the process singleton for enrichment.
 */

import type {
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../../../../shared/access-control-adapter.js";
import type {
  AccessControlFinding,
  DatabaseSecurityDialect,
} from "../../../../shared/access-control.types.js";
import type { ResolvedDatabaseConfig } from "../../lib/resolve-database-config.js";
import { unknownDatabaseSecurityAdapter } from "./adapters/unknown.adapter.js";

function createDefaultAdapters(): Map<DatabaseSecurityDialect, DatabaseSecurityAdapter> {
  return new Map<DatabaseSecurityDialect, DatabaseSecurityAdapter>([
    ["unknown", unknownDatabaseSecurityAdapter],
    // Concrete adapters land in later issues (#136 postgres, #140 mariadb, #141 mongodb).
  ]);
}

export interface DatabaseSecurityRegistry {
  register(adapter: DatabaseSecurityAdapter): void;
  select(dialect: DatabaseSecurityDialect): DatabaseSecurityAdapter;
  analyze(input: DatabaseSecurityAdapterInput): AccessControlFinding[];
}

export function createDatabaseSecurityRegistry(
  seed: Iterable<DatabaseSecurityAdapter> = [],
): DatabaseSecurityRegistry {
  const adapters = createDefaultAdapters();
  for (const adapter of seed) {
    adapters.set(adapter.dialect, adapter);
  }

  return {
    register(adapter) {
      adapters.set(adapter.dialect, adapter);
    },
    select(dialect) {
      return adapters.get(dialect) ?? unknownDatabaseSecurityAdapter;
    },
    analyze(input) {
      const adapter = adapters.get(input.dialect) ?? unknownDatabaseSecurityAdapter;
      return adapter.analyze({
        ...input,
        dialect: adapters.has(input.dialect) ? input.dialect : "unknown",
      });
    },
  };
}

/** Process singleton used by blueprint enrichment. */
export const defaultDatabaseSecurityRegistry = createDatabaseSecurityRegistry();

export function registerDatabaseSecurityAdapter(adapter: DatabaseSecurityAdapter): void {
  defaultDatabaseSecurityRegistry.register(adapter);
}

export function selectDatabaseSecurityAdapter(
  dialect: DatabaseSecurityDialect,
): DatabaseSecurityAdapter {
  return defaultDatabaseSecurityRegistry.select(dialect);
}

export function analyzeWithDatabaseSecurityAdapter(
  input: DatabaseSecurityAdapterInput,
): AccessControlFinding[] {
  return defaultDatabaseSecurityRegistry.analyze(input);
}

export function resolveDialectFromDatabaseConfig(
  config: ResolvedDatabaseConfig | null | undefined,
): DatabaseSecurityDialect {
  if (!config || config.kind === "none") return "unknown";
  if (config.kind === "sqlite") return "sqlite";
  if (config.kind === "postgres") {
    const source = `${config.source} ${config.connectionString}`.toLowerCase();
    if (/\bsupabase\b/.test(source) || source.includes(".supabase.")) return "supabase";
    return "postgres";
  }
  return "unknown";
}

function dialectFromToken(token: string): DatabaseSecurityDialect | null {
  const lower = token.trim().toLowerCase();
  if (!lower) return null;

  if (lower.startsWith("postgres://") || lower.startsWith("postgresql://")) {
    return lower.includes("supabase") ? "supabase" : "postgres";
  }
  if (lower.startsWith("mysql://") || lower.startsWith("mysql2://")) return "mysql";
  if (lower.startsWith("mariadb://")) return "mariadb";
  if (lower.startsWith("mongodb://") || lower.startsWith("mongodb+srv://")) return "mongodb";
  if (lower.startsWith("sqlite:") || (lower.startsWith("file:") && /\.sqlite3?$/.test(lower))) {
    return "sqlite";
  }

  if (lower === "supabase") return "supabase";
  if (lower === "postgres" || lower === "postgresql") return "postgres";
  if (lower === "mariadb") return "mariadb";
  if (lower === "mysql") return "mysql";
  if (lower === "mongo" || lower === "mongodb") return "mongodb";
  if (lower === "sqlite") return "sqlite";
  if (lower === "firestore") return "firestore";
  if (lower === "dynamodb") return "dynamodb";
  return null;
}

export function resolveDialectFromHints(hints: {
  frameworkHints?: string[];
  connectionHint?: string;
}): DatabaseSecurityDialect {
  const raw = [...(hints.frameworkHints ?? []), hints.connectionHint ?? ""].filter(Boolean);
  if (raw.length === 0) return "unknown";

  // Prefer full connection strings before tokenizing.
  for (const item of raw) {
    const fromUrl = dialectFromToken(item);
    if (fromUrl && /:\/\//.test(item)) return fromUrl;
  }

  const tokens = raw.flatMap((t) => t.split(/[\s,;|]+/)).map((t) => t.trim());
  for (const token of tokens) {
    const dialect = dialectFromToken(token);
    if (dialect) return dialect;
  }
  return "unknown";
}
