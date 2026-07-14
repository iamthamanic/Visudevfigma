/**
 * Tests for GitSummaryService project access checks.
 */

import { describe, expect, it } from "vitest";
import { GitSummaryService } from "./git-summary.service.js";
import type { ProjectService } from "./project.service.js";
import type { GitSummary } from "../types/api.types.js";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";

describe("GitSummaryService", () => {
  it("rejects unknown project ids", async () => {
    const projectService = {
      getProject: async () => null,
    } as unknown as ProjectService;
    const service = new GitSummaryService(projectService);

    await expect(service.getProjectGitSummary(PROJECT_ID)).rejects.toMatchObject({
      message: "Project not found",
      statusCode: 404,
    });
  });

  it("delegates to injected reader for known projects", async () => {
    const projectService = {
      getProject: async () => ({
        id: PROJECT_ID,
        name: "Demo",
        localPath: "/tmp/demo",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        source: "local" as const,
      }),
    } as unknown as ProjectService;
    const summary: GitSummary = {
      initialized: true,
      shallow: false,
      commits: [{ sha: "abc", subject: "x".repeat(500), committedAt: "2026-01-01T00:00:00.000Z" }],
      branches: [],
      workingTree: { modified: [], added: [], deleted: [] },
      warnings: ["commits: unavailable"],
    };
    const service = new GitSummaryService(projectService, async () => summary);

    const result = await service.getProjectGitSummary(PROJECT_ID);
    expect(result.commits[0]?.subject.length).toBeLessThanOrEqual(200);
    expect(result.warnings).toEqual(["commits: unavailable"]);
  });
});
