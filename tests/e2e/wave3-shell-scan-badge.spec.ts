/**
 * Wave 3 shell scan badge gate.
 * Acceptance: .qa/acceptance/wave3-shell-scan-badge.md
 */

import { test, expect } from "@playwright/test";
import { installWave2Mocks, openBlueprintView, seedSupabaseSession } from "./wave2-test-helpers.js";

const PROJECT_ID = "proj-wave3-shell";

test.describe("Wave 3 shell scan badge", () => {
  test("shows Scan abgeschlossen when blueprint loaded", async ({ page }) => {
    test.setTimeout(60_000);
    await seedSupabaseSession(page);
    await installWave2Mocks(page, PROJECT_ID, "wave3-shell-1");
    await page.setViewportSize({ width: 1440, height: 900 });
    await openBlueprintView(page, "architecture");

    const badge = page.getByTestId("blueprint-scan-badge");
    await expect(badge).toBeVisible({ timeout: 20000 });
    await expect(badge).toContainText("Scan abgeschlossen");
    await expect(badge).not.toContainText(/Noch nicht gescannt/i);
  });
});
