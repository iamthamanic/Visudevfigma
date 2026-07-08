/**
 * Unit tests for runtime screenshot merge helper.
 * Location: local-engine/src/lib/runtime-screenshots.test.ts
 */

import { describe, expect, it } from "vitest";
import { applyRuntimeScreenshots } from "./runtime-screenshots.js";

describe("applyRuntimeScreenshots", () => {
  it("merges screenshot URLs from runtime stateScreens", () => {
    const screens = [
      { id: "home", name: "Home" },
      { id: "settings", name: "Settings" },
    ];
    const merged = applyRuntimeScreenshots(screens, {
      stateScreens: [{ screenId: "home", screenshotUrl: "data:image/jpeg;base64,abc" }],
    });
    expect((merged[0] as { screenshotUrl?: string }).screenshotUrl).toBe(
      "data:image/jpeg;base64,abc",
    );
    expect((merged[0] as { screenshotStatus?: string }).screenshotStatus).toBe("ok");
    expect((merged[1] as { screenshotUrl?: string }).screenshotUrl).toBeUndefined();
  });
});
