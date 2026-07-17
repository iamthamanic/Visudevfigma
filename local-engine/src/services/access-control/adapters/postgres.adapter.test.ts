import { describe, expect, it } from "vitest";
import {
  POSTGRES_RLS_LABEL,
  detectPostgresSqlSignals,
  postgresDatabaseSecurityAdapter,
  postgresInspectorMechanismLabel,
  supabaseDatabaseSecurityAdapter,
} from "./postgres.adapter.js";
import { createDatabaseSecurityRegistry } from "../database-security-registry.js";

const rlsFacts = [
  {
    id: "f1",
    kind: "sql-migration",
    filePath: "supabase/migrations/001.sql",
    line: 10,
    snippet: "ALTER TABLE employees ENABLE ROW LEVEL SECURITY;",
  },
  {
    id: "f2",
    kind: "sql-migration",
    filePath: "supabase/migrations/002.sql",
    line: 4,
    snippet:
      "CREATE POLICY tenant_isolation ON employees USING (tenant_id = current_setting('app.tenant_id'));",
  },
];

describe("postgres.adapter", () => {
  it("detects RLS enable + policy signals from fixtures", () => {
    const signals = detectPostgresSqlSignals(rlsFacts);
    expect(signals.hasRlsEnable).toBe(true);
    expect(signals.hasPolicy).toBe(true);
  });

  it("emits protected tenant/scope findings with PostgreSQL RLS label", () => {
    const findings = postgresDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "postgres",
      facts: rlsFacts,
      resourceIds: ["r1"],
    });
    expect(findings.length).toBe(2);
    expect(findings.every((f) => f.status === "protected")).toBe(true);
    expect(findings[0]?.mechanisms.some((m) => m.label === POSTGRES_RLS_LABEL)).toBe(true);
    expect(postgresInspectorMechanismLabel(findings)).toBe(POSTGRES_RLS_LABEL);
  });

  it("marks partial when only ENABLE RLS is present", () => {
    const findings = postgresDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "postgres",
      facts: [rlsFacts[0]!],
      resourceIds: ["r1"],
    });
    expect(findings[0]?.status).toBe("partial");
  });

  it("returns unverified when no SQL security facts exist", () => {
    const findings = postgresDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "postgres",
      facts: [{ id: "x", kind: "route", filePath: "a.ts", line: 1, snippet: "get()" }],
      resourceIds: ["r1"],
    });
    expect(findings[0]?.status).toBe("unverified");
  });

  it("registers in registry for postgres and supabase dialects", () => {
    const registry = createDatabaseSecurityRegistry([
      postgresDatabaseSecurityAdapter,
      supabaseDatabaseSecurityAdapter,
    ]);
    expect(registry.select("postgres").dialect).toBe("postgres");
    expect(registry.select("supabase").dialect).toBe("supabase");
    const findings = registry.analyze({
      projectId: "p1",
      dialect: "supabase",
      facts: rlsFacts,
      resourceIds: ["route-a"],
    });
    expect(findings.some((f) => f.mechanisms.some((m) => m.label === POSTGRES_RLS_LABEL))).toBe(
      true,
    );
  });
});
