/**
 * Unit tests for legacy SecurityMatrix synthesis from accessControlMatrix.
 */

import { describe, expect, it } from "vitest";
import { synthesizeSecurityMatrixFromAccessControl } from "./synthesize-security-matrix.js";

describe("synthesizeSecurityMatrixFromAccessControl", () => {
  it("maps AC statuses and forces rls to n/a", () => {
    const legacy = synthesizeSecurityMatrixFromAccessControl([
      {
        routeId: "r1",
        method: "GET",
        path: "/api/x",
        authentication: { status: "protected" },
        authorization: { status: "partial" },
        resourceScope: { status: "missing" },
        tenantIsolation: { status: "missing" },
        ownership: { status: "unverified" },
        validation: { status: "protected" },
        rateLimit: { status: "unsupported" },
        audit: { status: "not-applicable" },
        overallStatus: "missing",
        findingCount: 2,
      },
    ]);
    expect(legacy).toHaveLength(1);
    expect(legacy[0]?.auth.state).toBe("confirmed");
    expect(legacy[0]?.role.state).toBe("partial");
    expect(legacy[0]?.db.state).toBe("missing");
    expect(legacy[0]?.rls.state).toBe("n/a");
    expect(legacy[0]?.rateLimit.state).toBe("unknown");
    expect(legacy[0]?.audit.state).toBe("n/a");
    expect(legacy[0]?.findingCount).toBe(2);
  });
});
