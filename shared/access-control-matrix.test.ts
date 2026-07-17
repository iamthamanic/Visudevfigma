import { describe, expect, it } from "vitest";
import { deriveAccessControlMatrixFromFindings } from "./access-control-matrix.js";
import type { AccessControlFinding } from "./access-control.types.js";

describe("deriveAccessControlMatrixFromFindings", () => {
  const routes = [{ id: "r1", method: "GET", path: "/employees" }];

  it("returns unverified cells when no findings exist", () => {
    const matrix = deriveAccessControlMatrixFromFindings(routes, []);
    expect(matrix).toHaveLength(1);
    expect(matrix[0].authentication.status).toBe("unverified");
    expect(matrix[0].overallStatus).toBe("unverified");
  });

  it("maps tenant-isolation finding to tenantIsolation column", () => {
    const findings: AccessControlFinding[] = [
      {
        id: "f1",
        resourceId: "r1",
        resourceKind: "route",
        control: "tenant-isolation",
        status: "protected",
        mechanisms: [
          { kind: "repository-filter", label: "Repository Query Filter", technology: "app" },
        ],
        enforcementLayers: ["repository"],
        evidence: [],
        confidence: 0.9,
      },
    ];
    const matrix = deriveAccessControlMatrixFromFindings(routes, findings);
    expect(matrix[0].tenantIsolation.status).toBe("protected");
    expect(matrix[0].tenantIsolation.mechanismLabel).toBe("Repository Query Filter");
  });

  it("uses worst status for overallStatus", () => {
    const findings: AccessControlFinding[] = [
      {
        id: "f1",
        resourceId: "r1",
        resourceKind: "route",
        control: "authentication",
        status: "protected",
        mechanisms: [],
        enforcementLayers: ["api"],
        evidence: [],
        confidence: 0.9,
      },
      {
        id: "f2",
        resourceId: "r1",
        resourceKind: "route",
        control: "tenant-isolation",
        status: "missing",
        mechanisms: [],
        enforcementLayers: [],
        evidence: [],
        confidence: 0.8,
      },
    ];
    const matrix = deriveAccessControlMatrixFromFindings(routes, findings);
    expect(matrix[0].overallStatus).toBe("missing");
    expect(matrix[0].findingCount).toBe(2);
  });
});
