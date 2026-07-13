import { describe, expect, it } from "vitest";
import { normalizeBlueprintData } from "./normalize-blueprint";

describe("normalizeBlueprintData", () => {
  it("drops malformed route and finding entries from KV payloads", () => {
    const normalized = normalizeBlueprintData({
      routes: [{ id: "r1", method: "GET" }, null, "bad"],
      securityMatrix: [{ routeId: "r1" }],
      findings: [{ id: "f1", severity: "critical" }],
      facts: [{ id: "fact-1" }],
      frameworkHints: ["next", 42, ""],
    });

    expect(normalized.routes).toEqual([]);
    expect(normalized.securityMatrix).toEqual([]);
    expect(normalized.findings).toEqual([]);
    expect(normalized.facts).toEqual([]);
    expect(normalized.frameworkHints).toEqual(["next"]);
  });
});
