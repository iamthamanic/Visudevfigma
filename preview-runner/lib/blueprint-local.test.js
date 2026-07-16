/**
 * Softort: blueprint analysis must use clone root, not preview package winner.
 * Location: preview-runner/lib/blueprint-local.test.js
 */

import { describe, expect, it } from "vitest";
import {
  FILE_LIMIT,
  SUPPORTED_EXT,
  prioritizeBlueprintFiles,
  resolveWorkspaceRoot,
} from "./blueprint-local.js";

describe("blueprint-local Softort coverage", () => {
  it("keeps workspace root at clone path (not preview web package)", () => {
    expect(resolveWorkspaceRoot("/repos/Rocket.Chat")).toBe("/repos/Rocket.Chat");
    expect(resolveWorkspaceRoot("/repos/plane")).toBe("/repos/plane");
  });

  it("supports python and prisma extensions", () => {
    expect(SUPPORTED_EXT.has("py")).toBe(true);
    expect(SUPPORTED_EXT.has("prisma")).toBe(true);
    expect(SUPPORTED_EXT.has("ts")).toBe(true);
  });

  it("prioritizes Django/Prisma/meteor over leaf UI packages", () => {
    const ranked = prioritizeBlueprintFiles([
      "packages/web-ui-registration/src/CMSPage.tsx",
      "apps/meteor/server/lib/roles/hasPermission.ts",
      "apps/api/plane/urls.py",
      "packages/database/schema.prisma",
      "apps/web/app/page.tsx",
    ]);
    expect(ranked[0]).toBe("packages/database/schema.prisma");
    expect(ranked[1]).toBe("apps/api/plane/urls.py");
    expect(ranked.indexOf("apps/meteor/server/lib/roles/hasPermission.ts")).toBeLessThan(
      ranked.indexOf("packages/web-ui-registration/src/CMSPage.tsx"),
    );
  });

  it("uses a Softort-friendly file limit (>=250)", () => {
    expect(FILE_LIMIT).toBeGreaterThanOrEqual(250);
  });
});
