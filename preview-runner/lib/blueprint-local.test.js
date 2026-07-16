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

  it("keeps specs/mocks/tests below app modules under soft-cap ranking", () => {
    // Mirrors Actual/Immich soft-cap bias (spec/mock domination).
    const ranked = prioritizeBlueprintFiles([
      "packages/sync-server/src/app/gocardless-service.spec.ts",
      "server/src/repositories/asset.repository.spec.ts",
      "server/src/repositories/asset.repository.mock.ts",
      "packages/sync-server/src/app/gocardless-service.ts",
      "server/src/repositories/asset.repository.ts",
      "apps/web/src/app/api/route.ts",
      "src/modules/leaves/leaves.routes.ts",
    ]);
    const top = ranked.slice(0, 4);
    expect(top.some((p) => /\.(spec|test|mock)\./.test(p))).toBe(false);
    expect(ranked.indexOf("src/modules/leaves/leaves.routes.ts")).toBeLessThan(
      ranked.indexOf("packages/sync-server/src/app/gocardless-service.spec.ts"),
    );
    expect(ranked.indexOf("server/src/repositories/asset.repository.ts")).toBeLessThan(
      ranked.indexOf("server/src/repositories/asset.repository.spec.ts"),
    );
  });

  it("prefers module-segment paths and canonical prisma over basename lottery", () => {
    const ranked = prioritizeBlueprintFiles([
      "HrKo_LeaveService.ts",
      "schema.prisma",
      "modules/hr/services/HrKo_LeaveService.ts",
      "modules/leaves/schema.prisma",
      "packages/database/schema.prisma",
      "src/modules/leaves/leave.controller.ts",
    ]);
    expect(ranked[0]).toBe("packages/database/schema.prisma");
    expect(ranked.indexOf("src/modules/leaves/leave.controller.ts")).toBeLessThan(
      ranked.indexOf("HrKo_LeaveService.ts"),
    );
    expect(ranked.indexOf("modules/hr/services/HrKo_LeaveService.ts")).toBeLessThan(
      ranked.indexOf("HrKo_LeaveService.ts"),
    );
  });

  it("uses a Softort-friendly file limit (>=250)", () => {
    expect(FILE_LIMIT).toBeGreaterThanOrEqual(250);
  });
});
