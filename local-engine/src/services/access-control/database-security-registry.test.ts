import { describe, expect, it } from "vitest";
import type { DatabaseSecurityAdapter } from "../../../../shared/access-control-adapter.js";
import {
  analyzeWithDatabaseSecurityAdapter,
  registerDatabaseSecurityAdapter,
  resolveDialectFromDatabaseConfig,
  resolveDialectFromHints,
  selectDatabaseSecurityAdapter,
} from "./database-security-registry.js";

describe("database-security-registry", () => {
  it("maps resolve-database-config postgres to postgres dialect", () => {
    expect(
      resolveDialectFromDatabaseConfig({
        kind: "postgres",
        connectionString: "postgres://localhost/db",
        source: "DATABASE_URL",
      }),
    ).toBe("postgres");
  });

  it("maps supabase connection hints to supabase dialect", () => {
    expect(
      resolveDialectFromDatabaseConfig({
        kind: "postgres",
        connectionString: "postgres://db.xxx.supabase.co/postgres",
        source: "SUPABASE_DB_URL",
      }),
    ).toBe("supabase");
  });

  it("selects unknown adapter when dialect has no concrete implementation", () => {
    const adapter = selectDatabaseSecurityAdapter("mariadb");
    expect(adapter.dialect).toBe("unknown");
  });

  it("unknown adapter emits unsupported — never missing/critical RLS-style statuses", () => {
    const findings = analyzeWithDatabaseSecurityAdapter({
      projectId: "p1",
      dialect: "unknown",
      facts: [],
      resourceIds: ["r1"],
    });
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every((f) => f.status === "unsupported")).toBe(true);
    expect(findings.every((f) => f.status !== "missing")).toBe(true);
  });

  it("resolveDialectFromHints picks mongodb from framework hints", () => {
    expect(resolveDialectFromHints({ frameworkHints: ["express", "mongodb"] })).toBe("mongodb");
  });

  it("registerDatabaseSecurityAdapter overrides selection for that dialect", () => {
    const stub: DatabaseSecurityAdapter = {
      dialect: "sqlite",
      analyze: () => [
        {
          id: "stub",
          resourceId: "r1",
          resourceKind: "route",
          control: "validation",
          status: "protected",
          mechanisms: [],
          enforcementLayers: ["database"],
          evidence: [],
          confidence: 1,
        },
      ],
    };
    registerDatabaseSecurityAdapter(stub);
    const selected = selectDatabaseSecurityAdapter("sqlite");
    expect(selected.dialect).toBe("sqlite");
    const findings = analyzeWithDatabaseSecurityAdapter({
      projectId: "p1",
      dialect: "sqlite",
      facts: [],
      resourceIds: ["r1"],
    });
    expect(findings[0]?.id).toBe("stub");
  });
});
