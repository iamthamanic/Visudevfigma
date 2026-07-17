/**
 * Vitest fixtures for MongoDB security adapter.
 */

import { describe, expect, it } from "vitest";
import {
  MONGO_SCHEMA_VALIDATION_LABEL,
  MONGO_TENANT_FILTER_LABEL,
  detectMongodbSignals,
  mongodbDatabaseSecurityAdapter,
} from "./mongodb.adapter.js";
import { createDatabaseSecurityRegistry } from "../database-security-registry.js";

describe("mongodb.adapter", () => {
  it("marks unscoped find({}) as partial with warning", () => {
    const findings = mongodbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mongodb",
      facts: [
        {
          id: "f1",
          kind: "repository",
          filePath: "src/routes/route-1/users.repo.ts",
          line: 8,
          snippet: "return db.collection('users').find({});",
        },
      ],
      resourceIds: ["route-1"],
    });
    const tenant = findings.find((f) => f.control === "tenant-isolation");
    expect(tenant?.status).toBe("partial");
    expect(tenant?.warning).toMatch(/Unscoped find/);
  });

  it("treats schema validation as validation control only", () => {
    const findings = mongodbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mongodb",
      facts: [
        {
          id: "f2",
          kind: "schema",
          filePath: "src/routes/route-1/user.schema.ts",
          line: 3,
          snippet: "validator: { $jsonSchema: { required: ['email'] } }",
        },
      ],
      resourceIds: ["route-1"],
    });
    const validation = findings.find((f) => f.control === "validation");
    expect(validation?.status).toBe("protected");
    expect(validation?.mechanisms[0]?.label).toBe(MONGO_SCHEMA_VALIDATION_LABEL);
    const tenant = findings.find((f) => f.control === "tenant-isolation");
    expect(tenant?.status).toBe("unverified");
  });

  it("detects tenantId filter + middleware as protected", () => {
    const signals = detectMongodbSignals([
      {
        id: "a",
        kind: "repository",
        filePath: "src/routes/route-1/repo.ts",
        line: 1,
        snippet: "find({ tenantId: ctx.tenantId })",
      },
      {
        id: "b",
        kind: "middleware",
        filePath: "src/routes/route-1/auth.ts",
        line: 2,
        snippet: "app.use(authMiddleware)",
      },
    ]);
    expect(signals.hasTenantFilter).toBe(true);
    expect(signals.hasMiddleware).toBe(true);
    const findings = mongodbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mongodb",
      facts: [
        {
          id: "a",
          kind: "repository",
          filePath: "src/routes/route-1/repo.ts",
          line: 1,
          snippet: "find({ tenantId: ctx.tenantId })",
        },
        {
          id: "b",
          kind: "middleware",
          filePath: "src/routes/route-1/auth.ts",
          line: 2,
          snippet: "app.use(authMiddleware)",
        },
      ],
      resourceIds: ["route-1"],
    });
    expect(findings.find((f) => f.control === "tenant-isolation")?.status).toBe("protected");
    expect(
      findings
        .find((f) => f.control === "tenant-isolation")
        ?.mechanisms.some((m) => m.label === MONGO_TENANT_FILTER_LABEL),
    ).toBe(true);
  });

  it("does not match route-10 facts when scoping route-1", () => {
    const findings = mongodbDatabaseSecurityAdapter.analyze({
      projectId: "p1",
      dialect: "mongodb",
      facts: [
        {
          id: "f10",
          kind: "repository",
          filePath: "src/routes/route-10/users.repo.ts",
          line: 8,
          snippet: "return db.collection('users').find({ tenantId: ctx.tenantId });",
        },
      ],
      resourceIds: ["route-1"],
    });
    const tenant = findings.find((f) => f.control === "tenant-isolation");
    expect(tenant?.status).toBe("unverified");
    expect(tenant?.mechanisms.some((m) => m.label === MONGO_TENANT_FILTER_LABEL)).toBe(false);
  });

  it("registers mongodb in registry", () => {
    const registry = createDatabaseSecurityRegistry([mongodbDatabaseSecurityAdapter]);
    expect(registry.select("mongodb").dialect).toBe("mongodb");
  });
});
