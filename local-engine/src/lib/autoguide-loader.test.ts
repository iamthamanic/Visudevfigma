/**
 * Unit tests for AutoGuide package detection.
 * Location: local-engine/src/lib/autoguide-loader.test.ts
 */

import { describe, expect, it } from "vitest";
import { detectAutoGuidePackages } from "./autoguide-loader.js";

describe("detectAutoGuidePackages", () => {
  it("reports unavailable when root is missing", async () => {
    const status = await detectAutoGuidePackages("/tmp/visudev-autoguide-missing-root");
    expect(status.available).toBe(false);
    expect(status.packages.scanner).toBe(false);
    expect(status.message).toBeTruthy();
  });

  it("detects built packages from VISUDEV_AUTOGUIDE_ROOT when present", async () => {
    const root = "/Users/halteverbotsocialmacpro/Desktop/arsvivai/2-DEV-PROJEKTE/autoguide";
    const status = await detectAutoGuidePackages(root);
    expect(status.root).toBe(root);
    expect(typeof status.packages.scanner).toBe("boolean");
  });
});
