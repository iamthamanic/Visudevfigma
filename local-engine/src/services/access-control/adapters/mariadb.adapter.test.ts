/**
 * Vitest fixtures for MariaDB/MySQL security adapter.
 */

import { describe, expect, it } from "vitest";
import {
  MARIADB_REPO_FILTER_LABEL,
  MARIADB_SECURITY_VIEW_LABEL,
  detectMariadbSignals,
  mariadbDatabaseSecurityAdapter,
  mariadbInspectorMechanismLabels,
  mysqlDatabaseSecurityAdapter,
} from "./mariadb.adapter.js";
import { createDatabaseSecurityRegistry } from "../database-security-registry.js";

const dualFacts = [
  {
    id: "v1",
    kind: "sql-migration",
    filePath: "db/views.sql",
    line: 2,
    snippet: "CREATE SQL SECURITY DEFINER VIEW tenant_employees AS SELECT * FROM employees;",
  },
  {
    id: "r1",
    kind: "repository",
    filePath: "src/employees.repo.ts",
    line: 12,
    snippet: "where: { tenant_id: ctx.tenantId }",
  },
];

describe("mariadb.adapter", () => {
  it("detects security view and repo tenant filter", () => {
    const signals = detectMariadbSignals(dualFacts);
    expect(signals.hasSecurityView).toBe(true);
    expect(signals.hasRepoTenantFilter).toBe(true);
  });

  it("emits protected findings with dual mechanisms", () => {
    const findings = mariadbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mariadb",
      facts: dualFacts,
      resourceIds: ["route-1"],
    });
    expect(findings.every((f) => f.status === "protected")).toBe(true);
    const labels = mariadbInspectorMechanismLabels(findings);
    expect(labels).toContain(MARIADB_SECURITY_VIEW_LABEL);
    expect(labels).toContain(MARIADB_REPO_FILTER_LABEL);
  });

  it("never treats missing RLS as a signal — partial on repo filter alone", () => {
    const findings = mariadbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mariadb",
      facts: [dualFacts[1]!],
      resourceIds: ["route-1"],
    });
    expect(findings[0]?.status).toBe("partial");
    expect(findings[0]?.mechanisms.some((m) => /RLS/i.test(m.label))).toBe(false);
  });

  it("registers mariadb and mysql in registry", () => {
    const registry = createDatabaseSecurityRegistry([
      mariadbDatabaseSecurityAdapter,
      mysqlDatabaseSecurityAdapter,
    ]);
    expect(registry.select("mariadb").dialect).toBe("mariadb");
    expect(registry.select("mysql").dialect).toBe("mysql");
  });
});
