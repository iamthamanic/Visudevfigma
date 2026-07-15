/**
 * Wave 4 Atlas 3D polish gate.
 * Acceptance: .qa/acceptance/wave4-atlas-3d-polish.md
 */

import { test, expect } from "@playwright/test";
import { installWave2Mocks, openBlueprintView, seedSupabaseSession } from "./wave2-test-helpers.js";

const PROJECT_ID = "proj-wave4-atlas";

test.describe("Wave 4 atlas 3D polish", () => {
  test("colored clusters, glow marker, rich inspector", async ({ page }) => {
    test.setTimeout(60_000);
    await seedSupabaseSession(page);
    await installWave2Mocks(page, PROJECT_ID, "wave4-atlas-1");
    await openBlueprintView(page, "atlas");

    expect(await page.getByTestId("atlas-cluster").count()).toBeGreaterThanOrEqual(6);
    expect(await page.getByTestId("atlas-cluster-label").count()).toBeGreaterThanOrEqual(6);

    const colored = page.locator('[data-testid="atlas-cluster"][data-cluster-color]');
    expect(await colored.count()).toBeGreaterThanOrEqual(6);

    const apiCluster = page
      .getByTestId("atlas-cluster")
      .filter({ hasText: /API SERVICE/i })
      .first();
    await apiCluster.click();
    await expect(apiCluster).toHaveAttribute("data-selected", "true");
    await expect(page.getByTestId("atlas-cluster-glow")).toHaveCount(1);

    const inspector = page.getByTestId("atlas-inspector");
    await expect(inspector).toBeVisible();
    await expect(inspector).toContainText(/NestJS|Backend/i);
    await expect(page.getByTestId("atlas-inspector-activity")).toBeVisible();
    await expect(page.getByTestId("atlas-inspector-tech")).toContainText(/NestJS|TypeScript/i);
  });
});
