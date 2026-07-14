/**
 * Tests for diagnostics finding location and SQL evidence helpers.
 */

import { describe, expect, it } from "vitest";
import type { BlueprintFinding, CodeFact } from "../../types";
import {
  findingLocationLabel,
  isSqlEvidence,
  matrixLocationLabel,
} from "./diagnostics-finding-location.js";

const finding: BlueprintFinding = {
  id: "f1",
  scopeId: "route-1",
  ruleId: "sql.injection",
  severity: "high",
  category: "security",
  message: "SQL",
  expectedState: "safe",
  actualState: "unsafe",
  confidence: 90,
  evidenceFactIds: ["fact-1"],
};

const sqlFact: CodeFact = {
  id: "fact-1",
  kind: "sql",
  filePath: "src/db/query.ts",
  line: 4,
  snippet: "SELECT * FROM users WHERE id = $1",
  metadata: {},
};

describe("diagnostics-finding-location", () => {
  it("prefers evidence file location over route label", () => {
    expect(
      findingLocationLabel(finding, [sqlFact], {
        id: "route-1",
        method: "GET",
        path: "/users",
        filePath: "src/routes/users.ts",
        line: 1,
        pipeline: [],
        concepts: {},
      }),
    ).toBe("src/db/query.ts:4");
  });

  it("detects SQL evidence snippets", () => {
    expect(isSqlEvidence(sqlFact)).toBe(true);
    expect(
      isSqlEvidence({
        ...sqlFact,
        kind: "source",
        snippet: "const q = 'SELECT 1'",
      }),
    ).toBe(true);
  });

  it("formats matrix artifact label", () => {
    expect(
      matrixLocationLabel({
        routeId: "route-1",
        method: "POST",
        path: "/login",
        auth: { state: "missing" },
        role: { state: "unknown" },
        validation: { state: "unknown" },
        rateLimit: { state: "unknown" },
        db: { state: "unknown" },
        rls: { state: "unknown" },
        audit: { state: "unknown" },
        findingCount: 1,
      }),
    ).toBe("Matrix · POST /login");
  });
});
