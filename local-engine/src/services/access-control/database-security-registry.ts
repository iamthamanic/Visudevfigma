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

function createDefaultRegistry(): Map<DatabaseSecurityDialect, DatabaseSecurityAdapter> {
  return new Map<DatabaseSecurityDialect, DatabaseSecurityAdapter>([
    ["unknown", unknownDatabaseSecurityAdapter],
    // Concrete adapters land in later issues (#136 postgres, #140 mariadb, #141 mongodb).
  ]);
}

let adaptersByDialect = createDefaultRegistry();

/** Test-only: restore default registry after mutating registrations. */
export function resetDatabaseSecurityAdapterRegistry(): void {
  adaptersByDialect = createDefaultRegistry();
}

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
    if (/\bsupabase\b/.test(source) || source.includes(".supabase.")) return "supabase";
    return "postgres";
  }
  return "unknown";
}

const HINT_RULES: Array<{ dialect: DatabaseSecurityDialect; pattern: RegExp }> = [
  { dialect: "supabase", pattern: /\bsupabase\b/i },
  { dialect: "postgres", pattern: /\bpostgres(?:ql)?\b/i },
  { dialect: "mariadb", pattern: /\bmariadb\b/i },
  { dialect: "mysql", pattern: /\bmysql\b/i },
  { dialect: "mongodb", pattern: /\bmongo(?:db)?\b/i },
  { dialect: "sqlite", pattern: /\bsqlite\b/i },
  { dialect: "firestore", pattern: /\bfirestore\b/i },
  { dialect: "dynamodb", pattern: /\bdynamodb\b/i },
];

export function resolveDialectFromHints(hints: {
  frameworkHints?: string[];
  connectionHint?: string;
}): DatabaseSecurityDialect {
  const tokens = [...(hints.frameworkHints ?? []), hints.connectionHint ?? ""]
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return "unknown";
  const blob = tokens.join(" ");
  for (const rule of HINT_RULES) {
    if (rule.pattern.test(blob)) return rule.dialect;
  }
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
