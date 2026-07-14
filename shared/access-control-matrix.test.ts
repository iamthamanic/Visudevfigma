import { describe, expect, it } from "vitest";
import { deriveAccessControlMatrixFromFindings } from "./access-control-matrix.js";
import type { AccessControlFinding } from "./access-control.types.js";

describe("deriveAccessControlMatrixFromFindings", () => {
  it("groups findings by route and picks worst mechanism status", () => {
    const findings: AccessControlFinding[] = [
      {
        id: "f1",
        routeId: "GET /api/employees",
        mechanism: "authn",
        status: "pass",
        message: "ok",
      },
      {
        id: "f2",
        routeId: "GET /api/employees",
        mechanism: "tenant",
        status: "fail",
        message: "missing tenant filter",
      },
    ];

    const rows = deriveAccessControlMatrixFromFindings(findings);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.method).toBe("GET");
    expect(rows[0]?.path).toBe("/api/employees");
    expect(rows[0]?.authn).toBe("pass");
    expect(rows[0]?.tenant).toBe("fail");
    expect(rows[0]?.status).toBe("fail");
  });
});
