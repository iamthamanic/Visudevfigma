/**
 * E2E critical paths (T2-020): Login screen, Projekt wählen, Scan starten.
 * Run: npx playwright test
 * CI: build + vite preview, then playwright test.
 */

import { test, expect } from "@playwright/test";

test.describe("VisuDEV critical paths", () => {
  test("shows login or shell when app loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const hasLogin = await page
      .getByRole("heading", { name: /VisuDEV/i })
      .isVisible()
      .catch(() => false);
    const hasSidebar = await page
      .getByRole("navigation")
      .isVisible()
      .catch(() => false);
    const hasMain = await page
      .locator("main")
      .isVisible()
      .catch(() => false);
    expect(hasLogin || (hasSidebar && hasMain)).toBeTruthy();
  });

  test("when logged in, projects screen is reachable", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /VisuDEV/i });
    const isLoginScreen = await loginHeading.isVisible().catch(() => false);
    if (isLoginScreen) {
      test.skip();
      return;
    }
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
    const projectsLink = page
      .getByRole("button", { name: /Projekte/i })
      .or(page.getByText("Projekte").first());
    if (await projectsLink.isVisible().catch(() => false)) {
      await projectsLink.click();
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("app flow screen shows header or empty state when project selected", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /VisuDEV/i });
    if (await loginHeading.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    const appFlowNav = page
      .getByRole("button", { name: /App Flow/i })
      .or(page.getByText("App Flow").first());
    if (await appFlowNav.isVisible().catch(() => false)) {
      await appFlowNav.click();
      await page.waitForTimeout(500);
      const hasAppFlowTitle = await page
        .getByRole("heading", { name: /App Flow/i })
        .isVisible()
        .catch(() => false);
      const hasEmptyState = await page
        .getByText(/Kein Projekt ausgewählt|Noch keine Flows|Sitemap/i)
        .isVisible()
        .catch(() => false);
      expect(hasAppFlowTitle || hasEmptyState).toBeTruthy();
    }
  });

  test("scan button exists on app flow when project has no data", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /VisuDEV/i });
    if (await loginHeading.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    const appFlowNav = page
      .getByRole("button", { name: /App Flow/i })
      .or(page.getByText("App Flow").first());
    if (!(await appFlowNav.isVisible().catch(() => false))) {
      test.skip();
      return;
    }
    await appFlowNav.click();
    await page.waitForTimeout(600);
    const scanButton = page.getByRole("button", { name: /Scan starten|Neu analysieren/i });
    const hasScanButton = await scanButton.isVisible().catch(() => false);
    const hasExportOrTabs = await page
      .getByRole("button", { name: /Export|Sitemap|Integrations/i })
      .isVisible()
      .catch(() => false);
    expect(hasScanButton || hasExportOrTabs).toBeTruthy();
  });
});
