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
    filePath: "src/routes/route-1/employees.repo.ts",
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

  it("emits protected findings with dual mechanisms for matching resource", () => {
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

  it("does not apply another route's repo filter (resource-scoped)", () => {
    const findings = mariadbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mariadb",
      facts: dualFacts,
      resourceIds: ["route-other"],
    });
    // Global SQL view still applies → partial without repo filter for this route
    expect(findings[0]?.status).toBe("partial");
    expect(findings[0]?.mechanisms.some((m) => m.label === MARIADB_REPO_FILTER_LABEL)).toBe(false);
  });

  it("marks missing when SQL data facts lack isolation mechanisms", () => {
    const findings = mariadbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mariadb",
      facts: [
        {
          id: "t1",
          kind: "sql-migration",
          filePath: "db/schema.sql",
          line: 1,
          snippet: "CREATE TABLE employees (id INT, tenant_id INT);",
        },
      ],
      resourceIds: ["route-1"],
    });
    expect(findings[0]?.status).toBe("missing");
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
