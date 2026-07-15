/**
 * Wave 5 shell footer health line gate.
 * Acceptance: .qa/acceptance/wave5-shell-footer-health.md
 */

import { test, expect } from "@playwright/test";
import { installWave2Mocks, openBlueprintView, seedSupabaseSession } from "./wave2-test-helpers.js";

const PROJECT_ID = "proj-wave5-footer";

test.describe("Wave 5 shell footer health", () => {
  test("health line visible across blueprint views", async ({ page }) => {
    test.setTimeout(60_000);
    await seedSupabaseSession(page);
    await installWave2Mocks(page, PROJECT_ID, "wave5-footer-1");
    await openBlueprintView(page, "atlas");

    const health = page.getByTestId("footer-health-line");
    await expect(health).toBeVisible();
    await expect(health).toContainText(/Keine kritischen Probleme/i);
    await expect(page.getByTestId("footer-module-count")).toContainText(/1\.?248|1248/);

    await openBlueprintView(page, "diagnostics");
    await expect(page.getByTestId("footer-health-line")).toContainText(
      /Keine kritischen Probleme/i,
    );
  });
});
