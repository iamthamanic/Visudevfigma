/**
 * Wave 5 execution fine-tune gate.
 * Acceptance: .qa/acceptance/wave5-execution-fine-tune.md
 */

import { test, expect } from "@playwright/test";
import { installWave2Mocks, openBlueprintView, seedSupabaseSession } from "./wave2-test-helpers.js";

const PROJECT_ID = "proj-wave5-execution";

test.describe("Wave 5 execution fine-tune", () => {
  test("no FEHLT, durations, timeline, payload+response", async ({ page }) => {
    test.setTimeout(60_000);
    await seedSupabaseSession(page);
    await installWave2Mocks(page, PROJECT_ID, "wave5-exec-1");
    await openBlueprintView(page, "execution");

    expect(await page.getByTestId("execution-step-card").count()).toBeGreaterThanOrEqual(6);
    expect(await page.getByText(/^Fehlt$/i).count()).toBe(0);
    expect(await page.getByTestId("execution-step-duration").count()).toBeGreaterThanOrEqual(6);
    await expect(page.getByTestId("execution-timeline")).toBeVisible();
    await expect(page.getByTestId("execution-payload")).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("execution-response")).toBeVisible();
    await expect(page.getByTestId("execution-payload")).toContainText("{");
    await expect(page.getByTestId("execution-response")).toContainText(/accepted|status|resource/i);
  });
});
