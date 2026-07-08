/**
 * Resolve database connection hints from project .env files (scan-time only, not persisted).
 * Location: local-engine/src/lib/resolve-database-config.ts
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILE_NAMES = [".env.local", ".env.development.local", ".env.development", ".env"];

const CONNECTION_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DIRECT_URL",
  "SUPABASE_DB_URL",
  "SQLITE_DATABASE_URL",
] as const;

export type ResolvedDatabaseConfig =
  | { kind: "postgres"; connectionString: string; source: string }
  | { kind: "sqlite"; filePath: string; source: string }
  | { kind: "none"; message: string };

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

export function parseEnvFileContents(contents: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const rawValue = trimmed.slice(eq + 1);
    if (!key) continue;
    entries[key] = stripQuotes(rawValue);
  }
  return entries;
}

export function readEnvFilesFromDirectory(projectRoot: string): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const fileName of [...ENV_FILE_NAMES].reverse()) {
    const filePath = path.join(projectRoot, fileName);
    if (!existsSync(filePath)) continue;
    try {
      const parsed = parseEnvFileContents(readFileSync(filePath, "utf8"));
      Object.assign(merged, parsed);
    } catch {
      // ignore unreadable env files
    }
  }
  return merged;
}

function resolveSqlitePath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("sqlite:")) {
    const withoutScheme = trimmed.replace(/^sqlite:\/*/i, "");
    return withoutScheme || null;
  }
  if (trimmed.startsWith("file:")) {
    return trimmed.replace(/^file:\/*/i, "") || null;
  }
  if (trimmed.endsWith(".db") || trimmed.endsWith(".sqlite") || trimmed.endsWith(".sqlite3")) {
    return trimmed;
  }
  return null;
}

export function resolveDatabaseConfigFromEnv(env: Record<string, string>): ResolvedDatabaseConfig {
  for (const key of CONNECTION_KEYS) {
    const value = env[key]?.trim();
    if (!value) continue;

    const sqlitePath = resolveSqlitePath(value);
    if (sqlitePath) {
      return { kind: "sqlite", filePath: sqlitePath, source: key };
    }

    if (/^postgres(ql)?:\/\//i.test(value)) {
      return { kind: "postgres", connectionString: value, source: key };
    }
  }

  return {
    kind: "none",
    message:
      "Keine Datenbank konfiguriert. Setze DATABASE_URL (PostgreSQL oder SQLite) in der Projekt-.env.",
  };
}

export function resolveDatabaseConfig(projectRoot: string): ResolvedDatabaseConfig {
  const env = readEnvFilesFromDirectory(projectRoot);
  const resolved = resolveDatabaseConfigFromEnv(env);
  if (resolved.kind !== "sqlite") {
    return resolved;
  }

  const sqlitePath = path.isAbsolute(resolved.filePath)
    ? resolved.filePath
    : path.resolve(projectRoot, resolved.filePath);

  if (!existsSync(sqlitePath)) {
    return {
      kind: "none",
      message: `SQLite-Datei nicht gefunden: ${sqlitePath}`,
    };
  }

  return { ...resolved, filePath: sqlitePath };
}
