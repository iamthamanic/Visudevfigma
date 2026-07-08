/**
 * Unit tests for local database config resolution from .env files.
 * Location: local-engine/src/lib/resolve-database-config.test.ts
 */

import { describe, expect, it } from "vitest";
import { parseEnvFileContents, resolveDatabaseConfigFromEnv } from "./resolve-database-config.js";

describe("parseEnvFileContents", () => {
  it("parses quoted and unquoted values", () => {
    const env = parseEnvFileContents(`
# comment
DATABASE_URL="postgresql://user:pass@localhost:5432/app"
POSTGRES_URL='postgres://localhost/dev'
`);
    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/app");
    expect(env.POSTGRES_URL).toBe("postgres://localhost/dev");
  });
});

describe("resolveDatabaseConfigFromEnv", () => {
  it("prefers postgres URLs", () => {
    const config = resolveDatabaseConfigFromEnv({
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    });
    expect(config.kind).toBe("postgres");
    if (config.kind === "postgres") {
      expect(config.source).toBe("DATABASE_URL");
    }
  });

  it("detects sqlite file paths", () => {
    const config = resolveDatabaseConfigFromEnv({
      DATABASE_URL: "sqlite:./data/app.db",
    });
    expect(config.kind).toBe("sqlite");
    if (config.kind === "sqlite") {
      expect(config.filePath).toBe("./data/app.db");
    }
  });

  it("returns none when no connection keys exist", () => {
    const config = resolveDatabaseConfigFromEnv({});
    expect(config.kind).toBe("none");
  });
});
