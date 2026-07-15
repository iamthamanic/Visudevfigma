/**
 * Wave 4 shell runner badge de-emphasis on Blueprint.
 * Acceptance: .qa/acceptance/wave4-shell-runner-badges.md
 */

import { test, expect } from "@playwright/test";
import { installWave2Mocks, openBlueprintView, seedSupabaseSession } from "./wave2-test-helpers.js";

const PROJECT_ID = "proj-wave4-shell";

test.describe("Wave 4 shell runner badges", () => {
  test("hides runners on Blueprint views", async ({ page }) => {
    test.setTimeout(60_000);
    await seedSupabaseSession(page);
    await installWave2Mocks(page, PROJECT_ID, "wave4-shell-1");
    await openBlueprintView(page, "atlas");

    await expect(page.getByTestId("runners-top-bar")).toHaveCount(0);
    await expect(page.getByTestId("blueprint-scan-badge")).toBeVisible();
  });
});
