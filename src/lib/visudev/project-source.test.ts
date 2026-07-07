import { describe, expect, it } from "vitest";
import { getProjectSourceMode, hasPreviewSource, projectNameFromLocalPath } from "./project-source";
import type { Project } from "./types";

const baseProject = {
  id: "p1",
  name: "Test",
  screens: [],
  flows: [],
  createdAt: "2026-01-01T00:00:00.000Z",
} satisfies Project;

describe("project-source", () => {
  it("detects local preview source", () => {
    const project: Project = {
      ...baseProject,
      source_mode: "local",
      local_path: "/Users/dev/app",
    };
    expect(getProjectSourceMode(project)).toBe("local");
    expect(hasPreviewSource(project)).toBe(true);
  });

  it("detects github preview source", () => {
    const project: Project = {
      ...baseProject,
      source_mode: "github",
      github_repo: "user/repo",
    };
    expect(hasPreviewSource(project)).toBe(true);
  });

  it("derives project name from local path", () => {
    expect(projectNameFromLocalPath("/Users/dev/my-app/")).toBe("my-app");
    expect(projectNameFromLocalPath("/Users/dev/my-app")).toBe("my-app");
  });
});
