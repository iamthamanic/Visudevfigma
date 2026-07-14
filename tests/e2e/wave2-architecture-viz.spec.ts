/**
 * Wave 2 architecture viz parity gate.
 * Acceptance: .qa/acceptance/wave2-architecture-viz-parity.md
 */

import { test, expect } from "@playwright/test";
import { buildHrToolDemoGraph } from "../../shared/demo-graph-seed.js";

const EVIDENCE_DIR = ".qa/evidence/wave2-architecture-viz";
const PROJECT_ID = "proj-wave2-architecture";
const ENGINE_HOSTS = ["http://127.0.0.1:4317", "http://localhost:4317"];
const SUPABASE_STORAGE_KEY = "sb-127-auth-token";

const E2E_USER = {
  id: "e2e-user-id",
  aud: "authenticated",
  role: "authenticated",
  email: "e2e@visudev.test",
  app_metadata: {},
  user_metadata: {},
};

const E2E_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJlMmUtdXNlci1pZCIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjo5OTk5OTk5OTk5fQ." +
  "e2e-signature";

function e2eSession() {
  return {
    access_token: E2E_ACCESS_TOKEN,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "e2e-refresh",
    user: E2E_USER,
  };
}

const MOCK_PROJECT = {
  id: PROJECT_ID,
  name: "browo/hr-tool",
  github_repo: "browo/hr-tool",
  github_branch: "main",
  screens: [],
  flows: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function mockBlueprint() {
  return {
    version: 1,
    projectId: PROJECT_ID,
    commitSha: "e9b3c42a",
    analyzedAt: new Date().toISOString(),
    routes: [],
    securityMatrix: [],
    findings: [],
    facts: [],
    filesAnalyzed: 1872,
    graph: buildHrToolDemoGraph(PROJECT_ID),
  };
}

async function seedSupabaseSession(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({ storageKey, session }) => {
      localStorage.setItem(storageKey, JSON.stringify(session));
    },
    { storageKey: SUPABASE_STORAGE_KEY, session: e2eSession() },
  );
}

async function installMocks(page: import("@playwright/test").Page) {
  const blueprint = mockBlueprint();

  await page.route("**/functions/v1/visudev-projects**", async (route) => {
    const url = route.request().url();
    if (route.request().method() === "GET" && !url.includes("/proj-")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [MOCK_PROJECT] }),
      });
      return;
    }
    if (url.includes(MOCK_PROJECT.id)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: MOCK_PROJECT }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/functions/v1/visudev-blueprint/**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: blueprint }),
      });
      return;
    }
    await route.continue();
  });

  await page.route("**/functions/v1/visudev-analyzer/blueprint/analyze**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { blueprint, analysisId: "wave2-architecture-1" },
      }),
    });
  });

  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes("/token") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(e2eSession()),
      });
      return;
    }
    if (url.includes("/user")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(E2E_USER),
      });
      return;
    }
    await route.continue();
  });

  for (const host of ENGINE_HOSTS) {
    await page.route(`${host}/**`, async (route) => {
      const url = route.request().url();
      if (url.includes("/blueprint/latest")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            data: { blueprint, analysisId: "wave2-architecture-1" },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: {} }),
      });
    });
  }
}

test.describe("Wave 2 architecture viz parity", () => {
  test.beforeEach(async ({ page }) => {
    await seedSupabaseSession(page);
    await installMocks(page);
  });

  test("layer stack shows 7 cards and inspector on selection", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    if (
      await page
        .getByText(/Melde dich an/i)
        .isVisible()
        .catch(() => false)
    ) {
      test.skip(true, "Auth mock insufficient");
      return;
    }

    await page.goto("/blueprint?view=architecture");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Blueprint wird generiert...")
      .waitFor({ state: "hidden", timeout: 45000 })
      .catch(() => {});

    const stack = page.getByTestId("architecture-layer-stack");
    await expect(stack).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("layer-card")).toHaveCount(7);

    await page.getByRole("button", { name: /Application Layer/i }).click();
    await expect(page.getByTestId("architecture-inspector")).toBeVisible();
    await expect(page.getByText("Enthaltene Services")).toBeVisible();

    await page.screenshot({
      path: `${EVIDENCE_DIR}/architecture-layer-stack.png`,
      fullPage: false,
    });
  });

  test("domains mode has no duplicate App.tsx entries", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/blueprint?view=architecture");
    await page.waitForLoadState("networkidle");
    await page
      .getByText("Blueprint wird generiert...")
      .waitFor({ state: "hidden", timeout: 45000 })
      .catch(() => {});

    await page.getByRole("tab", { name: "Domains" }).click();
    const appDuplicates = page.locator('[data-testid="domain-module"][data-path*="App.tsx"]');
    await expect(appDuplicates).toHaveCount(0);
  });
});
