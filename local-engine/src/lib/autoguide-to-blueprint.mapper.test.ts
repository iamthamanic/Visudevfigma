/**
 * Unit tests for AutoGuide → Blueprint mapping.
 * Location: local-engine/src/lib/autoguide-to-blueprint.mapper.test.ts
 */

import { describe, expect, it } from "vitest";
import { mapAutoGuideToBlueprint } from "./autoguide-to-blueprint.mapper.js";

describe("mapAutoGuideToBlueprint", () => {
  it("maps routes, facts, and aria findings into blueprint shape", () => {
    const blueprint = mapAutoGuideToBlueprint({
      projectId: "proj-1",
      localPath: "/Users/me/app",
      source: {
        routes: [{ route: "dashboard", filePath: "/Users/me/app/src/pages/Dashboard.tsx" }],
        elements: [
          {
            filePath: "/Users/me/app/src/pages/Dashboard.tsx",
            componentName: "Dashboard",
            handlerName: "onSave",
            line: 12,
            missingAriaLabel: true,
          },
        ],
      },
      merged: {
        pages: [{ id: "page-1", route: "dashboard", title: "dashboard" }],
        facts: [
          {
            id: "fact-1",
            key: "handler",
            value: "onSave",
            confidence: 0.9,
            provenance: [
              { source: "source_code", filePath: "/Users/me/app/src/pages/Dashboard.tsx" },
            ],
          },
        ],
      },
    });

    expect(blueprint.version).toBe(1);
    expect(blueprint.projectId).toBe("proj-1");
    const routes = blueprint.routes as Array<{ path: string; filePath: string }>;
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      path: "/dashboard",
      filePath: "/Users/me/app/src/pages/Dashboard.tsx",
    });
    const facts = blueprint.facts as unknown[];
    expect(facts).toHaveLength(1);
    const findings = blueprint.findings as unknown[];
    expect(findings).toHaveLength(1);
    expect(blueprint.frameworkHints).toContain("autoguide");
    expect(blueprint.filesAnalyzed).toBe(1);
  });
});
