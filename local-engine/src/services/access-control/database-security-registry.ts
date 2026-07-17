/**
 * Registry selecting DatabaseSecurityAdapter by dialect.
 * Unknown dialects use the fallback adapter (app-layer honesty, no false RLS).
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

const adaptersByDialect = new Map<DatabaseSecurityDialect, DatabaseSecurityAdapter>([
  ["unknown", unknownDatabaseSecurityAdapter],
  // Concrete adapters land in later issues (#136 postgres, #140 mariadb, #141 mongodb).
]);

export function registerDatabaseSecurityAdapter(adapter: DatabaseSecurityAdapter): void {
  adaptersByDialect.set(adapter.dialect, adapter);
}

export function resolveDialectFromDatabaseConfig(
  config: ResolvedDatabaseConfig | null | undefined,
): DatabaseSecurityDialect {
  if (!config || config.kind === "none") return "unknown";
  if (config.kind === "sqlite") return "sqlite";
  if (config.kind === "postgres") {
    const source = `${config.source} ${config.connectionString}`.toLowerCase();
    if (source.includes("supabase")) return "supabase";
    return "postgres";
  }
  return "unknown";
}

export function resolveDialectFromHints(hints: {
  frameworkHints?: string[];
  connectionHint?: string;
}): DatabaseSecurityDialect {
  const blob = [...(hints.frameworkHints ?? []), hints.connectionHint ?? ""]
    .join(" ")
    .toLowerCase();
  if (!blob.trim()) return "unknown";
  if (blob.includes("supabase")) return "supabase";
  if (blob.includes("postgres") || blob.includes("postgresql")) return "postgres";
  if (blob.includes("mariadb")) return "mariadb";
  if (blob.includes("mysql")) return "mysql";
  if (blob.includes("mongodb") || blob.includes("mongo")) return "mongodb";
  if (blob.includes("sqlite")) return "sqlite";
  if (blob.includes("firestore")) return "firestore";
  if (blob.includes("dynamodb")) return "dynamodb";
  return "unknown";
}

export function selectDatabaseSecurityAdapter(
  dialect: DatabaseSecurityDialect,
): DatabaseSecurityAdapter {
  return adaptersByDialect.get(dialect) ?? unknownDatabaseSecurityAdapter;
}

export function analyzeWithDatabaseSecurityAdapter(
  input: DatabaseSecurityAdapterInput,
): AccessControlFinding[] {
  const adapter = selectDatabaseSecurityAdapter(input.dialect);
  return adapter.analyze({
    ...input,
    dialect: adaptersByDialect.has(input.dialect) ? input.dialect : "unknown",
  });
}
