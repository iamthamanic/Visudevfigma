/**
 * Wave 4 footer / stats density gate.
 * Acceptance: .qa/acceptance/wave4-footer-stats.md
 */

import { test, expect } from "@playwright/test";
import { installWave2Mocks, openBlueprintView, seedSupabaseSession } from "./wave2-test-helpers.js";

const PROJECT_ID = "proj-wave4-footer";

test.describe("Wave 4 footer stats", () => {
  test("module and file counts match Zielbild scale", async ({ page }) => {
    test.setTimeout(60_000);
    await seedSupabaseSession(page);
    await installWave2Mocks(page, PROJECT_ID, "wave4-footer-1");
    await openBlueprintView(page, "atlas");

    const footer = page.getByTestId("blueprint-footer-stats");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("footer-module-count")).toContainText(/1\.?248|1248/);
    await expect(page.getByTestId("footer-file-count")).toContainText(/5\.?732|5732|1\.?872|1872/);

    const moduleText = await page.getByTestId("footer-module-count").innerText();
    const fileText = await page.getByTestId("footer-file-count").innerText();
    const modules = Number(moduleText.replace(/[^\d]/g, ""));
    const files = Number(fileText.replace(/[^\d]/g, ""));
    expect(modules).toBeGreaterThanOrEqual(100);
    expect(files).toBeGreaterThanOrEqual(500);
  });
});
