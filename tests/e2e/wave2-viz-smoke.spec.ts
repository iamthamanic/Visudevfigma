/**
 * Wave 2 verify-ui smoke: all Blueprint views render non-empty content.
 * Acceptance: .qa/acceptance/wave2-cross-cutting-enrichment.md
 */

import { test, expect } from "@playwright/test";
import { buildHrToolDemoGraph } from "../../shared/demo-graph-seed.js";

const EVIDENCE_DIR = ".qa/evidence/wave2-viz-smoke";
const PROJECT_ID = "proj-wave2-smoke";
const ENGINE_HOSTS = ["http://127.0.0.1:4317", "http://localhost:4317"];

const MOCK_PROJECT = {
  id: PROJECT_ID,
  name: "browo/hr-tool",
  localPath: "/tmp/hr-tool",
  repositoryUrl: "https://github.com/browo/hr-tool",
  blueprintProviderId: "legacy",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function mockBlueprint() {
  const routeId = "POST /api/leave-requests";
  const graph = buildHrToolDemoGraph(PROJECT_ID);

  return {
    version: 1,
    projectId: PROJECT_ID,
    commitSha: "e9b3c42a",
    analyzedAt: new Date().toISOString(),
    routes: [
      {
        id: routeId,
        method: "POST",
        path: "/api/leave-requests",
        filePath: "src/routes/leave.ts",
        line: 12,
        pipeline: [
          { id: "r1", type: "request", label: "LeaveRequestForm", state: "confirmed" },
          { id: "r2", type: "validation-gate", label: "Validation", state: "confirmed" },
          { id: "r3", type: "auth-gate", label: "Auth", state: "confirmed" },
          { id: "r4", type: "handler", label: "CreateLeaveRequest", state: "confirmed" },
        ],
        concepts: {
          "auth-gate": "confirmed",
          "validation-gate": "confirmed",
        },
      },
    ],
    securityMatrix: [
      {
        routeId: "GET /api/employees",
        method: "GET",
        path: "/api/employees",
        auth: { state: "confirmed" },
        role: { state: "partial" },
        validation: { state: "confirmed" },
        rateLimit: { state: "unknown" },
        db: { state: "confirmed" },
        rls: { state: "missing" },
        audit: { state: "partial" },
        findingCount: 1,
      },
    ],
    findings: [
      {
        id: "SEC-001",
        ruleId: "db.rls-missing",
        category: "security",
        severity: "critical",
        scopeId: "GET /api/employees",
        message: "RLS nicht aktiviert – Mitarbeiterdaten für alle sichtbar",
        expectedState: "RLS aktiv",
        actualState: "RLS fehlt",
        evidenceFactIds: ["fact-rls"],
        confidence: 92,
        remediation: "Row Level Security auf employees aktivieren.",
      },
    ],
    facts: [
      {
        id: "fact-rls",
        kind: "db-query",
        filePath: "db/policy.sql",
        line: 4,
        snippet: "relrowsecurity = false",
        metadata: { table: "employees" },
      },
    ],
    filesAnalyzed: 1872,
    graph,
  };
}

async function installLocalMocks(page: import("@playwright/test").Page) {
  const blueprint = mockBlueprint();

  const handler = async (route: import("@playwright/test").Route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes("/health")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { status: "ok", mode: "local" } }),
      });
      return;
    }

    if (url.endsWith("/api/projects") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: [MOCK_PROJECT] }),
      });
      return;
    }

    if (
      url.includes(`/api/projects/${PROJECT_ID}`) &&
      method === "GET" &&
      !url.includes("blueprint")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: MOCK_PROJECT }),
      });
      return;
    }

    if (url.includes("/blueprint/latest")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, data: { blueprint, analysisId: "wave2-smoke-1" } }),
      });
      return;
    }

    if (url.includes("/git/summary")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            initialized: true,
            commits: [{ sha: "e9b3c42", subject: "Payroll Integration", author: "Lukas Meier" }],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: {} }),
    });
  };

  for (const host of ENGINE_HOSTS) {
    await page.route(`${host}/**`, handler);
  }
}

const VIEWS = [
  { id: "architecture", heading: /Architektur/i },
  { id: "dependencies", heading: /Abhängigkeiten/i },
  { id: "execution", heading: /Ausführung/i },
  { id: "infrastructure", heading: /Infrastruktur/i },
  { id: "atlas", heading: /Atlas/i },
  { id: "evolution", heading: /Evolution/i },
  { id: "diagnostics", heading: /Diagnosen/i },
] as const;

test.describe("Wave 2 Blueprint viz smoke", () => {
  test.beforeEach(async ({ page }) => {
    await installLocalMocks(page);
  });

  for (const view of VIEWS) {
    test(`${view.id} view renders non-empty blueprint content`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/blueprint?view=${view.id}`);
      await page.waitForLoadState("networkidle");

      await page
        .getByText("Blueprint wird generiert...")
        .waitFor({ state: "hidden", timeout: 45000 })
        .catch(() => {});

      await expect(page.getByTestId("blueprint-view")).toBeVisible({ timeout: 20000 });
      const mainContent = page.getByTestId("blueprint-main-content");
      await expect(mainContent).toBeVisible();
      await expect(mainContent).not.toBeEmpty();

      await page.screenshot({
        path: `${EVIDENCE_DIR}/${view.id}.png`,
        fullPage: false,
      });
    });
  }
});
