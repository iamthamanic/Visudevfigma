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

export function registerDatabaseSecurityAdapter(adapter: DatabaseSecurityAdapter): void {
  adaptersByDialect.set(adapter.dialect, adapter);
}

/** Remove a non-unknown adapter registration (tests / hot-reload). */
export function unregisterDatabaseSecurityAdapter(dialect: DatabaseSecurityDialect): void {
  if (dialect === "unknown") return;
  adaptersByDialect.delete(dialect);
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
  { dialect: "supabase", pattern: /^supabase$/i },
  { dialect: "postgres", pattern: /^postgres(?:ql)?$/i },
  { dialect: "mariadb", pattern: /^mariadb$/i },
  { dialect: "mysql", pattern: /^mysql$/i },
  { dialect: "mongodb", pattern: /^mongo(?:db)?$/i },
  { dialect: "sqlite", pattern: /^sqlite$/i },
  { dialect: "firestore", pattern: /^firestore$/i },
  { dialect: "dynamodb", pattern: /^dynamodb$/i },
];

export function resolveDialectFromHints(hints: {
  frameworkHints?: string[];
  connectionHint?: string;
}): DatabaseSecurityDialect {
  const tokens = [...(hints.frameworkHints ?? []), hints.connectionHint ?? ""]
    .flatMap((t) => t.split(/[\s,;/|]+/))
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return "unknown";
  for (const token of tokens) {
    for (const rule of HINT_RULES) {
      if (rule.pattern.test(token)) return rule.dialect;
    }
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
