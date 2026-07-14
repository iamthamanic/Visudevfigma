/**
 * Wave 2 diagnostics viz parity gate.
 * Acceptance: .qa/acceptance/wave2-diagnostics-viz-parity.md
 */

import { test, expect } from "@playwright/test";
import {
  buildDiagnosticsMockBlueprint,
  installWave2Mocks,
  openBlueprintView,
  seedSupabaseSession,
} from "./wave2-test-helpers.js";

const EVIDENCE_DIR = ".qa/evidence/wave2-diagnostics-viz";
const PROJECT_ID = "proj-wave2-diagnostics";

test.describe("Wave 2 diagnostics viz parity", () => {
  test.beforeEach(async ({ page }) => {
    await seedSupabaseSession(page);
    await installWave2Mocks(
      page,
      PROJECT_ID,
      "wave2-diagnostics-1",
      buildDiagnosticsMockBlueprint(PROJECT_ID),
    );
  });

  test("matrix above findings, inspector evidence, resolve toggle", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await openBlueprintView(page, "diagnostics");

    const matrix = page.getByTestId("security-matrix");
    const findingsTable = page.getByTestId("findings-table");
    await expect(matrix).toBeVisible({ timeout: 20000 });
    await expect(findingsTable).toBeVisible();
    await expect(page.getByTestId("findings-pagination")).toBeVisible();

    const matrixBox = await matrix.boundingBox();
    const tableBox = await findingsTable.boundingBox();
    expect(matrixBox).not.toBeNull();
    expect(tableBox).not.toBeNull();
    if (matrixBox && tableBox) {
      expect(matrixBox.y).toBeLessThan(tableBox.y);
    }

    await page
      .getByRole("button", { name: /db\.rls-missing/i })
      .first()
      .click();
    await expect(page.getByTestId("problem-inspector-evidence")).toBeVisible();

    await page.getByRole("button", { name: "Als erledigt markieren" }).click();
    await expect(page.getByTestId("finding-status-SEC-001")).toHaveText("Erledigt");

    await page.screenshot({
      path: `${EVIDENCE_DIR}/diagnostics-matrix-findings-inspector.png`,
      fullPage: false,
    });
  });
});
